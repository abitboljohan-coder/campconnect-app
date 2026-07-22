import { Capacitor } from '@capacitor/core'
import { isNative } from './native'
import { supabase } from './supabase'

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
