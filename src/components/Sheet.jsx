import { useEffect } from 'react'
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

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'flex-end',
        zIndex: 1000,
        animation: 'ccFade 0.18s ease-out',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: '22px 22px 0 0',
          padding: '22px 20px 36px',
          paddingBottom: 'calc(36px + env(safe-area-inset-bottom))',
          width: '100%', maxWidth: 600, margin: '0 auto',
          maxHeight: '85dvh', overflowY: 'auto',
          overscrollBehavior: 'contain',
          animation: 'slideUp 0.22s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        <div style={{ width: 40, height: 4, background: '#e5e7eb', borderRadius: 2, margin: '0 auto 18px' }} />
        {children}
      </div>
    </div>,
    document.body,
  )
}
