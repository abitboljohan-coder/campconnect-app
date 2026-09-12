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
    <Carte hauteur="posee" padding={18} style={{ borderRadius: 14 }}>
      {/* L'icône s'aligne sur le chiffre, pas sur le milieu du bloc :
          centrée, elle se retrouvait à hauteur du libellé et semblait lui
          appartenir. */}
      <Pile direction="ligne" espace="md" aligner="flex-start">
        <span aria-hidden="true" style={{
          width: 38, height: 38, borderRadius: rayon.md,
          background: `${couleur}14`, color: couleur,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icone nom={icone} taille={20} />
        </span>
        <div style={{ minWidth: 0 }}>
          <Texte variante="titre" style={{ fontSize: 26, lineHeight: '38px' }}>{valeur}</Texte>
          <Texte variante="doux" style={{ marginTop: 4, fontWeight: graisse.fort, color: jetons.texte }}>
            {libelle}
          </Texte>
          {sous && <Texte variante="micro" style={{ marginTop: 2 }}>{sous}</Texte>}
        </div>
      </Pile>
    </Carte>
  )
}
