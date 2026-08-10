import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase, presentFilter } from '../supabase'
import { t, useLangue, locale } from '../i18n'
import MenuModeration from '../components/MenuModeration'
import { chargerBlocages, estBloque } from '../lib/moderation'
import { Texte, Pile, Vide, couleur, espace, graisse, ombre, rayon, texte as tailles } from '../design'

const REACTIONS = ['❤️', '😂', '👍', '🔥', '🎉']

export default function Chat({ camping, vacancier }) {
  useLangue()
  // La fiche Store promet « un espace aux couleurs de l'établissement » : le
  // chat suit la charte du camping comme le reste de l'application. L'accent
  // n'est plus lu ici mais dans les propriétés personnalisées posées par
  // appliquerTheme() — un écran n'a pas à connaître le camping pour s'y teinter.
  const { groupeId } = useParams()
  const navigate = useNavigate()
  const [groupe, setGroupe]         = useState(null)
  const [nbMembres, setNbMembres]   = useState(0)
  const [messages, setMessages]     = useState([])
  const [texte, setTexte]           = useState('')
  const [sending, setSending]       = useState(false)
  const [pickerFor, setPickerFor]   = useState(null)
  const [moderation, setModeration] = useState(null)   // contenu visé par le menu
  const [, setBloquesVersion]       = useState(0)      // force un rendu après blocage
  const appuiLong                   = useRef(null)

  const [erreur, setErreur]         = useState('')
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  // Le menu de modération s'ouvre sur appui long, comme dans toutes les
  // messageries. Un bouton visible sur chaque bulle alourdirait l'écran pour
  // un geste que l'on fait deux fois par an.
  function annulerAppuiLong() {
    if (appuiLong.current && appuiLong.current !== 'declenche') {
      clearTimeout(appuiLong.current)
      appuiLong.current = null
    }
  }

  function ouvrirModeration(msg, auteur) {
    setPickerFor(null)
    setModeration({
      type: 'message', id: msg.id, texte: msg.contenu,
      auteurId: msg.auteur_id, pseudo: auteur?.pseudo,
    })
  }

  useEffect(() => {
    async function init() {
      const [{ data: grp }, { count }, { data: msgs }] = await Promise.all([
        supabase.from('groupes').select('*').eq('id', groupeId).single(),
        supabase.from('membres_groupes').select('*, vacanciers!inner(id)', { count: 'exact', head: true }).eq('groupe_id', groupeId).or(presentFilter(), { foreignTable: 'vacanciers' }),
        supabase.from('messages').select('*, vacanciers(pseudo, avatar_emoji)').eq('groupe_id', groupeId).order('created_at', { ascending: true }),
      ])
      setGroupe(grp)
      setNbMembres(count || 0)
      setMessages(msgs || [])
      chargerBlocages(vacancier.id).then(() => setBloquesVersion(v => v + 1))
    }
    init()
  }, [groupeId, vacancier.id])

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
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'messages',
        filter: `groupe_id=eq.${groupeId}`,
      }, (payload) => {
        setMessages(prev => prev.map(m =>
          m.id === payload.new.id ? { ...m, reactions: payload.new.reactions } : m
        ))
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
    setErreur('')
    const contenu = texte.trim()
    setTexte('')
    const { error } = await supabase.from('messages').insert({ groupe_id: groupeId, auteur_id: vacancier.id, contenu })
    if (error) {
      console.error('Envoi message échoué :', error)
      setTexte(contenu) // on rend le message pour ne pas le perdre
      setErreur(t('chat.non_envoye'))
    }
    setSending(false)
    inputRef.current?.focus()
  }

  async function toggleReaction(msg, emoji) {
    setPickerFor(null)
    const reactions = { ...(msg.reactions || {}) }
    const list = reactions[emoji] || []
    reactions[emoji] = list.includes(vacancier.id)
      ? list.filter(id => id !== vacancier.id)
      : [...list, vacancier.id]
    if (!reactions[emoji].length) delete reactions[emoji]
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, reactions } : m))
    await supabase.from('messages').update({ reactions }).eq('id', msg.id)
  }

  // Grouper messages par date pour les séparateurs
  const grouped = groupByDate(messages)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: couleur.fond }}>

      {/* Header — Layout masque le sien sur les routes /chat/, c'est donc à cet
          en-tête de réserver la place de la barre d'état. Sans ce paddingTop,
          l'heure de l'iPhone recouvre la flèche retour et la rend incliquable. */}
      <div style={{
        background: 'var(--cc-accent-sombre)',
        padding: `${espace.md}px ${espace.lg}px`,
        paddingTop: 'calc(12px + var(--cc-safe-top))',
        display: 'flex', alignItems: 'center', gap: espace.md,
        flexShrink: 0,
        boxShadow: '0 2px 8px rgba(26, 26, 26, 0.2)',
      }}>
        <button
          onClick={() => navigate('/groupes')}
          aria-label={t('commun.retour')}
          style={{ color: '#fff', fontSize: 24, lineHeight: 1, padding: '0 4px', flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer' }}
        >
          ‹
        </button>
        <span aria-hidden="true" style={{
          width: 38, height: 38, borderRadius: rayon.md,
          background: 'rgba(255,255,255,0.16)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: tailles.titre, flexShrink: 0,
        }}>
          {groupe?.emoji || '👥'}
        </span>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <Texte variante="sousTitre" as="h1" style={{
            color: '#fff', fontSize: tailles.grand,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {groupe?.titre || '…'}
          </Texte>
          <Texte variante="doux" style={{ color: 'rgba(255,255,255,0.72)' }}>
            {nbMembres > 1 ? t('chat.participants', { n: nbMembres }) : t('chat.participant', { n: nbMembres })}
            {groupe?.lieu && ` · 📍 ${groupe.lieu}`}
          </Texte>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: `${espace.lg}px ${espace.md}px`, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {messages.length === 0 && (
          <Vide emoji="💬" texte={`${t('chat.aucun_msg')} ${t('chat.premier')}`} style={{ marginTop: 40 }} />
        )}

        {grouped.map(({ dateLabel, msgs }) => (
          <div key={dateLabel}>
            {/* Séparateur date */}
            <div style={{ textAlign: 'center', margin: `${espace.lg}px 0 ${espace.md}px` }}>
              <Texte variante="micro" as="span" style={{
                background: couleur.bordure, fontWeight: graisse.fort,
                padding: `3px ${espace.sm}px`, borderRadius: rayon.rond,
              }}>
                {dateLabel}
              </Texte>
            </div>

            {/* Les messages des personnes bloquées disparaissent avant tout
                calcul de regroupement : sinon un message masqué continuerait
                de couper les suites d'un même auteur, et l'en-tête se
                répéterait sans raison visible. */}
            {msgs.filter(m => !estBloque(vacancier.id, m.auteur_id)).map((msg, idx, visibles) => {
              const isMine = msg.auteur_id === vacancier.id
              const auteur = msg.vacanciers || { pseudo: t('chat.parti'), avatar_emoji: '👋' }
              const prevMsg = idx > 0 ? visibles[idx - 1] : null
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
                    <Texte variante="micro" style={{
                      color: 'var(--cc-accent)', fontWeight: graisse.fort,
                      marginBottom: 3, marginLeft: 46,
                    }}>
                      {auteur.avatar_emoji} {auteur.pseudo}
                    </Texte>
                  )}
                  {/* width 100% indispensable : la bulle porte un maxWidth en
                      pourcentage, qui a besoin d'une largeur de référence
                      définie. Sans lui, cette ligne se dimensionne sur son
                      contenu, le pourcentage devient circulaire, et le
                      navigateur retombe sur la largeur minimale — la bulle
                      s'affiche alors une lettre par ligne. */}
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, width: '100%', flexDirection: isMine ? 'row-reverse' : 'row' }}>
                    {/* Avatar auteur (them) */}
                    {!isMine && (
                      <span aria-hidden="true" style={{
                        width: 32, height: 32, borderRadius: rayon.rond,
                        background: couleur.bordure,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 16, flexShrink: 0,
                        opacity: showAuthor ? 1 : 0,
                      }}>
                        {auteur?.avatar_emoji || '🏕️'}
                      </span>
                    )}
                    <div style={{ position: 'relative', maxWidth: '72%' }}>
                      <div
                        onClick={() => {
                          // Un appui long vient d'ouvrir le menu : le clic de
                          // relâchement ne doit pas ouvrir les réactions en plus.
                          if (appuiLong.current === 'declenche') { appuiLong.current = null; return }
                          setPickerFor(pickerFor === msg.id ? null : msg.id)
                        }}
                        onTouchStart={() => {
                          if (isMine) return
                          appuiLong.current = setTimeout(() => {
                            appuiLong.current = 'declenche'
                            ouvrirModeration(msg, auteur)
                          }, 500)
                        }}
                        onTouchEnd={annulerAppuiLong}
                        onTouchMove={annulerAppuiLong}
                        onContextMenu={(e) => {
                          if (isMine) return
                          e.preventDefault()
                          ouvrirModeration(msg, auteur)
                        }}
                        style={{
                          background: isMine ? 'var(--cc-accent)' : couleur.surface,
                          color: isMine ? couleur.texteSurAccent : couleur.texte,
                          padding: `10px ${espace.lg}px`,
                          borderRadius: isMine ? '18px 18px 3px 18px' : '18px 18px 18px 3px',
                          fontSize: tailles.moyen, lineHeight: 1.45,
                          boxShadow: isMine ? ombre.levee : ombre.posee,
                          overflowWrap: 'break-word',
                          cursor: 'pointer',
                        }}>
                        {msg.contenu}
                      </div>
                      {/* Picker réactions */}
                      {pickerFor === msg.id && (
                        <div style={{
                          position: 'absolute', bottom: '100%', marginBottom: 6,
                          [isMine ? 'right' : 'left']: 0,
                          background: couleur.surface, borderRadius: rayon.rond, padding: `6px ${espace.sm}px`,
                          display: 'flex', gap: 6, zIndex: 30,
                          boxShadow: ombre.flottante,
                        }}>
                          {REACTIONS.map(e => (
                            <button key={e} onClick={ev => { ev.stopPropagation(); toggleReaction(msg, e) }}
                              style={{ fontSize: 20, background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                              {e}
                            </button>
                          ))}
                        </div>
                      )}
                      {/* Réactions affichées */}
                      {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                        <div style={{
                          display: 'flex', gap: 4, marginTop: 3,
                          justifyContent: isMine ? 'flex-end' : 'flex-start',
                        }}>
                          {Object.entries(msg.reactions).map(([e, ids]) => ids.length > 0 && (
                            <button key={e} onClick={() => toggleReaction(msg, e)}
                              aria-pressed={ids.includes(vacancier.id)}
                              style={{
                                fontSize: tailles.petit, padding: '2px 7px', borderRadius: rayon.md,
                                background: ids.includes(vacancier.id) ? 'var(--cc-accent-voile)' : couleur.surface,
                                border: `1px solid ${ids.includes(vacancier.id) ? 'var(--cc-accent)' : couleur.bordure}`,
                                cursor: 'pointer', fontWeight: graisse.fort, color: couleur.texteMoyen,
                              }}>
                              {e} {ids.length > 1 ? ids.length : ''}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <Texte variante="micro" style={{
                    fontSize: 10, marginTop: 3,
                    marginLeft: isMine ? 0 : 46,
                    marginRight: isMine ? 4 : 0,
                  }}>
                    {new Date(msg.created_at).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' })}
                  </Texte>
                </div>
              )
            })}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Saisie */}
      {erreur && (
        <Texte variante="doux" role="alert" style={{
          background: couleur.dangerFond, color: couleur.danger, fontWeight: graisse.fort,
          textAlign: 'center', padding: `${espace.sm}px ${espace.md}px`, flexShrink: 0,
        }}>
          ⚠️ {erreur}
        </Texte>
      )}
      <form
        onSubmit={envoyer}
        style={{
          padding: `10px ${espace.md}px`,
          background: couleur.surface,
          borderTop: `1px solid ${couleur.bordure}`,
          display: 'flex', gap: espace.sm, alignItems: 'center',
          paddingBottom: 'max(10px, var(--cc-safe-bottom))',
          flexShrink: 0,
        }}
      >
        <input
          ref={inputRef}
          type="text"
          aria-label={t('chat.ecrire')}
          placeholder={t('chat.ecrire')}
          value={texte}
          onChange={e => { setTexte(e.target.value); if (erreur) setErreur('') }}
          style={{
            flex: 1, padding: `11px ${espace.lg}px`,
            borderRadius: rayon.rond, border: `1.5px solid ${couleur.bordure}`,
            fontSize: 16, outline: 'none', background: couleur.fondClair,
            fontFamily: 'inherit',
            transition: 'border-color 0.15s',
          }}
        />
        <button
          type="submit"
          disabled={!texte.trim() || sending}
          aria-label={t('commun.envoyer')}
          style={{
            width: 44, height: 44, borderRadius: rayon.rond,
            background: !texte.trim() || sending ? couleur.bordure : 'var(--cc-accent)',
            color: couleur.texteSurAccent, fontSize: tailles.titre,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, border: 'none',
            cursor: !texte.trim() || sending ? 'default' : 'pointer',
            transition: 'background 0.15s',
            boxShadow: texte.trim() ? ombre.levee : 'none',
          }}
        >
          ↑
        </button>
      </form>

      {moderation && (
        <MenuModeration
          cible={moderation}
          camping={camping}
          vacancier={vacancier}
          onClose={() => setModeration(null)}
          onBloque={() => setBloquesVersion(v => v + 1)}
        />
      )}
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
    if (d.toDateString() === today.toDateString())     label = t('chat.aujourdhui')
    else if (d.toDateString() === yesterday.toDateString()) label = t('chat.hier')
    else label = d.toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long' })

    if (!map[label]) { map[label] = []; order.push(label) }
    map[label].push(msg)
  }
  return order.map(k => ({ dateLabel: k, msgs: map[k] }))
}
