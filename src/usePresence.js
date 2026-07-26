import { useEffect, useState } from 'react'
import { supabase } from './supabase'

// ─────────────────────────────────────────────────────────────────────────────
// Présence temps réel : combien de vacanciers ont l'app ouverte MAINTENANT,
// dans ce camping.
//
// S'appuie sur Supabase Realtime Presence : rien n'est écrit en base, et le
// décompte se met à jour tout seul quand quelqu'un ferme l'app ou perd le réseau.
// Le canal est nommé par camping → cloisonnement naturel.
//
// L'app est aussi retirée de la présence quand elle passe en arrière-plan
// (onglet caché / app minimisée), pour que le compteur reflète les personnes
// réellement actives.
// ─────────────────────────────────────────────────────────────────────────────

export function usePresence(campingId, vacancierId) {
  const [enLigne, setEnLigne] = useState(0)

  useEffect(() => {
    if (!campingId || !vacancierId) return

    const canal = supabase.channel(`presence:camping:${campingId}`, {
      config: { presence: { key: vacancierId } },
    })

    const recompter = () => {
      // Un vacancier peut avoir plusieurs onglets : on compte les clés uniques.
      const etat = canal.presenceState()
      setEnLigne(Object.keys(etat).length)
    }

    canal
      .on('presence', { event: 'sync' }, recompter)
      .on('presence', { event: 'join' }, recompter)
      .on('presence', { event: 'leave' }, recompter)
      .subscribe(async (statut) => {
        if (statut !== 'SUBSCRIBED') return
        if (document.visibilityState === 'visible') {
          await canal.track({ at: new Date().toISOString() })
        }
      })

    // App en arrière-plan → on se retire ; retour au premier plan → on revient.
    const onVisibilite = () => {
      if (document.visibilityState === 'visible') canal.track({ at: new Date().toISOString() })
      else canal.untrack()
    }
    document.addEventListener('visibilitychange', onVisibilite)

    return () => {
      document.removeEventListener('visibilitychange', onVisibilite)
      supabase.removeChannel(canal)
    }
  }, [campingId, vacancierId])

  return enLigne
}
