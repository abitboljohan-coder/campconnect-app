import { couleur, espace, rayon } from './tokens'

/**
 * Attente de chargement.
 *
 * Cinq écrans redessinaient le même bloc pulsant, avec cinq hauteurs et deux
 * gris différents. Le motif compte : montrer la forme de ce qui arrive évite
 * le saut de mise en page au moment où les données tombent.
 *
 * `aria-busy` et le libellé rendent l'attente audible ; un lecteur d'écran
 * annonçait jusqu'ici une page vide, sans indiquer qu'elle se remplissait.
 */
export default function Squelette({ lignes = 3, hauteur = 84, libelle = 'Chargement…' }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={libelle}
      style={{ display: 'flex', flexDirection: 'column', gap: espace.sm }}
    >
      {Array.from({ length: lignes }, (_, i) => (
        <div
          key={i}
          style={{
            height: hauteur,
            borderRadius: rayon.lg,
            background: couleur.bordure,
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
      ))}
    </div>
  )
}
