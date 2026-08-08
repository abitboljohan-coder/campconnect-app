import { rayon } from './tokens'

/**
 * Bouton d'action flottant.
 *
 * Sa position tient compte de la barre de navigation et de la zone sûre du
 * téléphone : posé à 82 px du bas en dur, il finissait sous la barre gestuelle
 * des iPhone récents, donc à moitié inatteignable.
 *
 * `aria-label` est exigé — un bouton dont le contenu est « + » n'annonce rien
 * d'utile, et c'est l'action principale de l'écran.
 */
export default function Fab({ label, children = '+', style, ...reste }) {
  return (
    <button
      aria-label={label}
      style={{
        position: 'fixed',
        bottom: 'calc(82px + var(--cc-safe-bottom, 0px))',
        right: 20,
        width: 56, height: 56,
        borderRadius: rayon.rond,
        background: 'var(--cc-accent)',
        color: '#fff',
        fontSize: 28, fontWeight: 300, lineHeight: 1,
        border: 'none', cursor: 'pointer',
        boxShadow: '0 4px 16px rgba(26, 26, 26, 0.28)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 50,
        transition: 'transform 0.15s, box-shadow 0.15s',
        ...style,
      }}
      {...reste}
    >
      {children}
    </button>
  )
}
