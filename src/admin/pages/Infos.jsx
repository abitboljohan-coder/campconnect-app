import { useState } from 'react'
import { supabase } from '../../supabase'
import { Bloc, Alerte, EnTete } from '../components/Bloc'
import { Bouton, Pile, couleur as jetons, espace, graisse, rayon } from '../../design'

// Mêmes défauts que la page vacancier (src/pages/Infos.jsx)
const DEFAULT_INFOS = [
  { id: 'piscine',    emoji: '🏊', titre: 'Piscine',          contenu: 'Ouverte 9h – 20h\nSurveillée 10h – 19h' },
  { id: 'snack',      emoji: '🍺', titre: 'Bar / Snack',       contenu: 'Ouvert 10h – 23h\nPetit-déjeuner 8h – 10h30' },
  { id: 'reception',  emoji: '🏠', titre: 'Réception',         contenu: 'Lun – Ven : 8h – 19h\nSam – Dim : 8h – 20h' },
  { id: 'wifi',       emoji: '📶', titre: 'Wi-Fi',             contenu: 'Réseau : CampConnect\nCode : CAMPING2026' },
  { id: 'laverie',    emoji: '👕', titre: 'Laverie',           contenu: 'Ouverte 7h – 22h\nMachines disponibles en libre-service' },
  { id: 'poubelles',  emoji: '♻️', titre: 'Tri & Poubelles',  contenu: 'Zone tri au bloc sanitaire A\nEnlèvement : chaque matin à 8h' },
  { id: 'animaux',    emoji: '🐾', titre: 'Animaux',           contenu: 'Acceptés en laisse\nZone détente chiens : allée B' },
  { id: 'urgences',   emoji: '🚨', titre: 'Urgences',          contenu: 'Réception : 04 XX XX XX XX\nSAMU : 15 · Police : 17 · Pompiers : 18' },
]

export default function Infos({ camping, setCamping }) {
  const [items, setItems] = useState(
    Array.isArray(camping?.infos) && camping.infos.length > 0 ? camping.infos : DEFAULT_INFOS
  )
  const [saving, setSaving]   = useState(false)
  const [success, setSuccess] = useState(false)

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
    setItems(list => list.filter((_, i) => i !== idx))
  }
  function add() {
    setItems(list => [...list, { id: `custom-${Date.now()}`, emoji: 'ℹ️', titre: '', contenu: '' }])
  }

  async function save() {
    setSaving(true)
    const infos = items.filter(it => it.titre.trim())
    const { error } = await supabase.from('campings').update({ infos }).eq('id', camping.id)
    if (!error) {
      setCamping?.({ ...camping, infos })
      setItems(infos.length > 0 ? infos : DEFAULT_INFOS)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }
    setSaving(false)
  }

  return (
    <Pile espace="lg" style={{ maxWidth: 640 }}>
      <EnTete
        titre="Infos pratiques"
        sous="Le livret d'accueil affiché aux vacanciers dans l'onglet « Infos ». Personnalisez les rubriques, l'ordre et le contenu."
      />

      {success && <Alerte type="succes">Livret d’accueil mis à jour !</Alerte>}

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
                style={{ ...saisie, flex: 1, fontWeight: graisse.fort }}
              />
              {/* Les trois commandes n'avaient qu'une flèche pour contenu : un
                  `title` s'affiche à la souris mais reste muet au toucher et
                  n'est pas garanti aux lecteurs d'écran. */}
              <IconeBouton libelle="Monter" onClick={() => move(idx, -1)} disabled={idx === 0}>↑</IconeBouton>
              <IconeBouton libelle="Descendre" onClick={() => move(idx, 1)} disabled={idx === items.length - 1}>↓</IconeBouton>
              <IconeBouton libelle="Supprimer" onClick={() => remove(idx)} danger>✕</IconeBouton>
            </Pile>
            <textarea
              value={it.contenu}
              onChange={e => update(idx, { contenu: e.target.value })}
              placeholder="Contenu (une info par ligne)"
              aria-label={`Contenu de la rubrique ${idx + 1}`}
              rows={3}
              style={{ ...saisie, width: '100%', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }}
            />
          </Bloc>
        ))}

        <button onClick={add} style={{
          padding: '13px', borderRadius: rayon.md, border: `2px dashed ${jetons.bordure}`,
          background: 'none', color: jetons.texteDoux, fontWeight: graisse.fort, fontSize: 14, cursor: 'pointer',
        }}>
          + Ajouter une rubrique
        </button>

        <Pile direction="ligne" espace="sm">
          <Bouton variante="secondaire" taille="lg" style={{ flex: 1 }} onClick={() => setItems(DEFAULT_INFOS)}>
            Rétablir les rubriques par défaut
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
        width: 34, height: 34, borderRadius: rayon.sm,
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
