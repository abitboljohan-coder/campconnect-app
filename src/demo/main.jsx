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
import Apparence from '../admin/pages/Apparence'
import InfosAdmin from '../admin/pages/Infos'
import CarteAdmin from '../admin/pages/Carte'
import Annonces from '../pages/Annonces'
import Signaler from '../pages/Signaler'
import AdminLogin from '../admin/AdminLogin'
import Onboarding from '../pages/Onboarding'
import MiniFiche from '../components/MiniFiche'
import { DEMO_CAMPING, DEMO_VACANCIER } from './mockSupabase'
import { ToastHost } from '../components/Toast'
import { appliquerTheme } from '../design'

const params = new URLSearchParams(location.search)
// ?accent=e8590c : la démo aux couleurs d'un autre camping (profil, paysage).
const accent = /^[0-9a-f]{6}$/i.test(params.get('accent') || '') ? `#${params.get('accent')}` : null
const c = accent ? { ...DEMO_CAMPING, couleur_principale: accent } : DEMO_CAMPING
const v = params.get('profil') === 'vide'
  ? { ...DEMO_VACANCIER, interests: [], avec: null, tranche_age: null }
  : DEMO_VACANCIER
appliquerTheme(c)
const s = params.get('s') || 'accueil'
const routeFor = { minifiche: '/chat/g1', accueil: '/', groupes: '/groupes', map: '/map', agenda: '/agenda', infos: '/infos', profil: '/profil', chat: '/chat/g1', admin: '/admin/overview', onboarding: '/onboarding',
  'admin-animations': '/admin/animations', 'admin-signalements': '/admin/signalements',
  'admin-moderation': '/admin/moderation', 'admin-parametres': '/admin/parametres', 'admin-stats': '/admin/stats',
  'admin-apparence': '/admin/apparence', 'admin-infos': '/admin/infos', 'admin-carte': '/admin/carte',
  annonces: '/annonces', signaler: '/signaler', 'admin-login': '/admin-login' }
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
        <Route path="/annonces" element={<Annonces camping={c} vacancier={v} />} />
        <Route path="/signaler" element={<Signaler camping={c} vacancier={v} />} />
        <Route path="/profil" element={<Profil camping={c} vacancier={v} onLogout={() => {}} />} />
      </Route>
      <Route path="/chat/:groupeId" element={<Chat camping={c} vacancier={v} />} />
      <Route path="/admin-login" element={<AdminLogin onLogin={() => {}} />} />
      <Route path="/onboarding" element={<Onboarding initialCamping={c} onDone={() => {}} />} />
      <Route element={<AdminLayout gerant={{ nom: 'Gérant démo' }} camping={c} onLogout={() => {}} />}>
        <Route path="/admin/overview" element={<Overview camping={c} />} />
        <Route path="/admin/animations" element={<AnimationsAdmin camping={c} />} />
        <Route path="/admin/signalements" element={<Signalements camping={c} />} />
        <Route path="/admin/moderation" element={<Moderation camping={c} />} />
        <Route path="/admin/parametres" element={<Parametres camping={c} session={{ user: { email: 'gerant@flotsbleus.fr' } }} />} />
        <Route path="/admin/stats" element={<Stats camping={c} />} />
        <Route path="/admin/apparence" element={<Apparence camping={c} setCamping={() => {}} />} />
        <Route path="/admin/infos" element={<InfosAdmin camping={c} setCamping={() => {}} />} />
        <Route path="/admin/carte" element={<CarteAdmin camping={c} setCamping={() => {}} />} />
      </Route>
    </Routes>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MemoryRouter initialEntries={entry === '/' ? ['/'] : ['/', entry]} initialIndex={entry === '/' ? 0 : 1}>
      <DemoApp />
      {/* ?s=minifiche : la mini-fiche de Léa ouverte sur le chat, comme après
          un appui sur son avatar. */}
      {s === 'minifiche' && (
        <MiniFiche id="vac-5" apercu={{ pseudo: 'Léa', avatar_emoji: '🏊‍♀️' }} camping={c} vacancier={v}
                   contexte={{ type: 'message', id: 'm3', texte: 'Génial, à tout à l’heure !', auteurId: 'vac-5', pseudo: 'Léa' }}
                   onClose={() => {}} />
      )}
    </MemoryRouter>
    <ToastHost />
  </StrictMode>,
)
