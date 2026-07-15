import { useEffect, useState } from 'react'
import { supabase } from '../../supabase'

export default function Moderation({ camping }) {
  const [messages, setMessages] = useState([])
  const [statuts, setStatuts] = useState([])
  const [vacanciers, setVacanciers] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('messages')

  async function load() {
    const { data: grps } = await supabase.from('groupes').select('id, titre').eq('camping_id', camping.id)
    const grpIds = (grps || []).map(g => g.id)
    const grpNames = Object.fromEntries((grps || []).map(g => [g.id, g.titre]))

    const [{ data: msgs }, { data: sts }, { data: vacs }] = await Promise.all([
      grpIds.length
        ? supabase.from('messages').select('*, vacanciers(pseudo, avatar_emoji, banni)')
            .in('groupe_id', grpIds).order('created_at', { ascending: false }).limit(100)
        : Promise.resolve({ data: [] }),
      supabase.from('statuts').select('*, vacanciers(pseudo, avatar_emoji, banni)')
        .eq('camping_id', camping.id).order('created_at', { ascending: false }).limit(50),
      supabase.from('vacanciers').select('*').eq('camping_id', camping.id).order('created_at', { ascending: false }),
    ])
    setMessages((msgs || []).map(m => ({ ...m, groupe_nom: grpNames[m.groupe_id] })))
    setStatuts(sts || [])
    setVacanciers(vacs || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [camping.id]) // eslint-disable-line

  async function supprimerMessage(id) {
    await supabase.from('messages').delete().eq('id', id)
    setMessages(prev => prev.filter(m => m.id !== id))
  }
  async function supprimerStatut(id) {
    await supabase.from('statuts').delete().eq('id', id)
    setStatuts(prev => prev.filter(s => s.id !== id))
  }
  async function toggleBan(vac) {
    const banni = !vac.banni
    if (banni && !confirm(`Bannir ${vac.pseudo} ? Il ne pourra plus poster de messages ni de statuts.`)) return
    await supabase.from('vacanciers').update({ banni }).eq('id', vac.id)
    setVacanciers(prev => prev.map(v => v.id === vac.id ? { ...v, banni } : v))
  }

  const fmtDate = iso => new Date(iso).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1a1a1a' }}>Modération</h1>
        <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>
          Supprimez les contenus inappropriés et gérez les vacanciers.
        </p>
      </div>

      {/* Onglets */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[['messages', `💬 Messages (${messages.length})`],
          ['statuts', `📣 Statuts (${statuts.length})`],
          ['vacanciers', `👥 Vacanciers (${vacanciers.length})`]].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            padding: '9px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            border: 'none',
            background: tab === k ? '#639922' : '#fff',
            color: tab === k ? '#fff' : '#374151',
            boxShadow: tab === k ? 'none' : '0 1px 3px rgba(0,0,0,0.08)',
          }}>{l}</button>
        ))}
      </div>

      {loading ? <div style={{ color: '#9ca3af' }}>Chargement…</div> : (
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid rgba(0,0,0,0.07)', overflow: 'hidden' }}>

          {tab === 'messages' && (messages.length === 0
            ? <EmptyRow text="Aucun message." />
            : messages.map(m => (
              <Row key={m.id}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{m.vacanciers?.avatar_emoji || '🙂'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>
                    <b style={{ color: '#1a1a1a' }}>{m.vacanciers?.pseudo}</b>
                    {m.vacanciers?.banni && <Badge red>banni</Badge>}
                    {' · '}{m.groupe_nom} · {fmtDate(m.created_at)}
                  </div>
                  <div style={{ fontSize: 14, color: '#374151', marginTop: 2, wordBreak: 'break-word' }}>{m.contenu}</div>
                </div>
                <DangerBtn onClick={() => supprimerMessage(m.id)}>Supprimer</DangerBtn>
              </Row>
            )))}

          {tab === 'statuts' && (statuts.length === 0
            ? <EmptyRow text="Aucun statut." />
            : statuts.map(s => (
              <Row key={s.id}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{s.vacanciers?.avatar_emoji || '🙂'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>
                    <b style={{ color: '#1a1a1a' }}>{s.vacanciers?.pseudo}</b>
                    {s.vacanciers?.banni && <Badge red>banni</Badge>}
                    {' · '}{fmtDate(s.created_at)}
                  </div>
                  <div style={{ fontSize: 14, color: '#374151', marginTop: 2 }}>{s.emoji} {s.texte}</div>
                </div>
                <DangerBtn onClick={() => supprimerStatut(s.id)}>Supprimer</DangerBtn>
              </Row>
            )))}

          {tab === 'vacanciers' && (vacanciers.length === 0
            ? <EmptyRow text="Aucun vacancier." />
            : vacanciers.map(v => (
              <Row key={v.id}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>{v.avatar_emoji || '🙂'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>
                    {v.pseudo} {v.banni && <Badge red>banni</Badge>}
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>
                    {v.emplacement ? `Empl. ${v.emplacement} · ` : ''}
                    inscrit le {fmtDate(v.created_at)}
                  </div>
                </div>
                <button onClick={() => toggleBan(v)} style={{
                  padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  border: '1.5px solid ' + (v.banni ? '#639922' : '#dc2626'),
                  background: 'transparent',
                  color: v.banni ? '#639922' : '#dc2626',
                }}>
                  {v.banni ? 'Débannir' : 'Bannir'}
                </button>
              </Row>
            )))}
        </div>
      )}
    </div>
  )
}

function Row({ children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 18px', borderBottom: '1px solid #f3f4f6' }}>
      {children}
    </div>
  )
}
function EmptyRow({ text }) {
  return <div style={{ padding: 28, textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>{text}</div>
}
function Badge({ children }) {
  return <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 800, background: '#fee2e2', color: '#dc2626', padding: '2px 7px', borderRadius: 8, textTransform: 'uppercase' }}>{children}</span>
}
function DangerBtn({ onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
      border: '1.5px solid #dc2626', background: 'transparent', color: '#dc2626', flexShrink: 0,
    }}>{children}</button>
  )
}
