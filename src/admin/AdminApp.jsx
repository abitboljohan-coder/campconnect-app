import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from '../supabase'
import AdminLogin from './AdminLogin'
import AdminLayout from './AdminLayout'
import Overview from './pages/Overview'
import Apparence from './pages/Apparence'
import Animations from './pages/Animations'
import Carte from './pages/Carte'
import Stats from './pages/Stats'
import Moderation from './pages/Moderation'
import Parametres from './pages/Parametres'
import InfosAdmin from './pages/Infos'

function slugify(nom) {
  return nom.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

export default function AdminApp() {
  const [session, setSession] = useState(null)
  const [gerant, setGerant]   = useState(null)
  const [camping, setCamping] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (s) {
        setSession(s)
        loadGerant(s)
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      if (!s) { setGerant(null); setCamping(null); setLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function loadGerant(s) {
    const { data: ger } = await supabase
      .from('gerants')
      .select('*, campings(*)')
      .eq('user_id', s.user.id)
      .maybeSingle()

    if (ger) {
      setGerant(ger)
      setCamping(ger.campings)
      setLoading(false)
      return
    }

    // Pas encore de gérant : créer le camping mémorisé au signup (1re connexion confirmée)
    const pending = localStorage.getItem('pendingCamping')
    if (pending) {
      const res = await createCamping(s, pending)
      if (res) {
        setGerant(res.gerant)
        setCamping(res.gerant.campings)
        localStorage.removeItem('pendingCamping')
      }
    }
    setLoading(false)
  }

  async function createCamping(s, nom) {
    let slug = slugify(nom)
    const { data: exists } = await supabase.from('campings').select('id').eq('slug', slug).maybeSingle()
    if (exists) slug = `${slug}-${Math.floor(Math.random() * 900 + 100)}`

    const { data: camping, error: e1 } = await supabase.from('campings')
      .insert({ nom: nom.trim(), slug }).select().single()
    if (e1) return null

    const { data: gerant, error: e2 } = await supabase.from('gerants')
      .insert({ user_id: s.user.id, camping_id: camping.id, email: s.user.email })
      .select('*, campings(*)').single()
    if (e2) return null

    return { gerant }
  }

  async function logout() {
    await supabase.auth.signOut()
    setGerant(null)
    setCamping(null)
  }

  if (loading) return (
    <div style={{
      minHeight: '100vh', background: '#0d1f0d',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ color: '#97C459', fontSize: 18 }}>🌲 Chargement...</div>
    </div>
  )

  return (
    <BrowserRouter>
      <Routes>
        {!session || !gerant ? (
          <Route path="*" element={
            <AdminLogin onLogin={(s) => { setSession(s); setLoading(true); loadGerant(s) }} />
          } />
        ) : (
          <Route element={<AdminLayout gerant={gerant} camping={camping} onLogout={logout} />}>
            <Route path="/admin" element={<Navigate to="/admin/overview" replace />} />
            <Route path="/admin/overview" element={<Overview camping={camping} />} />
            <Route path="/admin/apparence" element={
              <Apparence camping={camping} setCamping={setCamping} />
            } />
            <Route path="/admin/animations" element={<Animations camping={camping} />} />
            <Route path="/admin/carte" element={<Carte camping={camping} setCamping={setCamping} />} />
            <Route path="/admin/infos" element={<InfosAdmin camping={camping} setCamping={setCamping} />} />
            <Route path="/admin/stats" element={<Stats camping={camping} />} />
            <Route path="/admin/moderation" element={<Moderation camping={camping} />} />
            <Route path="/admin/parametres" element={
              <Parametres gerant={gerant} camping={camping} session={session} />
            } />
            <Route path="*" element={<Navigate to="/admin/overview" replace />} />
          </Route>
        )}
      </Routes>
    </BrowserRouter>
  )
}
