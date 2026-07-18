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
import Overview from '../admin/pages/Overview'
import { DEMO_CAMPING, DEMO_VACANCIER } from './mockSupabase'

const c = DEMO_CAMPING, v = DEMO_VACANCIER
const s = new URLSearchParams(location.search).get('s') || 'accueil'
const routeFor = { accueil: '/', groupes: '/groupes', map: '/map', agenda: '/agenda', infos: '/infos', chat: '/chat/g1', admin: '/admin/overview' }
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
      </Route>
      <Route path="/chat/:groupeId" element={<Chat vacancier={v} />} />
      <Route element={<AdminLayout gerant={{ nom: 'Gérant démo' }} camping={c} onLogout={() => {}} />}>
        <Route path="/admin/overview" element={<Overview camping={c} />} />
      </Route>
    </Routes>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MemoryRouter initialEntries={[entry]}><DemoApp /></MemoryRouter>
  </StrictMode>,
)
