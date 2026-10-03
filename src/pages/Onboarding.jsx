import { useState, useEffect, useRef } from 'react'
import { supabase, ensureAnonSession } from '../supabase'
import { isNative, setAppMode } from '../native'
import { estAccesLibre, estJoignable, cleDuLien, messageAcces, estRefusDePreuve } from '../lib/acces'
import { SUGGESTIONS_AVATARS } from '../lib/emojis'
import ChoixEmoji from '../components/ChoixEmoji'
import { champsArrivee } from '../lib/profil'
import { lireMonProfil } from '../lib/vacanciers'
import { t, useLangue } from '../i18n'
import {
  Bouton, Carte, Champ, Texte, Pile, appliquerTheme,
  couleur as jetons, espace, graisse, rayon,
} from '../design'

// Le vert profond de l'écran d'entrée : il précède le chargement du camping,
// donc il ne peut pas venir de l'accent — celui-ci n'est pas encore connu.
const TITRE = '#2f4a26'
const SOUS_TITRE = '#6d7964'

const aujourdhui = () => new Date().toISOString().slice(0, 10)

// Clé du QR code de la réception. Sur le web, elle est dans le lien
// (/join/<slug>?k=…). Dans l'app native, le chemin est toujours « / » : le
// deep link passe par native.js, qui la range en localStorage et recharge.
const lireCleQR = () => cleDuLien(window.location.search) || localStorage.getItem('cleQR')

/**
 * Preuve de présence jugée par le serveur (verifier_acces_camping) : QR code,
 * position GPS ou code du jour. Tout se décide là-bas — le code n'est plus
 * calculable dans l'app, et le serveur limite les essais. En cas de succès, il
 * rend un jeton, valable une à deux heures, que l'inscription présente.
 */
async function verifierAcces(slug, preuve) {
  const { data, error } = await supabase.rpc('verifier_acces_camping', { p_slug: slug, p_preuve: preuve })
  if (error || !data) return { ok: false, erreur: 'reseau' }
  return data
}

