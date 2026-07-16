import { useState } from 'react'
import { supabase } from '../../supabase'

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
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1a1a1a' }}>Infos pratiques</h1>
        <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>
          Le livret d'accueil affiché aux vacanciers dans l'onglet « Infos ». Personnalisez les rubriques, l'ordre et le contenu.
        </p>
      </div>

      {success && (
        <div style={{ background: '#dcfce7', color: '#166534', padding: '12px 16px', borderRadius: 10, fontSize: 14, fontWeight: 500, marginBottom: 16 }}>
          ✅ Livret d'accueil mis à jour !
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 640 }}>
        {items.map((it, idx) => (
          <div key={it.id} style={{ background: '#fff', borderRadius: 14, padding: 16, border: '1px solid rgba(0,0,0,0.07)' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
              <input
                value={it.emoji}
                onChange={e => update(idx, { emoji: e.target.value })}
                maxLength={4}
                style={{ ...inputStyle, width: 54, textAlign: 'center', fontSize: 20, padding: '8px 4px' }}
              />
              <input
                value={it.titre}
                onChange={e => update(idx, { titre: e.target.value })}
                placeholder="Titre de la rubrique"
                style={{ ...inputStyle, flex: 1, fontWeight: 600 }}
              />
              <button onClick={() => move(idx, -1)} disabled={idx === 0} style={btnIcon} title="Monter">↑</button>
              <button onClick={() => move(idx, 1)} disabled={idx === items.length - 1} style={btnIcon} title="Descendre">↓</button>
              <button onClick={() => remove(idx)} style={{ ...btnIcon, color: '#dc2626' }} title="Supprimer">✕</button>
            </div>
            <textarea
              value={it.contenu}
              onChange={e => update(idx, { contenu: e.target.value })}
              placeholder="Contenu (une info par ligne)"
              rows={3}
              style={{ ...inputStyle, width: '100%', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }}
            />
          </div>
        ))}

        <button onClick={add} style={{
          padding: '13px', borderRadius: 12, border: '2px dashed #d1d5db',
          background: 'none', color: '#6b7280', fontWeight: 600, fontSize: 14, cursor: 'pointer',
        }}>
          + Ajouter une rubrique
        </button>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => setItems(DEFAULT_INFOS)}
            style={{ flex: 1, padding: '13px', borderRadius: 12, background: '#f3f4f6', color: '#374151', fontWeight: 600, border: 'none', cursor: 'pointer' }}
          >
            Rétablir les rubriques par défaut
          </button>
          <button
            onClick={save}
            disabled={saving}
            style={{ flex: 2, padding: '13px', borderRadius: 12, background: saving ? '#9ca3af' : '#639922', color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer' }}
          >
            {saving ? 'Enregistrement...' : 'Enregistrer le livret'}
          </button>
        </div>
      </div>
    </div>
  )
}

const inputStyle = {
  padding: '10px 12px', borderRadius: 10,
  border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none', background: '#fafaf8',
  boxSizing: 'border-box',
}
const btnIcon = {
  width: 34, height: 34, borderRadius: 8, border: '1px solid #e5e7eb',
  background: '#fff', cursor: 'pointer', fontSize: 14, color: '#374151', flexShrink: 0,
}
