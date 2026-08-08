import { supabase } from '../supabase'

// Signalement de contenu et blocage entre vacanciers.
//
// Le blocage est conservé en local en plus de la base : le filtrage se fait à
// chaque rendu de liste, il doit donc être synchrone. Interroger la base à ce
// moment-là afficherait le contenu d'une personne bloquée pendant le temps de
// l'aller-retour — exactement ce que l'utilisateur a demandé à ne plus voir.
// La base reste la référence : elle survit à une réinstallation.

const cle = (vacancierId) => `blocages_${vacancierId}`

let cache = new Set()
let cacheDe = null

function lireLocal(vacancierId) {
  try {
    const brut = JSON.parse(localStorage.getItem(cle(vacancierId)) || '[]')
    return new Set(Array.isArray(brut) ? brut : [])
  } catch {
    return new Set()
  }
}

function ecrireLocal(vacancierId, ensemble) {
  try {
    localStorage.setItem(cle(vacancierId), JSON.stringify([...ensemble]))
  } catch { /* stockage plein ou refusé : le blocage reste actif pour la session */ }
}

/** Ensemble des identifiants bloqués, utilisable de façon synchrone. */
export function blocages(vacancierId) {
  if (!vacancierId) return new Set()
  if (cacheDe !== vacancierId) {
    cache = lireLocal(vacancierId)
    cacheDe = vacancierId
  }
  return cache
}

export function estBloque(vacancierId, autreId) {
  return !!autreId && blocages(vacancierId).has(autreId)
}

/**
 * Recharge depuis la base, pour retrouver ses blocages après réinstallation.
 *
 * Les deux sources sont réunies, jamais substituées. Remplacer le local par le
 * distant paraissait plus propre, mais faisait réapparaître une personne
 * bloquée dès que l'enregistrement du blocage avait échoué — hors ligne, par
 * exemple. Or l'erreur n'est pas symétrique : remontrer un contenu que
 * quelqu'un a demandé à ne plus voir est bien plus grave que d'en masquer un
 * de trop. Le déblocage, lui, est explicite et retire des deux côtés.
 */
export async function chargerBlocages(vacancierId) {
  if (!vacancierId) return new Set()
  const local = blocages(vacancierId)
  const { data, error } = await supabase
    .from('blocages').select('bloque_id').eq('vacancier_id', vacancierId)
  if (error) return local   // hors ligne : le cache local fait foi
  const distant = new Set((data || []).map(b => b.bloque_id))
  const ensemble = new Set([...local, ...distant])
  cache = ensemble
  cacheDe = vacancierId
  ecrireLocal(vacancierId, ensemble)

  // Réparation : ce qui n'existe qu'en local n'a jamais atteint la base, sans
  // doute parce que l'appareil était hors ligne au moment du blocage.
  const aRattraper = [...local].filter(id => !distant.has(id))
  if (aRattraper.length) {
    await supabase.from('blocages').upsert(
      aRattraper.map(id => ({ vacancier_id: vacancierId, bloque_id: id })),
      { onConflict: 'vacancier_id,bloque_id' })
  }
  return ensemble
}

/**
 * Bloque un vacancier et prévient l'équipe du camping.
 *
 * La règle 1.2 de l'App Store demande que le blocage « notifie le développeur
 * du contenu inapproprié » et le retire immédiatement du fil. Bloquer sans
 * rien remonter laisserait le contenu en place pour tous les autres : la
 * personne gênée s'en protège, la communauté non.
 *
 * Le blocage est donc doublé d'une remontée automatique, distinguée d'un
 * signalement explicite par sa catégorie. Le gérant voit la différence : l'un
 * est une demande d'action, l'autre un signal faible à surveiller.
 */
export async function bloquer(vacancierId, bloqueId, contexte = {}) {
  if (!vacancierId || !bloqueId || vacancierId === bloqueId) return false
  const ensemble = new Set(blocages(vacancierId))
  ensemble.add(bloqueId)
  cache = ensemble; cacheDe = vacancierId
  ecrireLocal(vacancierId, ensemble)

  // Le blocage prend effet immédiatement à l'écran, même si l'enregistrement
  // échoue : la personne a demandé à ne plus voir ce contenu, pas à attendre.
  const { error } = await supabase.from('blocages')
    .upsert({ vacancier_id: vacancierId, bloque_id: bloqueId }, { onConflict: 'vacancier_id,bloque_id' })

  if (contexte.campingId) {
    await supabase.from('signalements').insert({
      camping_id: contexte.campingId,
      vacancier_id: vacancierId,
      categorie: 'blocage',
      description: 'Blocage d’un vacancier par un autre vacancier',
      cible_type: contexte.cibleType || null,
      cible_id: contexte.cibleId || null,
      cible_texte: (contexte.texte || '').slice(0, 2000),
      auteur_signale_id: bloqueId,
    })
  }
  return !error
}

export async function debloquer(vacancierId, bloqueId) {
  const ensemble = new Set(blocages(vacancierId))
  ensemble.delete(bloqueId)
  cache = ensemble; cacheDe = vacancierId
  ecrireLocal(vacancierId, ensemble)
  const { error } = await supabase.from('blocages')
    .delete().eq('vacancier_id', vacancierId).eq('bloque_id', bloqueId)
  return !error
}

/**
 * Signale un contenu au gérant du camping.
 * Le texte est recopié : l'auteur peut supprimer son message avant que le
 * gérant ne traite le signalement, qui n'aurait alors plus rien à examiner.
 */
export async function signalerContenu({ campingId, vacancierId, cibleType, cibleId, texte, auteurId, motif }) {
  const { error } = await supabase.from('signalements').insert({
    camping_id: campingId,
    vacancier_id: vacancierId,
    categorie: 'contenu',
    description: motif || 'Contenu signalé par un vacancier',
    cible_type: cibleType,
    cible_id: cibleId,
    cible_texte: (texte || '').slice(0, 2000),
    auteur_signale_id: auteurId || null,
  })
  return !error
}
