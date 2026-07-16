import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { isNative } from './native'

import Onboarding from './pages/Onboarding'
import Accueil from './pages/Accueil'
import Groupes from './pages/Groupes'
import Chat from './pages/Chat'
import Agenda from './pages/Agenda'
import Profil from './pages/Profil'
import Map from './pages/Map'
import Infos from './pages/Infos'
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
  const isDev = !isNative && (window.location.hostname === 'localhost' || window.location.hostname.startsWith('192.168.'))
  return pathMatch?.[1]
    || new URLSearchParams(window.location.search).get('camping')
    || localStorage.getItem('campingSlug')
    || (isDev ? 'demo' : null)
}

function App() {
  const [camping, setCamping] = useState(null)
  const [vacancier, setVacancier] = useState(null)
  const [finSejour, setFinSejour] = useState(null) // vacancier dont le séjour est terminé
  const [loading, setLoading] = useState(true)

  const sejourTermine = v => v?.date_depart && v.date_depart < new Date().toISOString().slice(0, 10)

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
        if (sejourTermine(byDevice)) {
          localStorage.removeItem('vacancier')
          setFinSejour(byDevice)
        } else {
          setVacancier(byDevice)
          localStorage.setItem('vacancier', JSON.stringify(byDevice))
        }
        setLoading(false)
        return
      }

      // 3. Fallback : localStorage (anciens comptes sans device_id)
      const saved = localStorage.getItem('vacancier')
      if (saved) {
        try {
          const v = JSON.parse(saved)
          if (v.camping_id === campingData.id && !sejourTermine(v)) {
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

  if (finSejour) return (
    <FinSejour
      vacancier={finSejour}
      camping={camping}
      onRestart={() => setFinSejour(null)}
    />
  )

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
            <Route path="/infos" element={<Infos camping={camping} />} />
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

function FinSejour({ vacancier, camping, onRestart }) {
  return (
    <div style={{
      minHeight: '100dvh', background: 'linear-gradient(160deg, #0d1f0d 0%, #1b4332 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '24px 20px', textAlign: 'center', fontFamily: 'sans-serif',
    }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>👋</div>
      <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: 0 }}>
        Bon retour, {vacancier.pseudo} !
      </h1>
      <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: 12, fontSize: 15, maxWidth: 320, lineHeight: 1.6 }}>
        Votre séjour {camping ? `au ${camping.nom} ` : ''}est terminé.
        Vos données seront automatiquement supprimées. À l'année prochaine ! 🌲
      </p>
      <button
        onClick={onRestart}
        style={{
          marginTop: 28, padding: '14px 28px', borderRadius: 12, border: 'none',
          background: '#639922', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
        }}
      >
        Je suis de retour au camping 🏕️
      </button>
    </div>
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
