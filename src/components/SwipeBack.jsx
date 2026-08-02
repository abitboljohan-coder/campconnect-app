import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

// ─────────────────────────────────────────────────────────────────────────────
// Retour par glissement depuis le bord gauche.
//
// iOS offre ce geste nativement dans Safari, mais pas dans une WKWebView
// embarquée : sans lui, l'utilisateur glisse, rien ne bouge, et l'application
// se trahit immédiatement. C'est le geste le plus utilisé d'un téléphone.
//
// Quatre choix de conception :
//
//  • Zone de départ étroite (28 px). Au-delà, le geste entrerait en conflit
//    avec les carrousels horizontaux — bandeau des statuts, filtres d'annonces
//    — et avec le déplacement de la carte.
//
//  • Uniquement sur les pages secondaires. Les cinq onglets ne forment pas une
//    pile : « revenir » depuis Agenda n'a pas de sens et ramènerait sur un
//    écran arbitraire selon l'ordre de navigation.
//
//  • Le déplacement est écrit directement dans le style de l'élément, sans
//    passer par l'état React. Repasser par un rendu à chaque frame ferait
//    recalculer toute la page pendant le geste, et c'est exactement ce qui
//    donne l'impression de latence qu'on cherche à supprimer.
//
//  • Le contenu suit le doigt, puis termine sa course seul. Un geste qui ne
//    montre rien avant de se terminer paraît cassé ; c'est la correspondance
//    continue entre le doigt et l'écran qui fait la différence.
// ─────────────────────────────────────────────────────────────────────────────

const ONGLETS = ['/', '/groupes', '/map', '/agenda', '/infos']

const BORD = 28          // largeur de la zone de départ, en pixels
const SEUIL = 0.28       // fraction de l'écran au-delà de laquelle on valide
const VITESSE = 0.45     // px/ms : un geste vif valide même s'il est court

export default function SwipeBack({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const carte  = useRef(null)   // le contenu qui glisse
  const voile  = useRef(null)   // l'assombrissement derrière
  const geste  = useRef(null)

  const actif = !ONGLETS.includes(location.pathname)

  useEffect(() => {
    // Nouvelle page : on repart d'une position neutre.
    if (carte.current) {
      carte.current.style.transition = 'none'
      carte.current.style.transform = ''
      carte.current.style.boxShadow = 'none'
    }
    if (voile.current) voile.current.style.opacity = '0'
  }, [location.pathname])

  useEffect(() => {
    if (!actif) return

    const peindre = (dx) => {
      const p = Math.min(1, dx / window.innerWidth)
      if (carte.current) {
        carte.current.style.transform = dx > 0 ? `translate3d(${dx}px,0,0)` : ''
        carte.current.style.boxShadow = dx > 0 ? '-12px 0 32px rgba(0,0,0,0.18)' : 'none'
      }
      if (voile.current) voile.current.style.opacity = String(0.18 * (1 - p))
    }

    const debut = (e) => {
      const t = e.touches[0]
      if (t.clientX > BORD) return
      geste.current = { x0: t.clientX, y0: t.clientY, t0: Date.now(), dx: 0, engage: false }
      if (carte.current) carte.current.style.transition = 'none'
      // Le suivi n'est branché qu'à partir d'un toucher parti du bord. Laisser
      // en permanence un touchmove non passif sur le document désactive les
      // optimisations de défilement de WebKit et rend toute l'application
      // pâteuse au doigt, y compris là où le geste n'a rien à faire.
      document.addEventListener('touchmove', bouge, { passive: false })
    }

    const bouge = (e) => {
      const g = geste.current
      if (!g) return
      const t = e.touches[0]
      const ecartX = t.clientX - g.x0
      const ecartY = Math.abs(t.clientY - g.y0)

      // Tant que le geste n'est pas franchement horizontal, on ne le capte pas :
      // sinon un défilement vertical amorcé près du bord déclencherait un retour.
      if (!g.engage) {
        if (ecartX < 12) return
        if (ecartY > Math.abs(ecartX)) { geste.current = null; return }
        g.engage = true
      }
      if (e.cancelable) e.preventDefault()
      g.dx = Math.max(0, ecartX)
      peindre(g.dx)
    }

    const fin = () => {
      document.removeEventListener('touchmove', bouge)
      const g = geste.current
      geste.current = null
      if (!g?.engage) return
      const vitesse = g.dx / Math.max(1, Date.now() - g.t0)
      const valide = g.dx > window.innerWidth * SEUIL || vitesse > VITESSE

      if (carte.current) carte.current.style.transition = 'transform 0.19s cubic-bezier(0.32, 0.72, 0, 1)'
      if (voile.current) voile.current.style.transition = 'opacity 0.19s ease-out'

      if (valide) {
        peindre(window.innerWidth)
        setTimeout(() => navigate(-1), 185)
      } else {
        peindre(0)
      }
    }

    document.addEventListener('touchstart', debut, { passive: true })
    document.addEventListener('touchend', fin, { passive: true })
    document.addEventListener('touchcancel', fin, { passive: true })
    return () => {
      document.removeEventListener('touchstart', debut)
      document.removeEventListener('touchmove', bouge)
      document.removeEventListener('touchend', fin)
      document.removeEventListener('touchcancel', fin)
    }
  }, [actif, navigate])

  if (!actif) return children

  return (
    <>
      {/* Assombrit ce qui reste visible dessous, comme une pile de cartes. */}
      <div
        ref={voile}
        style={{
          position: 'fixed', inset: 0, zIndex: 1,
          background: '#000', opacity: 0, pointerEvents: 'none',
        }}
      />
      <div
        ref={carte}
        style={{ position: 'relative', zIndex: 2, minHeight: '100%', background: '#faf7f0' }}
      >
        {children}
      </div>
    </>
  )
}
