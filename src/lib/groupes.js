/**
 * Règles de vie d'un groupe, hors des écrans pour se tester seules.
 */

const HEURE = 3600 * 1000

/**
 * Un groupe mérite-t-il encore d'être proposé à ceux qui n'y sont pas ?
 *
 * Personne ne ferme un groupe : son créateur n'en a pas le droit, et le gérant
 * ne le fait pas. Un « Apéro ce soir » créé le premier jour restait donc
 * proposé tout le séjour, et au bout d'une semaine la liste était faite de
 * rendez-vous passés — on rejoignait des conversations mortes.
 *
 * Un groupe avec une heure reste proposé jusqu'à trois heures après celle-ci ;
 * sans heure, pendant vingt-quatre heures après sa création. Ses membres, eux,
 * le gardent dans « Mes groupes » : la conversation leur appartient.
 */
export function estActuel(groupe, maintenant = Date.now()) {
  // heure est une colonne texte. Une valeur illisible — « 20:00 » laissé par
  // une ancienne version, ou un format que Safari ne sait pas relire — donnait
  // NaN, et le groupe disparaissait sans bruit. On retombe alors sur la date
  // de création plutôt que de cacher le groupe.
  const heure = groupe.heure ? Date.parse(groupe.heure) : NaN
  if (!Number.isNaN(heure)) return heure + 3 * HEURE > maintenant
  const cree = groupe.created_at ? Date.parse(groupe.created_at) : NaN
  if (!Number.isNaN(cree)) return cree + 24 * HEURE > maintenant
  return true
}

/**
 * Transforme « 08:00 » saisi dans le formulaire en date complète.
 *
 * L'heure était toujours rattachée au jour même : le modèle « Rando demain
 * matin », créé la veille au soir avec 08:00, donnait un rendez-vous déjà
 * passé de douze heures. Une heure déjà dépassée de plus d'une heure désigne
 * donc le lendemain ; en deçà, c'est un rendez-vous qui vient de commencer.
 */
export function heurePrevue(hhmm, maintenant = new Date()) {
  if (!hhmm) return null
  const [h, m] = hhmm.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  const d = new Date(maintenant)
  d.setHours(h, m, 0, 0)
  if (d.getTime() < maintenant.getTime() - HEURE) d.setDate(d.getDate() + 1)
  return d
}

/** Le groupe a-t-il atteint le nombre de membres fixé par son créateur ? */
export const estComplet = (groupe, nbMembres) =>
  !!groupe.max_membres && nbMembres >= groupe.max_membres

/**
 * Heure d'un rendez-vous de groupe, précédée du jour : « Aujourd'hui 18:30 »,
 * « Demain 08:00 », sinon la date courte (« sam. 12 sept. 18:30 »).
 *
 * L'heure seule ne disait pas quel jour : une « Rando demain matin » créée la
 * veille s'affichait « 08:00 », sans qu'on sache si c'était passé ou à venir.
 * Les libellés viennent de l'appelant : la règle se teste sans i18n.
 * Renvoie null sans heure lisible (« 20:00 » laissé par une ancienne version).
 */
export function libelleHeure(heure, { aujourdhui, demain, locale = 'fr-FR' } = {}, maintenant = new Date()) {
  const d = heure ? new Date(heure) : null
  if (!d || Number.isNaN(d.getTime())) return null
  const hhmm = d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
  const ref = new Date(maintenant)
  const lendemain = new Date(ref); lendemain.setDate(ref.getDate() + 1)
  if (d.toDateString() === ref.toDateString()) return `${aujourdhui} ${hhmm}`
  if (d.toDateString() === lendemain.toDateString()) return `${demain} ${hhmm}`
  const jour = d.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' })
  return `${jour} ${hhmm}`
}
