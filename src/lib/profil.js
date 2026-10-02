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

const INTERETS_FR = {
  sport: 'Sport',
  musique: 'Musique',
  nature: 'Nature',
  cuisine: 'Cuisine',
  jeux: 'Jeux',
  lecture: 'Lecture',
  randonnee: 'Randonnée',
  piscine: 'Piscine',
  soirees: 'Soirées',
  enfants: 'Enfants',
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
