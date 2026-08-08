import { espace as jetons } from './tokens'

/**
 * Empilement vertical ou horizontal avec un espacement issu de l'échelle.
 *
 * Remplace les `display: flex` recopiés partout — l'application en comptait
 * plus de deux cents, chacun avec sa propre valeur de `gap`.
 */
export default function Pile({
  direction = 'colonne',
  espace: e = 'md',
  aligner,
  justifier,
  retour = false,
  children,
  style,
  ...reste
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: direction === 'ligne' ? 'row' : 'column',
        gap: typeof e === 'number' ? e : jetons[e],
        alignItems: aligner,
        justifyContent: justifier,
        flexWrap: retour ? 'wrap' : undefined,
        ...style,
      }}
      {...reste}
    >
      {children}
    </div>
  )
}
