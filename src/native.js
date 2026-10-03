import { Capacitor } from '@capacitor/core'
import { App as CapApp } from '@capacitor/app'
import { cleDuLien } from './lib/acces'

export const isNative = Capacitor.isNativePlatform()

export function getAppMode() {
  if (!isNative) return window.location.pathname.startsWith('/admin') ? 'gerant' : 'vacancier'
  return localStorage.getItem('appMode') || 'vacancier'
}

export function setAppMode(mode) {
  localStorage.setItem('appMode', mode)
  window.location.href = mode === 'gerant' ? '/admin' : '/'
}

export function initNative() {
  if (!isNative) return

  // Les marges de sécurité restent gérées par le CSS, y compris sur natif :
  // contentInset vaut « never », la WebView n'en ajoute donc aucune. Les
  // neutraliser ici — ce qui a été fait un temps — collait l'en-tête sous
  // l'heure de l'iPhone et descendait la barre de navigation sur l'indicateur
  // d'accueil, où iOS intercepte les touchers avant l'application : le menu
  // devenait alors insensible aux clics.

  // Deep links : https://…/join/:slug ou campconnect://join/:slug
  CapApp.addListener('appUrlOpen', ({ url }) => {
    const m = url.match(/\/join\/([^/?#]+)/)
    if (m) {
      localStorage.setItem('campingSlug', m[1])
      localStorage.setItem('appMode', 'vacancier')
      // On recharge sur « / », donc Onboarding ne verra plus le lien : la clé
      // du QR (?k=…) est rangée ici. Sans elle, le scan ne vaudrait pas preuve
      // de présence et le contrôle GPS se déclencherait quand même — alors que
      // le vacancier est bel et bien sur place. C'est le serveur qui la juge.
      localStorage.removeItem('arriveeParQR') // ancien drapeau, sans valeur de preuve
      const cle = cleDuLien(url)
      if (cle) localStorage.setItem('cleQR', cle)
      else localStorage.removeItem('cleQR')
      window.location.href = '/'
    }
  })

  // Bouton retour Android
  CapApp.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) window.history.back()
    else CapApp.exitApp()
  })
}
