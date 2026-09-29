import { Carte, Texte, Pile, Icone, couleur as jetons, graisse, rayon } from '../../design'

/**
 * Une mesure, dans une tuile.
 *
 * La teinte reste une propriété — les chiffres se distinguent entre eux, ce
 * que l'accent unique du camping ne peut pas exprimer. Mais elle ne porte plus
 * qu'un aplat discret derrière l'icône : cinq tuiles à cinq couleurs pleines
 * faisaient un arc-en-ciel où rien ne ressortait. Le chiffre, lui, garde
 * toujours la couleur du texte.
 */
export default function StatCard({ icone, valeur, libelle, sous, couleur = jetons.marqueTexte }) {
  return (
    <Carte hauteur="posee" padding={16} style={{ borderRadius: 14 }}>
      {/* L'icône s'aligne sur le chiffre, et le libellé passe dessous, sur toute
          la largeur : à côté de l'icône, deux tuiles par ligne sur un téléphone
          lui laissaient 70 px, et « remplissage » se coupait en deux. */}
      <Pile espace="sm">
        <Pile direction="ligne" espace="md" aligner="center">
          <span aria-hidden="true" style={{
            width: 36, height: 36, borderRadius: rayon.md,
            background: `${couleur}14`, color: couleur,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Icone nom={icone} taille={19} />
          </span>
          <Texte variante="titre" style={{ fontSize: 26, lineHeight: 1 }}>{valeur}</Texte>
        </Pile>
        <div style={{ minWidth: 0 }}>
          <Texte variante="doux" style={{ fontWeight: graisse.fort, color: jetons.texte, lineHeight: 1.3 }}>
            {libelle}
          </Texte>
          {sous && <Texte variante="micro" style={{ marginTop: 2 }}>{sous}</Texte>}
        </div>
      </Pile>
    </Carte>
  )
}
