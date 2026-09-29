/**
 * Emojis proposés aux vacanciers, et ceux qu'on refuse.
 *
 * Le choix était limité à une douzaine d'icônes figées par écran : impossible
 * d'illustrer un groupe « Tarot », « Crêpes » ou « Pêche à la ligne ». Le
 * vacancier peut désormais prendre n'importe quel emoji — dans les catégories
 * ci-dessous ou directement depuis le clavier de son téléphone — à l'exception
 * d'une courte liste à connotation sexuelle, violente ou morbide. CampConnect
 * est une application familiale : un groupe s'affiche à des enfants.
 *
 * Ces règles vivent hors des écrans pour se tester seules.
 */

// Chaque catégorie s'affiche comme un onglet, représenté par son icône.
export const CATEGORIES_EMOJIS = [
  { id: 'visages', icone: '😀', emojis: [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉',
    '😍', '🥰', '😘', '😎', '🤩', '🥳', '😜', '🤪', '🤗', '🤔', '😴', '😌',
    '🤠', '🥸', '😺', '👻', '🤖', '👽', '👋', '👍', '👏', '🙌', '🤝', '✌️',
    '💪', '🙏', '❤️', '💚',
  ] },
  { id: 'sport', icone: '⚽', emojis: [
    '⚽', '🏀', '🏐', '🏈', '🏉', '🎾', '🏓', '🏸', '🥏', '🎳', '⛳', '🏹',
    '🎣', '🤿', '🛹', '🛼', '🏄', '🏊', '🚣', '🧗', '🚴', '🚵', '🏃', '🚶',
    '🥾', '🧘', '🤸', '🏋️', '⛹️', '🥊', '🎯', '♟️', '🏇', '⛸️', '🏆', '🥇',
  ] },
  { id: 'manger', icone: '🍕', emojis: [
    '🍕', '🍔', '🍟', '🌭', '🥪', '🌮', '🥗', '🍝', '🍜', '🍣', '🥐', '🥖',
    '🥞', '🧇', '🧀', '🍖', '🍗', '🥩', '🍤', '🦪', '🍦', '🍨', '🍰', '🎂',
    '🍩', '🍪', '🍫', '🍿', '🍉', '🍓', '🍒', '🍎', '🍋', '🍍', '🥥', '🍇',
    '🌽', '🥕',
  ] },
  { id: 'boire', icone: '🍹', emojis: [
    '☕', '🍵', '🧃', '🥤', '🧋', '🥛', '🍹', '🍸', '🍷', '🍺', '🍻', '🥂',
    '🍾', '🧉', '🧊', '💧',
  ] },
  { id: 'nature', icone: '🌲', emojis: [
    '🏕️', '⛺', '🌲', '🌳', '🌴', '🌵', '🌿', '🍀', '🍁', '🍄', '🌻', '🌸',
    '🌺', '🌼', '🌷', '🌊', '🏖️', '🏝️', '⛰️', '🏔️', '🏞️', '🌅', '🌄', '☀️',
    '🌤️', '⛅', '🌧️', '⛈️', '🌈', '🌙', '⭐', '🌟', '✨', '🔥', '❄️', '🪵',
  ] },
  { id: 'animaux', icone: '🐶', emojis: [
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮',
    '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🦆', '🦉', '🐴', '🦄', '🐝', '🦋',
    '🐌', '🐞', '🐢', '🦎', '🐙', '🦀', '🐠', '🐬', '🐳', '🦈', '🦜', '🦩',
    '🦔', '🐿️',
  ] },
  { id: 'fete', icone: '🎉', emojis: [
    '🎉', '🎊', '🎈', '🎁', '🎶', '🎵', '🎤', '🎧', '🎸', '🎹', '🥁', '🎺',
    '🎻', '💃', '🕺', '🎭', '🎨', '🎬', '📷', '🎮', '🕹️', '🎲', '🧩', '🃏',
    '🪁', '🎠', '🎡', '🎢', '🎪', '🎆', '🎇', '📣', '🔔', '💡', '📚', '🧸',
  ] },
  { id: 'voyage', icone: '🚲', emojis: [
    '🚲', '🛴', '🚗', '🚐', '🚌', '🚤', '⛵', '🛶', '🚂', '✈️', '🚁', '🗺️',
    '🧭', '🎒', '🧳', '🔦', '🧺', '⛱️', '🩴', '🕶️', '👒', '🧢', '🛠️', '🔧',
  ] },
]

