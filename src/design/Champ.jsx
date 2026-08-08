import { useId } from 'react'
import { couleur, espace, graisse, rayon } from './tokens'
import Texte from './Texte'

/**
 * Champ de saisie avec son libellé, son aide et son erreur.
 *
 * Le libellé est lié à l'entrée par un identifiant généré : sans cela, un
 * lecteur d'écran annonce « zone de texte » sans dire de quoi il s'agit, et un
 * appui sur le libellé ne donne pas le focus au champ.
 *
 * La taille de police ne descend jamais sous 16 px : en deçà, iOS zoome
 * automatiquement à la mise au point et l'utilisateur se retrouve avec une
 * page décalée qu'il doit remettre en place à la main.
 */
export default function Champ({
  libelle, aide, erreur, id,
  multiligne = false,
  style, ...reste
}) {
  const auto = useId()
  const idChamp = id || auto
  // L'aide n'est rendue que lorsqu'aucune erreur ne la remplace : la référencer
  // dans aria-describedby en dehors de ce cas pointerait vers un élément
  // absent, et un lecteur d'écran n'annoncerait rien.
  const idAide = aide && !erreur ? `${idChamp}-aide` : undefined
  const idErreur = erreur ? `${idChamp}-erreur` : undefined
  const Balise = multiligne ? 'textarea' : 'input'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: espace.xs }}>
      {libelle && (
        <label htmlFor={idChamp}>
          <Texte variante="libelle" as="span">{libelle}</Texte>
        </label>
      )}
      <Balise
        id={idChamp}
        aria-describedby={[idAide, idErreur].filter(Boolean).join(' ') || undefined}
        aria-invalid={erreur ? true : undefined}
        style={{
          width: '100%',
          padding: `${espace.md}px ${espace.md}px`,
          fontSize: 16,
          fontFamily: 'inherit',
          color: couleur.texte,
          background: couleur.surface,
          border: `1px solid ${erreur ? couleur.danger : couleur.bordure}`,
          borderRadius: rayon.md,
          minHeight: multiligne ? 96 : 48,
          resize: multiligne ? 'vertical' : undefined,
          ...style,
        }}
        {...reste}
      />
      {aide && !erreur && <Texte variante="micro" id={idAide}>{aide}</Texte>}
      {erreur && (
        <Texte variante="micro" id={idErreur} style={{ color: couleur.danger, fontWeight: graisse.fort }}>
          {erreur}
        </Texte>
      )}
    </div>
  )
}
