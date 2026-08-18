import { useState, useEffect, useRef } from 'react'
import { supabase, ensureAnonSession } from '../supabase'
import { isNative, setAppMode } from '../native'
import { t, useLangue } from '../i18n'
import {
  Bouton, Carte, Champ, Texte, Pile, appliquerTheme,
  couleur as jetons, espace, graisse, rayon,
} from '../design'

// Le vert profond de l'écran d'entrée : il précède le chargement du camping,
// donc il ne peut pas venir de l'accent — celui-ci n'est pas encore connu.
const TITRE = '#2f4a26'
const SOUS_TITRE = '#6d7964'

const AVATARS = ['🏕️', '🌲', '⛺', '🎯', '🚴', '🏊', '🎣', '🌻', '🦜', '🌈']

// Code tournant : 4 chiffres, change toutes les heures, unique par camping
// Fonctionne avec UUID (string) ou number
export function getHourlyCode(campingId) {
  const h = Math.floor(Date.now() / 3_600_000)
  const str = String(campingId) + String(h)
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = Math.imul(31, hash) + str.charCodeAt(i) | 0
  }
  return String((Math.abs(hash) % 9000) + 1000)
}

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Si on est arrivé via /join/slug → le QR code physique = preuve de présence → pas besoin de vérifier
// Attention : ne vaut que sur le web. Dans l'app native, le chemin est toujours
// « / » — le deep link passe par native.js, qui range le slug en localStorage et
// recharge sur la racine. D'où le drapeau ci-dessous, posé au même moment.
const fromQR = !!window.location.pathname.match(/^\/join\/([^/?#]+)/)
             || localStorage.getItem('arriveeParQR') === '1'

// Camping en accès libre : contrôle de présence désactivé pour ce camping-là.
// Réservé au camping de démonstration, qui doit rester ouvrable depuis
// n'importe où — par un prospect à qui l'on fait la démonstration, et surtout
// par les testeurs d'Apple et de Google, à des milliers de kilomètres du site.
// Les campings réels n'ont pas ce drapeau et gardent leur vérification GPS.
const estAccesLibre = c => c?.carte_config?.acces_libre === true

export default function Onboarding({ initialCamping, onDone }) {
  useLangue()
  const initialStep = !initialCamping
    ? 'search'
    : (fromQR || estAccesLibre(initialCamping) ? 'form' : 'verify')
  const [step, setStep] = useState(initialStep)
  const [camping, setCamping] = useState(initialCamping)

  // L'accent du camping est posé dès qu'il est identifié : l'inscription se
  // fait donc déjà à ses couleurs, avant même d'entrer dans l'application.
  useEffect(() => { appliquerTheme(camping) }, [camping])

  // Recherche de camping
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const searchTimeout = useRef(null)

  // Vérification GPS / code
  const [gpsStatus, setGpsStatus] = useState('idle') // idle | checking | ok | fail
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState('')

  // Formulaire profil
  const [form, setForm] = useState({ pseudo: '', emplacement: '', avatar_emoji: '🏕️', date_depart: '' })
  const [cguAcceptees, setCguAcceptees] = useState(false)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const isDev = window.location.hostname === 'localhost' || window.location.hostname.startsWith('192.168.')

  // Lancer la vérif GPS automatiquement à l'arrivée sur 'verify'
  useEffect(() => {
    if (step === 'verify' && camping) {
      if (isDev) { setStep('form'); return } // bypass en dev local
      // Camping de démonstration : ouvrable depuis n'importe où. Couvre le cas
      // où l'on arrive par la recherche plutôt que par un lien /join.
      if (estAccesLibre(camping)) { setStep('form'); return }
      checkGPS()
    }
  }, [step, camping?.id])

  function checkGPS() {
    setGpsStatus('checking')
    if (!navigator.geolocation) { setGpsStatus('fail'); return }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        const campingLat = camping.carte_config?.center?.lat
        const campingLng = camping.carte_config?.center?.lng

        // Camping pas encore calibré : on bascule sur le code d'accès.
        //
        // Cet écran écrivait ici la position du vacancier dans le camping, en
        // guise de calibration automatique. Deux dégâts, tous deux constatés :
        //
        //   • l'écriture recomposait carte_config à partir de la copie que ce
        //     client avait en mémoire. Elle remplaçait donc l'objet entier, et
        //     effaçait ce qu'un autre écran y avait mis entre-temps — les
        //     points d'intérêt détectés depuis l'administration ont disparu
        //     ainsi, remplacés par un objet ne contenant qu'un « center » ;
        //
        //   • le centre retenu était celui du téléphone du premier arrivant.
        //     Quelqu'un qui installe l'application depuis chez lui définissait
        //     le camping à son domicile, et la vérification GPS devenait fausse
        //     pour tous les suivants.
        //
        // Le centre est une donnée du camping : il se règle depuis
        // l'administration, à l'étape « Position du camping ». Sans lui, le
        // code affiché à la réception prend le relais — ce qu'il sait déjà faire.
        if (!campingLat || !campingLng) {
          setGpsStatus('fail')
          return
        }

        const dist = haversine(lat, lng, campingLat, campingLng)
        if (dist < 800) {
          setGpsStatus('ok')
          setTimeout(() => setStep('form'), 900)
        } else {
          setGpsStatus('fail')
        }
      },
      () => setGpsStatus('fail'),
      { timeout: 8000, maximumAge: 30000 }
    )
  }

  // Liste initiale : tous les campings (affichée avant toute saisie)
  useEffect(() => {
    if (step !== 'search') return
    supabase.from('campings')
      .select('id, nom, slug, couleur_principale, logo_url')
      .order('nom').limit(20)
      .then(({ data }) => { if (data && !query) setResults(data) })
  }, [step]) // eslint-disable-line

  function handleQueryChange(q) {
    setQuery(q)
    clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(async () => {
      setSearching(true)
      let req = supabase.from('campings')
        .select('id, nom, slug, couleur_principale, logo_url')
        .order('nom').limit(q.length >= 2 ? 6 : 20)
      if (q.length >= 2) {
        // Insensible aux accents : on cherche sur nom ET slug (slug = nom sans accents)
        const slugQ = q.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-')
        req = req.or(`nom.ilike.%${q}%,slug.ilike.%${slugQ}%`)
      }
      const { data } = await req
      setResults(data || [])
      setSearching(false)
    }, 300)
  }

  /**
   * Choix d'un camping dans la liste de recherche.
   *
   * La recherche ne ramène que de quoi dessiner la liste — nom, slug, couleur,
   * logo. Elle laisse volontairement carte_config de côté : cet objet contient
   * le contour et les points d'intérêt, et le tirer pour vingt campings
   * chargerait des centaines de kilo-octets sur le réseau d'un camping, pour
   * n'en garder qu'un.
   *
   * Mais la suite en dépend : c'est carte_config qui porte le drapeau d'accès
   * libre et le centre GPS. Sans lui, un camping ouvert sans vérification de
   * position passait quand même par le contrôle GPS, qui échouait, et
   * réclamait un code que le visiteur n'a pas. La ligne complète est donc
   * relue ici, pour ce camping-là seulement.
   */
  async function selectCamping(c) {
    setCamping(c)
    setStep('verify')
    setGpsStatus('idle')

    const { data } = await supabase
      .from('campings').select('*').eq('id', c.id).maybeSingle()

    // En cas d'échec on garde la version partielle : le contrôle GPS prendra
    // le relais, avec le code en secours. Mieux vaut un accès plus strict
    // qu'un écran bloqué.
    if (!data) return
    setCamping(data)
    if (estAccesLibre(data)) setStep('form')
  }

  // Reset complet : oublie le camping mémorisé pour repartir du choix (change de camping)
  function changerCamping() {
    localStorage.removeItem('campingSlug')
    localStorage.removeItem('vacancier')
    setCamping(null)
    setQuery('')
    setGpsStatus('idle')
    setStep('search')
  }

  function checkCode() {
    if (code.trim() === getHourlyCode(camping.id)) {
      setStep('form')
    } else {
      setCodeError(t('onb.code_erreur'))
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.pseudo.trim()) { setFormError(t('onb.pseudo_oblig')); return }
    // L'attribut required du navigateur suffit en théorie ; ce contrôle existe
    // parce qu'un formulaire soumis par un autre chemin le contournerait, et
    // parce que l'acceptation doit être vérifiable, pas seulement présumée.
    if (!cguAcceptees) { setFormError(t('cgu.obligatoire')); return }
    setSaving(true)
    setFormError('')
    await ensureAnonSession()
    const { data: { user } } = await supabase.auth.getUser()
    const uid = user?.id
    const deviceId = localStorage.getItem('deviceId')
    const profil = {
      camping_id: camping.id,
      pseudo: form.pseudo.trim(),
      avatar_emoji: form.avatar_emoji,
      emplacement: form.emplacement.trim() || null,
      date_depart: form.date_depart || null,
      device_id: deviceId,
      user_id: uid,
      cgu_acceptees_at: new Date().toISOString(),
    }

    // Re-séjour avec la même identité (ex: retour l'année suivante) → réutiliser le profil
    const { data: existing } = await supabase
      .from('vacanciers').select('id')
      .eq('user_id', uid).eq('camping_id', camping.id)
      .maybeSingle()

    const { data, error } = existing
      ? await supabase.from('vacanciers').update(profil).eq('id', existing.id).select().single()
      : await supabase.from('vacanciers').insert(profil).select().single()

    if (error) { setFormError(t('onb.err_generique')); setSaving(false); return }
    onDone(camping, data)
  }

  // ─── SEARCH ───────────────────────────────────────────────────────────────
  if (step === 'search') return (
    <Screen clair>
      <div style={{ textAlign: 'center', marginBottom: 30 }}>
        {/* La même marque que l'écran de démarrage, à la même place : le
            passage de l'un à l'autre ne doit pas se remarquer. */}
        <img src="/logo-mark.png" alt="" width={82} height={87}
             style={{ display: 'block', margin: '0 auto 14px' }} />
        <Texte variante="titre" style={{ fontSize: 27, color: TITRE }}>CampConnect</Texte>
        <Texte variante="corps" style={{ marginTop: 7, color: SOUS_TITRE }}>
          {t('onb.rechercher')}
        </Texte>
      </div>

      <Card>
        <Pile espace="lg">
          <div style={{ position: 'relative' }}>
            <Champ
              libelle={t('onb.votre_camping')}
              value={query}
              onChange={e => handleQueryChange(e.target.value)}
              placeholder={t('onb.camping_ph')}
              style={{ paddingLeft: 40 }}
              autoFocus
            />
            <span aria-hidden="true" style={{ position: 'absolute', left: 13, bottom: 15, fontSize: 17 }}>🔍</span>
          </div>

          {searching && <Texte variante="doux" style={{ textAlign: 'center' }}>{t('onb.en_recherche')}</Texte>}

          {results.length > 0 && (
            <Pile espace="xs">
              {results.map(c => (
                <button
                  key={c.id}
                  onClick={() => selectCamping(c)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: espace.md,
                    padding: `${espace.md}px 14px`, borderRadius: rayon.md,
                    border: `1.5px solid ${jetons.bordure}`, background: jetons.fondClair,
                    cursor: 'pointer', textAlign: 'left', width: '100%',
                    transition: 'border-color 0.15s',
                  }}
                >
                  <span aria-hidden="true" style={{
                    width: 36, height: 36, borderRadius: rayon.sm, flexShrink: 0,
                    background: c.couleur_principale || jetons.marque,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18,
                  }}>
                    {c.logo_url ? <img src={c.logo_url} alt="" style={{ width: 28, height: 28, objectFit: 'contain' }} /> : '🏕️'}
                  </span>
                  <span>
                    <Texte variante="corps" as="span" style={{ display: 'block', fontWeight: graisse.fort, color: jetons.texte }}>{c.nom}</Texte>
                    <Texte variante="doux" as="span" style={{ display: 'block', marginTop: 1 }}>{t('onb.appuyer')}</Texte>
                  </span>
                </button>
              ))}
            </Pile>
          )}

          {query.length >= 2 && !searching && results.length === 0 && (
            <Texte variante="doux" style={{ textAlign: 'center' }}>{t('onb.aucun_camping')}</Texte>
          )}

          <Texte variante="doux" style={{
            padding: `${espace.md}px 14px`, background: jetons.fond,
            borderRadius: rayon.md, textAlign: 'center',
          }}>
            {t('onb.qr_astuce')}
          </Texte>

          {isNative && (
            <Bouton variante="discret" pleineLargeur onClick={() => setAppMode('gerant')}
                    style={{ textDecoration: 'underline' }}>
              {t('onb.gerant')}
            </Bouton>
          )}
        </Pile>
      </Card>
    </Screen>
  )

  // ─── VERIFY ───────────────────────────────────────────────────────────────
  if (step === 'verify') return (
    <Screen clair>
      <div style={{ textAlign: 'center', marginBottom: 26 }}>
        {camping.logo_url
          ? <img src={camping.logo_url} alt="" style={{ width: 68, height: 68, objectFit: 'contain', borderRadius: 16, marginBottom: 12 }} />
          : <img src="/logo-mark.png" alt="" width={72} height={77} style={{ display: 'block', margin: '0 auto 12px' }} />
        }
        <Texte variante="titre" style={{ fontSize: 23, color: TITRE }}>{camping.nom}</Texte>
        <Texte variante="corps" style={{ marginTop: 6, color: SOUS_TITRE }}>{t('onb.verif_presence')}</Texte>
      </div>

      <Card>
        <Pile espace="lg">
          {/* GPS — l'état est annoncé aux lecteurs d'écran, pas seulement teinté. */}
          <Pile espace="xs" role="status" aria-live="polite">
            <Pile direction="ligne" espace="sm" aligner="center">
              <span aria-hidden="true" style={{ fontSize: 20 }}>📍</span>
              <Texte variante="corps" as="span" style={{ fontWeight: graisse.fort, color: jetons.texte }}>
                {t('onb.verif_gps')}
              </Texte>
              {gpsStatus === 'checking' && <Spinner />}
              {gpsStatus === 'ok' && (
                <Texte variante="doux" as="span" style={{ color: jetons.succes, fontWeight: graisse.fort }}>
                  {t('onb.gps_confirme')}
                </Texte>
              )}
              {gpsStatus === 'fail' && (
                <Texte variante="doux" as="span" style={{ color: jetons.danger }}>{t('onb.gps_indispo')}</Texte>
              )}
            </Pile>
            <Texte variante="micro">
              {gpsStatus === 'checking' && t('onb.gps_en_cours')}
              {gpsStatus === 'ok' && t('onb.gps_ok')}
              {gpsStatus === 'fail' && t('onb.gps_echec')}
              {gpsStatus === 'idle' && t('commun.chargement')}
            </Texte>
          </Pile>

          {/* Code du jour, en repli quand le GPS ne tranche pas */}
          {gpsStatus === 'fail' && (
            <Pile espace="sm" style={{ borderTop: `1px solid ${jetons.bordure}`, paddingTop: 18 }}>
              <Pile direction="ligne" espace="sm" aligner="center">
                <span aria-hidden="true" style={{ fontSize: 18 }}>🔑</span>
                <Texte variante="corps" as="span" style={{ fontWeight: graisse.fort, color: jetons.texte }}>
                  {t('onb.code_titre')}
                </Texte>
              </Pile>
              <Texte variante="micro">{t('onb.code_detail')}</Texte>
              <Pile direction="ligne" espace="sm" aligner="flex-end">
                {/* Champ empile son libellé au-dessus de sa saisie ; sans cette
                    enveloppe extensible, il se dimensionne sur son contenu et
                    le bouton OK part à l'autre bout de la carte. */}
                <div style={{ flex: 1 }}>
                <Champ
                  type="number"
                  libelle={t('onb.code_titre')}
                  value={code}
                  onChange={e => { setCode(e.target.value); setCodeError('') }}
                  onKeyDown={e => e.key === 'Enter' && checkCode()}
                  placeholder="_ _ _ _"
                  maxLength={4}
                  erreur={codeError || undefined}
                  style={{ fontSize: 22, textAlign: 'center', letterSpacing: 8, fontWeight: graisse.titre }}
                />
                </div>
                <Bouton taille="lg" onClick={checkCode} style={{ flexShrink: 0, minHeight: 48 }}>OK</Bouton>
              </Pile>
            </Pile>
          )}

          <Bouton variante="discret" pleineLargeur onClick={changerCamping}>
            {t('onb.changer')}
          </Bouton>
        </Pile>
      </Card>
    </Screen>
  )

  // ─── FORM ─────────────────────────────────────────────────────────────────
  return (
    <Screen clair>
      <div style={{ textAlign: 'center', marginBottom: 26 }}>
        {camping.logo_url
          ? <img src={camping.logo_url} alt="" style={{ width: 64, height: 64, objectFit: 'contain', borderRadius: 16, marginBottom: 12 }} />
          : <img src="/logo-mark.png" alt="" width={66} height={70} style={{ display: 'block', margin: '0 auto 12px' }} />
        }
        <Texte variante="titre" style={{ fontSize: 23, color: TITRE }}>{camping.nom}</Texte>
        <Texte variante="corps" style={{ marginTop: 6, color: SOUS_TITRE }}>{t('onb.creez_profil')}</Texte>
      </div>

      <Card>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Pile espace="sm" role="group" aria-label={t('onb.avatar')}>
            <Texte variante="libelle" as="span">{t('onb.avatar')}</Texte>
            <Pile direction="ligne" espace="sm" retour>
              {AVATARS.map(emoji => (
                <button
                  key={emoji} type="button"
                  aria-label={emoji}
                  aria-pressed={form.avatar_emoji === emoji}
                  onClick={() => setForm(f => ({ ...f, avatar_emoji: emoji }))}
                  style={{
                    width: 44, height: 44, fontSize: 24, borderRadius: rayon.md,
                    border: `2px solid ${form.avatar_emoji === emoji ? 'var(--cc-accent)' : jetons.bordure}`,
                    background: form.avatar_emoji === emoji ? 'var(--cc-accent-voile)' : jetons.surface,
                    cursor: 'pointer',
                  }}
                >
                  {emoji}
                </button>
              ))}
            </Pile>
          </Pile>

          <Champ
            libelle={`${t('profil.pseudo')} *`}
            value={form.pseudo}
            onChange={e => setForm(f => ({ ...f, pseudo: e.target.value }))}
            placeholder={t('onb.pseudo_place')}
            autoFocus
          />

          <Champ
            libelle={t('profil.emplacement')}
            value={form.emplacement}
            onChange={e => setForm(f => ({ ...f, emplacement: e.target.value }))}
            placeholder={t('onb.emplacement_ph')}
          />

          <Champ
            type="date"
            libelle={t('profil.depart')}
            aide={t('onb.depart_aide')}
            value={form.date_depart}
            min={new Date().toISOString().slice(0, 10)}
            onChange={e => setForm(f => ({ ...f, date_depart: e.target.value }))}
          />

          {/* Règles de la communauté et acceptation des conditions.
              La règle 1.2 de l'App Store impose que ces conditions soient
              présentées AVANT l'inscription et qu'elles annoncent explicitement
              une tolérance zéro. Un simple lien ne suffit pas : la phrase doit
              être lisible à l'écran, c'est ce que vérifie l'examinateur. */}
          <Carte
            hauteur="posee"
            padding={`14px ${espace.lg}px`}
            style={{ background: jetons.alerteFond, border: '1px solid #fed7aa', boxShadow: 'none' }}
          >
            <Texte variante="doux" style={{ fontWeight: graisse.titre, color: jetons.alerte, marginBottom: 6 }}>
              {t('cgu.titre')}
            </Texte>
            <Texte variante="doux" style={{ color: '#7c2d12', lineHeight: 1.55 }}>
              {t('cgu.tolerance')}
            </Texte>
          </Carte>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: espace.sm, cursor: 'pointer' }}>
            <input type="checkbox" required checked={cguAcceptees}
                   onChange={e => setCguAcceptees(e.target.checked)}
                   style={{ marginTop: 2, width: 16, height: 16, flexShrink: 0 }} />
            <Texte variante="doux" as="span">
              {t('cgu.accepte')}{' '}
              <a href="https://www.campconnect.fr/cgu.html" target="_blank" rel="noreferrer"
                 style={{ color: 'var(--cc-accent)', fontWeight: graisse.fort }}>{t('cgu.lien_cgu')}</a>
              {' '}{t('commun.et')}{' '}
              <a href="https://www.campconnect.fr/confidentialite.html" target="_blank" rel="noreferrer"
                 style={{ color: 'var(--cc-accent)', fontWeight: graisse.fort }}>{t('cgu.lien_confid')}</a>.
              {' '}{t('cgu.visibilite')}
            </Texte>
          </label>

          {formError && (
            <Texte variante="doux" role="alert" style={{
              color: jetons.danger, fontWeight: graisse.fort,
              padding: `10px ${espace.md}px`, background: jetons.dangerFond, borderRadius: rayon.sm,
            }}>
              {formError}
            </Texte>
          )}

          <Bouton type="submit" taille="lg" pleineLargeur charge={saving}>
            {saving ? t('onb.enregistrement') : t('onb.cest_parti')}
          </Bouton>
        </form>

        <Bouton variante="discret" pleineLargeur onClick={changerCamping} style={{ marginTop: espace.lg }}>
          {t('onb.changer')}
        </Bouton>
      </Card>
    </Screen>
  )
}

