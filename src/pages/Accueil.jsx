import { useEffect, useRef, useState } from 'react'
import { toast } from '../toast'
import Sheet from '../components/Sheet'
import { useNavigate } from 'react-router-dom'
import { supabase, presentFilter } from '../supabase'
import { t, useLangue } from '../i18n'
import Meteo from '../components/Meteo'
import { usePresence } from '../usePresence'
import MenuModeration from '../components/MenuModeration'
import { chargerBlocages, estBloque } from '../lib/moderation'
import CarteGroupe from '../components/CarteGroupe'
import ChoixEmoji from '../components/ChoixEmoji'
import { SUGGESTIONS_STATUTS } from '../lib/emojis'
import { estActuel } from '../lib/groupes'
import {
  Bouton, Carte, Champ, Texte, Pile, Squelette, Vide,
  couleur, espace, graisse, ombre, rayon, texte as tailles,
} from '../design'

export default function Accueil({ camping, vacancier }) {
  useLangue()
  const [groupes, setGroupes]           = useState([])
  const [nbGroupes, setNbGroupes]       = useState(0)
  const [nbAnimations, setNbAnimations] = useState(0)
  const [vacancierCount, setVacancierCount] = useState(0)
  const [mesGroupes, setMesGroupes]     = useState([])
  const [membresMap, setMembresMap]     = useState({})
  const [loading, setLoading]           = useState(true)
  const navigate = useNavigate()
  const enLigne = usePresence(camping?.id, vacancier?.id)

  useEffect(() => {
    async function load() {
      const now = new Date().toISOString()
      const [
        { data: grpsBruts },
        { count: aCount },
        { count: vCount },
        { data: membres },
      ] = await Promise.all([
        supabase.from('groupes').select('*').eq('camping_id', camping.id).eq('actif', true).order('created_at', { ascending: false }).limit(30),
        supabase.from('animations').select('*', { count: 'exact', head: true }).eq('camping_id', camping.id).eq('publiee', true).gte('debut', now),
        supabase.from('vacanciers').select('*', { count: 'exact', head: true }).eq('camping_id', camping.id).or(presentFilter()),
        supabase.from('membres_groupes').select('groupe_id').eq('vacancier_id', vacancier.id),
      ])
      // Les compteurs du bandeau lisaient la longueur de listes tronquées à 5
      // groupes et 4 animations : un camping animé annonçait « 4 animations »
      // quel que soit leur nombre réel. Et les groupes d'il y a une semaine,
      // que personne ne ferme, comptaient encore.
      const actuels = (grpsBruts || []).filter(g => estActuel(g))
      const grps = actuels.slice(0, 5)
      setGroupes(grps)
      setNbGroupes(actuels.length)
      setNbAnimations(aCount || 0)
      setVacancierCount(vCount || 0)
      setMesGroupes((membres || []).map(m => m.groupe_id))
      setLoading(false)

      const ids = grps.map(g => g.id)
      if (ids.length) {
        const { data: allMembres } = await supabase
          .from('membres_groupes').select('groupe_id, vacanciers!inner(avatar_emoji)').in('groupe_id', ids)
          .or(presentFilter(), { foreignTable: 'vacanciers' })
        const map = {}
        for (const m of allMembres || []) {
          if (!map[m.groupe_id]) map[m.groupe_id] = []
          map[m.groupe_id].push(m.vacanciers?.avatar_emoji || '🙂')
        }
        setMembresMap(map)
      }
    }
    load()
  }, [camping.id, vacancier.id])

  async function rejoindre(groupeId) {
    const { error } = await supabase.from('membres_groupes').insert({ groupe_id: groupeId, vacancier_id: vacancier.id })
    if (error && error.code !== '23505') { // 23505 = déjà membre, on laisse passer
      console.error('Rejoindre groupe échoué :', error)
      toast(t('groupes.err_rejoindre'), 'erreur')
      return
    }
    setMesGroupes(prev => prev.includes(groupeId) ? prev : [...prev, groupeId])
    navigate(`/chat/${groupeId}`)
  }

  return (
    <div style={{ background: couleur.fondClair, minHeight: '100%', paddingBottom: espace.xl }}>

      <div style={{ margin: `${espace.lg}px ${espace.lg}px 0` }}>
        <Hero
          vacancier={vacancier}
          enLigne={enLigne}
          vacancierCount={vacancierCount}
          groupesCount={nbGroupes}
          animationsCount={nbAnimations}
          onMap={() => navigate('/map')}
          onAgenda={() => navigate('/agenda')}
        />
      </div>

      <Meteo camping={camping} />

      {/* Accès rapides */}
      <Pile direction="ligne" espace="sm" style={{ margin: `14px ${espace.lg}px 0` }}>
        <AccesRapide emoji="🛠️" fond={couleur.dangerFond}
                     libelle={t('signaler.court')} onClick={() => navigate('/signaler')} />
        <AccesRapide emoji="📣" fond="var(--cc-accent-voile)"
                     libelle={t('annonces.court')} onClick={() => navigate('/annonces')} />
      </Pile>

      <StatutsStrip camping={camping} vacancier={vacancier} />

      {/* Groupes actifs */}
      <Pile espace="md" style={{ padding: `${espace.xl}px ${espace.lg}px 0` }}>
        <Pile direction="ligne" espace="sm" justifier="space-between" aligner="center">
          <Texte variante="sousTitre" as="h2" style={{ fontSize: 18 }}>
            {t('accueil.groupes_maintenant')}
          </Texte>
          {/* Le lien garde sa ligne : sans cela, le rembourrage du bouton vole
              assez de largeur au titre pour le faire passer sur deux lignes,
              et la flèche se retrouve seule en dessous. */}
          <Bouton variante="discret" taille="sm" onClick={() => navigate('/groupes')}
                  style={{
                    color: 'var(--cc-accent)', whiteSpace: 'nowrap', flexShrink: 0,
                    paddingLeft: 0, paddingRight: 0,
                  }}>
            {t('accueil.voir_tout')} →
          </Bouton>
        </Pile>

        {loading ? (
          <Squelette lignes={3} hauteur={74} libelle={t('commun.chargement')} />
        ) : groupes.length === 0 ? (
          /* L'écran d'accueil d'un camping qui démarre n'affichait qu'une
             phrase grise : le vacancier comprenait qu'il n'y avait rien, mais
             pas qu'il pouvait y remédier lui-même. Le bouton mène là où le
             groupe se crée. */
          <Vide
            emoji="👥"
            titre={t('accueil.aucun_groupe')}
            texte={t('accueil.premier_creer')}
            action={<Bouton onClick={() => navigate('/groupes')}>{t('groupes.creer')}</Bouton>}
          />
        ) : (
          <Pile espace="sm">
            {groupes.map(g => (
              <CarteGroupe
                key={g.id}
                groupe={g}
                avatars={membresMap[g.id]}
                membre={mesGroupes.includes(g.id)}
                onAction={mesGroupes.includes(g.id)
                  ? () => navigate(`/chat/${g.id}`)
                  : () => rejoindre(g.id)
                }
              />
            ))}
          </Pile>
        )}

        <Bouton taille="lg" pleineLargeur onClick={() => navigate('/groupes')}>
          {t('accueil.creer_groupe')}
        </Bouton>
      </Pile>
    </div>
  )
}

