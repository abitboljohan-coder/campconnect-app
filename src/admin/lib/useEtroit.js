import { useSyncExternalStore } from 'react'

/**
 * Écran étroit : le point de bascule est celui du menu latéral, pas une
 * taille d'appareil. Partagé par la mise en page et les pages qui changent
 * de disposition au téléphone.
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

export function useEtroit() {
  return useSyncExternalStore(
    abonner,
    () => window.matchMedia(REQUETE_ETROIT).matches,
    () => false,   // au rendu serveur, on suppose l'écran large
  )
}
