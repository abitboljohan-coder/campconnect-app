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
 */
export default function StatCard({ icone, valeur, libelle, sous, cellule = false, enfant }) {
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
