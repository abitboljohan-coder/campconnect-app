import { useEffect, useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'

const NAV_ITEMS = [
  { path: '/admin/overview',    icon: '🏠', label: 'Accueil' },
  { path: '/admin/animations',  icon: '📅', label: 'Animations' },
  { path: '/admin/carte',       icon: '🗺️', label: 'Carte' },
  { path: '/admin/apparence',   icon: '🎨', label: 'Apparence' },
  { path: '/admin/stats',       icon: '📊', label: 'Stats' },
  { path: '/admin/moderation',  icon: '🛡️', label: 'Modération' },
  { path: '/admin/parametres',  icon: '⚙️', label: 'Paramètres' },
]

export default function AdminLayout({ gerant, camping, onLogout }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const navigate = useNavigate()

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  const sidebarW = 220

  return (
    <div style={{ minHeight: '100vh', background: '#f5f2eb', display: 'flex' }}>

      {/* Sidebar desktop */}
      {!isMobile && (
        <aside style={{
          width: sidebarW, background: '#0d1f0d',
          display: 'flex', flexDirection: 'column',
          position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100,
        }}>
          {/* Logo */}
          <div style={{ padding: '28px 20px 20px' }}>
            <div style={{ color: '#C0DD97', fontWeight: 700, fontSize: 18 }}>🌲 CampConnect</div>
            <div style={{ color: 'rgba(192,221,151,0.5)', fontSize: 12, marginTop: 4 }}>{camping?.nom}</div>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: '0 12px' }}>
            {NAV_ITEMS.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 10, marginBottom: 2,
                  color: isActive ? '#0d1f0d' : '#C0DD97',
                  background: isActive ? '#C0DD97' : 'transparent',
                  fontWeight: isActive ? 600 : 400,
                  fontSize: 14, textDecoration: 'none',
                  transition: 'all 0.15s',
                })}
              >
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Gérant + logout */}
          <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ color: 'rgba(192,221,151,0.6)', fontSize: 12, marginBottom: 12 }}>
              {gerant?.nom || 'Gérant'}
            </div>
            <button
              onClick={onLogout}
              style={{
                width: '100%', padding: '9px', borderRadius: 8,
                background: 'rgba(220,38,38,0.15)', color: '#fca5a5',
                fontSize: 13, fontWeight: 600, border: '1px solid rgba(220,38,38,0.2)',
              }}
            >
              Se déconnecter
            </button>
          </div>
        </aside>
      )}

      {/* Contenu principal */}
      <div style={{ flex: 1, marginLeft: isMobile ? 0 : sidebarW, paddingBottom: isMobile ? 70 : 0 }}>

        {/* Header mobile */}
        {isMobile && (
          <div style={{
            background: '#0d1f0d', padding: '14px 16px',
            paddingTop: 'calc(14px + env(safe-area-inset-top))',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            position: 'sticky', top: 0, zIndex: 50,
          }}>
            <div>
              <div style={{ color: '#C0DD97', fontWeight: 700, fontSize: 16 }}>🌲 CampConnect</div>
              <div style={{ color: 'rgba(192,221,151,0.5)', fontSize: 11 }}>{camping?.nom}</div>
            </div>
            <button onClick={onLogout} style={{ color: '#fca5a5', fontSize: 13, fontWeight: 600 }}>
              Déco.
            </button>
          </div>
        )}

        {/* Header desktop */}
        {!isMobile && (
          <div style={{
            background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.07)',
            padding: '14px 28px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ fontSize: 14, color: '#6b7280' }}>
              Connecté en tant que <strong style={{ color: '#1a1a1a' }}>{gerant?.nom || 'Gérant'}</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#639922' }}>{camping?.nom}</div>
              <button
                onClick={onLogout}
                style={{
                  padding: '6px 14px', borderRadius: 8,
                  background: '#fef2f2', color: '#dc2626',
                  fontSize: 13, fontWeight: 600, border: '1px solid #fecaca',
                }}
              >
                Se déconnecter
              </button>
            </div>
          </div>
        )}

        {/* Page content */}
        <main style={{ padding: isMobile ? '20px 16px' : '28px', maxWidth: 1100, margin: '0 auto' }}>
          <Outlet />
        </main>
      </div>

      {/* Bottom nav mobile */}
      {isMobile && (
        <nav style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: '#0d1f0d', borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', zIndex: 100,
          paddingBottom: 'env(safe-area-inset-bottom)',
          height: 56,
        }}>
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                textDecoration: 'none',
                color: isActive ? '#C0DD97' : 'rgba(192,221,151,0.35)',
                fontSize: 24,
              })}
            >
              {item.icon}
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  )
}
