import { couleur, espace } from './tokens'
import Texte from './Texte'

/**
 * État vide.
 *
 * Une liste vide n'est pas une erreur : c'est le premier écran que voit un
 * vacancier qui vient d'arriver. L'application se contentait jusqu'ici d'une
 * ligne de gris centrée — techniquement correcte, et parfaitement muette sur ce
 * qu'il convient de faire ensuite. D'où l'action facultative.
 */
export default function Vide({ emoji, titre, texte, action, style }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: espace.sm, textAlign: 'center', padding: `48px ${espace.xl}px`,
      color: couleur.texteDoux,
      ...style,
    }}>
      {emoji && <span aria-hidden="true" style={{ fontSize: 40 }}>{emoji}</span>}
      {titre && <Texte variante="sousTitre">{titre}</Texte>}
      {texte && <Texte variante="corps" style={{ maxWidth: 320 }}>{texte}</Texte>}
      {action && <div style={{ marginTop: espace.sm }}>{action}</div>}
    </div>
  )
}
