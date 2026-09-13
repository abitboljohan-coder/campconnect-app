import { useCallback, useState, useSyncExternalStore } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import Sheet from '../components/Sheet'
import {
  Bouton, Texte, Pile, Icone,
  couleur as jetons, espace, graisse, rayon, texte as tailles,
} from '../design'

/**
 * Les neuf entrées n'ont pas le même rythme.
 *
 * Elles étaient toutes au même niveau, dans une barre du bas de neuf icônes :
 * sur un écran de 390 pt, chaque cible faisait 43 pt de large — sous le
 * minimum de 44 pt — sans libellé. Or « Modération » se regarde tous les
 * matins et « Apparence » une fois dans la vie du camping. Les quatre gestes
 * quotidiens tiennent la barre ; la configuration passe derrière « Réglages ».
 */
const QUOTIDIEN = [
  { path: '/admin/overview',     icone: 'accueil',    label: 'Accueil' },
  { path: '/admin/animations',   icone: 'agenda',     label: 'Animations' },
  { path: '/admin/signalements', icone: 'outil',      label: 'Signalements' },
  { path: '/admin/moderation',   icone: 'bouclier',   label: 'Modération' },
]

const CONFIGURATION = [
  { path: '/admin/carte',      icone: 'carte',     label: 'Carte' },
  { path: '/admin/apparence',  icone: 'apparence', label: 'Apparence' },
  { path: '/admin/infos',      icone: 'infos',     label: 'Infos pratiques' },
  { path: '/admin/stats',      icone: 'stats',     label: 'Statistiques' },
  { path: '/admin/parametres', icone: 'curseurs',  label: 'Paramètres' },
]

// L'administration garde la charte CampConnect — vert sombre et vert clair —
// et non l'accent du camping : c'est l'outil du gérant, pas la vitrine de son
// établissement. Le vacancier voit ses couleurs ; le gérant voit les nôtres.
const VERT_CLAIR = '#C0DD97'
const VERT_ETEINT = 'rgba(192,221,151,0.55)'
const LARGEUR_MENU = 232
const SEPARATION = 'rgba(255,255,255,0.08)'

/**
 * Le point de bascule est celui du menu latéral, pas une taille d'appareil.
 *
 * `useSyncExternalStore` plutôt qu'un état recopié dans un effet : la valeur
 * est lue à chaque rendu à sa source. Une rotation d'iPad survenue entre le
 * premier rendu et l'abonnement ne peut donc pas passer inaperçue, et il n'y a
 * pas de rendu en cascade pour rattraper l'écart.
 */
const REQUETE_ETROIT = '(max-width: 767px)'

function abonner(rappel) {
  const mq = window.matchMedia(REQUETE_ETROIT)
  mq.addEventListener('change', rappel)
  return () => mq.removeEventListener('change', rappel)
}

function useEtroit() {
  return useSyncExternalStore(
    abonner,
    () => window.matchMedia(REQUETE_ETROIT).matches,
    () => false,   // au rendu serveur, on suppose l'écran large
  )
}

/**
 * Marque CampConnect.
 *
 * Sur le vert sombre du bandeau, le logo seul s'efface — sa tente et son sol
 * sont eux-mêmes vert foncé. La plaque claire lui rend son contraste.
 */
function Marque({ taille = 26, texte: tailleTexte = 18 }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: espace.sm }}>
      <span style={{
        width: taille + 10, height: taille + 10, borderRadius: rayon.md,
        background: jetons.fondClair, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <img src="/logo-mark.png" alt="" width={taille} height={taille}
             style={{ display: 'block', objectFit: 'contain' }} />
      </span>
      <Texte variante="sousTitre" as="span" style={{ color: VERT_CLAIR, fontSize: tailleTexte }}>
        CampConnect
      </Texte>
    </span>
  )
}

