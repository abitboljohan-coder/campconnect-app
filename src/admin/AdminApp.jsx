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
import Parametres from './pages/Parametres'

export default function AdminApp() {
  const [session, setSession] = useState(null)
  const [gerant, setGerant]   = useState(null)
  const [camping, setCamping] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (s) {
        setSession(s)
        loadGerant(s.user.email)
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

  async function loadGerant(userEmail) {
    const { data: ger } = await supabase
      .from('gerants')
      .select('*, campings(*)')
      .eq('email', userEmail)
      .single()

    if (ger) {
      setGerant(ger)
      setCamping(ger.campings)
    }
    setLoading(false)
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
            <AdminLogin onLogin={(s) => { setSession(s); loadGerant(s.user.email) }} />
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
            <Route path="/admin/stats" element={<Stats camping={camping} />} />
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
