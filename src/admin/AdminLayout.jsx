import { useCallback, useEffect, useState } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import Sheet from '../components/Sheet'
import { supabase } from '../supabase'
import { isNative, setAppMode } from '../native'
import { Bouton, Texte, Pile, Icone, espace, graisse, rayon, texte as tailles } from '../design'
import { jetons, barre } from './theme'
import { useEtroit } from './lib/useEtroit'

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
  { path: '/admin/animations',   icone: 'agenda',     label: 'Animations', court: 'Agenda' },
  // « court » : le libellé de la barre du bas, où « Signalements » ne tenait
  // pas dans ses 64 px sur un petit téléphone et mordait sur ses voisins.
  { path: '/admin/signalements', icone: 'drapeau',    label: 'Signalements', court: 'Alertes' },
  { path: '/admin/moderation',   icone: 'bouclier',   label: 'Modération', court: 'Modérer' },
]

const CONFIGURATION = [
  { path: '/admin/carte',      icone: 'carte',     label: 'Carte' },
  { path: '/admin/apparence',  icone: 'apparence', label: 'Apparence' },
  { path: '/admin/infos',      icone: 'infos',     label: 'Infos pratiques' },
  { path: '/admin/stats',      icone: 'stats',     label: 'Statistiques' },
  { path: '/admin/parametres', icone: 'curseurs',  label: 'Paramètres' },
]

// L'administration garde sa propre charte, et non l'accent du camping : c'est
// l'outil du gérant, pas la vitrine de son établissement. Barre ardoise neutre,
// repère saumon sur l'entrée active (voir ./theme).
const LARGEUR_MENU = 240

/**
 * Le camping d'abord.
 *
 * Le bandeau affichait « CampConnect » en grand et le nom du camping en petit
 * dessous : chez lui, le gérant lisait notre marque avant la sienne. Le logo
 * du camping s'il en a un, sinon le nôtre, sur une plaque claire.
 */
function Marque({ camping, sous, uneLigne = false }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: espace.md, minWidth: 0 }}>
      <span style={{
        width: 38, height: 38, borderRadius: 10, background: jetons.fondClair, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
      }}>
        <img src={camping?.logo_url || '/logo-mark.png'} alt="" width={camping?.logo_url ? 38 : 26} height={camping?.logo_url ? 38 : 26}
             style={{ display: 'block', objectFit: camping?.logo_url ? 'cover' : 'contain' }} />
      </span>
      <span style={{ minWidth: 0 }}>
        <Texte variante="sousTitre" as="span" style={{
          display: 'block', color: barre.texteActif, fontSize: 15.5, lineHeight: 1.25,
          // Au téléphone, une ligne (l'en-tête reste bas) ; dans le menu, le
          // nom entier sur deux lignes plutôt que « Camping Les Flots… ».
          ...(uneLigne ? { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } : null),
        }}>
          {camping?.nom || 'Mon camping'}
        </Texte>
        <Texte variante="micro" as="span" style={{ display: 'block', color: barre.texte, fontSize: 12.5, marginTop: 1 }}>
          {sous}
        </Texte>
      </span>
    </span>
  )
}

/**
 * Nombre de signalements encore « nouveaux ».
 *
 * Un signalement ne se voyait qu'en ouvrant la page Signalements : rien, dans
 * le reste de la console, ne disait qu'un vacancier attendait une réponse. Le
 * compte s'affiche désormais sur l'entrée du menu, et se met à jour en temps
 * réel et à chaque changement de page — donc aussi après un traitement.
 */
