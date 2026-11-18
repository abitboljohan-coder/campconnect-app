import { Carte, Texte, Pile, Icone, graisse } from '../../design'
import { jetons } from '../theme'

/**
 * Une mesure, dans une tuile.
 *
 * Une seule couleur pour toutes les tuiles : cinq icônes de cinq couleurs
 * faisaient un arc-en-ciel où rien ne ressortait. C'est le chiffre qui doit se
 * lire en premier ; l'icône, discrète, accompagne le libellé.
 *
 * `cellule` : sans le cadre de carte, pour un panneau qui en réunit plusieurs.
 * `compact` : tuile blanche sans bordure, pour la grille de l'accueil.
 */
export default function StatCard({ icone, valeur, libelle, sous, cellule = false, compact = false, enfant, style }) {
  if (compact) {
    return (
      <div style={{ background: jetons.surface, borderRadius: 16, padding: '14px 16px', minWidth: 0, ...style }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: jetons.texteMoyen, lineHeight: 1.3 }}>{libelle}</p>
        <p style={{
          margin: '6px 0 2px', fontSize: 30, fontWeight: 700, color: jetons.texte, lineHeight: 1.1,
          letterSpacing: '-0.01em', fontVariantNumeric: 'tabular-nums',
        }}>
          {valeur}
        </p>
        {enfant}
        {sous && <p style={{ margin: 0, fontSize: 13, color: jetons.texteDoux, lineHeight: 1.4 }}>{sous}</p>}
      </div>
    )
  }
  const contenu = (
    <Pile espace="sm">
      <Pile direction="ligne" espace="sm" aligner="center" style={{ color: jetons.texteDoux }}>
        <Icone nom={icone} taille={16} />
        <Texte variante="doux" as="span" style={{ fontWeight: graisse.fort, color: jetons.texteDoux, lineHeight: 1.3 }}>
          {libelle}
        </Texte>
      </Pile>
      <Texte variante="titre" as="p" style={{
        fontSize: 32, lineHeight: 1.05, color: jetons.texte,
        letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums',
      }}>
        {valeur}
      </Texte>
      {enfant}
      {sous && <Texte variante="micro" style={{ color: jetons.texteDoux }}>{sous}</Texte>}
    </Pile>
  )
  if (cellule) {
    return (
      <div style={{ padding: '20px 22px', minWidth: 0, boxShadow: `1px 0 0 ${jetons.bordure}, 0 1px 0 ${jetons.bordure}` }}>
        {contenu}
      </div>
    )
  }
  return (
    <Carte hauteur="posee" padding="20px 22px"
           style={{ borderRadius: 14, boxShadow: 'none', border: `1px solid ${jetons.bordure}` }}>
      {contenu}
    </Carte>
  )
}