// ─── Composants utilitaires ────────────────────────────────────────────────

function Screen({ bg, clair, children }) {
  return (
    <div style={{
      minHeight: '100dvh',
      // L'écran de démarrage affiche la marque sur le crème de l'application.
      // Enchaîner sur un vert sombre casserait cette continuité au moment
      // précis où l'utilisateur découvre le produit. Le dégradé clair reprend
      // le fond de l'app, à peine réchauffé.
      background: clair
        ? 'linear-gradient(170deg, #faf7f0 0%, #f2efe4 58%, #e9efe1 100%)'
        : `linear-gradient(160deg, ${bg} 0%, #1b4332 100%)`,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center',
      // Surtout pas justify-content: center. Quand le contenu dépasse la
      // hauteur de l'écran — ce que fait le formulaire d'inscription depuis
      // qu'il porte les règles de la communauté — le centrage flex rogne le
      // débordement par le haut, et cette partie devient inatteignable : le
      // logo et le nom du camping disparaissaient sous la barre d'état.
      // Une marge automatique centre quand il y a la place et laisse défiler
      // sinon.
      justifyContent: 'flex-start',
      overflowY: 'auto',
      padding: '24px 20px',
      paddingTop: 'calc(24px + var(--cc-safe-top))',
      paddingBottom: 'calc(24px + var(--cc-safe-bottom))',
    }}>
      <div style={{
        margin: 'auto 0', width: '100%',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        {children}
      </div>
    </div>
  )
}

function Card({ children }) {
  return (
    <Carte
      hauteur="flottante"
      padding="26px 22px"
      style={{
        borderRadius: 22, width: '100%', maxWidth: 380,
        // Sur fond clair, une ombre dense ferait une tache grise. Le liseré
        // teinté détache la carte sans la salir.
        border: '1px solid rgba(47, 74, 38, 0.07)',
      }}
    >
      {children}
    </Carte>
  )
}

function Spinner() {
  return (
    <span
      aria-hidden="true"
      style={{
        width: 14, height: 14, border: `2px solid ${jetons.bordure}`,
        borderTopColor: 'var(--cc-accent)', borderRadius: rayon.rond,
        animation: 'spin 0.7s linear infinite', flexShrink: 0,
      }}
    />
  )
}