/** Une entrée du menu latéral. */
function LienMenu({ item }) {
  return (
    <NavLink
      to={item.path}
      style={({ isActive }) => ({
        display: 'flex', alignItems: 'center', gap: espace.sm + 2,
        padding: `10px ${espace.md}px`, borderRadius: rayon.md, marginBottom: 2,
        color: isActive ? jetons.marqueSombre : VERT_CLAIR,
        background: isActive ? VERT_CLAIR : 'transparent',
        fontWeight: isActive ? graisse.fort : graisse.normal,
        fontSize: tailles.base, textDecoration: 'none',
        transition: 'background 0.15s, color 0.15s',
      })}
    >
      <Icone nom={item.icone} taille={19} />
      {item.label}
    </NavLink>
  )
}

function TitreGroupe({ children }) {
  return (
    <Texte variante="micro" as="h2" style={{
      color: VERT_ETEINT, textTransform: 'uppercase', letterSpacing: '0.08em',
      fontWeight: graisse.fort, padding: `0 ${espace.md}px`,
      marginTop: espace.lg, marginBottom: espace.xs,
    }}>
      {children}
    </Texte>
  )
}

export default function AdminLayout({ gerant, camping, onLogout }) {
  const etroit = useEtroit()
  const [reglagesOuverts, setReglagesOuverts] = useState(false)
  const { pathname } = useLocation()

  // La feuille se referme au clic, là où la navigation est décidée — et non
  // en réaction à l'URL une fois la page déjà rendue dessous.
  const fermerReglages = useCallback(() => setReglagesOuverts(false), [])

  const dansConfiguration = CONFIGURATION.some(i => pathname.startsWith(i.path))

  return (
    <div style={{ minHeight: '100dvh', background: jetons.fond, display: 'flex' }}>

      {/* ─── Menu latéral, écrans larges ─────────────────────────────────── */}
      {!etroit && (
        <aside className="cc-sombre" style={{
          width: LARGEUR_MENU, background: jetons.marqueSombre,
          display: 'flex', flexDirection: 'column',
          position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100,
          overflowY: 'auto',
        }}>
          <div style={{ padding: '28px 20px 4px' }}>
            <Marque />
            <Texte variante="doux" style={{ color: VERT_ETEINT, marginTop: espace.xs }}>
              {camping?.nom}
            </Texte>
          </div>

          <nav style={{ flex: 1, padding: `0 ${espace.md}px ${espace.lg}px` }}
               aria-label="Menu de l'administration">
            <TitreGroupe>Au quotidien</TitreGroupe>
            {QUOTIDIEN.map(item => <LienMenu key={item.path} item={item} />)}

            <TitreGroupe>Configuration</TitreGroupe>
            {CONFIGURATION.map(item => <LienMenu key={item.path} item={item} />)}
          </nav>

          <div style={{ padding: `${espace.lg}px 20px`, borderTop: `1px solid ${SEPARATION}` }}>
            <Texte variante="doux" style={{ color: VERT_ETEINT, marginBottom: espace.md }}>
              {gerant?.email || 'Gérant'}
            </Texte>
            <Bouton variante="danger" taille="sm" pleineLargeur onClick={onLogout}
                    style={{ background: 'rgba(220,38,38,0.15)', color: '#fca5a5', border: '1px solid rgba(220,38,38,0.2)' }}>
              Se déconnecter
            </Bouton>
          </div>
        </aside>
      )}

      {/* ─── Contenu ─────────────────────────────────────────────────────── */}
      <div style={{
        flex: 1, minWidth: 0,
        marginLeft: etroit ? 0 : LARGEUR_MENU,
        paddingBottom: etroit ? 'calc(64px + var(--cc-safe-bottom, 0px))' : 0,
      }}>

        {etroit ? (
          <header className="cc-sombre" style={{
            background: jetons.marqueSombre, padding: `14px ${espace.lg}px`,
            paddingTop: 'calc(14px + var(--cc-safe-top, 0px))',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: espace.md, position: 'sticky', top: 0, zIndex: 50,
          }}>
            <div style={{ minWidth: 0 }}>
              <Marque taille={22} texte={tailles.grand} />
              <Texte variante="micro" style={{
                color: VERT_ETEINT,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {camping?.nom}
              </Texte>
            </div>
            {/* « Déco. » était une abréviation illisible sur une cible trop
                petite. Le mot entier tient, et la cible fait 44 pt. */}
            <Bouton variante="discret" taille="sm" onClick={onLogout}
                    style={{ color: '#fca5a5', flexShrink: 0, minHeight: 44 }}>
              Quitter
            </Bouton>
          </header>
        ) : (
          <header style={{
            background: jetons.surface, borderBottom: `1px solid ${jetons.bordure}`,
            padding: '14px 28px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <Texte variante="corps">
              Connecté en tant que <strong style={{ color: jetons.texte }}>{gerant?.email || 'Gérant'}</strong>
            </Texte>
            <Texte variante="corps" as="span" style={{ fontWeight: graisse.fort, color: jetons.marqueTexte }}>
              {camping?.nom}
            </Texte>
          </header>
        )}

        <main style={{
          padding: etroit ? `${espace.xl}px ${espace.lg}px` : 28,
          maxWidth: 1100, margin: '0 auto',
        }}>
          <Outlet />
        </main>
      </div>

      {/* ─── Barre du bas, écrans étroits ────────────────────────────────── */}
      {etroit && (
        <nav className="cc-sombre" aria-label="Administration" data-barre="bas" style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: jetons.marqueSombre, borderTop: `1px solid ${SEPARATION}`,
          display: 'flex', zIndex: 100,
          paddingBottom: 'var(--cc-safe-bottom, 0px)',
        }}>
          {QUOTIDIEN.map(item => (
            <NavLink key={item.path} to={item.path} style={({ isActive }) => ({
              ...styleOnglet, color: isActive ? VERT_CLAIR : VERT_ETEINT,
              fontWeight: isActive ? graisse.fort : graisse.normal,
            })}>
              <Icone nom={item.icone} taille={22} />
              <span>{item.label}</span>
            </NavLink>
          ))}

          <button
            type="button"
            onClick={() => setReglagesOuverts(true)}
            aria-haspopup="dialog"
            aria-expanded={reglagesOuverts}
            style={{
              ...styleOnglet, border: 0, background: 'transparent', cursor: 'pointer',
              // `font: inherit` remettrait la taille du bouton à celle du
              // document et ferait déborder le libellé : seule la famille est
              // à reprendre, la taille vient de styleOnglet.
              fontFamily: 'inherit',
              color: dansConfiguration ? VERT_CLAIR : VERT_ETEINT,
              fontWeight: dansConfiguration ? graisse.fort : graisse.normal,
            }}
          >
            <Icone nom="grille" taille={22} />
            <span>Réglages</span>
          </button>
        </nav>
      )}

      {reglagesOuverts && (
        <Sheet onClose={fermerReglages}>
          <Pile espace="md">
            <Texte variante="sousTitre" as="h2">Configuration</Texte>
            <Pile espace="xs">
              {CONFIGURATION.map(item => (
                <NavLink key={item.path} to={item.path} onClick={fermerReglages} style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: espace.md,
                  padding: `14px ${espace.md}px`, minHeight: 52,
                  borderRadius: rayon.md, textDecoration: 'none',
                  background: isActive ? jetons.fond : 'transparent',
                  color: jetons.texte, fontSize: tailles.base,
                  fontWeight: isActive ? graisse.fort : graisse.normal,
                })}>
                  <Icone nom={item.icone} taille={21} style={{ color: jetons.marqueTexte }} />
                  <span style={{ flex: 1 }}>{item.label}</span>
                  <Icone nom="chevron" taille={17} style={{ color: jetons.texteDoux }} />
                </NavLink>
              ))}
            </Pile>
          </Pile>
        </Sheet>
      )}
    </div>
  )
}

/** Cinq cibles au lieu de neuf : 78 pt de large au lieu de 43, et un libellé. */
const styleOnglet = {
  flex: 1, minWidth: 0, minHeight: 56,
  display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center', gap: 3,
  padding: `${espace.sm}px 2px`,
  textDecoration: 'none', textAlign: 'center',
  fontSize: tailles.micro, lineHeight: 1.1,
  letterSpacing: '-0.01em',
  overflow: 'hidden',
}
