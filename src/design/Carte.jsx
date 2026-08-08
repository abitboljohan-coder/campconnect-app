import { couleur, espace, ombre, rayon } from './tokens'

// Trois hauteurs, pas trente-deux ombres.
const HAUTEURS = {
  posee: ombre.posee,        // dans une liste
  levee: ombre.levee,        // en avant sur la page
  flottante: ombre.flottante,// au-dessus du contenu (feuille, dialogue)
}

export default function Carte({
  hauteur = 'posee',
  padding = espace.lg,
  bordure = true,
  cliquable = false,
  children,
  style,
  ...reste
}) {
  return (
    <div
      style={{
        background: couleur.surface,
        borderRadius: rayon.lg,
        padding,
        border: bordure ? `1px solid ${couleur.bordure}` : 'none',
        boxShadow: HAUTEURS[hauteur],
        cursor: cliquable ? 'pointer' : undefined,
        ...style,
      }}
      {...reste}
    >
      {children}
    </div>
  )
}
