import { useState } from 'react'
import { supabase } from '../supabase'
import { isNative, setAppMode } from '../native'

function slugify(nom) {
  return nom.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

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
      setError('Identifiants incorrects.')
      setLoading(false)
      return
    }

    // Vérifier que cet utilisateur est bien un gérant
    const { data: gerant } = await supabase
      .from('gerants')
      .select('id')
      .eq('email', data.session.user.email)
      .single()

    if (!gerant) {
      await supabase.auth.signOut()
      setError("Vous n'avez pas accès au dashboard gérant.")
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

    // 1. Compte auth (réutilise un compte orphelin, ex: après remise à zéro)
    const { data, error: signErr } = await supabase.auth.signUp({ email, password })
    let session = data?.session
    if (signErr) {
      if (signErr.message.includes('already')) {
        const { data: si, error: siErr } = await supabase.auth.signInWithPassword({ email, password })
        if (siErr) { setError('Un compte existe déjà avec cet email (mot de passe différent ?).'); setLoading(false); return }
        session = si.session
      } else {
        setError(signErr.message); setLoading(false); return
      }
    }
    if (!session) {
      setError('Vérifiez votre boîte mail pour confirmer votre compte, puis connectez-vous.')
      setLoading(false); setMode('login'); return
    }

    // Ce compte gère-t-il déjà un camping ? (contrainte 1 compte = 1 camping)
    const { data: dejaGerant } = await supabase.from('gerants').select('id').eq('user_id', session.user.id).maybeSingle()
    if (dejaGerant) { setError('Ce compte gère déjà un camping.'); setLoading(false); return }

    // 2. Camping (slug unique)
    let slug = slugify(nomCamping)
    const { data: existing } = await supabase.from('campings').select('id').eq('slug', slug).maybeSingle()
    if (existing) slug = `${slug}-${Math.floor(Math.random() * 900 + 100)}`

    const { data: newCamping, error: campErr } = await supabase.from('campings')
      .insert({ nom: nomCamping.trim(), slug }).select().single()
    if (campErr) { setError('Erreur création camping : ' + campErr.message); setLoading(false); return }

    // 3. Lien gérant
    const { error: gerErr } = await supabase.from('gerants')
      .insert({ user_id: session.user.id, camping_id: newCamping.id, email })
    if (gerErr) { setError('Erreur : ' + gerErr.message); setLoading(false); return }

    onLogin(session)
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
