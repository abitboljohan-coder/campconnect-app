import { useState } from 'react'
import { supabase } from '../../supabase'
import { Bloc, EnTete } from '../components/Bloc'
import { toast } from '../../toast'
import { MODELES_INFOS, infosPubliables } from '../../lib/infos'
import { Bouton, Pile, couleur as jetons, espace, graisse, rayon } from '../../design'

// Les modèles ne sont que des exemples : on les propose avec leur titre et un
// contenu vide, l'exemple restant en texte indicatif. Pré-remplis, ils
// partaient tels quels chez les vacanciers (faux code Wi-Fi, faux numéro de
// réception) dès que le gérant enregistrait sans tout relire.
const modeleDe = (id) => MODELES_INFOS.find(m => m.id === id)

export default function Infos({ camping, setCamping }) {
  const [items, setItems] = useState(() => infosPubliables(camping?.infos))
  const [saving, setSaving]   = useState(false)

  function update(idx, patch) {
    setItems(list => list.map((it, i) => i === idx ? { ...it, ...patch } : it))
  }
  function move(idx, dir) {
    setItems(list => {
      const l = [...list]
      const j = idx + dir
      if (j < 0 || j >= l.length) return l
      ;[l[idx], l[j]] = [l[j], l[idx]]
      return l
    })
  }
  function remove(idx) {
    const it = items[idx]
    const rempli = it.titre.trim() || it.contenu.trim()
    if (rempli && !confirm(`Supprimer la rubrique « ${it.titre.trim() || 'sans titre'} » ?`)) return
    setItems(list => list.filter((_, i) => i !== idx))
  }
  function add() {
    setItems(list => [...list, { id: `custom-${Date.now()}`, emoji: 'ℹ️', titre: '', contenu: '' }])
  }
  // Ajoute les modèles absents à la suite, sans rien effacer : l'ancien
  // « Rétablir » remplaçait d'un appui tout le livret du gérant.
  function ajouterModeles() {
    setItems(list => [
      ...list,
      ...MODELES_INFOS.filter(m => !list.some(it => it.id === m.id)).map(m => ({ ...m, contenu: '' })),
    ])
  }

  async function save() {
    setSaving(true)
    const infos = infosPubliables(items)
    const { error } = await supabase.from('campings').update({ infos }).eq('id', camping.id)
    setSaving(false)
    // Toast plutôt qu'une alerte en haut de page : le bouton est tout en bas,
    // et un échec passait jusqu'ici inaperçu.
    if (error) {
      console.error('Enregistrement du livret échoué :', error)
      toast("Le livret n'a pas pu être enregistré. Réessayez.", 'erreur')
      return
    }
    setCamping?.({ ...camping, infos })
    // Les rubriques encore vides restent à l'écran, à compléter.
    const nonPubliees = items.filter(it => it.titre.trim()).length - infos.length
    toast(nonPubliees > 0
      ? `Livret enregistré. ${nonPubliees} rubrique${nonPubliees > 1 ? 's' : ''} sans contenu non publiée${nonPubliees > 1 ? 's' : ''}.`
      : 'Livret d’accueil mis à jour !', 'succes')
  }

  return (
    <Pile espace="lg" style={{ maxWidth: 640 }}>
      <EnTete
        titre="Infos pratiques"
        sous="Le livret d'accueil affiché aux vacanciers dans l'onglet « Infos ». Personnalisez les rubriques, l'ordre et le contenu. Une rubrique sans contenu n'est pas publiée."
      />

      {items.length === 0 && (
        <Bloc>
          Votre livret est vide. Les vacanciers voient « demandez à la réception » et les
          numéros d'urgence (15, 17, 18, 112). Ajoutez vos rubriques, ou partez des modèles.
        </Bloc>
      )}

      <Pile espace="md">
        {items.map((it, idx) => (
          <Bloc key={it.id}>
            <Pile direction="ligne" espace="sm" aligner="center">
              <input
                value={it.emoji}
                onChange={e => update(idx, { emoji: e.target.value })}
                maxLength={4}
                aria-label={`Emoji de la rubrique ${idx + 1}`}
                style={{ ...saisie, width: 54, textAlign: 'center', fontSize: 20, padding: '8px 4px' }}
              />
              <input
                value={it.titre}
                onChange={e => update(idx, { titre: e.target.value })}
                placeholder="Titre de la rubrique"
                aria-label={`Titre de la rubrique ${idx + 1}`}
                // minWidth 0 : sans lui, un champ ne rétrécit pas sous sa
                // largeur par défaut et poussait les boutons hors de l'écran.
                style={{ ...saisie, flex: 1, minWidth: 0, fontWeight: graisse.fort }}
              />
            </Pile>
            <textarea
              value={it.contenu}
              onChange={e => update(idx, { contenu: e.target.value })}
              placeholder={modeleDe(it.id) ? `Exemple, à adapter :\n${modeleDe(it.id).contenu}` : 'Contenu (une info par ligne)'}
              aria-label={`Contenu de la rubrique ${idx + 1}`}
              rows={3}
              style={{ ...saisie, width: '100%', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }}
            />
            {/* Les commandes ont leur propre ligne : sur la ligne du titre, elles
                sortaient de l'écran d'un téléphone de 87 à 157 px.
                Les trois n'avaient qu'une flèche pour contenu : un `title`
                s'affiche à la souris mais reste muet au toucher et n'est pas
                garanti aux lecteurs d'écran. */}
            <Pile direction="ligne" espace="sm" justifier="flex-end">
              <IconeBouton libelle="Monter" onClick={() => move(idx, -1)} disabled={idx === 0}>↑</IconeBouton>
              <IconeBouton libelle="Descendre" onClick={() => move(idx, 1)} disabled={idx === items.length - 1}>↓</IconeBouton>
              <IconeBouton libelle="Supprimer" onClick={() => remove(idx)} danger>✕</IconeBouton>
            </Pile>
          </Bloc>
        ))}

        <button onClick={add} style={{
          padding: '13px', borderRadius: rayon.md, border: `2px dashed ${jetons.bordure}`,
          background: 'none', color: jetons.texteDoux, fontWeight: graisse.fort, fontSize: 14, cursor: 'pointer',
        }}>
          + Ajouter une rubrique
        </button>

        <Pile direction="ligne" espace="sm">
          <Bouton variante="secondaire" taille="lg" style={{ flex: 1 }} onClick={ajouterModeles}>
            Ajouter les rubriques modèles
          </Bouton>
          <Bouton taille="lg" style={{ flex: 2 }} charge={saving} onClick={save}>
            {saving ? 'Enregistrement…' : 'Enregistrer le livret'}
          </Bouton>
        </Pile>
      </Pile>
    </Pile>
  )
}

function IconeBouton({ libelle, danger, children, ...reste }) {
  return (
    <button
      aria-label={libelle}
      title={libelle}
      style={{
        width: 44, height: 44, borderRadius: rayon.sm,
        border: `1px solid ${jetons.bordure}`, background: jetons.surface,
        cursor: 'pointer', fontSize: 14, flexShrink: 0,
        color: danger ? jetons.danger : jetons.texteMoyen,
      }}
      {...reste}
    >
      {children}
    </button>
  )
}

const saisie = {
  padding: `10px ${espace.md}px`, borderRadius: rayon.md,
  border: `1.5px solid ${jetons.bordure}`, fontSize: 16, outline: 'none',
  background: jetons.fondClair, boxSizing: 'border-box',
}