function AccesRapide({ emoji, fond, libelle, onClick }) {
  return (
    <Carte
      as="button"
      hauteur="posee"
      padding={`13px ${espace.lg}px`}
      cliquable
      onClick={onClick}
      style={{
        flex: 1, display: 'flex', alignItems: 'center', gap: espace.sm,
        textAlign: 'left', font: 'inherit',
      }}
    >
      <span aria-hidden="true" style={{
        width: 36, height: 36, borderRadius: 11, flexShrink: 0, fontSize: 18,
        background: fond, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{emoji}</span>
      <Texte variante="doux" as="span" style={{ fontWeight: graisse.titre, color: couleur.texte }}>
        {libelle}
      </Texte>
    </Carte>
  )
}

/* ─── Statuts éphémères 24h ─── */

function StatutsStrip({ camping, vacancier }) {
  const [statuts, setStatuts] = useState([])
  const [moderation, setModeration] = useState(null)
  const [, setBloquesVersion] = useState(0)
  const appuiLong = useRef(null)

  function annulerAppuiLong() {
    if (appuiLong.current && appuiLong.current !== 'declenche') {
      clearTimeout(appuiLong.current); appuiLong.current = null
    }
  }

  function ouvrirModeration(st) {
    setModeration({
      type: 'statut', id: st.id, texte: `${st.emoji || ''} ${st.texte}`.trim(),
      auteurId: st.vacancier_id, pseudo: st.vacanciers?.pseudo,
    })
  }
  const [showModal, setShowModal] = useState(false)
  const [texte, setTexte] = useState('')
  const [emoji, setEmoji] = useState('🔥')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString()
      const { data } = await supabase
        .from('statuts')
        .select('*, vacanciers(pseudo, avatar_emoji)')
        .eq('camping_id', camping.id)
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(20)
      setStatuts(data || [])
      chargerBlocages(vacancier.id).then(() => setBloquesVersion(v => v + 1))
    }
    load()
    const channel = supabase
      .channel(`statuts_${camping.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'statuts', filter: `camping_id=eq.${camping.id}` },
        async (payload) => {
          // Son propre statut est déjà affiché dès la publication : ne pas
          // le doubler quand l'événement temps réel arrive.
          if (payload.new.vacancier_id === vacancier.id) return
          const { data: vac } = await supabase
            .from('vacanciers').select('pseudo, avatar_emoji').eq('id', payload.new.vacancier_id).single()
          setStatuts(prev => prev.some(s => s.id === payload.new.id)
            ? prev
            : [{ ...payload.new, vacanciers: vac }, ...prev])
        })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [camping.id, vacancier.id])

  async function poster() {
    if (!texte.trim() || saving) return
    setSaving(true)
    const { data, error } = await supabase.from('statuts').insert({
      camping_id: camping.id, vacancier_id: vacancier.id,
      emoji, texte: texte.trim(),
    }).select('*, vacanciers(pseudo, avatar_emoji)').single()
    setSaving(false)
    if (error) {
      console.error('Publication statut échouée :', error)
      toast(error.code === '42501' ? t('commun.banni') : t('accueil.err_statut'), 'erreur')
      return
    }
    // Le statut n'apparaissait qu'au retour de l'événement temps réel. Si la
    // connexion temps réel était tombée — téléphone mis en veille, réseau du
    // camping —, rien ne s'affichait : on croyait l'envoi raté et on republiait.
    if (data) setStatuts(prev => prev.some(s => s.id === data.id) ? prev : [data, ...prev])
    setTexte(''); setShowModal(false)
  }

  // Les trois formulations existaient déjà traduites dans i18n ; elles étaient
  // simplement réécrites en français ici, si bien qu'un vacancier anglophone
  // lisait « il y a 12 min » au milieu d'une interface en anglais.
  function timeAgo(iso) {
    const min = Math.floor((Date.now() - new Date(iso)) / 60000)
    if (min < 1) return t('commun.maintenant')
    if (min < 60) return t('commun.ilya_min', { n: min })
    return t('commun.ilya_h', { n: Math.floor(min / 60) })
  }

  return (
    <div style={{ padding: '18px 0 0' }}>
      <div style={{ display: 'flex', gap: espace.sm, overflowX: 'auto', padding: `0 ${espace.lg}px 4px` }}>
        {/* Poster un statut */}
        <button onClick={() => setShowModal(true)} style={{
          flexShrink: 0, width: 74, borderRadius: rayon.lg,
          border: '2px dashed var(--cc-accent-bordure)', background: 'var(--cc-accent-voile)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: espace.xs, padding: `${espace.md}px ${espace.sm}px`, cursor: 'pointer',
        }}>
          <span aria-hidden="true" style={{
            width: 32, height: 32, borderRadius: rayon.rond,
            background: 'var(--cc-accent)', color: couleur.texteSurAccent,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: tailles.titre, fontWeight: 300,
          }}>+</span>
          <Texte variante="micro" as="span" style={{ fontWeight: graisse.titre, color: 'var(--cc-accent)' }}>
            {t('accueil.quoi_de_neuf')}
          </Texte>
        </button>

        {statuts.filter(s => !estBloque(vacancier.id, s.vacancier_id)).map(s => (
          <div key={s.id}
            onTouchStart={() => {
              if (s.vacancier_id === vacancier.id) return
              appuiLong.current = setTimeout(() => {
                appuiLong.current = 'declenche'; ouvrirModeration(s)
              }, 500)
            }}
            onTouchEnd={annulerAppuiLong}
            onTouchMove={annulerAppuiLong}
            onContextMenu={(e) => {
              if (s.vacancier_id === vacancier.id) return
              e.preventDefault(); ouvrirModeration(s)
            }}
            style={{
              flexShrink: 0, maxWidth: 200, borderRadius: rayon.lg,
              background: couleur.surface, padding: `10px ${espace.lg}px`,
              boxShadow: ombre.posee,
            }}>
            <Pile direction="ligne" espace="xs" aligner="center" style={{ marginBottom: espace.xs }}>
              <span aria-hidden="true" style={{ fontSize: 16 }}>{s.vacanciers?.avatar_emoji || '🙂'}</span>
              <Texte variante="doux" as="span" style={{ fontWeight: graisse.titre, color: couleur.texte }}>
                {s.vacanciers?.pseudo}
              </Texte>
              <Texte variante="micro" as="span" style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>
                {timeAgo(s.created_at)}
              </Texte>
            </Pile>
            <Texte variante="doux" style={{ color: couleur.texteMoyen, lineHeight: 1.4 }}>
              {s.emoji} {s.texte}
            </Texte>
          </div>
        ))}
      </div>

      {moderation && (
        <MenuModeration
          cible={moderation}
          camping={camping}
          vacancier={vacancier}
          onClose={() => setModeration(null)}
          onBloque={() => setBloquesVersion(v => v + 1)}
        />
      )}

      {/* Poster un statut */}
      {showModal && (
        <Sheet onClose={() => setShowModal(false)}>
          <Pile espace="lg">
            <Pile espace="xs">
              <Texte variante="sousTitre" as="h2" style={{ fontSize: 18 }}>{t('accueil.quoi_de_neuf')}</Texte>
              <Texte variante="doux">{t('accueil.visible24')}</Texte>
            </Pile>

            <ChoixEmoji
              libelle={t('groupes.emoji')}
              valeur={emoji}
              suggestions={SUGGESTIONS_STATUTS}
              onChange={setEmoji}
              taille={40}
            />

            <Champ
              libelle={t('accueil.quoi_de_neuf')}
              value={texte}
              onChange={e => setTexte(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && poster()}
              placeholder={t('accueil.statut_ph')}
              autoFocus
              maxLength={90}
            />

            <Bouton taille="lg" pleineLargeur charge={saving} disabled={!texte.trim()} onClick={poster}>
              {saving ? t('accueil.publication') : `${emoji} ${t('accueil.publier')}`}
            </Bouton>
          </Pile>
        </Sheet>
      )}
    </div>
  )
}

/* ─── Bandeau d'accueil ─── */
function Hero({ vacancier, vacancierCount, groupesCount, animationsCount, onMap, onAgenda, enLigne }) {
  useLangue()
  const h = new Date().getHours()
  const salut = h < 12 ? t('accueil.bonjour') : h < 18 ? t('accueil.bonapresmidi') : t('accueil.bonsoiree')
  const astre = h < 6 ? '🌙' : h < 12 ? '🌅' : h < 18 ? '☀️' : '🌇'

  return (
    <div style={{
      borderRadius: rayon.xl,
      // Le dégradé part de l'accent du camping et glisse vers un jaune d'été.
      // color-mix évite d'avoir à recomposer l'accent en JavaScript pour en
      // dériver une variante translucide.
      background: 'linear-gradient(135deg, var(--cc-accent) 0%, color-mix(in srgb, var(--cc-accent) 80%, transparent) 60%, #f0b429 140%)',
      padding: '22px 20px 18px',
      color: '#fff',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: ombre.flottante,
    }}>
      <span aria-hidden="true" style={{ position: 'absolute', top: -22, right: -14, fontSize: 110, opacity: 0.14, transform: 'rotate(12deg)', pointerEvents: 'none' }}>⛺</span>
      <span aria-hidden="true" style={{ position: 'absolute', bottom: -18, left: -10, fontSize: 80, opacity: 0.12, pointerEvents: 'none' }}>🌲</span>

      <Texte variante="corps" style={{ color: '#fff', fontWeight: graisse.fort, opacity: 0.92 }}>
        {salut} {astre}
      </Texte>
      <Texte variante="titre" as="h1" style={{ color: '#fff', margin: '2px 0 14px' }}>
        {vacancier?.avatar_emoji} {vacancier?.pseudo || t('accueil.campeur')}
      </Texte>

      <Pile direction="ligne" espace="sm" retour style={{ marginBottom: espace.lg }}>
        {enLigne > 0 && (
          <Jeton>
            <span aria-hidden="true" style={{
              width: 8, height: 8, borderRadius: rayon.rond, background: '#22c55e',
              boxShadow: '0 0 0 3px rgba(34,197,94,0.35)',
              animation: 'pulseDot 2s ease-in-out infinite', flexShrink: 0,
            }} />
            <span><strong style={{ fontWeight: graisse.affiche, fontSize: tailles.base }}>{enLigne}</strong> {t('accueil.en_ligne')}</span>
          </Jeton>
        )}
        {[
          [vacancierCount, t(vacancierCount === 1 ? 'accueil.mot_vacancier' : 'accueil.mot_vacanciers')],
          [groupesCount, t(groupesCount === 1 ? 'accueil.mot_groupe' : 'accueil.mot_groupes')],
          [animationsCount, t(animationsCount === 1 ? 'accueil.mot_animation' : 'accueil.mot_animations')],
        ].map(([n, l]) => (
          <Jeton key={l}>
            <span><strong style={{ fontWeight: graisse.affiche, fontSize: tailles.base }}>{n}</strong> {l}</span>
          </Jeton>
        ))}
      </Pile>

      <Pile direction="ligne" espace="sm">
        <Bouton onClick={onMap} style={{
          flex: 1, background: '#fff', color: 'var(--cc-accent)',
          borderRadius: rayon.lg, fontWeight: graisse.affiche, boxShadow: ombre.levee,
        }}>
          🗺️ {t('accueil.explorer_carte')}
        </Bouton>
        <Bouton onClick={onAgenda} style={{
          flex: 1, background: 'rgba(255,255,255,0.16)', color: '#fff',
          borderRadius: rayon.lg, border: '1.5px solid rgba(255,255,255,0.4)',
        }}>
          📅 {t('nav.agenda')}
        </Bouton>
      </Pile>
    </div>
  )
}

/** Pastille de statistique du bandeau : verre dépoli sur le dégradé. */
function Jeton({ children }) {
  return (
    <span style={{
      background: 'rgba(255,255,255,0.18)',
      backdropFilter: 'blur(6px)',
      borderRadius: 14, padding: `7px ${espace.md}px`,
      fontSize: tailles.petit, fontWeight: graisse.fort,
      border: '1px solid rgba(255,255,255,0.25)',
      display: 'flex', alignItems: 'center', gap: 6,
    }}>
      {children}
    </span>
  )
}
