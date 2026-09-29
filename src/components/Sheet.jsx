import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { couleur, rayon } from '../design'

/**
 * Feuille modale glissant depuis le bas, rendue directement dans <body>.
 *
 * Le portail n'est pas un détail d'implémentation : une modale rendue au milieu
 * de l'arbre reste prisonnière du contexte d'empilement de ses ancêtres. Il
 * suffit qu'un parent porte un `transform`, un `filter`, un `backdrop-filter`
 * ou, sur iOS, un `-webkit-overflow-scrolling`, pour que son z-index cesse
 * d'être comparé à celui de la barre de navigation — qui passe alors devant la
 * feuille et recouvre le champ de saisie. Ancrée à <body>, la feuille est
 * toujours au-dessus, quelle que soit la page qui l'ouvre.
 *
 * Elle défile en interne et plafonne à 85% de la hauteur utile : avec le
 * clavier ouvert sur un petit écran, une feuille non défilante tronque ses
 * propres boutons de validation.
 */
export default function Sheet({ onClose, children }) {
  // Zone réellement visible, clavier déduit.
  //
  // Une feuille en position fixed s'ancre au viewport de mise en page, que le
  // clavier ne réduit pas : à l'ouverture du clavier, la feuille reste collée
  // en bas et se retrouve entièrement masquée derrière lui. visualViewport,
  // lui, reflète la zone réellement visible.
  //
  // Le calque épouse donc exactement cette zone — sa position ET sa hauteur.
  // Une première version se contentait de remonter la feuille de la hauteur
  // du clavier et de la plafonner à « 85 % de l'écran moins le clavier » : sur
  // un iPhone, cela laissait à peine un tiers de l'écran au formulaire, alors
  // que tout l'espace au-dessus restait libre. Créer un groupe se faisait dans
  // une lucarne où l'on devait défiler à l'aveugle.
  const [zone, setZone] = useState(null)   // { haut, hauteur } quand le clavier est ouvert
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const suivre = () => {
      const cache = window.innerHeight - vv.height - vv.offsetTop
      // 60px : ignore les micro-écarts (barre d'adresse qui se replie, etc.)
      setZone(cache > 60 ? { haut: Math.round(vv.offsetTop), hauteur: Math.round(vv.height) } : null)
    }
    suivre()
    vv.addEventListener('resize', suivre)
    vv.addEventListener('scroll', suivre)
    return () => {
      vv.removeEventListener('resize', suivre)
      vv.removeEventListener('scroll', suivre)
    }
  }, [])

  // Le fond ne doit pas défiler derrière la feuille ouverte.
  useEffect(() => {
    const avant = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = avant }
  }, [])

  // Échap ferme la feuille — utile sur le web et avec un clavier externe.
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // ── Fermeture en tirant la feuille vers le bas ────────────────────────────
  // Geste attendu de toute feuille modale depuis des années : on la repousse
  // comme un objet physique, plutôt que de chercher une croix. Le panneau suit
  // le doigt via le style direct — repasser par un rendu React à chaque frame
  // rendrait le suivi saccadé.
  const panneau = useRef(null)
  const tirage  = useRef(null)

  const debutTirage = (e) => {
    // Uniquement si la feuille est en haut de son défilement : sinon le geste
    // sert à faire défiler le contenu, pas à fermer.
    if ((panneau.current?.scrollTop || 0) > 0) return
    tirage.current = { y0: e.touches[0].clientY, t0: Date.now(), dy: 0 }
    if (panneau.current) panneau.current.style.transition = 'none'
  }

  const bougeTirage = (e) => {
    const g = tirage.current
    if (!g || !panneau.current) return
    const dy = e.touches[0].clientY - g.y0
    if (dy < 0) return                       // vers le haut : on laisse défiler
    if (panneau.current.scrollTop > 0) { tirage.current = null; return }
    if (e.cancelable) e.preventDefault()
    g.dy = dy
    // Résistance croissante : la feuille freine, elle ne suit pas à l'infini.
    panneau.current.style.transform = `translate3d(0,${dy * 0.72}px,0)`
  }

  const finTirage = () => {
    const g = tirage.current
    tirage.current = null
    if (!g || !panneau.current) return
    const vitesse = g.dy / Math.max(1, Date.now() - g.t0)
    panneau.current.style.transition = 'transform 0.2s cubic-bezier(0.32, 0.72, 0, 1)'
    if (g.dy > 110 || vitesse > 0.5) {
      panneau.current.style.transform = 'translate3d(0,100%,0)'
      setTimeout(() => onClose?.(), 190)
    } else {
      panneau.current.style.transform = ''
    }
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: 'fixed', left: 0, right: 0,
        top: zone ? zone.haut : 0,
        height: zone ? zone.hauteur : '100%',
        background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'flex-end',
        zIndex: 1000,
        animation: 'ccFade 0.18s ease-out',
      }}
    >
      <div
        ref={panneau}
        onClick={e => e.stopPropagation()}
        onTouchStart={debutTirage}
        onTouchMove={bougeTirage}
        onTouchEnd={finTirage}
        onTouchCancel={finTirage}
        style={{
          background: couleur.surface,
          borderRadius: `${rayon.xl}px ${rayon.xl}px 0 0`,
          padding: '22px 20px 36px',
          paddingBottom: zone ? 20 : 'calc(36px + var(--cc-safe-bottom))',
          width: '100%', maxWidth: 600, margin: '0 auto',
          // Clavier ouvert : toute la hauteur visible, moins la barre d'état.
          maxHeight: zone ? 'calc(100% - var(--cc-safe-top) - 8px)' : '85%',
          overflowY: 'auto',
          // Un champ trop large ne doit jamais rendre la feuille défilable de
          // côté : c'est ce qui la faisait « sauter » à gauche à chaque saisie.
          overflowX: 'hidden',
          overscrollBehavior: 'contain',
          animation: 'slideUp 0.22s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        <div aria-hidden="true" style={{ width: 44, height: 5, background: couleur.bordure, borderRadius: 3, margin: '0 auto 18px' }} />
        {children}
      </div>
    </div>,
    document.body,
  )
}
