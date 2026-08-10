import { couleur, espace, graisse, rayon, texte as tailles } from './tokens'

/**
 * Puce sélectionnable — la pastille arrondie que l'on active ou désactive.
 *
 * L'application en comptait cinq implémentations : centres d'intérêt et
 * tranches d'âge dans le profil, catégories dans le signalement, options dans
 * l'accueil, langues. Chacune avec son propre rayon, sa propre bordure et sa
 * propre façon d'exprimer l'état actif — dont deux qui ne l'exprimaient que par
 * la couleur, invisible pour qui ne la distingue pas.
 *
 * Ici l'état est porté par `aria-pressed` : il est annoncé, pas seulement teinté.
 */
export default function Puce({ actif = false, taille = 'md', children, style, ...reste }) {
  const compact = taille === 'sm'
  return (
    <button
      type="button"
      aria-pressed={actif}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: espace.xs,
        padding: compact ? `6px ${espace.md}px` : `9px ${espace.lg}px`,
        minHeight: compact ? 32 : 40,
        borderRadius: rayon.rond,
        fontSize: compact ? tailles.petit : tailles.base,
        fontWeight: graisse.fort,
        fontFamily: 'inherit',
        lineHeight: 1.2,
        cursor: 'pointer',
        background: actif ? 'var(--cc-accent-voile)' : couleur.surface,
        border: `2px solid ${actif ? 'var(--cc-accent)' : couleur.bordure}`,
        color: actif ? 'var(--cc-accent)' : couleur.texteMoyen,
        transition: 'background 0.15s, border-color 0.15s, color 0.15s',
        ...style,
      }}
      {...reste}
    >
      {children}
    </button>
  )
}
