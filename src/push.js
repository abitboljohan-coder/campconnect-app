import { Capacitor } from '@capacitor/core'
import { isNative } from './native'
import { supabase } from './supabase'
import { toast } from './toast'

// ─────────────────────────────────────────────────────────────────────────────
// Notifications push (FCM Android / APNs iOS via @capacitor/push-notifications)
//
// Flux :
//  1. registerPush() demande la permission puis enregistre l'appareil
//  2. l'événement 'registration' renvoie le token → on l'enregistre dans Supabase
//     (table push_tokens, cloisonnée par vacancier/camping)
//  3. un tap sur une notif ouvre l'écran concerné (chat du groupe / agenda)
//
// L'envoi réel se fait côté serveur (Edge Function supabase/functions/send-push),
// déclenchée par les insertions de messages / animations.
// ─────────────────────────────────────────────────────────────────────────────

let _listenersReady = false
let _ctx = {}

/**
 * À appeler quand le camping et le vacancier sont connus (App.jsx).
 * No-op sur le web — les push ne concernent que l'app native.
 */
export async function registerPush({ camping, vacancier } = {}) {
  if (!isNative) return

  // Android sans google-services.json → on n'appelle SURTOUT pas register() :
  // cela lève « Default FirebaseApp is not initialized », une exception fatale
  // côté Java qu'aucun try/catch JavaScript ne rattrape.
  //
  // iOS n'est pas concerné : le greffon y renvoie le jeton APNs sans jamais
  // toucher à Firebase, et l'envoi passe directement par APNs côté serveur.
  // Le bloquer sur un fichier Firebase le privait de notifications pour rien.
  if (Capacitor.getPlatform() === 'android'
      && typeof __FIREBASE_ANDROID_PRET__ !== 'undefined' && !__FIREBASE_ANDROID_PRET__) {
    console.info('Notifications push Android désactivées : google-services.json absent.')
    return
  }

  _ctx = { camping, vacancier }

  let PushNotifications
  try {
    ({ PushNotifications } = await import('@capacitor/push-notifications'))
  } catch (e) {
    console.warn('Plugin push indisponible', e)
    return
  }

  if (!_listenersReady) {
    _listenersReady = true

    PushNotifications.addListener('registration', (token) => saveToken(token.value))
    PushNotifications.addListener('registrationError', (err) =>
      console.error('Push registration error:', err))

    // Notification reçue alors que l'application est au premier plan.
    //
    // Android ne la montre alors pas dans la barre de statut : le greffon la
    // remet ici, et sans écouteur elle est purement perdue — Logcat le dit sans
    // détour, « No listeners found for event pushNotificationReceived ».
    // Un toast est d'ailleurs plus juste qu'une notification système, que
    // l'utilisateur ne verrait pas puisqu'il a déjà l'application sous les yeux.
    PushNotifications.addListener('pushNotificationReceived', ({ title, body, data }) => {
      // Sauf pour le fil qu'il est en train de lire : le temps réel y a déjà
      // fait apparaître le message, l'annoncer une seconde fois serait du bruit.
      if (data?.groupe_id && window.location.pathname === `/chat/${data.groupe_id}`) return
      toast([title, body].filter(Boolean).join(' — '))
    })

    // Tap sur une notification → navigation contextuelle
    PushNotifications.addListener('pushNotificationActionPerformed', ({ notification }) => {
      const data = notification?.data || {}
      if (data.groupe_id)            window.location.href = `/chat/${data.groupe_id}`
      else if (data.type === 'animation') window.location.href = '/agenda'
    })
  }

  // Permission (Android 13+ / iOS)
  let perm = await PushNotifications.checkPermissions()
  if (perm.receive === 'prompt' || perm.receive === 'prompt-with-rationale') {
    perm = await PushNotifications.requestPermissions()
  }
  if (perm.receive !== 'granted') return

  await PushNotifications.register()
}

async function saveToken(token) {
  try {
    const deviceId = localStorage.getItem('deviceId')
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('push_tokens').upsert({
      device_id:    deviceId,
      token,
      platform:     Capacitor.getPlatform(), // 'android' | 'ios'
      vacancier_id: _ctx.vacancier?.id || null,
      camping_id:   _ctx.camping?.id || null,
      user_id:      user?.id || null,
      updated_at:   new Date().toISOString(),
    }, { onConflict: 'device_id' })
  } catch (e) {
    console.error('Enregistrement du token push échoué', e)
  }
}

/** À appeler à la déconnexion / fin de séjour : l'appareil ne reçoit plus de push. */
export async function unregisterPush() {
  try {
    const deviceId = localStorage.getItem('deviceId')
    if (deviceId) await supabase.from('push_tokens').delete().eq('device_id', deviceId)
  } catch (e) {
    console.error('Suppression du token push échouée', e)
  }
}
