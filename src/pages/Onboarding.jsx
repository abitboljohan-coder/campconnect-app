import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'
import { isNative, setAppMode } from '../native'

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
const fromQR = !!window.location.pathname.match(/^\/join\/([^/?#]+)/)

export default function Onboarding({ initialCamping, onDone }) {
  const initialStep = !initialCamping ? 'search' : (fromQR ? 'form' : 'verify')
  const [step, setStep] = useState(initialStep)
  const [camping, setCamping] = useState(initialCamping)
  const couleur = camping?.couleur_principale || '#639922'

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
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const isDev = window.location.hostname === 'localhost' || window.location.hostname.startsWith('192.168.')

  // Lancer la vérif GPS automatiquement à l'arrivée sur 'verify'
  useEffect(() => {
    if (step === 'verify' && camping) {
      if (isDev) { setStep('form'); return } // bypass en dev local
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

        if (!campingLat || !campingLng) {
          // Camping pas encore calibré → on sauvegarde cette position comme centre
          // et on vérifie automatiquement (premier vacancier = calibration)
          await supabase.from('campings').update({
            carte_config: { ...(camping.carte_config || {}), center: { lat, lng } }
          }).eq('id', camping.id)
          setGpsStatus('ok')
          setTimeout(() => setStep('form'), 900)
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

  function selectCamping(c) {
    setCamping(c)
    setStep('verify')
    setGpsStatus('idle')
  }

  function checkCode() {
    if (code.trim() === getHourlyCode(camping.id)) {
      setStep('form')
    } else {
      setCodeError('Code incorrect. Demandez le code du jour à la réception.')
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.pseudo.trim()) { setFormError('Le pseudo est obligatoire.'); return }
    setSaving(true)
    setFormError('')
    const deviceId = localStorage.getItem('deviceId')
    const profil = {
      camping_id: camping.id,
      pseudo: form.pseudo.trim(),
      avatar_emoji: form.avatar_emoji,
      emplacement: form.emplacement.trim() || null,
      date_depart: form.date_depart || null,
      device_id: deviceId,
    }

    // Re-séjour sur le même appareil (ex: retour l'année suivante) → réutiliser le profil
    const { data: existing } = await supabase
      .from('vacanciers').select('id')
      .eq('device_id', deviceId).eq('camping_id', camping.id)
      .maybeSingle()

    const { data, error } = existing
      ? await supabase.from('vacanciers').update(profil).eq('id', existing.id).select().single()
      : await supabase.from('vacanciers').insert(profil).select().single()

    if (error) { setFormError('Erreur. Réessayez.'); setSaving(false); return }
    onDone(camping, data)
  }

  // ─── SEARCH ───────────────────────────────────────────────────────────────
  if (step === 'search') return (
    <Screen bg="#0d1f0d">
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 52, marginBottom: 10 }}>🌲</div>
        <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 700, margin: 0 }}>CampConnect</h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: 8, fontSize: 14 }}>
          Recherchez votre camping pour commencer
        </p>
      </div>

      <Card>
        <label style={labelStyle}>VOTRE CAMPING</label>
        <div style={{ position: 'relative', marginTop: 8 }}>
          <input
            type="text"
            value={query}
            onChange={e => handleQueryChange(e.target.value)}
            placeholder="ex: Camping Les Pins Verts"
            style={{ ...inputStyle, paddingLeft: 40 }}
            autoFocus
          />
          <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', fontSize: 17 }}>🔍</span>
        </div>

        {searching && (
          <div style={{ color: '#9ca3af', fontSize: 13, marginTop: 12, textAlign: 'center' }}>Recherche...</div>
        )}

        {results.length > 0 && (
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {results.map(c => (
              <button
                key={c.id}
                onClick={() => selectCamping(c)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px', borderRadius: 10,
                  border: '1.5px solid #e5e7eb', background: '#fafaf8',
                  cursor: 'pointer', textAlign: 'left', width: '100%',
                  transition: 'border-color 0.15s',
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                  background: c.couleur_principale || '#639922',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18,
                }}>
                  {c.logo_url ? <img src={c.logo_url} style={{ width: 28, height: 28, objectFit: 'contain' }} /> : '🏕️'}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#1f2937' }}>{c.nom}</div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }}>Appuyer pour rejoindre</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {query.length >= 2 && !searching && results.length === 0 && (
          <div style={{ color: '#9ca3af', fontSize: 13, marginTop: 12, textAlign: 'center' }}>
            Aucun camping trouvé. Vérifiez l'orthographe.
          </div>
        )}

        <div style={{ marginTop: 20, padding: '12px 14px', background: '#f5f2eb', borderRadius: 10, fontSize: 12, color: '#6b7280', textAlign: 'center' }}>
          💡 Ou scannez le QR code affiché à la réception de votre camping
        </div>

        {isNative && (
          <button
            onClick={() => setAppMode('gerant')}
            style={{ marginTop: 14, width: '100%', background: 'none', border: 'none', fontSize: 12, color: '#9ca3af', textDecoration: 'underline', cursor: 'pointer' }}
          >
            Je suis gérant de camping
          </button>
        )}
      </Card>
    </Screen>
  )

  // ─── VERIFY ───────────────────────────────────────────────────────────────
  if (step === 'verify') return (
    <Screen bg={couleur}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        {camping.logo_url
          ? <img src={camping.logo_url} style={{ width: 64, height: 64, objectFit: 'contain', marginBottom: 10 }} />
          : <div style={{ fontSize: 52, marginBottom: 10 }}>🌲</div>
        }
        <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: 0 }}>{camping.nom}</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: 6, fontSize: 14 }}>Vérification de votre présence</p>
      </div>

      <Card>
        {/* GPS */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 20 }}>📍</span>
            <span style={{ fontWeight: 600, fontSize: 14, color: '#1f2937' }}>Vérification GPS</span>
            {gpsStatus === 'checking' && <Spinner />}
            {gpsStatus === 'ok' && <span style={{ color: '#16a34a', fontSize: 13, fontWeight: 600 }}>✓ Confirmé</span>}
            {gpsStatus === 'fail' && <span style={{ color: '#dc2626', fontSize: 13 }}>Non disponible</span>}
          </div>
          <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>
            {gpsStatus === 'checking' && 'Localisation en cours...'}
            {gpsStatus === 'ok' && 'Vous êtes bien dans le camping !'}
            {gpsStatus === 'fail' && 'GPS non disponible ou trop loin — utilisez le code ci-dessous.'}
            {gpsStatus === 'idle' && 'Chargement...'}
          </p>
        </div>

        {/* Code */}
        {(gpsStatus === 'fail') && (
          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 18 }}>🔑</span>
              <span style={{ fontWeight: 600, fontSize: 14, color: '#1f2937' }}>Code d'accès du jour</span>
            </div>
            <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 12 }}>
              Affiché à la réception et sur le tableau d'affichage. Change toutes les heures.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="number"
                value={code}
                onChange={e => { setCode(e.target.value); setCodeError('') }}
                placeholder="_ _ _ _"
                maxLength={4}
                style={{ ...inputStyle, flex: 1, fontSize: 22, textAlign: 'center', letterSpacing: 8, fontWeight: 700 }}
                onKeyDown={e => e.key === 'Enter' && checkCode()}
              />
              <button
                onClick={checkCode}
                style={{
                  background: couleur, color: '#fff', padding: '0 18px',
                  borderRadius: 10, fontWeight: 600, fontSize: 14,
                  border: 'none', cursor: 'pointer', flexShrink: 0,
                }}
              >
                OK
              </button>
            </div>
            {codeError && (
              <p style={{ color: '#dc2626', fontSize: 12, marginTop: 8, padding: '8px 10px', background: '#fef2f2', borderRadius: 8 }}>
                {codeError}
              </p>
            )}
          </div>
        )}

        <button
          onClick={() => { setCamping(null); setStep('search') }}
          style={{ marginTop: 20, background: 'none', border: 'none', color: '#9ca3af', fontSize: 13, cursor: 'pointer', width: '100%' }}
        >
          ← Changer de camping
        </button>
      </Card>
    </Screen>
  )

  // ─── FORM ─────────────────────────────────────────────────────────────────
  return (
    <Screen bg={couleur}>
      <div style={{ textAlign: 'center', marginBottom: 32, color: '#fff' }}>
        {camping.logo_url
          ? <img src={camping.logo_url} style={{ width: 60, height: 60, objectFit: 'contain', marginBottom: 10 }} />
          : <div style={{ fontSize: 52, marginBottom: 10 }}>🌲</div>
        }
        <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: 0 }}>{camping.nom}</h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: 6, fontSize: 14 }}>Créez votre profil vacancier</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Avatar */}
          <div>
            <label style={labelStyle}>AVATAR</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              {AVATARS.map(emoji => (
                <button
                  key={emoji} type="button"
                  onClick={() => setForm(f => ({ ...f, avatar_emoji: emoji }))}
                  style={{
                    width: 44, height: 44, fontSize: 24, borderRadius: 10,
                    border: form.avatar_emoji === emoji ? `2px solid ${couleur}` : '2px solid #e5e7eb',
                    background: form.avatar_emoji === emoji ? `${couleur}15` : '#f9fafb',
                    cursor: 'pointer',
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={labelStyle}>PSEUDO *</span>
            <input
              type="text" value={form.pseudo}
              onChange={e => setForm(f => ({ ...f, pseudo: e.target.value }))}
              placeholder="ex: Marie42" style={inputStyle} autoFocus
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={labelStyle}>N° EMPLACEMENT</span>
            <input
              type="text" value={form.emplacement}
              onChange={e => setForm(f => ({ ...f, emplacement: e.target.value }))}
              placeholder="ex: A42 (optionnel)" style={inputStyle}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={labelStyle}>DATE DE DÉPART</span>
            <input
              type="date" value={form.date_depart}
              min={new Date().toISOString().slice(0, 10)}
              onChange={e => setForm(f => ({ ...f, date_depart: e.target.value }))}
              style={inputStyle}
            />
            <span style={{ fontSize: 11, color: '#9ca3af' }}>
              Jusqu'à quand restez-vous ? Modifiable dans votre profil si vous prolongez.
            </span>
          </label>

          {/* Consentement RGPD */}
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>
            <input type="checkbox" required style={{ marginTop: 2, width: 16, height: 16, flexShrink: 0 }} />
            <span>
              J'accepte que mon pseudo, mon avatar et mon emplacement soient visibles
              par les autres vacanciers du camping pendant mon séjour. Mes données sont
              supprimées en fin de saison.{' '}
              <a href="https://www.campconnect.fr/confidentialite.html" target="_blank" rel="noreferrer"
                 style={{ color: '#639922' }}>Politique de confidentialité</a>
            </span>
          </label>

          {formError && (
            <p style={{ color: '#dc2626', fontSize: 13, padding: '10px 12px', background: '#fef2f2', borderRadius: 8 }}>
              {formError}
            </p>
          )}

          <button
            type="submit" disabled={saving}
            style={{
              background: saving ? '#9ca3af' : couleur, color: '#fff',
              padding: '14px', borderRadius: 12, fontSize: 16, fontWeight: 600,
              border: 'none', cursor: saving ? 'default' : 'pointer',
            }}
          >
            {saving ? 'Enregistrement...' : "C'est parti ! 🌿"}
          </button>
        </form>
      </Card>
    </Screen>
  )
}

// ─── Composants utilitaires ────────────────────────────────────────────────

function Screen({ bg, children }) {
  return (
    <div style={{
      minHeight: '100dvh',
      background: `linear-gradient(160deg, ${bg} 0%, #1b4332 100%)`,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px 20px',
    }}>
      {children}
    </div>
  )
}

function Card({ children }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 20, padding: '26px 22px',
      width: '100%', maxWidth: 380,
      boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
    }}>
      {children}
    </div>
  )
}

function Spinner() {
  return (
    <div style={{
      width: 14, height: 14, border: '2px solid #e5e7eb',
      borderTopColor: '#639922', borderRadius: '50%',
      animation: 'spin 0.7s linear infinite', flexShrink: 0,
    }} />
  )
}

const labelStyle = { fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.8 }
const inputStyle = {
  padding: '12px 14px', borderRadius: 10,
  border: '1.5px solid #e5e7eb', fontSize: 16,
  outline: 'none', width: '100%',
}
