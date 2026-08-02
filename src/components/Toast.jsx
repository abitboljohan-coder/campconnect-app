import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { sAbonner } from '../toast'

// ─────────────────────────────────────────────────────────────────────────────
// Notifications passagères.
//
// Remplace alert(), qui bloque le fil d'exécution, affiche le nom de domaine
// dans une boîte système, exige un clic pour disparaître, et signale
// immédiatement une page web déguisée en application. Aucune app sociale
// n'interrompt son utilisateur pour lui dire qu'un envoi a échoué.
//
// L'émetteur vit au niveau du module plutôt que dans un contexte React : les
// erreurs remontent souvent depuis des fonctions asynchrones hors de l'arbre,
// et `toast(...)` doit pouvoir être appelé de n'importe où sans branchement.
// ─────────────────────────────────────────────────────────────────────────────

const TONS = {
  info:    { fond: 'rgba(26,26,26,0.94)', texte: '#fff',    icone: null },
  succes:  { fond: 'rgba(22,101,52,0.96)', texte: '#dcfce7', icone: '✓' },
  erreur:  { fond: 'rgba(153,27,27,0.96)', texte: '#fee2e2', icone: '!' },
}

export function ToastHost() {
  const [liste, setListe] = useState([])

  useEffect(() => {
    const recevoir = (t) => {
      setListe(l => [...l, t])
      // 4 s : le temps de lire une phrase courte sans bloquer l'écran.
      setTimeout(() => setListe(l => l.filter(x => x.id !== t.id)), 4000)
    }
    return sAbonner(recevoir)
  }, [])

  if (!liste.length) return null

  return createPortal(
    <div
      style={{
        position: 'fixed',
        // Au-dessus de la barre de navigation flottante, pas derrière.
        bottom: 'calc(88px + var(--cc-safe-bottom))',
        left: 12, right: 12,
        display: 'flex', flexDirection: 'column', gap: 8,
        alignItems: 'center',
        zIndex: 2000,
        pointerEvents: 'none',
      }}
    >
      {liste.map(t => {
        const ton = TONS[t.ton] || TONS.info
        return (
          <div
            key={t.id}
            role="status"
            aria-live="polite"
            style={{
              maxWidth: 480, width: 'fit-content',
              display: 'flex', alignItems: 'center', gap: 9,
              background: ton.fond,
              color: ton.texte,
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              padding: '12px 18px',
              borderRadius: 14,
              fontSize: 14, fontWeight: 600, lineHeight: 1.35,
              boxShadow: '0 8px 28px rgba(0,0,0,0.28)',
              animation: 'ccToastIn 0.22s cubic-bezier(0.32, 0.72, 0, 1)',
            }}
          >
            {ton.icone && (
              <span style={{
                flexShrink: 0, width: 18, height: 18, borderRadius: '50%',
                background: 'rgba(255,255,255,0.22)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 800,
              }}>{ton.icone}</span>
            )}
            <span>{t.message}</span>
          </div>
        )
      })}
    </div>,
    document.body,
  )
}
