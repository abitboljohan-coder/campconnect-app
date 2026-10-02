/**
 * Règles du livret d'accueil (onglet « Infos »), hors des écrans pour se
 * tester seules.
 */

/**
 * Modèles de rubriques proposés au gérant.
 *
 * Ce sont des exemples à adapter, jamais du contenu : ils servaient autrefois
 * de repli côté vacancier, qui lisait alors un code Wi-Fi « CAMPING2026 » et
 * une réception joignable au « 04 XX XX XX XX ». Ils ne sont plus affichés
 * qu'en texte indicatif dans l'éditeur du gérant.
 */
export const MODELES_INFOS = [
  { id: 'piscine',    emoji: '🏊', titre: 'Piscine',          contenu: 'Ouverte 9h – 20h\nSurveillée 10h – 19h' },
  { id: 'snack',      emoji: '🍺', titre: 'Bar / Snack',       contenu: 'Ouvert 10h – 23h\nPetit-déjeuner 8h – 10h30' },
  { id: 'reception',  emoji: '🏠', titre: 'Réception',         contenu: 'Lun – Ven : 8h – 19h\nSam – Dim : 8h – 20h' },
  { id: 'wifi',       emoji: '📶', titre: 'Wi-Fi',             contenu: 'Réseau : CampConnect\nCode : CAMPING2026' },
  { id: 'laverie',    emoji: '👕', titre: 'Laverie',           contenu: 'Ouverte 7h – 22h\nMachines disponibles en libre-service' },
  { id: 'poubelles',  emoji: '♻️', titre: 'Tri & Poubelles',  contenu: 'Zone tri au bloc sanitaire A\nEnlèvement : chaque matin à 8h' },
  { id: 'animaux',    emoji: '🐾', titre: 'Animaux',           contenu: 'Acceptés en laisse\nZone détente chiens : allée B' },
  { id: 'urgences',   emoji: '🚨', titre: 'Urgences',          contenu: 'Réception : 04 XX XX XX XX\nSAMU : 15 · Police : 17 · Pompiers : 18' },
]

const CONTENUS_MODELES = new Set(MODELES_INFOS.map(m => m.contenu))

/**
 * La rubrique est-elle un modèle enregistré tel quel ?
 *
 * L'ancien éditeur pré-remplissait les modèles : un gérant qui enregistrait
 * sans rien changer publiait de fausses informations comme si elles étaient
 * les siennes. On les reconnaît à leur contenu, resté mot pour mot.
 */
export const estModele = (info) => CONTENUS_MODELES.has((info?.contenu || '').trim())

/**
 * Rubriques réellement publiables : un titre, un contenu, et pas un modèle.
 *
 * `infos` vaut `{}` par défaut en base, pas `[]` : on ne se fie qu'à un
 * tableau.
 */
export function infosPubliables(infos) {
  if (!Array.isArray(infos)) return []
  return infos.filter(i => i?.titre?.trim() && i?.contenu?.trim() && !estModele(i))
}

/** Numéros d'urgence valables partout en France, montrés quand le livret est vide. */
export const NUMEROS_URGENCE = [
  { numero: '15',  cle: 'infos.samu' },
  { numero: '17',  cle: 'infos.police' },
  { numero: '18',  cle: 'infos.pompiers' },
  { numero: '112', cle: 'infos.urgence_eu' },
]

// Numéro complet (« 04 94 56 00 00 », « +33 6 12 34 56 78 ») ou numéro court
// d'urgence, mais seulement s'il suit son nom (« SAMU : 15 ») : sans ce
// contexte, « 15 minutes » ou « 18h » deviendraient des liens d'appel.
// Pas de lookbehind : il fait échouer le chargement sur les iOS d'avant 16.4.
const TELEPHONE = /(\+\d(?:[ .-]?\d){7,13}|0\d(?:[ .-]?\d{2}){4})(?!\d)|((?:samu|police|gendarmerie|pompiers|secours|urgences?(?: européenne)?)\s*:?\s*)(1[578]|11[2459])(?!\d)/gi

/**
 * Découpe un texte saisi par le gérant en morceaux, dont les numéros de
 * téléphone portent `tel` pour devenir des liens d'appel.
 */
export function decouperTelephones(texte) {
  const morceaux = []
  let curseur = 0
  for (const m of (texte || '').matchAll(TELEPHONE)) {
    const [, long, contexte, court] = m
    // Un chiffre juste avant : c'est la fin d'un nombre plus long, pas un numéro.
    if (long && m.index > 0 && /\d/.test(texte[m.index - 1])) continue
    const debutNumero = m.index + (contexte?.length || 0)
    const numero = long || court
    if (debutNumero > curseur) morceaux.push({ texte: texte.slice(curseur, debutNumero) })
    morceaux.push({ texte: numero, tel: numero.replace(/[ .-]/g, '') })
    curseur = debutNumero + numero.length
  }
  if (curseur < (texte || '').length) morceaux.push({ texte: texte.slice(curseur) })
  return morceaux
}
