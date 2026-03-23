import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

export default function Chat({ vacancier }) {
  const { groupeId } = useParams()
  const navigate = useNavigate()
  const [groupe, setGroupe]         = useState(null)
  const [nbMembres, setNbMembres]   = useState(0)
  const [messages, setMessages]     = useState([])
  const [texte, setTexte]           = useState('')
  const [sending, setSending]       = useState(false)
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  useEffect(() => {
    async function init() {
      const [{ data: grp }, { count }, { data: msgs }] = await Promise.all([
        supabase.from('groupes').select('*').eq('id', groupeId).single(),
        supabase.from('membres_groupes').select('*', { count: 'exact', head: true }).eq('groupe_id', groupeId),
        supabase.from('messages').select('*, vacanciers(pseudo, avatar_emoji)').eq('groupe_id', groupeId).order('created_at', { ascending: true }),
      ])
      setGroupe(grp)
      setNbMembres(count || 0)
      setMessages(msgs || [])
    }
    init()
  }, [groupeId])

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel(`chat:${groupeId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `groupe_id=eq.${groupeId}`,
      }, async (payload) => {
        const { data: vac } = await supabase
          .from('vacanciers').select('pseudo, avatar_emoji').eq('id', payload.new.auteur_id).single()
        setMessages(prev => [...prev, { ...payload.new, vacanciers: vac }])
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [groupeId])

  // Scroll bas
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function envoyer(e) {
    e.preventDefault()
    if (!texte.trim() || sending) return
    setSending(true)
    const contenu = texte.trim()
    setTexte('')
    await supabase.from('messages').insert({ groupe_id: groupeId, auteur_id: vacancier.id, contenu })
    setSending(false)
    inputRef.current?.focus()
  }

  // Grouper messages par date pour les séparateurs
  const grouped = groupByDate(messages)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: '#f5f2eb' }}>

      {/* Header */}
      <div style={{
        background: '#0d1f0d',
        padding: '12px 16px',
        display: 'flex', alignItems: 'center', gap: 12,
        flexShrink: 0,
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      }}>
        <button
          onClick={() => navigate('/groupes')}
          style={{ color: '#C0DD97', fontSize: 24, lineHeight: 1, padding: '0 4px', flexShrink: 0 }}
        >
          ‹
        </button>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: '#1a3a1a',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0,
        }}>
          {groupe?.emoji || '👥'}
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {groupe?.titre || '...'}
          </div>
          <div style={{ fontSize: 12, color: '#97C459' }}>
            {nbMembres} participant{nbMembres > 1 ? 's' : ''}
            {groupe?.lieu && ` · 📍 ${groupe.lieu}`}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 14, marginTop: 60, lineHeight: 2 }}>
            Aucun message pour l'instant.<br />Soyez le premier à écrire ! 👋
          </div>
        )}

        {grouped.map(({ dateLabel, msgs }) => (
          <div key={dateLabel}>
            {/* Séparateur date */}
            <div style={{
              textAlign: 'center', margin: '16px 0 12px',
              position: 'relative',
            }}>
              <span style={{
                background: '#e8e4da', color: '#9ca3af',
                fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
              }}>
                {dateLabel}
              </span>
            </div>

            {msgs.map((msg, idx) => {
              const isMine = msg.auteur_id === vacancier.id
              const auteur = msg.vacanciers
              const prevMsg = idx > 0 ? msgs[idx - 1] : null
              const showAuthor = !isMine && (!prevMsg || prevMsg.auteur_id !== msg.auteur_id)

              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex', flexDirection: 'column',
                    alignItems: isMine ? 'flex-end' : 'flex-start',
                    marginBottom: 2,
                  }}
                >
                  {showAuthor && auteur && (
                    <div style={{ fontSize: 11, color: '#639922', marginBottom: 3, marginLeft: 46, fontWeight: 600 }}>
                      {auteur.avatar_emoji} {auteur.pseudo}
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, flexDirection: isMine ? 'row-reverse' : 'row' }}>
                    {/* Avatar auteur (them) */}
                    {!isMine && (
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: '#e8e4da',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 16, flexShrink: 0,
                        opacity: showAuthor ? 1 : 0,
                      }}>
                        {auteur?.avatar_emoji || '🏕️'}
                      </div>
                    )}
                    <div style={{
                      background: isMine ? '#639922' : 'rgba(255,255,255,0.92)',
                      color: isMine ? '#fff' : '#1a1a1a',
                      padding: '10px 14px',
                      borderRadius: isMine ? '18px 18px 3px 18px' : '18px 18px 18px 3px',
                      maxWidth: '72%',
                      fontSize: 15, lineHeight: 1.45,
                      boxShadow: isMine ? `0 2px 8px ${['#639922']}44` : '0 1px 4px rgba(0,0,0,0.08)',
                      wordBreak: 'break-word',
                    }}>
                      {msg.contenu}
                    </div>
                  </div>
                  <div style={{
                    fontSize: 10, color: '#9ca3af', marginTop: 3,
                    marginLeft: isMine ? 0 : 46,
                    marginRight: isMine ? 4 : 0,
                  }}>
                    {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={envoyer}
        style={{
          padding: '10px 12px',
          background: '#fff',
          borderTop: '1px solid #e5e7eb',
          display: 'flex', gap: 8, alignItems: 'center',
          paddingBottom: 'max(10px, env(safe-area-inset-bottom))',
          flexShrink: 0,
        }}
      >
        <input
          ref={inputRef}
          type="text"
          placeholder="Écrire un message..."
          value={texte}
          onChange={e => setTexte(e.target.value)}
          style={{
            flex: 1, padding: '11px 16px',
            borderRadius: 24, border: '1.5px solid #e5e7eb',
            fontSize: 15, outline: 'none', background: '#f9f7f3',
            transition: 'border-color 0.15s',
          }}
        />
        <button
          type="submit"
          disabled={!texte.trim() || sending}
          style={{
            width: 44, height: 44, borderRadius: '50%',
            background: !texte.trim() || sending ? '#e5e7eb' : '#639922',
            color: '#fff', fontSize: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'background 0.15s',
            boxShadow: texte.trim() ? '0 2px 8px rgba(99,153,34,0.4)' : 'none',
          }}
        >
          ↑
        </button>
      </form>
    </div>
  )
}

function groupByDate(messages) {
  const today    = new Date()
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)

  const map = {}
  const order = []
  for (const msg of messages) {
    const d = new Date(msg.created_at)
    let label
    if (d.toDateString() === today.toDateString())     label = "Aujourd'hui"
    else if (d.toDateString() === yesterday.toDateString()) label = 'Hier'
    else label = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

    if (!map[label]) { map[label] = []; order.push(label) }
    map[label].push(msg)
  }
  return order.map(k => ({ dateLabel: k, msgs: map[k] }))
}
