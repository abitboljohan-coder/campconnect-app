// Service worker de CampConnect.
//
// Le réseau d'un camping est mauvais par nature : c'est le contexte d'usage
// principal de l'application, pas un cas limite. Sans ce fichier, une coupure
// donnait un écran blanc.
//
// Deux stratégies, choisies selon ce que l'on sert :
//
//   • La coquille de l'application (HTML, JS, CSS, logo) est servie depuis le
//     cache d'abord. Elle ne change qu'à chaque déploiement, et l'utilisateur
//     n'a aucune raison d'attendre le réseau pour voir son interface.
//
//   • Les tuiles satellite passent par le réseau, avec repli sur le cache.
//     Une tuile déjà vue reste affichable hors ligne, ce qui suffit à se
//     repérer dans le camping où l'on est déjà passé.
//
// Ce qui n'est délibérément PAS mis en cache : les appels à Supabase. Un
// message vieux d'une heure présenté comme actuel est pire qu'un message
// absent — on ne ment pas sur la fraîcheur d'une conversation.

// Changer ce numéro purge les anciens caches à l'activation. C'est le seul
// moyen de se débarrasser d'une coquille périmée déjà installée chez un
// utilisateur — v1 servait index.html depuis le cache en priorité, et pouvait
// donc y rester indéfiniment.
const VERSION = 'cc-v2'
const COQUILLE = `${VERSION}-coquille`
const TUILES = `${VERSION}-tuiles`
const TUILES_MAX = 300

const ESSENTIELS = ['/', '/index.html', '/logo-mark.png', '/manifest.webmanifest']

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(COQUILLE)
      // addAll échoue en bloc si une seule ressource manque ; on tolère les
      // absences pour qu'un fichier renommé n'empêche pas l'installation.
      .then(c => Promise.allSettled(ESSENTIELS.map(u => c.add(u))))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(noms => Promise.all(
        noms.filter(n => !n.startsWith(VERSION)).map(n => caches.delete(n))
      ))
      .then(() => self.clients.claim())
  )
})

// Limite la taille du cache de tuiles : une carte parcourue longuement peut en
// accumuler des milliers, et le quota du navigateur n'est pas extensible.
async function limiter(nom, max) {
  const cache = await caches.open(nom)
  const cles = await cache.keys()
  if (cles.length <= max) return
  await Promise.all(cles.slice(0, cles.length - max).map(k => cache.delete(k)))
}

self.addEventListener('fetch', (e) => {
  const { request } = e
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Supabase et les autres API : jamais de cache, jamais d'interception.
  if (url.hostname.endsWith('.supabase.co')) return

  // Tuiles satellite : réseau d'abord, cache en secours.
  if (url.hostname.includes('arcgisonline.com') || url.hostname.includes('tile.')) {
    e.respondWith(
      fetch(request)
        .then(rep => {
          const copie = rep.clone()
          caches.open(TUILES).then(c => c.put(request, copie).then(() => limiter(TUILES, TUILES_MAX)))
          return rep
        })
        .catch(() => caches.match(request))
    )
    return
  }

  // Navigation : le réseau d'abord, borné dans le temps, cache en secours.
  //
  // Cette coquille était servie depuis le cache en priorité, et rafraîchie en
  // arrière-plan. Le compromis paraissait bon — l'application s'affiche
  // instantanément — mais il a un coût qui ne se voit qu'au déploiement
  // suivant : index.html référence les fichiers JS par leur empreinte. Servir
  // l'ancien index.html, c'est servir tout l'ancien code. Un correctif publié
  // n'atteignait donc l'utilisateur qu'au deuxième lancement, et la version du
  // cache ne changeant jamais entre deux déploiements, rien ne forçait la
  // bascule.
  //
  // Le délai borné garde l'essentiel du bénéfice : sur le réseau d'un camping,
  // au-delà de deux secondes, on sert la coquille connue plutôt que d'attendre.
  if (request.mode === 'navigate') {
    e.respondWith((async () => {
      const reseau = fetch(request).then(rep => {
        if (rep.ok) caches.open(COQUILLE).then(c => c.put('/index.html', rep.clone()))
        return rep
      })
      const borne = new Promise(resoudre => setTimeout(() => resoudre(null), 2000))
      // `catch` sur la course, pas sur la promesse : une panne réseau doit
      // mener au cache, pas faire échouer la navigation.
      const gagnant = await Promise.race([reseau.catch(() => null), borne])
      if (gagnant) return gagnant
      const cache = await caches.match('/index.html')
      // Sans coquille en cache, mieux vaut attendre le réseau que ne rien
      // rendre du tout : respondWith(undefined) casse la navigation.
      return cache || reseau
    })())
    return
  }

  // Ressources bâties (JS, CSS, images) : leur nom contient une empreinte, donc
  // le cache ne peut jamais servir une version périmée.
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.match(request).then(cache => cache || fetch(request).then(rep => {
        if (rep.ok) {
          const copie = rep.clone()
          caches.open(COQUILLE).then(c => c.put(request, copie))
        }
        return rep
      }))
    )
  }
})
