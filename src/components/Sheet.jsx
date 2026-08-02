import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

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
  // Hauteur du clavier logiciel.
  //
  // Une feuille en position fixed s'ancre au viewport de mise en page, que le
  // clavier ne réduit pas : à l'ouverture du clavier, la feuille reste collée
  // en bas et se retrouve entièrement masquée derrière lui. visualViewport,
  // lui, reflète la zone réellement visible ; l'écart entre les deux donne la
  // hauteur du clavier, dont on remonte la feuille.
  const [clavier, setClavier] = useState(0)
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const suivre = () => {
      const cache = window.innerHeight - vv.height - vv.offsetTop
      setClavier(cache > 60 ? Math.round(cache) : 0)   // 60px : ignore les micro-écarts
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
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'flex-end',
        paddingBottom: clavier,
        transition: 'padding-bottom 0.2s ease-out',
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
          background: '#fff',
          borderRadius: '22px 22px 0 0',
          padding: '22px 20px 36px',
          paddingBottom: clavier ? 36 : 'calc(36px + var(--cc-safe-bottom))',
          width: '100%', maxWidth: 600, margin: '0 auto',
          maxHeight: clavier ? `calc(85dvh - ${clavier}px)` : '85dvh', overflowY: 'auto',
          overscrollBehavior: 'contain',
          animation: 'slideUp 0.22s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        <div style={{ width: 44, height: 5, background: '#d8d4cc', borderRadius: 3, margin: '0 auto 18px' }} />
        {children}
      </div>
    </div>,
    document.body,
  )
}
