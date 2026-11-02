import { Carte, Texte, Pile, espace, graisse, rayon } from '../../design'
import { jetons } from '../theme'

// Trois pages d'administration définissaient chacune leur propre `Card` et son
// propre `Alert`, avec trois rayons et deux gris. Ce sont les deux seules
// structures que toutes les pages partagent : elles vivent ici.

/** Section titrée de l'administration. */
export function Bloc({ titre, children, ...reste }) {
  return (
    <Carte hauteur="posee" padding="20px 22px" {...reste}
           style={{ borderRadius: 14, boxShadow: 'none', border: `1px solid ${jetons.bordure}`, ...reste.style }}>
      <Pile espace="lg">
        {titre && <Texte variante="sousTitre" as="h2" style={{ fontSize: 16, color: jetons.texte }}>{titre}</Texte>}
        {children}
      </Pile>
    </Carte>
  )
}

/**
 * Message de résultat.
 *
 * `role="status"` plutôt qu'une simple couleur : après un enregistrement, un
 * gérant qui n'a pas les yeux sur cette zone de l'écran n'apprenait rien du
 * succès ou de l'échec de son action.
 */
export function Alerte({ type = 'succes', children }) {
  const ok = type === 'succes'
  return (
    <div
      role={ok ? 'status' : 'alert'}
      style={{
        background: ok ? '#f0fdf4' : jetons.dangerFond,
        color: ok ? jetons.succes : jetons.danger,
        padding: `${espace.md}px ${espace.lg}px`,
        borderRadius: rayon.md,
        fontSize: 14, fontWeight: graisse.normal,
        border: `1px solid ${ok ? '#bbf7d0' : '#fecaca'}`,
      }}
    >
      {ok ? '✅ ' : '❌ '}{children}
    </div>
  )
}

/** En-tête de page : titre et une phrase qui dit à quoi la page sert. */
export function EnTete({ titre, sous }) {
  return (
    <Pile espace="xs">
      <Texte variante="titre" style={{ fontSize: 28, color: jetons.texte, letterSpacing: '-0.02em' }}>{titre}</Texte>
      {sous && <Texte variante="corps" style={{ color: jetons.texteDoux }}>{sous}</Texte>}
    </Pile>
  )
}
