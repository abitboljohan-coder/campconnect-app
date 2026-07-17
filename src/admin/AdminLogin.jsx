import { useState } from 'react'
import { supabase } from '../supabase'
import { isNative, setAppMode } from '../native'

export default function AdminLogin({ onLogin }) {
  const [mode, setMode]         = useState('login') // 'login' | 'signup'
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [nomCamping, setNomCamping] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) {
      setError(authError.message.toLowerCase().includes('confirm')
        ? 'Confirmez votre email (lien reçu par mail) avant de vous connecter.'
        : 'Identifiants incorrects.')
      setLoading(false)
      return
    }

    // Accès gérant = avoir un espace camping, OU en avoir un en attente de création
    const { data: gerant } = await supabase
      .from('gerants')
      .select('id')
      .eq('email', data.session.user.email)
      .maybeSingle()

    if (!gerant && !localStorage.getItem('pendingCamping')) {
      await supabase.auth.signOut()
      setError("Ce compte n'a pas d'espace gérant. Créez-le via « Créer l'espace de mon camping ».")
      setLoading(false)
      return
    }

    onLogin(data.session)
  }

  async function handleSignup(e) {
    e.preventDefault()
    setError('')
    if (!nomCamping.trim()) { setError('Indiquez le nom de votre camping.'); return }
    if (password.length < 8) { setError('Mot de passe : 8 caractères minimum.'); return }
    setLoading(true)

    // Le camping sera créé à la 1re connexion confirmée (via AdminApp)
    localStorage.setItem('pendingCamping', nomCamping.trim())

    // Compte auth (réutilise un compte orphelin, ex: après remise à zéro)
    const { data, error: signErr } = await supabase.auth.signUp({ email, password })
    let session = data?.session
    if (signErr) {
      if (signErr.message.includes('already')) {
        const { data: si, error: siErr } = await supabase.auth.signInWithPassword({ email, password })
        if (siErr) {
          setError(siErr.message.toLowerCase().includes('confirm')
            ? 'Confirmez d’abord votre email (lien reçu par mail), puis connectez-vous.'
            : 'Un compte existe déjà avec cet email (mot de passe différent ?).')
          setLoading(false); return
        }
        session = si.session
      } else {
        localStorage.removeItem('pendingCamping')
        setError(signErr.message); setLoading(false); return
      }
    }

    // Confirmation email active → pas encore de session : on attend la confirmation
    if (!session) {
      setError('Compte créé ✅ Confirmez votre email (lien reçu par mail), puis connectez-vous : votre espace camping sera prêt.')
      setLoading(false); setMode('login'); return
    }

    onLogin(session) // AdminApp crée le camping depuis pendingCamping
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0d1f0d',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '0 20px',
    }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🌲</div>
          <div style={{ color: '#C0DD97', fontSize: 24, fontWeight: 700, letterSpacing: -0.5 }}>CampConnect</div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginTop: 4 }}>Espace gérant</div>
        </div>

        {/* Formulaire */}
        <form onSubmit={mode === 'login' ? handleSubmit : handleSignup}
              style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {mode === 'signup' && (
            <div>
              <label style={labelStyle}>Nom de votre camping</label>
              <input
                type="text"
                value={nomCamping}
                onChange={e => setNomCamping(e.target.value)}
                required
                placeholder="ex: Camping Les Flots Bleus"
                style={inputStyle}
              />
            </div>
          )}
          <div>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
              placeholder="gerant@camping.fr"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder={mode === 'signup' ? '8 caractères minimum' : '••••••••'}
              style={inputStyle}
            />
          </div>

          {error && (
            <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: 14 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '14px', borderRadius: 12,
              background: loading ? '#4a6a20' : '#639922',
              color: '#fff', fontWeight: 700, fontSize: 15,
              marginTop: 4, transition: 'background 0.15s',
            }}
          >
            {loading
              ? (mode === 'login' ? 'Connexion...' : 'Création...')
              : (mode === 'login' ? 'Se connecter' : '🚀 Créer mon espace camping')}
          </button>

          <button
            type="button"
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}
            style={{ background: 'none', border: 'none', color: '#C0DD97', fontSize: 13, cursor: 'pointer', marginTop: 6, textDecoration: 'underline' }}
          >
            {mode === 'login'
              ? "Nouveau ? Créer l'espace de mon camping"
              : 'Déjà un compte ? Se connecter'}
          </button>

          {isNative && (
            <button
              type="button"
              onClick={() => setAppMode('vacancier')}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}
            >
              ← Retour à l'espace vacancier
            </button>
          )}
        </form>
      </div>
    </div>
  )
}

const labelStyle = {
  display: 'block', fontSize: 12, fontWeight: 600,
  color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.6,
}
const inputStyle = {
  width: '100%', padding: '12px 14px', borderRadius: 10,
  border: '1.5px solid rgba(255,255,255,0.12)',
  background: 'rgba(255,255,255,0.07)', color: '#fff',
  fontSize: 15, outline: 'none',
  boxSizing: 'border-box',
}
