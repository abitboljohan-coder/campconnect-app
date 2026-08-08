import { useEffect, useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { Bouton, Texte, Pile, couleur as jetons, espace, graisse, rayon, texte as tailles } from '../design'

const NAV_ITEMS = [
  { path: '/admin/overview',    icon: '🏠', label: 'Accueil' },
  { path: '/admin/animations',  icon: '📅', label: 'Animations' },
  { path: '/admin/carte',       icon: '🗺️', label: 'Carte' },
  { path: '/admin/apparence',   icon: '🎨', label: 'Apparence' },
  { path: '/admin/infos',       icon: 'ℹ️', label: 'Infos pratiques' },
  { path: '/admin/stats',       icon: '📊', label: 'Stats' },
  { path: '/admin/signalements', icon: '🛠️', label: 'Signalements' },
  { path: '/admin/moderation',  icon: '🛡️', label: 'Modération' },
  { path: '/admin/parametres',  icon: '⚙️', label: 'Paramètres' },
]

// L'administration garde la charte CampConnect — vert sombre et vert clair —
// et non l'accent du camping : c'est l'outil du gérant, pas la vitrine de son
// établissement. Le vacancier voit ses couleurs ; le gérant voit les nôtres.
const VERT_CLAIR = '#C0DD97'
const LARGEUR_MENU = 220

export default function AdminLayout({ gerant, camping, onLogout }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  return (
    <div style={{ minHeight: '100dvh', background: jetons.fond, display: 'flex' }}>

      {/* Menu latéral */}
      {!isMobile && (
        <aside className="cc-sombre" style={{
          width: LARGEUR_MENU, background: jetons.marqueSombre,
          display: 'flex', flexDirection: 'column',
          position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100,
        }}>
          <div style={{ padding: '28px 20px 20px' }}>
            <Texte variante="sousTitre" style={{ color: VERT_CLAIR, fontSize: 18 }}>🌲 CampConnect</Texte>
            <Texte variante="doux" style={{ color: 'rgba(192,221,151,0.6)', marginTop: espace.xs }}>
              {camping?.nom}
            </Texte>
          </div>

          <nav style={{ flex: 1, padding: `0 ${espace.md}px` }} aria-label="Administration">
            {NAV_ITEMS.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: espace.sm,
                  padding: `10px ${espace.md}px`, borderRadius: rayon.md, marginBottom: 2,
                  color: isActive ? jetons.marqueSombre : VERT_CLAIR,
                  background: isActive ? VERT_CLAIR : 'transparent',
                  fontWeight: isActive ? graisse.fort : graisse.normal,
                  fontSize: tailles.base, textDecoration: 'none',
                  transition: 'all 0.15s',
                })}
              >
                <span aria-hidden="true" style={{ fontSize: 18 }}>{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div style={{ padding: `${espace.lg}px 20px`, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <Texte variante="doux" style={{ color: 'rgba(192,221,151,0.6)', marginBottom: espace.md }}>
              {gerant?.nom || 'Gérant'}
            </Texte>
            <Bouton variante="danger" taille="sm" pleineLargeur onClick={onLogout}
                    style={{ background: 'rgba(220,38,38,0.15)', color: '#fca5a5', border: '1px solid rgba(220,38,38,0.2)' }}>
              Se déconnecter
            </Bouton>
          </div>
        </aside>
      )}

      {/* Contenu */}
      <div style={{ flex: 1, marginLeft: isMobile ? 0 : LARGEUR_MENU, paddingBottom: isMobile ? 70 : 0 }}>

        {isMobile ? (
          <header className="cc-sombre" style={{
            background: jetons.marqueSombre, padding: `14px ${espace.lg}px`,
            paddingTop: 'calc(14px + var(--cc-safe-top))',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            position: 'sticky', top: 0, zIndex: 50,
          }}>
            <div>
              <Texte variante="sousTitre" style={{ color: VERT_CLAIR, fontSize: tailles.grand }}>
                🌲 CampConnect
              </Texte>
              <Texte variante="micro" style={{ color: 'rgba(192,221,151,0.6)' }}>{camping?.nom}</Texte>
            </div>
            <Bouton variante="discret" taille="sm" onClick={onLogout} style={{ color: '#fca5a5' }}>
              Déco.
            </Bouton>
          </header>
        ) : (
          <header style={{
            background: jetons.surface, borderBottom: `1px solid ${jetons.bordure}`,
            padding: '14px 28px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <Texte variante="corps">
              Connecté en tant que <strong style={{ color: jetons.texte }}>{gerant?.nom || 'Gérant'}</strong>
            </Texte>
            <Pile direction="ligne" espace="lg" aligner="center">
              <Texte variante="corps" as="span" style={{ fontWeight: graisse.fort, color: jetons.marqueTexte }}>
                {camping?.nom}
              </Texte>
              <Bouton variante="danger" taille="sm" onClick={onLogout}>Se déconnecter</Bouton>
            </Pile>
          </header>
        )}

        <main style={{ padding: isMobile ? `${espace.xl}px ${espace.lg}px` : 28, maxWidth: 1100, margin: '0 auto' }}>
          <Outlet />
        </main>
      </div>

      {/* Barre du bas, en mobile */}
      {isMobile && (
        <nav className="cc-sombre" aria-label="Administration" style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: jetons.marqueSombre, borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', zIndex: 100,
          paddingBottom: 'var(--cc-safe-bottom)',
          height: 56,
        }}>
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              // L'icône seule ne dit rien : neuf entrées annoncées « lien »
              // sans distinction rendaient la barre du bas inutilisable au
              // lecteur d'écran comme à la commande vocale.
              aria-label={item.label}
              title={item.label}
              style={({ isActive }) => ({
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                textDecoration: 'none',
                color: isActive ? VERT_CLAIR : 'rgba(192,221,151,0.35)',
                fontSize: tailles.grosTitre,
              })}
            >
              <span aria-hidden="true">{item.icon}</span>
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  )
}
