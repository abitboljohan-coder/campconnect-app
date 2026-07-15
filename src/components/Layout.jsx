import { Outlet, NavLink, useLocation, Link } from 'react-router-dom'

const NAV = [
  { to: '/', label: 'Accueil', icon: '🏕️' },
  { to: '/groupes', label: 'Groupes', icon: '👥' },
  { to: '/map', label: 'Carte', icon: '🗺️' },
  { to: '/agenda', label: 'Agenda', icon: '📅' },
  { to: '/infos', label: 'Infos', icon: 'ℹ️' },
]

export default function Layout({ camping }) {
  const couleur = camping?.couleur_principale || '#639922'
  const location = useLocation()
  const hideNav = location.pathname.startsWith('/chat/')
  const isMap   = location.pathname === '/map'

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: '#faf7f0' }}>
      {/* Header clair estival */}
      {!hideNav && !isMap && (
        <header style={{
          background: 'rgba(250,247,240,0.92)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          position: 'sticky',
          top: 0,
          zIndex: 100,
          borderBottom: '1px solid rgba(0,0,0,0.05)',
        }}>
          {camping?.logo_url
            ? <img src={camping.logo_url} alt="" style={{ height: 34, width: 34, borderRadius: 10, objectFit: 'cover' }} />
            : <div style={{
                width: 34, height: 34, borderRadius: 10, background: `${couleur}22`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
              }}>⛺</div>
          }
          <div style={{
            fontWeight: 800,
            fontSize: 17,
            color: '#1a1a1a',
            lineHeight: 1.2,
            letterSpacing: '-0.3px',
          }}>
            {camping?.nom || 'CampConnect'}
          </div>
          <Link to="/profil" style={{
            marginLeft: 'auto', textDecoration: 'none',
            width: 36, height: 36, borderRadius: '50%',
            background: `${couleur}18`, border: `2px solid ${couleur}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
          }}>👤</Link>
        </header>
      )}

      {/* Contenu */}
      <main style={{ flex: 1, overflowY: isMap ? 'hidden' : 'auto', paddingBottom: hideNav || isMap ? 0 : 88, position: 'relative' }}>
        <Outlet />
      </main>

      {/* Bottom nav flottante */}
      {!hideNav && (
        <nav style={{
          position: 'fixed',
          bottom: 12,
          left: 12,
          right: 12,
          maxWidth: 500,
          margin: '0 auto',
          background: 'rgba(255,255,255,0.94)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderRadius: 24,
          display: 'flex',
          height: 64,
          paddingBottom: 'env(safe-area-inset-bottom)',
          zIndex: 100,
          boxShadow: '0 8px 30px rgba(0,0,0,0.14)',
          border: '1px solid rgba(0,0,0,0.05)',
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
                fontSize: 10.5,
                fontWeight: isActive ? 800 : 500,
                gap: 3,
                transition: 'all 0.15s',
                position: 'relative',
              })}
            >
              {({ isActive }) => (
                <>
                  <span style={{
                    fontSize: 21,
                    width: 40, height: 30, borderRadius: 12,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isActive ? `${couleur}1d` : 'transparent',
                    transition: 'background 0.15s',
                  }}>{item.icon}</span>
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  )
}
