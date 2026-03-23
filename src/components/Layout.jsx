import { Outlet, NavLink, useLocation } from 'react-router-dom'

const NAV = [
  { to: '/', label: 'Accueil', icon: '🏕️' },
  { to: '/groupes', label: 'Groupes', icon: '👥' },
  { to: '/map', label: 'Carte', icon: '🗺️' },
  { to: '/agenda', label: 'Agenda', icon: '📅' },
  { to: '/profil', label: 'Profil', icon: '👤' },
]

export default function Layout({ camping }) {
  const couleur = camping?.couleur_principale || '#639922'
  const location = useLocation()
  const hideNav = location.pathname.startsWith('/chat/')
  const isMap   = location.pathname === '/map'

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: '#f5f2eb' }}>
      {/* Header sombre */}
      {!hideNav && !isMap && (
        <header style={{
          background: '#0d1f0d',
          color: '#fff',
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
        }}>
          {camping?.logo_url && (
            <img src={camping.logo_url} alt="" style={{ height: 30, borderRadius: 6, objectFit: 'contain' }} />
          )}
          <div>
            <div style={{
              fontWeight: 700,
              fontSize: 18,
              color: couleur,
              lineHeight: 1.2,
              letterSpacing: '-0.3px',
            }}>
              {camping?.nom || 'CampConnect'}
            </div>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: 20 }}>🌲</div>
        </header>
      )}

      {/* Contenu */}
      <main style={{ flex: 1, overflowY: isMap ? 'hidden' : 'auto', paddingBottom: hideNav || isMap ? 0 : 72, position: 'relative' }}>
        <Outlet />
      </main>

      {/* Bottom nav */}
      {!hideNav && (
        <nav style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: '#fff',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          height: 64,
          paddingBottom: 'env(safe-area-inset-bottom)',
          zIndex: 100,
          boxShadow: '0 -2px 12px rgba(0,0,0,0.06)',
        }}>
          {NAV.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              style={({ isActive }) => ({
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
                color: isActive ? couleur : '#9ca3af',
                fontSize: 11,
                fontWeight: isActive ? 700 : 400,
                gap: 2,
                transition: 'color 0.15s',
              })}
            >
              <span style={{ fontSize: 22 }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  )
}