export default function Onboarding({ initialCamping, onDone }) {
  useLangue()
  const [cleQR, setCleQR] = useState(lireCleQR)
  // L'arrivée par QR passe devant tout le reste, y compris devant un camping
  // que la réception n'a pas fini de configurer — c'est justement elle qui a
  // affiché ce QR. Sa clé est contrôlée sur l'écran de vérification.
  const initialStep = !initialCamping
    ? 'search'
    : estAccesLibre(initialCamping) ? 'form'
    : cleQR ? 'verify'
    : !estJoignable(initialCamping) ? 'pas_pret'
    : 'verify'
  const [step, setStep] = useState(initialStep)
  const [camping, setCamping] = useState(initialCamping)
  // Jeton rendu par le serveur après une vérification réussie.
  const [jeton, setJeton] = useState(null)
  const [qrErreur, setQrErreur] = useState('')

  // L'accent du camping est posé dès qu'il est identifié : l'inscription se
  // fait donc déjà à ses couleurs, avant même d'entrer dans l'application.
  useEffect(() => { appliquerTheme(camping) }, [camping])

  // Recherche de camping
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [ouverture, setOuverture] = useState(null)   // id du camping en cours d'ouverture
  const searchTimeout = useRef(null)

  // Vérification GPS / code
  const [gpsStatus, setGpsStatus] = useState('idle') // idle | checking | ok | fail
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState('')
  const [codeEnCours, setCodeEnCours] = useState(false)

  // Formulaire profil. Avatar vide = pas encore choisi : 🏕️ par défaut, ou
  // celui du profil retrouvé — on ne l'écrase pas avec le choix par défaut.
  const [form, setForm] = useState({ pseudo: '', emplacement: '', avatar_emoji: '', date_depart: '' })
  const [cguAcceptees, setCguAcceptees] = useState(false)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  // Accès accordé : le jeton du serveur accompagnera l'inscription.
  function accesAccorde(j) {
    setJeton(j || null)
    setCodeError('')
    setQrErreur('')
  }

  // Un QR imprimé avant un changement de clé ne vaut plus rien : on le dit,
  // on l'oublie, et l'on passe au GPS — le vacancier est sans doute sur place.
  async function verifierQR() {
    setGpsStatus('checking')
    const r = await verifierAcces(camping.slug, { cle: cleQR })
    if (r.ok) { accesAccorde(r.jeton); setStep('form'); return }
    // Sur une simple panne réseau, la clé reste rangée : rouvrir l'app la
    // réessaiera, sans avoir à rescanner.
    if (r.erreur === 'qr_perime') localStorage.removeItem('cleQR')
    setCleQR(null)
    setQrErreur(t(r.erreur === 'qr_perime' ? 'onb.qr_perime' : 'onb.err_generique'))
    checkGPS()
  }

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
        // Le centre est une donnée du camping : il est enregistré avec le
        // contour, depuis l'administration (Carte, étape 1). Sans lui, le
        // code affiché à la réception prend le relais — ce qu'il sait déjà faire.
        if (!campingLat || !campingLng) {
          setGpsStatus('fail')
          return
        }

        // La distance (moins de 800 m du centre) est jugée par le serveur :
        // calculée ici, elle se contournait en appelant l'API directement.
        const r = await verifierAcces(camping.slug, { lat, lng })
        if (r.ok) {
          accesAccorde(r.jeton)
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

  // À l'arrivée sur 'verify' : la clé du QR d'abord, sinon le GPS. Le code du
  // jour reste en repli. (Le contournement « localhost » d'autrefois a
  // disparu : c'est désormais le serveur qui décide, il ne servirait à rien.)
  useEffect(() => {
    if (step === 'verify' && camping) {
      // Camping de démonstration : ouvrable depuis n'importe où. Couvre le cas
      // où l'on arrive par la recherche plutôt que par un lien /join.
      if (estAccesLibre(camping)) { setStep('form'); return }
      if (cleQR) verifierQR()
      else checkGPS()
    }
  }, [step, camping?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Retour après « Se déconnecter » : la même identité retrouve son profil sur
  // ce camping. Le formulaire est pré-rempli plutôt que de repartir à vide,
  // sans toucher à ce que la personne aurait déjà commencé à saisir.
  useEffect(() => {
    if (step !== 'form' || !camping?.id) return
    let actif = true
    async function preRemplir() {
      await ensureAnonSession()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.id) return
      const { data: v } = await lireMonProfil(camping.id)
      if (!actif || !v) return
      setForm(f => ({
        pseudo: f.pseudo || v.pseudo || '',
        emplacement: f.emplacement || v.emplacement || '',
        avatar_emoji: f.avatar_emoji || v.avatar_emoji || '',
        // Un départ passé (séjour précédent) n'est pas repris : il terminerait
        // aussitôt le nouveau séjour.
        date_depart: f.date_depart || (v.date_depart >= aujourdhui() ? v.date_depart : ''),
      }))
    }
    preRemplir()
    return () => { actif = false }
  }, [step, camping?.id])

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
        // Virgules, parenthèses et guillemets ont un sens dans le filtre de
        // Supabase : « Les Pins, Var » cassait la requête, qui ne renvoyait
        // rien, et l'écran affichait « aucun camping » pour un camping existant.
        const nomQ = q.replace(/[,()"\\]/g, ' ').trim()
        req = req.or(`nom.ilike.%${nomQ}%,slug.ilike.%${slugQ}%`)
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
   * réclamait un code que le visiteur n'a pas. C'est ce qui a bloqué deux fois
   * l'examinateur de l'App Store à la porte de l'application.
   *
   * La ligne complète est donc relue ici, pour ce camping-là seulement, et
   * l'étape n'est choisie qu'ensuite. Décider avant la relecture ferait passer
   * par l'écran GPS le temps que la réponse arrive : sur un réseau lent, on
   * verrait la demande de position, puis le code, puis le formulaire.
   */
  async function selectCamping(c) {
    setOuverture(c.id)
    const { data } = await supabase
      .from('campings').select('*').eq('id', c.id).maybeSingle()
    setOuverture(null)

    // En cas d'échec on garde la version partielle : le contrôle GPS prend le
    // relais, avec le code en secours. Plus strict, jamais bloquant.
    const complet = data || c
    setCamping(complet)
    setGpsStatus('idle')
    // Une clé de QR encore dans l'adresse appartient au camping du lien, pas
    // à celui que l'on vient de choisir dans la liste.
    setCleQR(null)
    setJeton(null)
    setQrErreur('')

    if (estAccesLibre(complet)) { setStep('form'); return }
    // La relecture doit avoir abouti pour conclure qu'un camping n'est pas
    // prêt : sur une lecture ratée, `complet` n'a pas de carte_config du tout
    // et tout camping paraîtrait fermé.
    if (data && !estJoignable(complet)) { setStep('pas_pret'); return }
    setStep('verify')
  }

  // Reset complet : oublie le camping mémorisé pour repartir du choix (change de camping)
  function changerCamping() {
    localStorage.removeItem('campingSlug')
    localStorage.removeItem('vacancier')
    localStorage.removeItem('cleQR')
    setCleQR(null)
    setJeton(null)
    setQrErreur('')
    setCamping(null)
    setQuery('')
    setGpsStatus('idle')
    setStep('search')
  }

  // Le code est vérifié par le serveur, qui accepte aussi celui de l'heure
  // précédente pendant les dix premières minutes (lu à 10 h 58, tapé à
  // 11 h 01) et bloque après dix codes faux dans l'heure.
  async function checkCode() {
    const saisi = code.trim()
    if (saisi.length !== 4 || codeEnCours) { setCodeError(t('onb.code_erreur')); return }
    setCodeEnCours(true)
    const r = await verifierAcces(camping.slug, { code: saisi })
    setCodeEnCours(false)
    if (r.ok) { accesAccorde(r.jeton); setStep('form') }
    else setCodeError(t(messageAcces(r.erreur)))
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
    // Re-séjour avec la même identité (ex: retour l'année suivante, ou après
    // « Se déconnecter ») → le serveur réutilise le profil.
    const { data: existing } = await lireMonProfil(camping.id)

    // Un champ laissé vide n'efface pas le profil retrouvé : le formulaire
    // est vierge si le pré-remplissage n'est pas encore arrivé. (Le serveur
    // applique la même règle de son côté.)
    const profil = {
      ...champsArrivee(form, existing, aujourdhui()),
      device_id: localStorage.getItem('deviceId'),
      cgu: true,
    }

    // L'inscription passe par le serveur, qui exige une preuve de présence
    // (jeton de la vérification, ou accès libre de la démo) : l'insertion
    // directe dans vacanciers permettait d'entrer dans n'importe quel camping.
    const { data: r, error } = await supabase.rpc('rejoindre_camping', {
      p_slug: camping.slug,
      p_preuve: jeton ? { jeton } : {},
      p_profil: profil,
    })
    if (!error && r && !r.ok && estRefusDePreuve(r.erreur)) {
      // Vérification trop ancienne (formulaire laissé ouvert plus d'une heure)
      // ou QR changé entre-temps : on la refait, le formulaire reste rempli.
      setSaving(false)
      setJeton(null)
      setGpsStatus('idle')
      setQrErreur(t(messageAcces(r.erreur)))
      setStep('verify')
      return
    }
    const { data, error: errLecture } = error || !r?.ok ? { data: null } : await lireMonProfil(camping.id)

    if (error || !r?.ok || errLecture || !data) { setFormError(t('onb.err_generique')); setSaving(false); return }
    localStorage.removeItem('cleQR')
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
                  disabled={ouverture === c.id}
                  style={{
                    opacity: ouverture === c.id ? 0.55 : 1,
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

  // ─── CAMPING PAS ENCORE OUVERT ────────────────────────────────────────────
  if (step === 'pas_pret') return (
    <Screen clair>
      <div style={{ textAlign: 'center', marginBottom: 26 }}>
        {camping.logo_url
          ? <img src={camping.logo_url} alt="" style={{ width: 68, height: 68, objectFit: 'contain', borderRadius: 16, marginBottom: 12 }} />
          : <img src="/logo-mark.png" alt="" width={72} height={77} style={{ display: 'block', margin: '0 auto 12px' }} />
        }
        <Texte variante="titre" style={{ fontSize: 23, color: TITRE }}>{camping.nom}</Texte>
      </div>

      <Card>
        <Pile espace="lg">
          <Pile espace="sm" role="status">
            <Texte variante="sousTitre" as="h2">{t('onb.pas_pret_titre')}</Texte>
            <Texte variante="corps">{t('onb.pas_pret_detail')}</Texte>
          </Pile>
          <Bouton pleineLargeur onClick={changerCamping}>{t('onb.changer')}</Bouton>
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
          {qrErreur && (
            <Texte variante="doux" role="alert" style={{
              color: jetons.danger, fontWeight: graisse.fort,
              padding: `10px ${espace.md}px`, background: jetons.dangerFond, borderRadius: rayon.sm,
            }}>
              {qrErreur}
            </Texte>
          )}

          {/* GPS — l'état est annoncé aux lecteurs d'écran, pas seulement teinté. */}
          <Pile espace="xs" role="status" aria-live="polite">
            <Pile direction="ligne" espace="sm" aligner="center">
              <span aria-hidden="true" style={{ fontSize: 20 }}>{cleQR ? '🔳' : '📍'}</span>
              <Texte variante="corps" as="span" style={{ fontWeight: graisse.fort, color: jetons.texte }}>
                {cleQR ? t('onb.qr_verif') : t('onb.verif_gps')}
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
              {gpsStatus === 'checking' && !cleQR && t('onb.gps_en_cours')}
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
                {/* type="text" + inputMode : un champ number ignore maxLength
                    et, sur iOS, n'affiche pas le pavé numérique simple. */}
                <Champ
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="off"
                  libelle={t('onb.code_titre')}
                  value={code}
                  onChange={e => { setCode(e.target.value.replace(/\D/g, '').slice(0, 4)); setCodeError('') }}
                  onKeyDown={e => e.key === 'Enter' && checkCode()}
                  placeholder="_ _ _ _"
                  maxLength={4}
                  erreur={codeError || undefined}
                  style={{ fontSize: 22, textAlign: 'center', letterSpacing: 8, fontWeight: graisse.titre }}
                />
                </div>
                <Bouton taille="lg" onClick={checkCode} charge={codeEnCours} style={{ flexShrink: 0, minHeight: 48 }}>OK</Bouton>
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
          {/* Pseudo d'abord, sans autoFocus : le clavier ne doit pas cacher
              l'écran avant même qu'on l'ait lu. L'avatar tient sur une ligne
              qui défile — la grille de douze faisait déborder le formulaire
              sur deux écrans d'un petit téléphone. */}
          <Champ
            libelle={`${t('profil.pseudo')} *`}
            value={form.pseudo}
            onChange={e => setForm(f => ({ ...f, pseudo: e.target.value }))}
            placeholder={t('onb.pseudo_place')}
            maxLength={40}
          />

          <ChoixEmoji
            libelle={t('onb.avatar')}
            valeur={form.avatar_emoji || '🏕️'}
            suggestions={SUGGESTIONS_AVATARS}
            onChange={avatar_emoji => setForm(f => ({ ...f, avatar_emoji }))}
            uneLigne
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

          {/* Tout le libellé coche la case, et la case fait 22 px : à 16 px,
              on la manquait au doigt. */}
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: espace.md, cursor: 'pointer' }}>
            <input type="checkbox" required checked={cguAcceptees}
                   onChange={e => setCguAcceptees(e.target.checked)}
                   style={{ margin: 0, width: 22, height: 22, flexShrink: 0, accentColor: 'var(--cc-accent)' }} />
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
