import { couleur } from '../design/tokens'

/**
 * Teintes du paysage « carte postale » du profil et de la mini-fiche.
 *
 * L'accent change d'un camping à l'autre — vert, bleu-canard, orange, rouge —
 * et le paysage doit rester beau avec chacun. D'où deux règles :
 *   • les plans (collines, eau, forêt) sont un camaïeu de l'accent, éclairci
 *     au blanc ou assombri au noir, jamais mélangé à une autre teinte : un
 *     bleu-canard mêlé à du sable donne du gris, un vert mêlé à du rose aussi ;
 *   • la chaleur vient de la lumière, identique partout — horizon pêche,
 *     soleil crème au halo abricot, lanterne allumée dans la tente. C'est
 *     l'« heure dorée » des illustrations de voyage actuelles, et elle
 *     s'accorde à toutes les couleurs.
 *
 * Les mélanges sont calculés ici plutôt qu'en CSS (color-mix) : les WebView
 * d'iOS 15 et des Android anciens ne le comprennent pas, et le paysage
 * disparaîtrait sans erreur.
 */

/** [r, g, b] d'une couleur #rgb ou #rrggbb, ou null. */
export function versRvb(c) {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})([0-9a-f]{2})?$/i.exec(String(c || '').trim())
  if (!m) return null
  const h = m[1].length === 3 ? m[1].replace(/./g, x => x + x) : m[1]
  return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16))
}

const enHex = rvb => '#' + rvb.map(v => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('')

/** Mélange `part` de a (0 à 1) avec le reste de b. */
export function melange(a, b, part) {
  const x = versRvb(a), y = versRvb(b)
  if (!x || !y) return a
  return enHex(x.map((v, i) => v * part + y[i] * (1 - part)))
}

function luminance(c) {
  const [r, g, b] = versRvb(c).map(v => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Rapport de contraste WCAG entre deux couleurs. */
export function contraste(a, b) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((p, q) => q - p)
  return (l1 + 0.05) / (l2 + 0.05)
}

/** Accent valide, ou la couleur de la marque. */
export function accentSur(accent) {
  return versRvb(accent) ? enHex(versRvb(accent)) : couleur.marque
}

/**
 * L'accent en tant que couleur de texte : assombri juste assez pour atteindre
 * 4,5:1 sur le fond. Un jaune ou un orange vif choisi par un gérant restait
 * sinon illisible au soleil.
 */
export function accentLisible(accent, fond = couleur.fondClair) {
  let c = accentSur(accent)
  for (let k = 0; k < 30 && contraste(c, fond) < 4.5; k++) c = melange(c, '#000000', 0.9)
  return c
}

/** L'accent posé par appliquerTheme(), lu là où il sert. */
export function accentCourant() {
  try {
    return accentSur(getComputedStyle(document.documentElement).getPropertyValue('--cc-accent'))
  } catch {
    return couleur.marque
  }
}

export function teintesPaysage(accent) {
  const a = accentSur(accent)
  const clair = part => melange(a, '#ffffff', part)
  const sombre = part => melange(a, '#000000', part)
  return {
    cielHaut:  clair(0.24),
    cielBas:   '#ffe5c9',   // horizon pêche
    halo:      '#ffd49c',
    soleil:    '#fff7e6',
    lointain:  clair(0.34),
    colline:   clair(0.62),
    avant:     a,
    foret:     sombre(0.5),
    tente:     sombre(0.42),
    tenteOmbre: sombre(0.28),
    lueur:     '#ffc76a',   // la lanterne
    oiseaux:   sombre(0.55),
    // Ronds des centres d'intérêt
    anneau:    a,
    anneauClair: clair(0.4),
    disque:    clair(0.1),
    texte:     accentLisible(a),
  }
}
