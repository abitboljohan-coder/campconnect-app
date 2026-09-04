import { isNative } from './native'

// ─────────────────────────────────────────────────────────────────────────────
// Retour haptique.
//
// Le greffon est importé dynamiquement : sur le web il n'existe pas de moteur
// de vibration comparable, et le charger d'office ajouterait du code mort au
// paquet de tous les vacanciers qui ouvrent l'application depuis un navigateur.
//
// Chaque appel est silencieusement sans effet en cas d'échec. Un retour tactile
// est un agrément, jamais une fonction : un appareil sans moteur, un utilisateur
// qui a coupé les vibrations dans ses réglages, un greffon indisponible — rien
// de tout cela ne doit interrompre l'action en cours.
// ─────────────────────────────────────────────────────────────────────────────

let _greffon = null

async function greffon() {
  if (!isNative) return null
  if (_greffon) return _greffon
  try {
    const m = await import('@capacitor/haptics')
    _greffon = m
    return m
  } catch {
    return null
  }
}

/** Sélection : changement d'onglet, choix dans une liste. Le plus discret. */
export async function toucher() {
  const m = await greffon()
  try { await m?.Haptics.impact({ style: m.ImpactStyle.Light }) } catch { /* agrément */ }
}

/** Une action a abouti : message envoyé, groupe rejoint, animation publiée. */
export async function reussite() {
  const m = await greffon()
  try { await m?.Haptics.notification({ type: m.NotificationType.Success }) } catch { /* agrément */ }
}

/** Une action a échoué. Distinct de la réussite : deux secousses, pas une. */
export async function echec() {
  const m = await greffon()
  try { await m?.Haptics.notification({ type: m.NotificationType.Error }) } catch { /* agrément */ }
}
