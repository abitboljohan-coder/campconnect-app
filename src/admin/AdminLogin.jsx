import { useState } from 'react'
import { supabase } from '../supabase'

export default function AdminLogin({ onLogin }) {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
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
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
              placeholder="••••••••"
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
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
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
