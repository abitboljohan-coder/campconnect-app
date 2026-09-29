import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import '../index.css'
import Layout from '../components/Layout'
import AdminLayout from '../admin/AdminLayout'
import Accueil from '../pages/Accueil'
import Groupes from '../pages/Groupes'
import MapPage from '../pages/Map'
import Agenda from '../pages/Agenda'
import Chat from '../pages/Chat'
import Infos from '../pages/Infos'
import Profil from '../pages/Profil'
import Overview from '../admin/pages/Overview'
import AnimationsAdmin from '../admin/pages/Animations'
import Signalements from '../admin/pages/Signalements'
import Moderation from '../admin/pages/Moderation'
import Parametres from '../admin/pages/Parametres'
import Stats from '../admin/pages/Stats'
import Onboarding from '../pages/Onboarding'
import { DEMO_CAMPING, DEMO_VACANCIER } from './mockSupabase'
import { ToastHost } from '../components/Toast'
import { appliquerTheme } from '../design'

const c = DEMO_CAMPING, v = DEMO_VACANCIER
appliquerTheme(c)
const s = new URLSearchParams(location.search).get('s') || 'accueil'
const routeFor = { accueil: '/', groupes: '/groupes', map: '/map', agenda: '/agenda', infos: '/infos', profil: '/profil', chat: '/chat/g1', admin: '/admin/overview', onboarding: '/onboarding',
  'admin-animations': '/admin/animations', 'admin-signalements': '/admin/signalements',
  'admin-moderation': '/admin/moderation', 'admin-parametres': '/admin/parametres', 'admin-stats': '/admin/stats' }
const entry = routeFor[s] || '/'

function DemoApp() {
  return (
    <Routes>
      <Route element={<Layout camping={c} />}>
        <Route path="/" element={<Accueil camping={c} vacancier={v} />} />
        <Route path="/groupes" element={<Groupes camping={c} vacancier={v} />} />
        <Route path="/map" element={<MapPage camping={c} vacancier={v} />} />
        <Route path="/agenda" element={<Agenda camping={c} vacancier={v} />} />
        <Route path="/infos" element={<Infos camping={c} />} />
        <Route path="/profil" element={<Profil camping={c} vacancier={v} onLogout={() => {}} />} />
      </Route>
      <Route path="/chat/:groupeId" element={<Chat camping={c} vacancier={v} />} />
      <Route path="/onboarding" element={<Onboarding initialCamping={c} onDone={() => {}} />} />
      <Route element={<AdminLayout gerant={{ nom: 'Gérant démo' }} camping={c} onLogout={() => {}} />}>
        <Route path="/admin/overview" element={<Overview camping={c} />} />
        <Route path="/admin/animations" element={<AnimationsAdmin camping={c} />} />
        <Route path="/admin/signalements" element={<Signalements camping={c} />} />
        <Route path="/admin/moderation" element={<Moderation camping={c} />} />
        <Route path="/admin/parametres" element={<Parametres camping={c} session={{ user: { email: 'gerant@flotsbleus.fr' } }} />} />
        <Route path="/admin/stats" element={<Stats camping={c} />} />
      </Route>
    </Routes>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MemoryRouter initialEntries={entry === '/' ? ['/'] : ['/', entry]} initialIndex={entry === '/' ? 0 : 1}><DemoApp /></MemoryRouter>
    <ToastHost />
  </StrictMode>,
)
