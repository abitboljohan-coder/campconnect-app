import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

const EMOJIS = ['🏐', '🔥', '🚶', '🎮', '🎤', '🏊', '🚴', '🎯', '♟️', '🧘', '🎸', '🍕']

const TEMPLATES = [
  { emoji: '🎳', titre: 'Pétanque',        lieu: 'Terrain de pétanque' },
  { emoji: '🍻', titre: 'Apéro ce soir',   lieu: '' },
  { emoji: '🥾', titre: 'Rando demain matin', lieu: 'Accueil' },
  { emoji: '🏐', titre: 'Volley',          lieu: 'Terrain de sport' },
  { emoji: '🏊', titre: 'Piscine',         lieu: 'Piscine' },
  { emoji: '🍖', titre: 'BBQ',             lieu: '' },
  { emoji: '🎮', titre: 'Jeux / soirée',   lieu: '' },
]

export default function Groupes({ camping, vacancier }) {
  const [groupes, setGroupes]     = useState([])
  const [membresMap, setMembresMap] = useState({})
  const [mesGroupes, setMesGroupes] = useState([])
  const [loading, setLoading]     = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ titre: '', emoji: '🏐', lieu: '', heure: '', max_membres: '' })
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()
  const couleur = camping?.couleur_principale || '#639922'

  async function load() {
    const [{ data: grps }, { data: membres }] = await Promise.all([
      supabase.from('groupes').select('*').eq('camping_id', camping.id).eq('actif', true).order('created_at', { ascending: false }),
      supabase.from('membres_groupes').select('groupe_id').eq('vacancier_id', vacancier.id),
    ])
    setGroupes(grps || [])
    setMesGroupes((membres || []).map(m => m.groupe_id))
    setLoading(false)

    // Avatars des membres par groupe
    const ids = (grps || []).map(g => g.id)
    if (ids.length) {
      const { data: allMembres } = await supabase
        .from('membres_groupes').select('groupe_id, vacanciers(avatar_emoji)').in('groupe_id', ids)
      const map = {}
      for (const m of allMembres || []) {
        if (!map[m.groupe_id]) map[m.groupe_id] = []
        map[m.groupe_id].push(m.vacanciers?.avatar_emoji || '🙂')
      }
      setMembresMap(map)
    }
  }

  useEffect(() => { load() }, [camping.id, vacancier.id])

  async function rejoindre(groupeId) {
    await supabase.from('membres_groupes').insert({ groupe_id: groupeId, vacancier_id: vacancier.id })
    setMesGroupes(prev => [...prev, groupeId])
    navigate(`/chat/${groupeId}`)
  }

  async function creerGroupe() {
    if (!form.titre.trim()) return
    setSaving(true)

    // Construire le timestamp heure
    let heure = null
    if (form.heure) {
      const today = new Date()
      const [h, m] = form.heure.split(':')
      today.setHours(parseInt(h), parseInt(m), 0, 0)
      heure = today.toISOString()
    }

    const { data, error } = await supabase.from('groupes').insert({
      camping_id: camping.id,
      createur_id: vacancier.id,
      titre: form.titre.trim(),
      emoji: form.emoji,
      lieu: form.lieu.trim() || null,
      heure,
      max_membres: form.max_membres ? parseInt(form.max_membres) : null,
      actif: true,
    }).select().single()

    if (!error && data) {
      await supabase.from('membres_groupes').insert({ groupe_id: data.id, vacancier_id: vacancier.id })
      setShowModal(false)
      setForm({ titre: '', emoji: '🏐', lieu: '', heure: '', max_membres: '' })
      navigate(`/chat/${data.id}`)
    }
    setSaving(false)
  }

  const mesGrps    = groupes.filter(g => mesGroupes.includes(g.id))
  const autresGrps = groupes.filter(g => !mesGroupes.includes(g.id))

  return (
    <div style={{ padding: '20px 16px', maxWidth: 600, margin: '0 auto' }}>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{ height: 76, borderRadius: 14, background: '#e8e4da', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      ) : (
        <>
          {mesGrps.length > 0 && (
            <Section title="Mes groupes">
              {mesGrps.map(g => (
                <GroupRow key={g.id} groupe={g} couleur={couleur} isMember={true}
                  avatars={membresMap[g.id]} onAction={() => navigate(`/chat/${g.id}`)} />
              ))}
            </Section>
          )}

          <Section title={mesGrps.length > 0 ? 'Autres groupes' : 'Tous les groupes'}>
            {autresGrps.length === 0 && mesGrps.length === 0 ? (
              <Empty text="Aucun groupe pour ce camping. Soyez le premier !" />
            ) : autresGrps.length === 0 ? (
              <Empty text="Vous êtes dans tous les groupes disponibles 🎉" />
            ) : (
              autresGrps.map(g => (
                <GroupRow key={g.id} groupe={g} couleur={couleur} isMember={false}
                  avatars={membresMap[g.id]} onAction={() => rejoindre(g.id)} />
              ))
            )}
          </Section>
        </>
      )}

      {/* FAB + */}
      <button
        onClick={() => setShowModal(true)}
        style={{
          position: 'fixed', bottom: 82, right: 20,
          width: 56, height: 56, borderRadius: '50%',
          background: couleur, color: '#fff',
          fontSize: 28, fontWeight: 300,
          boxShadow: `0 4px 16px ${couleur}66`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 50, transition: 'transform 0.15s, box-shadow 0.15s',
        }}
      >
        +
      </button>

      {/* Modal création */}
      {showModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end', zIndex: 200 }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              background: '#fff', borderRadius: '22px 22px 0 0',
              padding: '24px 20px 40px', width: '100%', maxWidth: 600, margin: '0 auto',
              animation: 'fadeIn 0.2s ease',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ width: 40, height: 4, background: '#e5e7eb', borderRadius: 2, margin: '0 auto 20px' }} />
            <h2 style={{ fontSize: 20, marginBottom: 14, color: '#1a1a1a' }}>Créer un groupe</h2>

            {/* Templates 1-tap */}
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 10, marginBottom: 8 }}>
              {TEMPLATES.map(t => (
                <button key={t.titre} type="button"
                  onClick={() => setForm(f => ({ ...f, titre: t.titre, emoji: t.emoji, lieu: t.lieu }))}
                  style={{
                    flexShrink: 0, padding: '8px 13px', borderRadius: 20,
                    border: form.titre === t.titre ? `2px solid ${couleur}` : '1.5px solid #e5e7eb',
                    background: form.titre === t.titre ? `${couleur}15` : '#fafafa',
                    fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer',
                  }}>
                  {t.emoji} {t.titre}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Emoji picker */}
              <div>
                <label style={labelStyle}>EMOJI</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                  {EMOJIS.map(e => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, emoji: e }))}
                      style={{
                        width: 44, height: 44, fontSize: 22, borderRadius: 10,
                        border: form.emoji === e ? `2px solid ${couleur}` : '2px solid #e5e7eb',
                        background: form.emoji === e ? `${couleur}18` : '#f9f9f7',
                        transition: 'all 0.1s',
                      }}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={labelStyle}>TITRE DU GROUPE *</label>
                <input
                  type="text"
                  value={form.titre}
                  onChange={e => setForm(f => ({ ...f, titre: e.target.value }))}
                  placeholder="ex: Randonnée du matin"
                  style={inputStyle}
                  autoFocus
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>LIEU</label>
                  <input
                    type="text"
                    value={form.lieu}
                    onChange={e => setForm(f => ({ ...f, lieu: e.target.value }))}
                    placeholder="ex: Piscine"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>HEURE</label>
                  <input
                    type="time"
                    value={form.heure}
                    onChange={e => setForm(f => ({ ...f, heure: e.target.value }))}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>NB MAX MEMBRES</label>
                <input
                  type="number"
                  min="2"
                  max="50"
                  value={form.max_membres}
                  onChange={e => setForm(f => ({ ...f, max_membres: e.target.value }))}
                  placeholder="ex: 10"
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button
                  onClick={() => setShowModal(false)}
                  style={{ flex: 1, padding: '13px', borderRadius: 12, background: '#f3f4f6', color: '#374151', fontWeight: 600 }}
                >
                  Annuler
                </button>
                <button
                  onClick={creerGroupe}
                  disabled={saving || !form.titre.trim()}
                  style={{
                    flex: 2, padding: '13px', borderRadius: 12,
                    background: saving || !form.titre.trim() ? '#9ca3af' : couleur,
                    color: '#fff', fontWeight: 700, fontSize: 15,
                    transition: 'background 0.15s',
                  }}
                >
                  {saving ? 'Création...' : `${form.emoji} Créer le groupe`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10 }}>
        {title}
      </h3>
      {children}
    </div>
  )
}

