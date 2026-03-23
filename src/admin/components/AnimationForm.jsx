import { useState } from 'react'

const EMOJIS = ['🎉', '🏊', '🎸', '⚽', '🎯', '🎤', '🧘', '🚴', '🎮', '🍕', '🎨', '🏐', '🌅', '🔥', '🎭']

export default function AnimationForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState({
    titre:       initial?.titre || '',
    emoji:       initial?.emoji || '🎉',
    lieu:        initial?.lieu || '',
    dateStr:     initial?.debut ? new Date(initial.debut).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    heureStr:    initial?.debut ? new Date(initial.debut).toTimeString().slice(0, 5) : '14:00',
    places_max:  initial?.places_max?.toString() || '',
    description: initial?.description || '',
    publiee:     initial?.publiee ?? true,
  })

  function handleSave() {
    if (!form.titre.trim()) return

    let debut = null
    if (form.dateStr && form.heureStr) {
      debut = new Date(`${form.dateStr}T${form.heureStr}:00`).toISOString()
    }

    onSave({
      titre:       form.titre.trim(),
      emoji:       form.emoji,
      lieu:        form.lieu.trim() || null,
      debut,
      places_max:  form.places_max ? parseInt(form.places_max) : null,
      description: form.description.trim() || null,
      publiee:     form.publiee,
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Emoji */}
      <div>
        <label style={labelStyle}>EMOJI</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
          {EMOJIS.map(e => (
            <button
              key={e} type="button"
              onClick={() => setForm(f => ({ ...f, emoji: e }))}
              style={{
                width: 40, height: 40, fontSize: 20, borderRadius: 8,
                border: form.emoji === e ? '2px solid #639922' : '2px solid #e5e7eb',
                background: form.emoji === e ? '#63992215' : '#f9f9f7',
              }}
            >{e}</button>
          ))}
        </div>
      </div>

      {/* Titre */}
      <div>
        <label style={labelStyle}>TITRE *</label>
        <input
          type="text"
          value={form.titre}
          onChange={e => setForm(f => ({ ...f, titre: e.target.value }))}
          placeholder="ex: Cours de yoga matinal"
          style={inputStyle}
          autoFocus
        />
      </div>

      {/* Lieu */}
      <div>
        <label style={labelStyle}>LIEU</label>
        <input
          type="text"
          value={form.lieu}
          onChange={e => setForm(f => ({ ...f, lieu: e.target.value }))}
          placeholder="ex: Piscine, Espace détente..."
          style={inputStyle}
        />
      </div>

      {/* Date + Heure */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>DATE</label>
          <input type="date" value={form.dateStr} onChange={e => setForm(f => ({ ...f, dateStr: e.target.value }))} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>HEURE</label>
          <input type="time" value={form.heureStr} onChange={e => setForm(f => ({ ...f, heureStr: e.target.value }))} style={inputStyle} />
        </div>
      </div>

      {/* Places max */}
      <div>
        <label style={labelStyle}>PLACES MAX</label>
        <input
          type="number" min="1" max="999"
          value={form.places_max}
          onChange={e => setForm(f => ({ ...f, places_max: e.target.value }))}
          placeholder="Laisser vide = illimité"
          style={inputStyle}
        />
      </div>

      {/* Description */}
      <div>
        <label style={labelStyle}>DESCRIPTION</label>
        <textarea
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          placeholder="Description optionnelle..."
          rows={3}
          style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
        />
      </div>

      {/* Publier */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          onClick={() => setForm(f => ({ ...f, publiee: !f.publiee }))}
          style={{
            width: 44, height: 24, borderRadius: 12,
            background: form.publiee ? '#639922' : '#d1d5db',
            position: 'relative', cursor: 'pointer', transition: 'background 0.2s',
            flexShrink: 0,
          }}
        >
          <div style={{
            position: 'absolute', top: 2,
            left: form.publiee ? 22 : 2,
            width: 20, height: 20, borderRadius: '50%',
            background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            transition: 'left 0.2s',
          }} />
        </div>
        <span style={{ fontSize: 14, color: '#374151' }}>
          {form.publiee ? 'Publier immédiatement' : 'Enregistrer en brouillon'}
        </span>
      </div>

      {/* Boutons */}
      <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
        <button
          type="button" onClick={onCancel}
          style={{ flex: 1, padding: '12px', borderRadius: 10, background: '#f3f4f6', color: '#374151', fontWeight: 600 }}
        >
          Annuler
        </button>
        <button
          type="button" onClick={handleSave}
          disabled={saving || !form.titre.trim()}
          style={{
            flex: 2, padding: '12px', borderRadius: 10,
            background: saving || !form.titre.trim() ? '#9ca3af' : '#639922',
            color: '#fff', fontWeight: 700,
          }}
        >
          {saving ? 'Enregistrement...' : (initial ? 'Modifier' : 'Créer')}
        </button>
      </div>
    </div>
  )
}

const labelStyle = {
  fontSize: 11, fontWeight: 700, color: '#9ca3af',
  textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', marginBottom: 6,
}
const inputStyle = {
  width: '100%', padding: '11px 13px', borderRadius: 10,
  border: '1.5px solid #e5e7eb', fontSize: 15,
  outline: 'none', background: '#fafaf8', boxSizing: 'border-box',
}
