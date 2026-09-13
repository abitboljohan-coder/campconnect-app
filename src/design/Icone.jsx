import { TRACES } from './icones'

/**
 * Icônes au trait.
 *
 * L'administration se repérait à l'emoji. Un emoji n'est pas une icône : son
 * dessin change avec le système, sa couleur ne suit pas celle du texte, et il
 * porte un ton — 🛡️ à côté de 🎨 ne fait pas une famille. Ces tracés-ci
 * partagent une grille, une épaisseur, des extrémités arrondies, et prennent
 * la couleur courante.
 *
 * `aria-hidden` par défaut : une icône double toujours un libellé ici, elle
 * n'a rien à annoncer de plus.
 */
export default function Icone({ nom, taille = 22, epaisseur = 1.7, style, ...reste }) {
  const trace = TRACES[nom]
  if (!trace) return null
  return (
    <svg
      width={taille} height={taille} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={epaisseur}
      strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" focusable="false"
      style={{ display: 'block', flexShrink: 0, ...style }}
      {...reste}
    >
      <path d={trace} />
    </svg>
  )
}
