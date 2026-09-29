import { useState } from 'react'
import { t } from '../i18n'
import { CATEGORIES_EMOJIS, dernierEmoji, estRefuse } from '../lib/emojis'
import { Texte, Pile, couleur, espace, graisse, rayon } from '../design'

/**
 * Choix d'un emoji : quelques suggestions d'emblée, tout le reste à un appui.
 *
 * Trois niveaux, du plus rapide au plus libre :
 *   1. les suggestions propres à l'écran, toujours visibles ;
 *   2. « Plus d'emojis » : des catégories, une à la fois — les afficher toutes
 *      d'un coup allongerait la feuille de plus d'un mètre de défilement ;
 *   3. un champ où taper n'importe quel emoji depuis le clavier du téléphone.
 *
 * Les emojis refusés (voir lib/emojis) ne sont proposés nulle part, et un
 * emoji refusé tapé au clavier est écarté avec un message plutôt qu'en silence.
 */
export default function ChoixEmoji({ valeur, onChange, suggestions, libelle, taille = 44 }) {
  const [ouvert, setOuvert] = useState(false)
  const [categorie, setCategorie] = useState(CATEGORIES_EMOJIS[0].id)
  const [saisie, setSaisie] = useState('')
  const [message, setMessage] = useState('')

  // Un emoji choisi hors des suggestions reste visible en tête : sans cela,
  // l'utilisateur referme le panneau et ne voit plus ce qu'il a choisi.
  const visibles = valeur && !suggestions.includes(valeur) ? [valeur, ...suggestions] : suggestions
  const emojisCategorie = CATEGORIES_EMOJIS.find(c => c.id === categorie)?.emojis || []

  function taper(texte) {
    const e = dernierEmoji(texte)
    if (!e) {
      setSaisie(texte)
      setMessage(texte.trim() ? t('emoji.seulement') : '')
      return
    }
    setSaisie('')
    if (estRefuse(e)) { setMessage(t('emoji.refuse')); return }
    setMessage('')
    onChange(e)
  }

  const bouton = (e, actif, onClick, etiquette) => (
    <button
      key={e}
      type="button"
      aria-label={etiquette || e}
      aria-pressed={actif}
      onClick={onClick}
      style={{
        width: taille, height: taille, fontSize: Math.round(taille / 2), borderRadius: rayon.md,
        border: `2px solid ${actif ? 'var(--cc-accent)' : couleur.bordure}`,
        background: actif ? 'var(--cc-accent-voile)' : couleur.surface,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, transition: 'all 0.1s',
      }}
    >
      {e}
    </button>
  )

  return (
    <Pile espace="sm" role="group" aria-label={libelle}>
      {libelle && <Texte variante="libelle" as="span">{libelle}</Texte>}

      <Pile direction="ligne" espace="sm" retour>
        {visibles.map(e => bouton(e, valeur === e, () => onChange(e)))}
        <button
          type="button"
          aria-expanded={ouvert}
          onClick={() => { setOuvert(o => !o); setMessage('') }}
          style={{
            height: taille, padding: `0 ${espace.md}px`, borderRadius: rayon.md,
            border: `2px dashed ${ouvert ? 'var(--cc-accent)' : couleur.bordure}`,
            background: ouvert ? 'var(--cc-accent-voile)' : couleur.surface,
            color: 'var(--cc-accent)', fontWeight: graisse.fort, fontSize: 14,
            whiteSpace: 'nowrap',
          }}
        >
          {ouvert ? t('emoji.moins') : t('emoji.plus')}
        </button>
      </Pile>

      {ouvert && (
        <Pile espace="sm" style={{
          padding: espace.md, borderRadius: rayon.lg,
          background: couleur.fondClair, border: `1px solid ${couleur.bordure}`,
        }}>
          {/* Onglets de catégorie : une icône chacun, ils tiennent sur une ligne. */}
          <div role="tablist" style={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
            {CATEGORIES_EMOJIS.map(c => (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={categorie === c.id}
                aria-label={t(`emoji.cat_${c.id}`)}
                onClick={() => setCategorie(c.id)}
                style={{
                  flex: 1, minWidth: 0, height: 36, fontSize: 19, borderRadius: rayon.sm,
                  background: categorie === c.id ? couleur.surface : 'transparent',
                  boxShadow: categorie === c.id ? '0 1px 3px rgba(26,26,26,0.12)' : 'none',
                }}
              >
                {c.icone}
              </button>
            ))}
          </div>

          <Pile direction="ligne" espace={6} retour role="tabpanel">
            {emojisCategorie.map(e => bouton(e, valeur === e, () => onChange(e)))}
          </Pile>

          {/* N'importe quel emoji du clavier. Le champ se vide aussitôt l'emoji
              retenu : on peut en taper un autre pour changer d'avis. */}
          <input
            type="text"
            value={saisie}
            onChange={e => taper(e.target.value)}
            placeholder={t('emoji.autre')}
            aria-label={t('emoji.autre')}
            autoComplete="off"
            autoCorrect="off"
            enterKeyHint="done"
            style={{
              width: '100%', minHeight: 44, padding: `${espace.sm}px ${espace.md}px`,
              fontSize: 16, borderRadius: rayon.md,
              border: `1px solid ${couleur.bordure}`, background: couleur.surface, color: couleur.texte,
            }}
          />
          {message && (
            <Texte variante="micro" role="alert" style={{ color: couleur.danger, fontWeight: graisse.fort }}>
              {message}
            </Texte>
          )}
        </Pile>
      )}
    </Pile>
  )
}
