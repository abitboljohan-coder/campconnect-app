import { useState } from 'react'
import { supabase } from '../supabase'
import { isNative, setAppMode } from '../native'
import { couleur as jetons } from '../design'
import { traduireErreur } from './lib/erreurs'

// Lien du mail « mot de passe oublié ». Dans l'app native, l'origine vaut
// capacitor://localhost, qu'un navigateur ne sait pas ouvrir : domaine public.
const URL_ADMIN = isNative ? 'https://app.campconnect.fr/admin' : `${window.location.origin}/admin`

export default function AdminLogin({ onLogin, erreurInitiale = '' }) {
  const [mode, setMode]         = useState('login') // 'login' | 'signup'
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [nomCamping, setNomCamping] = useState('')
  const [error, setError]       = useState(erreurInitiale)
  // Message de réussite, affiché en vert : « Compte créé » sortait dans
  // l'encadré rouge des erreurs.
  const [info, setInfo]         = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setInfo('')
    setLoading(true)

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) {
      setError(traduireErreur(authError, 'Connexion impossible. Vérifiez votre email et votre mot de passe.'))
      setLoading(false)
      return
    }

    // Accès gérant = avoir un espace camping, OU en avoir un en attente de création
    const { data: gerant } = await supabase
      .from('gerants')
      .select('id')
      .eq('email', data.session.user.email)
      .maybeSingle()

    // Le nom du camping voyage aussi dans le compte (user_metadata) : un gérant
    // inscrit sur son téléphone peut se connecter la première fois ailleurs.
    const enAttente = localStorage.getItem('pendingCamping') || data.session.user.user_metadata?.nom_camping
    if (!gerant && !enAttente) {
      await supabase.auth.signOut()
      setError("Ce compte n'a pas d'espace gérant. Créez-le via « Créer l'espace de mon camping ».")
      setLoading(false)
      return
    }

    onLogin(data.session)
  }

  async function handleSignup(e) {
    e.preventDefault()
    setError(''); setInfo('')
    if (!nomCamping.trim()) { setError('Indiquez le nom de votre camping.'); return }
    if (password.length < 8) { setError('Mot de passe : 8 caractères minimum.'); return }
    setLoading(true)

    // Le camping sera créé à la 1re connexion confirmée (via AdminApp)
    localStorage.setItem('pendingCamping', nomCamping.trim())

    // Compte auth (réutilise un compte orphelin, ex: après remise à zéro)
    // Le nom est aussi rangé dans le compte : localStorage ne vaut que pour
    // cet appareil, et la confirmation de l'email se fait souvent sur un autre.
    const { data, error: signErr } = await supabase.auth.signUp({
      email, password, options: { data: { nom_camping: nomCamping.trim() } },
    })
    let session = data?.session
    if (signErr) {
      if (/already/i.test(signErr.message)) {
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
        setError(traduireErreur(signErr, 'Création du compte impossible. Vérifiez la connexion et réessayez.')); setLoading(false); return
      }
    }

    // Confirmation email active → pas encore de session : on attend la confirmation
    if (!session) {
      setInfo('Compte créé ✅ Confirmez votre email (lien reçu par mail), puis connectez-vous : votre espace camping sera prêt.')
      setLoading(false); setMode('login'); return
    }

    onLogin(session) // AdminApp crée le camping depuis pendingCamping
  }

  async function motDePasseOublie() {
    setError(''); setInfo('')
    if (!email.trim()) { setError('Indiquez votre email ci-dessus, puis touchez « Mot de passe oublié ? ».'); return }
    setLoading(true)
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: URL_ADMIN })
    setLoading(false)
    if (err) { setError(traduireErreur(err, "L'email n'a pas pu être envoyé. Vérifiez la connexion et réessayez.")); return }
    // Même message que le compte existe ou non : ne pas révéler quelles
    // adresses sont inscrites.
    setInfo('Si un compte existe pour cette adresse, un email vient de vous être envoyé. Son lien vous connecte directement : choisissez ensuite un nouveau mot de passe dans Paramètres.')
  }

  return (
    <div style={{
      minHeight: '100dvh', background: jetons.marqueSombre,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '0 20px',
    }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        {/* Marque — le vrai logo, comme sur l'écran d'entrée du vacancier.
            La plaque claire lui rend son contraste : sur le vert sombre, la
            tente et le sol du logo, eux-mêmes vert foncé, disparaîtraient. */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <span style={{
            width: 84, height: 84, borderRadius: 22,
            background: jetons.fondClair, margin: '0 auto 14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <img src="/logo-mark.png" alt="" width={60} height={64}
                 style={{ display: 'block', objectFit: 'contain' }} />
          </span>
          <div style={{ color: '#C0DD97', fontSize: 24, fontWeight: 700, letterSpacing: -0.5 }}>CampConnect</div>
          <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, marginTop: 4 }}>Espace gérant</div>
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
            <div role="alert" style={{ background: jetons.dangerFond, color: jetons.danger, padding: '10px 14px', borderRadius: 8, fontSize: 14 }}>
              {error}
            </div>
          )}
          {info && (
            <div role="status" style={{ background: '#f0fdf4', color: jetons.succes, padding: '10px 14px', borderRadius: 8, fontSize: 14 }}>
              {info}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '14px', borderRadius: 12,
              background: loading ? '#4a6a20' : jetons.marque,
              color: '#fff', fontWeight: 700, fontSize: 15,
              marginTop: 4, transition: 'background 0.15s',
            }}
          >
            {loading
              ? (mode === 'login' ? 'Connexion...' : 'Création...')
              : (mode === 'login' ? 'Se connecter' : '🚀 Créer mon espace camping')}
          </button>

          {mode === 'login' && (
            <button
              type="button"
              onClick={motDePasseOublie}
              disabled={loading}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: 13, cursor: 'pointer', minHeight: 44, textDecoration: 'underline' }}
            >
              Mot de passe oublié ?
            </button>
          )}

          <button
            type="button"
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setInfo('') }}
            style={{ background: 'none', border: 'none', color: '#C0DD97', fontSize: 13, cursor: 'pointer', minHeight: 44, textDecoration: 'underline' }}
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
  fontSize: 16, outline: 'none',
  boxSizing: 'border-box',
}
