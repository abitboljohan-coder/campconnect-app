import { t } from '../i18n'

/**
 * Choix du profil : « Je voyage » et centres d'intérêt.
 *
 * Ils étaient enregistrés tels qu'affichés, en français (« En couple »,
 * « Randonnée ») : un vacancier néerlandais voyait du français, et traduire
 * l'écran aurait changé les valeurs en base. On enregistre désormais un code
 * stable, traduit à l'affichage.
 *
 * Les profils déjà en base gardent leurs valeurs françaises — aucune
 * migration : elles sont reconnues à la lecture et ramenées à leur code.
 * Une valeur inconnue est conservée telle quelle, jamais perdue.
 */

// Code → libellé français. Ce libellé est aussi l'ancienne valeur en base,
// et ce que lit le gérant, dont la console est en français.
const AVEC_FR = {
  solo: 'Solo',
  couple: 'En couple',
  amis: 'Entre amis',
  famille: 'En famille',
}

// L'ordre est celui de l'écran : les plus courants d'un séjour en camping
// d'abord. Les dix premiers codes historiques (sport… enfants) restent tous
// proposés : des vacanciers les ont enregistrés, et le gérant les compte.
const INTERETS_FR = {
  plage: 'Plage',
  piscine: 'Piscine',
  apero: 'Apéro',
  petanque: 'Pétanque',
  randonnee: 'Randonnée',
  velo: 'Vélo',
  padel: 'Padel',
  paddle: 'Paddle & kayak',
  yoga: 'Yoga',
  sport: 'Sport',
  jeux: 'Jeux',
  musique: 'Musique',
  soirees: 'Soirées',
  cuisine: 'Cuisine',
  nature: 'Nature',
  photo: 'Photo',
  lecture: 'Lecture',
  enfants: 'Enfants',
}

// Un emoji par choix : le profil les montre en puces, pas en liste de mots.
const EMOJIS_AVEC = { solo: '🎒', couple: '💑', amis: '🙌', famille: '👨‍👩‍👧' }
const EMOJIS_INTERETS = {
  plage: '🏖️', piscine: '🏊', apero: '🍹', petanque: '🎯', randonnee: '🥾',
  velo: '🚲', padel: '🎾', paddle: '🛶', yoga: '🧘', sport: '🏅', jeux: '🎲',
  musique: '🎸', soirees: '🎉', cuisine: '🍳', nature: '🌿', photo: '📷',
  lecture: '📚', enfants: '🧸',
}

export const AVEC = Object.keys(AVEC_FR)
export const INTERETS = Object.keys(INTERETS_FR)

const inverse = table => Object.fromEntries(Object.entries(table).map(([code, fr]) => [fr, code]))
const ANCIENS_AVEC = inverse(AVEC_FR)
const ANCIENS_INTERETS = inverse(INTERETS_FR)

/** Code de « Je voyage », que la valeur soit un code ou un ancien libellé. */
export function codeAvec(valeur) {
  if (!valeur) return ''
  return ANCIENS_AVEC[valeur] || valeur
}

/** Codes des centres d'intérêt, sans doublon (« Sport » et « sport » ne comptent qu'une fois). */
export function codesInterets(liste) {
  if (!Array.isArray(liste)) return []
  return [...new Set(liste.filter(Boolean).map(v => ANCIENS_INTERETS[v] || v))]
}

/** Libellé dans la langue du vacancier. */
export function libelleAvec(valeur) {
  const code = codeAvec(valeur)
  return AVEC_FR[code] ? t(`profil.avec_${code}`) : code
}

export function libelleInteret(valeur) {
  const code = ANCIENS_INTERETS[valeur] || valeur
  return INTERETS_FR[code] ? t(`profil.interet_${code}`) : code
}

/** Emoji d'un choix, ou chaîne vide pour une valeur inconnue. */
export function emojiAvec(valeur) {
  return EMOJIS_AVEC[codeAvec(valeur)] || ''
}

export function emojiInteret(valeur) {
  return EMOJIS_INTERETS[ANCIENS_INTERETS[valeur] || valeur] || ''
}

/**
 * Colonnes lues pour la mini-fiche d'un autre vacancier — et rien d'autre.
 * Ni l'emplacement, ni la tranche d'âge, ni la date de départ : savoir où
 * dort quelqu'un, son âge et le jour où il part n'aide pas à lier
 * connaissance, et ne regarde que lui.
 */
export const COLONNES_FICHE = 'id, pseudo, avatar_emoji, avec, interests'

/** « En vacances entre amis » : le « Je voyage » dit comme une phrase. */
export function phraseAvec(valeur) {
  const code = codeAvec(valeur)
  return AVEC_FR[code] ? t(`profil.bio_${code}`) : code
}

/**
 * Centres d'intérêt partagés avec un autre vacancier, dans l'ordre de ses
 * choix à lui. Les anciens libellés français sont ramenés à leur code des
 * deux côtés : « Randonnée » chez l'un et « randonnee » chez l'autre, c'est
 * bien la même envie.
 */
export function pointsCommuns(miens, siens) {
  const moi = new Set(codesInterets(miens))
  return codesInterets(siens).filter(c => moi.has(c))
}

/**
 * La phrase qui donne une raison de se parler : « Vous aimez tous les deux
 * le padel » pour un seul point commun, « 3 centres d'intérêt en commun »
 * au-delà, null sans aucun.
 */
export function phraseCommuns(communs) {
  if (!communs?.length) return null
  if (communs.length > 1) return t('fiche.communs', { n: communs.length })
  const code = communs[0]
  return t('fiche.commun_un', { chose: INTERETS_FR[code] ? t(`profil.objet_${code}`) : code })
}

/** Date du jour (AAAA-MM-JJ) à l'heure du téléphone, pas en UTC : à 1 h du
 *  matin en France, l'UTC est encore la veille. */
export function jourLocal(d = new Date()) {
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/**
 * Nuits restantes avant le départ : 0 le jour du départ, null sans date ou
 * une fois le départ passé — le profil n'affiche alors rien plutôt qu'un
 * nombre négatif.
 */
export function nuitsRestantes(depart, aujourdhui) {
  if (!depart || !aujourdhui) return null
  const n = Math.round((Date.parse(depart) - Date.parse(aujourdhui)) / 86400000)
  return Number.isFinite(n) && n >= 0 ? n : null
}

/** Libellés français, pour la console du gérant (statistiques, export). */
export function libelleAvecFr(valeur) {
  const code = codeAvec(valeur)
  return AVEC_FR[code] || code
}

export function libelleInteretFr(valeur) {
  const code = ANCIENS_INTERETS[valeur] || valeur
  return INTERETS_FR[code] || code
}

/**
 * Champs enregistrés à l'arrivée, quand la même identité retrouve un profil
 * sur ce camping (retour après « Se déconnecter », ou l'année suivante).
 *
 * Le formulaire réécrivait tout le profil : revenir effaçait l'emplacement,
 * la date de départ et l'avatar. Un champ laissé vide garde donc la valeur
 * existante — sauf une date de départ passée, qui terminerait aussitôt le
 * nouveau séjour.
 */
export function champsArrivee(form, existant, aujourdhui) {
  const departGarde = existant?.date_depart >= aujourdhui ? existant.date_depart : null
  return {
    pseudo: form.pseudo.trim(),
    avatar_emoji: form.avatar_emoji || existant?.avatar_emoji || '🏕️',
    emplacement: form.emplacement.trim() || existant?.emplacement || null,
    date_depart: form.date_depart || departGarde,
  }
}
