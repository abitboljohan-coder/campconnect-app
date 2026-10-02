// Règles de date du formulaire d'animation (heure LOCALE du téléphone du gérant).

const pad = n => String(n).padStart(2, '0')

// Date au format du champ, en heure LOCALE. toISOString() donnait la date en
// temps universel : une animation de 0 h 30 s'ouvrait en modification sur la
// veille, et l'enregistrer la décalait réellement d'un jour.
export const dateLocale = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const heureLocale = d => `${pad(d.getHours())}:${pad(d.getMinutes())}`

/**
 * Date et heure proposées pour une nouvelle animation : la prochaine heure
 * pleine. Le formulaire proposait « aujourd'hui 14 h » même à 18 h : saisie
 * sans y prêter attention, l'animation naissait dans le passé. À 23 h passées,
 * l'heure pleine suivante tombe le lendemain, et la date suit.
 */
export function creneauParDefaut(maintenant = new Date()) {
  const d = new Date(maintenant)
  d.setMinutes(0, 0, 0)
  d.setHours(d.getHours() + 1)
  return { dateStr: dateLocale(d), heureStr: heureLocale(d) }
}

/** Le créneau saisi est-il déjà passé ? */
export function estPasse(dateStr, heureStr, maintenant = new Date()) {
  if (!dateStr || !heureStr) return false
  return new Date(`${dateStr}T${heureStr}:00`).getTime() < maintenant.getTime()
}

/**
 * Copie d'une animation pour la semaine suivante, même heure.
 * setDate plutôt que + 7 × 24 h : au changement d'heure, 168 heures plus tard
 * ne tombent pas à la même heure d'horloge.
 */
export function dupliquerAnimation(anim) {
  // eslint-disable-next-line no-unused-vars
  const { id, created_at, ...reste } = anim
  if (!anim.debut) return reste
  const d = new Date(anim.debut)
  d.setDate(d.getDate() + 7)
  return { ...reste, debut: d.toISOString() }
}

/**
 * Taux de remplissage des animations À VENIR à places limitées, plafonné à
 * 100 %. Il mélangeait les animations passées et celles sans limite : 30
 * inscrits à un concert libre plus 10 sur 10 à l'aquagym donnaient 400 %.
 */
export function tauxRemplissage(animations, inscriptions, maintenant = Date.now()) {
  const comptees = (animations || []).filter(a =>
    a.places_max > 0 && a.debut && new Date(a.debut).getTime() >= maintenant)
  const places = comptees.reduce((s, a) => s + a.places_max, 0)
  if (places === 0) return 0
  const ids = new Set(comptees.map(a => a.id))
  // Une animation surbookée ne compense pas les places vides d'une autre.
  const parAnim = {}
  for (const i of inscriptions || []) if (ids.has(i.animation_id)) parAnim[i.animation_id] = (parAnim[i.animation_id] || 0) + 1
  const occupees = comptees.reduce((s, a) => s + Math.min(parAnim[a.id] || 0, a.places_max), 0)
  return Math.min(100, Math.round((occupees / places) * 100))
}
