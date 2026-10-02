import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase, presentFilter } from '../supabase'
import { t, useLangue, locale } from '../i18n'
import MenuModeration from '../components/MenuModeration'
import Sheet from '../components/Sheet'
import { toast } from '../toast'
import { chargerBlocages, estBloque } from '../lib/moderation'
import { estComplet, libelleHeure } from '../lib/groupes'
import { toutCharger } from '../lib/reseau'
import ErreurReseau from '../components/ErreurReseau'
import { Texte, Pile, Vide, Bouton, couleur, espace, graisse, ombre, rayon, texte as tailles } from '../design'

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
  const [quitter, setQuitter]       = useState(false)
  const [quittant, setQuittant]     = useState(false)
  // null tant qu'on ne sait pas : on suppose membre, le cas courant, pour ne
  // pas faire clignoter la zone de saisie à chaque ouverture.
  const [membre, setMembre]         = useState(null)
  const [rejoignant, setRejoignant] = useState(false)
  const [charge, setCharge]         = useState(false)       // premier chargement terminé
  const [erreurReseau, setErreurReseau] = useState(false)
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

  async function init() {
    const { resultats: [{ data: grp }, { count }, { data: msgs }, { data: moi }], error } = await toutCharger([
      supabase.from('groupes').select('*').eq('id', groupeId).single(),
      supabase.from('membres_groupes').select('*, vacanciers!inner(id)', { count: 'exact', head: true }).eq('groupe_id', groupeId).or(presentFilter(), { foreignTable: 'vacanciers' }),
      supabase.from('messages').select('*, vacanciers(pseudo, avatar_emoji)').eq('groupe_id', groupeId).order('created_at', { ascending: true }),
      // On pouvait écrire dans un groupe qu'on venait de quitter, ou ouvert
      // par un lien sans en être membre : l'appartenance n'était jamais lue.
      supabase.from('membres_groupes').select('groupe_id').eq('groupe_id', groupeId).eq('vacancier_id', vacancier.id).maybeSingle(),
    ])
    setCharge(true)
    // Erreur réseau : ne pas afficher « Aucun message… Soyez le premier ! ».
    // Les messages déjà affichés restent, une relecture ratée ne les efface pas.
    // PGRST116 (groupe introuvable) n'est pas une coupure : réessayer n'y
    // changerait rien.
    const reseau = !!error && error.code !== 'PGRST116'
    setErreurReseau(reseau)
    if (reseau) {
      console.error('Chargement du chat échoué :', error)
      return
    }
    setGroupe(grp)
    setNbMembres(count || 0)
    setMembre(!!moi)
    if (msgs) setMessages(msgs)
    chargerBlocages(vacancier.id).then(() => setBloquesVersion(v => v + 1))
  }

  function reessayer() {
    setErreurReseau(false)
    setCharge(false)
    init()
  }

  useEffect(() => {
    async function charger() { await init() }
    charger()

    // Le temps réel ne rattrape rien : les messages arrivés pendant que le
    // téléphone était en veille, ou que le réseau du camping avait décroché,
    // n'arrivaient jamais. On revenait dans la conversation, elle paraissait
    // calme, alors qu'on y parlait. Au retour au premier plan, on relit tout.
    const auRetour = () => { if (document.visibilityState === 'visible') init() }
    document.addEventListener('visibilitychange', auRetour)
    return () => document.removeEventListener('visibilitychange', auRetour)
  }, [groupeId, vacancier.id]) // eslint-disable-line react-hooks/exhaustive-deps

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
        setMessages(prev => ajouter(prev, { ...payload.new, vacanciers: vac }))
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

  // Descendre en bas à l'arrivée d'un message — et seulement là. Réagir d'un
  // cœur à un vieux message ramenait tout en bas, loin de ce qu'on lisait.
  const nbMessages = messages.length
  const dejaAffiche = useRef(false)
  useEffect(() => {
    if (!nbMessages) return
    bottomRef.current?.scrollIntoView({ behavior: dejaAffiche.current ? 'smooth' : 'auto' })
    dejaAffiche.current = true
  }, [nbMessages])

  async function envoyer(e) {
    e.preventDefault()
    if (!texte.trim() || sending) return
    setSending(true)
    setErreur('')
    const contenu = texte.trim()
    setTexte('')
    const { data, error } = await supabase.from('messages')
      .insert({ groupe_id: groupeId, auteur_id: vacancier.id, contenu })
      .select('*, vacanciers(pseudo, avatar_emoji)').single()
    if (error) {
      console.error('Envoi message échoué :', error)
      setTexte(contenu) // on rend le message pour ne pas le perdre
      if (error.code === '42501') {
        // La base refuse (42501) deux cas : le vacancier banni, et celui qui
        // n'est plus membre du groupe (msg_insert exige l'appartenance —
        // groupe quitté depuis un autre écran, retiré par le gérant). Lui
        // annoncer qu'il « ne peut plus publier dans ce camping » serait faux
        // et inquiétant : on relit l'appartenance, sur ce seul chemin d'erreur.
        const { data: moi } = await supabase.from('membres_groupes').select('groupe_id')
          .eq('groupe_id', groupeId).eq('vacancier_id', vacancier.id).maybeSingle()
        if (!moi) setMembre(false)   // la saisie laisse place à « Rejoindre le groupe »
        else setErreur(t('commun.banni'))
      } else {
        setErreur(t('chat.non_envoye'))
      }
    } else if (data) {
      // Affiché tout de suite, sans attendre l'événement temps réel : s'il ne
      // venait pas, on croyait le message perdu et on le renvoyait.
      setMessages(prev => ajouter(prev, data))
    }
    setSending(false)
    inputRef.current?.focus()
  }

  async function quitterGroupe() {
    setQuittant(true)
    const { error } = await supabase.from('membres_groupes')
      .delete().eq('groupe_id', groupeId).eq('vacancier_id', vacancier.id)
    setQuittant(false)
    if (error) {
      toast(t('chat.err_quitter'), 'erreur')
      return
    }
    toast(t('chat.quitte', { titre: groupe?.titre || '' }), 'succes')
    // replace : le retour Android ramenait dans la conversation quittée.
    navigate('/groupes', { replace: true })
  }

  async function rejoindre() {
    if (rejoignant) return
    setRejoignant(true)
    const { error } = await supabase.from('membres_groupes').insert({ groupe_id: groupeId, vacancier_id: vacancier.id })
    setRejoignant(false)
    if (error && error.code !== '23505') { // 23505 = déjà membre, on laisse passer
      console.error('Rejoindre groupe échoué :', error)
      toast(t('groupes.err_rejoindre'), 'erreur')
      return
    }
    setMembre(true)
    setErreur('')
    if (!error) setNbMembres(n => n + 1)
  }

  const complet = membre === false && groupe && estComplet(groupe, nbMembres)
  // Quand, puis qui, puis où — même ordre que dans la liste des groupes.
  const heure = libelleHeure(groupe?.heure, { aujourdhui: t('chat.aujourdhui'), demain: t('agenda.demain'), locale: locale() })
  const infos = [
    heure && `🕐 ${heure}`,
    `👥 ${nbMembres}`,
    groupe?.lieu && `📍 ${groupe.lieu}`,
  ].filter(Boolean).join(' · ')

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
        display: 'flex', alignItems: 'center', gap: espace.sm,
        flexShrink: 0,
        boxShadow: '0 2px 8px rgba(26, 26, 26, 0.2)',
      }}>
        {/* 44 × 44 : la flèche seule faisait une cible d'une douzaine de
            pixels, qu'on manquait une fois sur deux. */}
        <button
          onClick={() => navigate('/groupes')}
          aria-label={t('commun.retour')}
          style={{
            color: '#fff', fontSize: 30, lineHeight: 1, width: 44, height: 44, margin: '-6px -8px -6px -10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer',
          }}
        >
          ‹
        </button>
        <span aria-hidden="true" style={{
          width: 34, height: 34, borderRadius: rayon.md,
          background: 'rgba(255,255,255,0.16)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: tailles.grand, flexShrink: 0,
        }}>
          {groupe?.emoji || '👥'}
        </span>
        {/* Titre sur deux lignes au besoin : à 320 px, à côté de « Quitter »,
            il n'en restait que « Apéro pét… ». L'heure du rendez-vous, que
            l'on devait chercher dans les messages, passe en tête de la ligne
            d'infos, qui peut elle aussi tenir sur deux lignes. */}
        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <Texte variante="sousTitre" as="h1" style={{
            color: '#fff', fontSize: tailles.grand, lineHeight: 1.25, overflowWrap: 'anywhere',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {groupe?.titre || '…'}
          </Texte>
          <Texte variante="micro" style={{
              color: 'rgba(255,255,255,0.8)', marginTop: 2, overflowWrap: 'anywhere',
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
            {infos}
          </Texte>
        </div>
        {/* Rien ne permettait de quitter un groupe : on restait membre, et
            notifié, d'un apéro d'il y a trois jours jusqu'à la fin du séjour.
            Un non-membre n'a rien à quitter : le bouton n'apparaît pas. */}
        {membre !== false && (
          <button
            onClick={() => setQuitter(true)}
            style={{
              color: '#fff', background: 'rgba(255,255,255,0.14)', border: 'none',
              borderRadius: rayon.rond, padding: `0 10px`, minHeight: 36,
              fontSize: tailles.petit, fontWeight: graisse.fort, flexShrink: 0, cursor: 'pointer',
            }}
          >
            {t('chat.quitter')}
          </button>
        )}
      </div>

      {quitter && (
        <Sheet onClose={() => setQuitter(false)}>
          <Pile espace="lg">
            <Texte variante="section" as="h2">{t('chat.quitter_titre', { titre: groupe?.titre || '' })}</Texte>
            <Texte variante="doux">{t('chat.quitter_texte')}</Texte>
            <Pile espace="sm">
              <Bouton variante="danger" pleineLargeur charge={quittant} onClick={quitterGroupe}>
                {t('chat.quitter')}
              </Bouton>
              <Bouton variante="secondaire" pleineLargeur onClick={() => setQuitter(false)}>
                {t('commun.annuler')}
              </Bouton>
            </Pile>
          </Pile>
        </Sheet>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: `${espace.lg}px ${espace.md}px`, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* « Aucun message » seulement une fois la conversation lue : il
            s'affichait pendant le chargement, et à la place d'une erreur. */}
        {messages.length === 0 && erreurReseau && (
          <ErreurReseau onReessayer={reessayer} style={{ marginTop: 40 }} />
        )}
        {messages.length === 0 && charge && !erreurReseau && (
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
                          background: couleur.surface, borderRadius: rayon.rond, padding: `2px ${espace.xs}px`,
                          display: 'flex', gap: 0, zIndex: 30,
                          boxShadow: ombre.flottante,
                        }}>
                          {/* padding 8 : avec 2 px, chaque emoji faisait une
                              cible de 28 px qu'on manquait au doigt. Le gap
                              tombe à 0 pour que la barre ne s'élargisse pas. */}
                          {REACTIONS.map(e => (
                            <button key={e} onClick={ev => { ev.stopPropagation(); toggleReaction(msg, e) }}
                              style={{ fontSize: 20, lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}>
                              {e}
                            </button>
                          ))}
                        </div>
                      )}
                      {/* Réactions affichées */}
                      {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                        <div style={{
                          // wrap : plus hautes, cinq réactions ne doivent pas
                          // déborder d'une bulle étroite à 320 px.
                          display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 3,
                          justifyContent: isMine ? 'flex-end' : 'flex-start',
                        }}>
                          {Object.entries(msg.reactions).map(([e, ids]) => ids.length > 0 && (
                            <button key={e} onClick={() => toggleReaction(msg, e)}
                              aria-pressed={ids.includes(vacancier.id)}
                              style={{
                                // 36 px de haut : à 2 px de rembourrage, la
                                // pastille se manquait au doigt.
                                fontSize: tailles.petit, minHeight: 36, padding: '2px 10px', borderRadius: rayon.md,
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
      {membre === false ? (
        /* Non-membre (groupe quitté, lien partagé) : on lit, mais pour
           écrire il faut d'abord rejoindre — comme depuis la liste. */
        <div style={{
          padding: `10px ${espace.md}px`,
          background: couleur.surface,
          borderTop: `1px solid ${couleur.bordure}`,
          paddingBottom: 'max(10px, var(--cc-safe-bottom))',
          flexShrink: 0,
        }}>
          <Bouton taille="lg" pleineLargeur charge={rejoignant} disabled={complet} onClick={rejoindre}>
            {complet ? t('commun.complet') : t('chat.rejoindre')}
          </Bouton>
        </div>
      ) : (
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
          maxLength={1000}
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
      )}

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

/** Ajoute un message s'il n'est pas déjà là : l'envoi et le temps réel le livrent tous deux. */
function ajouter(liste, msg) {
  return liste.some(m => m.id === msg.id) ? liste : [...liste, msg]
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
