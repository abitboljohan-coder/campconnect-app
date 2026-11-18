// ─────────────────────────────────────────────────────────────────────────────
// Bandeau « Vous êtes gérant de camping ? » des campings de démo.
//
// Des gérants curieux essaient la démo puis repartent sans qu'on sache qui ils
// sont. Le bandeau leur demande le nom de leur camping et un moyen de les
// joindre, et l'enregistre dans `candidatures` — la même table que le
// formulaire du site, donc la même notification par email.
//
// La table n'est qu'insérable depuis l'app (aucune lecture) : ne jamais
// ajouter de `.select()` derrière l'insertion, il échouerait.
// ─────────────────────────────────────────────────────────────────────────────

/** Les campings de démo. Aucune colonne ne les distingue en base : ce sont ces
 *  deux slugs, et eux seuls. */
export const SLUGS_DEMO = ['les-flots-bleus', 'demo-rives-du-lac']

export const estCampingDemo = (camping) => SLUGS_DEMO.includes(camping?.slug)

export const LONGUEUR_MAX_CAMPING = 120
export const LONGUEUR_MAX_CONTACT = 120

const EMAIL = /^[^\s@<>"']+@[^\s@<>"']+\.[a-z]{2,}$/i
// Chiffres seuls, « + » initial permis : de 9 chiffres (numéro national court)
// à 15 (maximum de la norme E.164).
const TELEPHONE = /^\+?\d{9,15}$/

// Caractères de contrôle et chevrons retirés : le texte part dans un email de
// notification, il n'a aucune raison de contenir une balise.
// eslint-disable-next-line no-control-regex
const nettoyer = (s) => String(s ?? '').replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/\s+/g, ' ').trim()

/**
 * Valide la saisie et prépare la ligne à insérer dans `candidatures`.
 * Renvoie `{ ligne }` ou `{ erreur: 'camping' | 'contact' }`.
 */
export function preparerDemandeApercu({ nomCamping, contact, slug }) {
  if (!SLUGS_DEMO.includes(slug)) return { erreur: 'camping' }

  const camping = nettoyer(nomCamping)
  if (camping.length < 2 || camping.length > LONGUEUR_MAX_CAMPING) return { erreur: 'camping' }

  const saisie = nettoyer(contact)
  if (!saisie || saisie.length > LONGUEUR_MAX_CONTACT) return { erreur: 'contact' }

  const base = `Demande d'aperçu (bandeau démo app, ${slug}).`
  if (EMAIL.test(saisie)) {
    return { ligne: { nom: null, email: saisie.toLowerCase(), camping, emplacements: null, message: base } }
  }
  // Espaces, points, tirets et parenthèses sont de la mise en forme.
  const numero = saisie.replace(/[\s.\-()]/g, '')
  if (TELEPHONE.test(numero)) {
    return { ligne: { nom: null, email: null, camping, emplacements: null, message: `${base} Téléphone : ${numero} (à rappeler).` } }
  }
  return { erreur: 'contact' }
}

// Le choix (fermé ou envoyé) est mémorisé sur l'appareil. Le stockage peut
// manquer (navigation privée) : le bandeau s'affiche alors, sans planter.
const CLE = 'bandeauGerantDemo'

export function bandeauDejaVu() {
  try { return !!localStorage.getItem(CLE) } catch { return false }
}

export function memoriserBandeau(etat) {
  try { localStorage.setItem(CLE, etat) } catch { /* stockage indisponible */ }
}
