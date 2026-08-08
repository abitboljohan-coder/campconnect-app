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

const VERSION = 'cc-v1'
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

  // Navigation : la coquille en cache d'abord, puis rafraîchie en arrière-plan.
  // L'utilisateur voit son application immédiatement ; la version suivante sera
  // à jour. C'est le compromis habituel, et le bon ici : le contenu vient de
  // toute façon du réseau une fois l'interface affichée.
  if (request.mode === 'navigate') {
    e.respondWith(
      caches.match('/index.html').then(cache => {
        const reseau = fetch(request)
          .then(rep => {
            caches.open(COQUILLE).then(c => c.put('/index.html', rep.clone()))
            return rep
          })
          .catch(() => cache)
        return cache || reseau
      })
    )
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
