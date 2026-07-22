import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

const TRANCHES = ['18-25', '26-35', '36-45', '46-60', '60+']
const AVEC_OPTIONS = ['Solo', 'En couple', 'Entre amis', 'En famille']
const INTERETS = ['Sport', 'Musique', 'Nature', 'Cuisine', 'Jeux', 'Lecture', 'Randonnée', 'Piscine', 'Soirées', 'Enfants']

export default function Profil({ camping, vacancier, onLogout }) {
  const [editing, setEditing]   = useState(false)
  const [form, setForm]         = useState({
    pseudo:       vacancier.pseudo || '',
    emplacement:  vacancier.emplacement || '',
    tranche_age:  vacancier.tranche_age || '',
    avec:         vacancier.avec || '',
    interests:     Array.isArray(vacancier.interests) ? vacancier.interests : [],
    date_depart:  vacancier.date_depart || '',
  })
  const [saving, setSaving]     = useState(false)
  const [success, setSuccess]   = useState(false)
  const [stats, setStats]       = useState({ groupes: 0, animations: 0 })
  const couleur = camping?.couleur_principale || '#639922'

  useEffect(() => {
    async function loadStats() {
      const [{ count: grpCount }, { count: animCount }] = await Promise.all([
        supabase.from('membres_groupes').select('*', { count: 'exact', head: true }).eq('vacancier_id', vacancier.id),
        supabase.from('inscriptions').select('*', { count: 'exact', head: true }).eq('vacancier_id', vacancier.id),
      ])
      setStats({ groupes: grpCount || 0, animations: animCount || 0 })
    }
    loadStats()
  }, [vacancier.id])

  function toggleInteret(val) {
    setForm(f => ({
      ...f,
      interests: f.interests.includes(val) ? f.interests.filter(i => i !== val) : [...f.interests, val],
    }))
  }

  async function sauvegarder() {
    setSaving(true)
    const { error } = await supabase.from('vacanciers').update({
      pseudo:      form.pseudo.trim(),
      emplacement: form.emplacement.trim() || null,
      tranche_age: form.tranche_age || null,
      avec:        form.avec || null,
      interests:    form.interests.length > 0 ? form.interests : null,
      date_depart: form.date_depart || null,
    }).eq('id', vacancier.id)

    if (error) {
      console.error('Sauvegarde profil échouée :', error)
      setSaving(false)
      alert("Impossible d'enregistrer votre profil pour le moment.")
      return
    }
    const updated = { ...vacancier, ...form }
    localStorage.setItem('vacancier', JSON.stringify(updated))
    setEditing(false)
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
    setSaving(false)
  }

  const interests = Array.isArray(vacancier.interests) ? vacancier.interests : []

  return (
    <div style={{ background: '#f5f2eb', minHeight: '100%' }}>
      {/* Header vert sombre */}
      <div style={{
        background: '#0d1f0d',
        padding: '28px 20px 24px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
      }}>
        {/* Avatar */}
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: `${couleur}30`,
          border: `3px solid ${couleur}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 40,
          boxShadow: `0 0 0 6px ${couleur}20`,
        }}>
          {vacancier.avatar_emoji || '🏕️'}
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: 20, color: '#fff', lineHeight: 1.2 }}>{vacancier.pseudo}</div>
          {vacancier.emplacement && (
            <div style={{ fontSize: 13, color: '#97C459', marginTop: 4 }}>
              📍 Emplacement {vacancier.emplacement}
            </div>
          )}
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>{camping?.nom}</div>
        </div>

        {/* Centres d'intérêt en pills */}
        {interests.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginTop: 4 }}>
            {interests.map(tag => (
              <span key={tag} style={{
                background: `${couleur}30`, color: '#C0DD97',
                fontSize: 12, fontWeight: 500, padding: '3px 10px', borderRadius: 20,
                border: `1px solid ${couleur}50`,
              }}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: '20px 16px', maxWidth: 500, margin: '0 auto' }}>

        {success && (
          <div style={{
            background: '#dcfce7', color: '#166534',
            padding: '12px 16px', borderRadius: 10,
            fontSize: 14, fontWeight: 500, marginBottom: 16, textAlign: 'center',
          }}>
            ✅ Profil mis à jour !
          </div>
        )}

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
          {[
            { n: stats.groupes,    label: 'Groupes',     icon: '👥' },
            { n: stats.animations, label: 'Animations',  icon: '📅' },
            { n: interests.length,  label: 'Intérêts',    icon: '⭐' },
          ].map(s => (
            <div key={s.label} style={{
              background: '#fff', borderRadius: 14, padding: '14px 10px', textAlign: 'center',
              boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
            }}>
              <div style={{ fontSize: 22 }}>{s.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', lineHeight: 1.2 }}>{s.n}</div>
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Carte infos */}
        <div style={{ background: '#fff', borderRadius: 16, padding: '20px', marginBottom: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h2 style={{ fontSize: 16, color: '#1a1a1a' }}>Mes informations</h2>
            {!editing && (
              <button onClick={() => setEditing(true)} style={{ color: couleur, fontWeight: 600, fontSize: 14 }}>
                Modifier
              </button>
            )}
          </div>

          {editing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Field label="Pseudo">
                <input type="text" value={form.pseudo} onChange={e => setForm(f => ({ ...f, pseudo: e.target.value }))} style={inputStyle} />
              </Field>
              <Field label="N° Emplacement">
                <input type="text" value={form.emplacement} onChange={e => setForm(f => ({ ...f, emplacement: e.target.value }))} placeholder="ex: A42" style={inputStyle} />
              </Field>
              <Field label="Date de départ">
                <input type="date" value={form.date_depart} min={new Date().toISOString().slice(0, 10)} onChange={e => setForm(f => ({ ...f, date_depart: e.target.value }))} style={inputStyle} />
              </Field>
              <Field label="Tranche d'âge">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {TRANCHES.map(t => (
                    <Pill key={t} label={t} active={form.tranche_age === t} couleur={couleur} onClick={() => setForm(f => ({ ...f, tranche_age: t }))} />
                  ))}
                </div>
              </Field>
              <Field label="Je voyage">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {AVEC_OPTIONS.map(a => (
                    <Pill key={a} label={a} active={form.avec === a} couleur={couleur} onClick={() => setForm(f => ({ ...f, avec: a }))} />
                  ))}
                </div>
              </Field>
              <Field label="Centres d'intérêt">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {INTERETS.map(i => (
                    <Pill key={i} label={i} active={form.interests.includes(i)} couleur={couleur} onClick={() => toggleInteret(i)} />
                  ))}
                </div>
              </Field>

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button
                  onClick={() => { setEditing(false); setForm({ pseudo: vacancier.pseudo || '', emplacement: vacancier.emplacement || '', tranche_age: vacancier.tranche_age || '', avec: vacancier.avec || '', interests: Array.isArray(vacancier.interests) ? vacancier.interests : [], date_depart: vacancier.date_depart || '' }) }}
                  style={{ flex: 1, padding: '12px', borderRadius: 10, background: '#f3f4f6', color: '#374151', fontWeight: 600 }}
                >
                  Annuler
                </button>
                <button
                  onClick={sauvegarder}
                  disabled={saving}
                  style={{ flex: 2, padding: '12px', borderRadius: 10, background: saving ? '#9ca3af' : couleur, color: '#fff', fontWeight: 600 }}
                >
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <InfoRow label="Pseudo" value={vacancier.pseudo} />
              <InfoRow label="Emplacement" value={vacancier.emplacement || '—'} />
              <InfoRow label="Départ" value={vacancier.date_depart ? new Date(vacancier.date_depart + 'T12:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : '—'} />
              {vacancier.tranche_age && <InfoRow label="Tranche d'âge" value={vacancier.tranche_age} />}
              {vacancier.avec && <InfoRow label="Je voyage" value={vacancier.avec} />}
            </div>
          )}
        </div>

        {/* Déconnexion */}
        <button
          onClick={onLogout}
          style={{
            width: '100%', padding: '14px', borderRadius: 14,
            background: '#fef2f2', color: '#dc2626', fontWeight: 600, fontSize: 15,
            border: '1.5px solid #fecaca', marginBottom: 24,
          }}
        >
          Se déconnecter
        </button>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#c8c5bc' }}>
          CampConnect — {camping?.nom}
        </p>
      </div>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid #f5f2eb' }}>
      <span style={{ fontSize: 14, color: '#9ca3af' }}>{label}</span>
      <span style={{ fontSize: 15, fontWeight: 500, color: '#1a1a1a' }}>{value}</span>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', marginBottom: 8 }}>{label}</label>
      {children}
    </div>
  )
}

function Pill({ label, active, couleur, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500,
        background: active ? couleur : '#f5f2eb',
        color: active ? '#fff' : '#374151',
        border: active ? 'none' : '1.5px solid #e5e7eb',
        transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  )
}

const inputStyle = {
  padding: '11px 13px', borderRadius: 10,
  border: '1.5px solid #e5e7eb', fontSize: 15, outline: 'none', width: '100%', background: '#fafaf8',
}