// Suggestions affichées d'emblée, propres à chaque écran.
export const SUGGESTIONS_GROUPES = ['🎳', '🍻', '🥾', '🏐', '🏊', '🍖', '🎮', '🔥', '🚴', '🎯', '🎸', '🍕', '♟️', '🧘']
export const SUGGESTIONS_STATUTS = ['🔥', '🍻', '🎳', '🏊', '🎉', '🍖', '🎾', '📣']
export const SUGGESTIONS_AVATARS = ['🏕️', '🌲', '⛺', '🎯', '🚴', '🏊', '🎣', '🌻', '🦜', '🌈', '🦊', '🐢']

/**
 * Refusés : connotation sexuelle, geste insultant, armes, drogues, morbide.
 *
 * Liste volontairement courte et explicite. Elle vise les emojis dont l'usage
 * détourné est notoire, pas le moindre sous-entendu imaginable : la banane
 * reste disponible, la pêche 🍑 non — son sens détourné l'emporte de loin sur
 * le fruit. Les drapeaux restent tous permis.
 */
const REFUSES = [
  '🍆', '🍑', '💦', '👅', '🫦', '🥵', '🔞',   // sexuel
  '🖕',                                         // insulte
  '🔫', '🔪', '🗡️', '💣',                     // armes
  '💊', '💉', '🚬',                             // drogues
  '💀', '☠️', '⚰️', '🪦', '🩸', '💩',           // morbide, scatologique
]

// Modificateurs qui ne changent pas le sens d'un emoji : couleur de peau,
// sélecteur de présentation, liant de séquence. Retirés avant comparaison,
// sinon 🖕🏽 passerait là où 🖕 est refusé.
const NEUTRES = /[\u{1F3FB}-\u{1F3FF}]|\u{FE0E}|\u{FE0F}|\u{200D}/gu
const base = e => e.replace(NEUTRES, '')

const REFUSES_BASE = new Set(REFUSES.map(base))

const PICTO = /\p{Extended_Pictographic}/u
const DRAPEAU = /\p{Regional_Indicator}{2}/u

/** Découpe un texte en caractères visibles (graphèmes). */
function graphemes(texte) {
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    return [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(texte)].map(s => s.segment)
  }
  return Array.from(texte)   // repli : sans Segmenter, un emoji composé se découpe mal
}

/** Vrai si `e` est un seul emoji, et rien d'autre. */
export function estEmoji(e) {
  if (typeof e !== 'string' || !e || e.length > 16) return false
  const g = graphemes(e)
  if (g.length !== 1) return false
  return PICTO.test(e) || DRAPEAU.test(e)
}

/** Vrai si l'emoji fait partie de la liste refusée — en entier ou en partie. */
export function estRefuse(e) {
  if (!e) return false
  const b = base(e)
  if (REFUSES_BASE.has(b)) return true
  // Séquence composée (👨‍👩‍👧, 🏳️‍🌈…) : refusée si l'un de ses éléments l'est.
  return Array.from(b).some(c => REFUSES_BASE.has(c))
}

export const emojiAutorise = e => estEmoji(e) && !estRefuse(e)

/**
 * Dernier emoji d'un texte tapé au clavier : c'est celui que l'on vient
 * d'ajouter. Renvoie null s'il n'y en a aucun.
 */
export function dernierEmoji(texte) {
  if (!texte) return null
  const g = graphemes(texte)
  for (let i = g.length - 1; i >= 0; i--) {
    if (estEmoji(g[i])) return g[i]
  }
  return null
}
