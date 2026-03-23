import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './supabase'

import Onboarding from './pages/Onboarding'
import Accueil from './pages/Accueil'
import Groupes from './pages/Groupes'
import Chat from './pages/Chat'
import Agenda from './pages/Agenda'
import Profil from './pages/Profil'
import Map from './pages/Map'
import Layout from './components/Layout'

// Génère un identifiant unique et permanent pour cet appareil
function getDeviceId() {
  let id = localStorage.getItem('deviceId')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('deviceId', id)
  }
  return id
}

function getCampingSlug() {
  const pathMatch = window.location.pathname.match(/^\/join\/([^/?#]+)/)
  const isDev = window.location.hostname === 'localhost' || window.location.hostname.startsWith('192.168.')
  return pathMatch?.[1]
    || new URLSearchParams(window.location.search).get('camping')
    || localStorage.getItem('campingSlug')
    || (isDev ? 'demo' : null)
}

function App() {
  const [camping, setCamping] = useState(null)
  const [vacancier, setVacancier] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const deviceId = getDeviceId()
    const slug = getCampingSlug()

    async function init() {
      if (!slug) { setLoading(false); return }

      // 1. Charger le camping
      const { data: campingData } = await supabase
        .from('campings').select('*').eq('slug', slug).single()

      if (!campingData) { setLoading(false); return }

      setCamping(campingData)
      localStorage.setItem('campingSlug', campingData.slug)

      // 2. Récupérer le vacancier par deviceId (même si localStorage effacé)
      const { data: byDevice } = await supabase
        .from('vacanciers')
        .select('*')
        .eq('device_id', deviceId)
        .eq('camping_id', campingData.id)
        .maybeSingle()

      if (byDevice) {
        setVacancier(byDevice)
        localStorage.setItem('vacancier', JSON.stringify(byDevice))
        setLoading(false)
        return
      }

      // 3. Fallback : localStorage (anciens comptes sans device_id)
      const saved = localStorage.getItem('vacancier')
      if (saved) {
        try {
          const v = JSON.parse(saved)
          if (v.camping_id === campingData.id) {
            setVacancier(v)
            // Migrer : sauvegarder le device_id pour cet ancien compte
            supabase.from('vacanciers').update({ device_id: deviceId }).eq('id', v.id)
          }
        } catch {}
      }

      setLoading(false)
    }

    init()

    // Rafraîchir camping sur focus (mises à jour admin en temps réel)
    const onFocus = () => {
      const s = localStorage.getItem('campingSlug')
      if (s) supabase.from('campings').select('*').eq('slug', s).single()
        .then(({ data }) => { if (data) setCamping(data) })
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  if (loading) return <Splash />

  return (
    <BrowserRouter>
      <Routes>
        {!camping || !vacancier ? (
          <Route path="*" element={
            <Onboarding
              initialCamping={camping}
              onDone={(c, v) => {
                setCamping(c)
                setVacancier(v)
                localStorage.setItem('campingSlug', c.slug)
                localStorage.setItem('vacancier', JSON.stringify(v))
              }}
            />
          } />
        ) : (
          <Route element={<Layout camping={camping} />}>
            <Route path="/" element={<Accueil camping={camping} vacancier={vacancier} />} />
            <Route path="/groupes" element={<Groupes camping={camping} vacancier={vacancier} />} />
            <Route path="/chat/:groupeId" element={<Chat vacancier={vacancier} />} />
            <Route path="/map" element={<Map camping={camping} vacancier={vacancier} />} />
            <Route path="/agenda" element={<Agenda camping={camping} vacancier={vacancier} />} />
            <Route path="/profil" element={
              <Profil camping={camping} vacancier={vacancier} onLogout={() => {
                localStorage.removeItem('vacancier')
                localStorage.removeItem('campingSlug')
                setVacancier(null)
                setCamping(null)
              }} />
            } />
            <Route path="*" element={<Navigate to="/" />} />
          </Route>
        )}
      </Routes>
    </BrowserRouter>
  )
}

function Splash() {
  return (
    <div style={{ minHeight: '100vh', background: '#0d1f0d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#97C459', fontFamily: 'sans-serif', fontSize: 18 }}>🌲 Chargement...</div>
    </div>
  )
}

export default App
