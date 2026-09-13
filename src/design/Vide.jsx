import { couleur, espace, rayon } from './tokens'
import Texte from './Texte'

/**
 * État vide.
 *
 * Une liste vide n'est pas une erreur : c'est le premier écran que voit un
 * vacancier qui vient d'arriver. L'application se contentait d'une ligne de
 * gris centrée — techniquement correcte, et parfaitement muette sur ce qu'il
 * convient de faire ensuite. D'où l'action facultative.
 *
 * L'emoji posé seul sur le fond donnait un écran qui semblait inachevé plutôt
 * que simplement vide. La plaque ronde teintée de l'accent du camping lui rend
 * une présence, et rattache l'écran aux couleurs de l'établissement au lieu de
 * le laisser en gris neutre.
 */
export default function Vide({ emoji, titre, texte, action, style }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: espace.sm, textAlign: 'center', padding: `48px ${espace.xl}px`,
      color: couleur.texteDoux,
      ...style,
    }}>
      {emoji && (
        <span aria-hidden="true" style={{
          width: 76, height: 76, borderRadius: rayon.rond,
          background: 'var(--cc-accent-voile, rgba(0,0,0,0.04))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 34, marginBottom: espace.xs,
        }}>
          {emoji}
        </span>
      )}
      {titre && <Texte variante="sousTitre">{titre}</Texte>}
      {texte && <Texte variante="corps" style={{ maxWidth: 320 }}>{texte}</Texte>}
      {action && <div style={{ marginTop: espace.sm }}>{action}</div>}
    </div>
  )
}
