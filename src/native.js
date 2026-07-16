import { Capacitor } from '@capacitor/core'
import { App as CapApp } from '@capacitor/app'

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

  // Deep links : https://…/join/:slug ou campconnect://join/:slug
  CapApp.addListener('appUrlOpen', ({ url }) => {
    const m = url.match(/\/join\/([^/?#]+)/)
    if (m) {
      localStorage.setItem('campingSlug', m[1])
      localStorage.setItem('appMode', 'vacancier')
      window.location.href = '/'
    }
  })

  // Bouton retour Android
  CapApp.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) window.history.back()
    else CapApp.exitApp()
  })
}