function AvatarStack({ avatars, couleur }) {
  if (!avatars?.length) return null
  const shown = avatars.slice(0, 4)
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginTop: 5 }}>
      {shown.map((a, i) => (
        <div key={i} style={{
          width: 22, height: 22, borderRadius: '50%', background: '#fff',
          border: '1.5px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, marginLeft: i === 0 ? 0 : -7, zIndex: 5 - i,
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
        }}>{a}</div>
      ))}
      {avatars.length > 4 && (
        <span style={{ fontSize: 11, fontWeight: 700, color: couleur, marginLeft: 4 }}>
          +{avatars.length - 4}
        </span>
      )}
      <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 6 }}>
        {avatars.length} membre{avatars.length > 1 ? 's' : ''}
      </span>
    </div>
  )
}

function GroupRow({ groupe, couleur, isMember, onAction, avatars }) {
  const heureStr = groupe.heure
    ? new Date(groupe.heure).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : null
  const meta = [groupe.lieu && `📍 ${groupe.lieu}`, heureStr && `🕐 ${heureStr}`, groupe.max_membres && `${groupe.max_membres} places max`].filter(Boolean).join(' · ')

  return (
    <div style={{
      background: '#fff', borderRadius: 14, padding: '14px 16px', marginBottom: 10,
      display: 'flex', alignItems: 'center', gap: 12,
      boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        background: isMember ? `${couleur}20` : '#f5f2eb',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 24, flexShrink: 0,
      }}>
        {groupe.emoji || '👥'}
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{ fontWeight: 600, fontSize: 15, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {groupe.titre}
        </div>
        {meta && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{meta}</div>}
        <AvatarStack avatars={avatars} couleur={couleur} />
      </div>
      <button
        onClick={onAction}
        style={{
          background: isMember ? couleur : 'transparent',
          color: isMember ? '#fff' : couleur,
          padding: '7px 14px', borderRadius: 20,
          fontSize: 13, fontWeight: 600, flexShrink: 0,
          border: `1.5px solid ${isMember ? 'transparent' : couleur}`,
          transition: 'all 0.15s',
        }}
      >
        {isMember ? 'Ouvrir' : 'Rejoindre'}
      </button>
    </div>
  )
}

function Empty({ text }) {
  return <div style={{ textAlign: 'center', padding: '28px', color: '#9ca3af', fontSize: 14, background: '#fff', borderRadius: 14 }}>{text}</div>
}

const labelStyle = { fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', marginBottom: 6 }
const inputStyle = { padding: '11px 13px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 15, outline: 'none', width: '100%', background: '#fafafa' }