function useSignalementsNouveaux(campingId, pathname) {
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!campingId) return
    let actif = true
    const compter = () => supabase.from('signalements')
      .select('id', { count: 'exact', head: true })
      .eq('camping_id', campingId).eq('statut', 'nouveau')
      .then(({ count }) => { if (actif) setN(count || 0) })
    compter()
    const canal = supabase.channel(`badge_signalements_${campingId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'signalements', filter: `camping_id=eq.${campingId}` },
        compter)
      .subscribe()
    return () => { actif = false; supabase.removeChannel(canal) }
  }, [campingId, pathname])
  return n
}

/** « Mercredi 18 novembre » : la date du jour, sous le nom du camping. */
function dateCourte() {
  const d = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  return d.charAt(0).toUpperCase() + d.slice(1)
}

/** Pastille rouge d'un compte à traiter. */
function Pastille({ n, style }) {
  if (!n) return null
  return (
    <span aria-label={`${n} à traiter`} style={{
      minWidth: 18, height: 18, padding: '0 5px', borderRadius: 9,
      background: jetons.danger, color: '#fff',
      fontSize: 11, fontWeight: graisse.affiche, lineHeight: '18px', textAlign: 'center',
      ...style,
    }}>
      {n > 99 ? '99+' : n}
    </span>
  )
}

/** Une entrée du menu latéral. */
function LienMenu({ item, badge }) {
  return (
    <NavLink
      to={item.path}
      style={({ isActive }) => ({
        display: 'flex', alignItems: 'center', gap: espace.sm + 2,
        padding: `9px ${espace.md}px`, borderRadius: rayon.sm, marginBottom: 2,
        color: isActive ? barre.texteActif : barre.texte,
        background: isActive ? barre.actif : 'transparent',
        fontWeight: isActive ? graisse.fort : graisse.normal,
        fontSize: tailles.base, textDecoration: 'none',
        transition: 'background 0.15s, color 0.15s',
      })}
    >
      {({ isActive }) => (
        <>
          <Icone nom={item.icone} taille={18} style={{ color: isActive ? jetons.accent : 'inherit' }} />
          <span style={{ flex: 1 }}>{item.label}</span>
          <Pastille n={badge} />
        </>
      )}
    </NavLink>
  )
}

function TitreGroupe({ children }) {
  return (
    <Texte variante="micro" as="h2" style={{
      color: barre.titre, textTransform: 'uppercase', letterSpacing: '0.08em',
      fontWeight: graisse.fort, padding: `0 ${espace.md}px`,
      marginTop: espace.lg, marginBottom: espace.xs,
    }}>
      {children}
    </Texte>
  )
}

/**
 * Ancre de page (`/admin/parametres#qr`) : fait défiler jusqu'au bloc visé.
 *
 * Le routeur ne le fait pas, et la page charge ses données après le premier
 * rendu : on réessaie quelques fois le temps que le bloc apparaisse. À défaut
 * de l'identifiant, un titre qui contient le mot de l'ancre fait l'affaire.
 */
function useDefilerVersAncre(hash) {
  useEffect(() => {
    const ancre = decodeURIComponent((hash || '').slice(1))
    if (!ancre) return
    let essais = 0
    const iv = setInterval(() => {
      const cible = document.getElementById(ancre)
        || [...document.querySelectorAll('main h2')]
          .find(h => h.textContent.toLowerCase().includes(ancre.toLowerCase()))
      if (cible || ++essais > 20) clearInterval(iv)
      if (cible) {
        // Sous l'en-tête collant du téléphone, dont la hauteur dépend de l'encoche.
        const entete = document.querySelector('header.cc-sombre')
        cible.style.scrollMarginTop = `${(entete?.offsetHeight || 0) + 16}px`
        cible.scrollIntoView({ block: 'start', behavior: 'smooth' })
      }
    }, 100)
    return () => clearInterval(iv)
  }, [hash])
}

export default function AdminLayout({ gerant, camping, onLogout }) {
  const etroit = useEtroit()
  const [reglagesOuverts, setReglagesOuverts] = useState(false)
  const { pathname, hash } = useLocation()
  useDefilerVersAncre(hash)

  // La feuille se referme au clic, là où la navigation est décidée — et non
  // en réaction à l'URL une fois la page déjà rendue dessous.
  const fermerReglages = useCallback(() => setReglagesOuverts(false), [])

  // Se déconnecter oblige à retaper son mot de passe, sans « mot de passe
  // oublié » : un appui égaré ne doit pas suffire.
  const seDeconnecter = () => {
    if (confirm('Se déconnecter de l’espace gérant ? Il faudra retaper votre mot de passe.')) onLogout()
  }

  const dansConfiguration = CONFIGURATION.some(i => pathname.startsWith(i.path))
  const nouveaux = useSignalementsNouveaux(camping?.id, pathname)
  const badgeDe = path => (path === '/admin/signalements' ? nouveaux : 0)

  return (
    // flexShrink 0 : enfant de #root (colonne flex de hauteur fixe), ce bloc
    // rétrécissait à la hauteur de l'écran ; la marge réservée à la barre du
    // bas ne s'ajoutait plus après le contenu, dont le bas restait caché.
    <div style={{ minHeight: '100dvh', background: jetons.fond, display: 'flex', flexShrink: 0 }}>

      {/* ─── Menu latéral, écrans larges ─────────────────────────────────── */}
      {!etroit && (
        <aside className="cc-sombre" style={{
          width: LARGEUR_MENU, background: barre.fond,
          display: 'flex', flexDirection: 'column',
          position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100,
          overflowY: 'auto',
        }}>
          <div style={{ padding: '24px 16px 8px' }}>
            <Marque camping={camping} sous="Espace gérant" />
          </div>

          <nav style={{ flex: 1, padding: `0 ${espace.md}px ${espace.lg}px` }}
               aria-label="Menu de l'administration">
            <TitreGroupe>Au quotidien</TitreGroupe>
            {QUOTIDIEN.map(item => <LienMenu key={item.path} item={item} badge={badgeDe(item.path)} />)}

            <TitreGroupe>Configuration</TitreGroupe>
            {CONFIGURATION.map(item => <LienMenu key={item.path} item={item} />)}
          </nav>

          <div style={{ padding: `${espace.lg}px 20px`, borderTop: `1px solid ${barre.separation}` }}>
            <Texte variante="doux" style={{
              color: barre.texte, marginBottom: espace.md,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {gerant?.email || 'Gérant'}
            </Texte>
            <Bouton variante="discret" taille="sm" pleineLargeur onClick={seDeconnecter}
                    style={{ background: 'transparent', color: barre.texte, border: `1px solid ${barre.separation}` }}>
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
            background: barre.fond, padding: `10px ${espace.sm}px 10px ${espace.lg}px`,
            paddingTop: 'calc(10px + var(--cc-safe-top, 0px))',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: espace.md, position: 'sticky', top: 0, zIndex: 50,
          }}>
            <Marque camping={camping} uneLigne
                    sous={dateCourte()} />
            {/* Dans l'app, le gérant qui touchait « Quitter » voulait revenir
                côté vacancier et se retrouvait déconnecté. Le bouton y mène
                donc à l'espace vacancier ; la déconnexion passe dans Réglages. */}
            {isNative ? (
              <Bouton variante="discret" taille="sm" onClick={() => setAppMode('vacancier')}
                      style={{ color: barre.texteActif, flexShrink: 0, minHeight: 44 }}>
                Espace vacancier
              </Bouton>
            ) : (
              <Bouton variante="discret" taille="sm" onClick={seDeconnecter}
                      style={{ color: barre.texte, flexShrink: 0, minHeight: 44 }}>
                Quitter
              </Bouton>
            )}
          </header>
        ) : null}

        <main style={{
          padding: etroit ? `${espace.xl}px ${espace.lg}px` : '40px 40px 56px',
          maxWidth: 1180, margin: '0 auto',
        }}>
          <Outlet />
        </main>
      </div>

      {/* ─── Barre du bas, écrans étroits ────────────────────────────────── */}
      {etroit && (
        <nav className="cc-sombre" aria-label="Administration" data-barre="bas" style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: barre.fond, borderTop: `1px solid ${barre.separation}`,
          display: 'flex', zIndex: 100,
          paddingBottom: 'var(--cc-safe-bottom, 0px)',
        }}>
          {QUOTIDIEN.map(item => (
            <NavLink key={item.path} to={item.path} aria-label={item.label} style={({ isActive }) => ({
              ...styleOnglet, color: isActive ? barre.texteActif : barre.texte,
              fontWeight: isActive ? graisse.fort : graisse.normal,
            })}>
              <span style={{ position: 'relative', display: 'inline-flex' }}>
                <Icone nom={item.icone} taille={22} />
                <Pastille n={badgeDe(item.path)} style={{ position: 'absolute', top: -6, left: 14 }} />
              </span>
              <span style={{ maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.court || item.label}
              </span>
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
              color: dansConfiguration ? barre.texteActif : barre.texte,
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
            {/* Le retour côté vacancier est dans l'en-tête (app) ; la
                déconnexion, plus rare et plus coûteuse, est rangée ici. */}
            <Bouton variante="secondaire" pleineLargeur onClick={seDeconnecter}
                    style={{ color: jetons.danger }}>
              Se déconnecter
            </Bouton>
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
