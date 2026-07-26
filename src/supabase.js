import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Sans .env au moment du build, createClient lève une exception qui casse toute
// l'app avec un écran blanc illisible. On affiche un message explicite à la place.
if (!supabaseUrl || !supabaseKey) {
  const msg = 'Configuration manquante : le fichier .env (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY) était absent au moment du build.'
  console.error(msg)
  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
      document.body.innerHTML = `<div style="font-family:sans-serif;padding:32px;color:#b91c1c;line-height:1.7">
        <h2 style="margin:0 0 12px">⚠️ Configuration manquante</h2>
        <p>${msg}</p>
        <p style="color:#6b7280;font-size:14px">Créez le fichier <code>.env</code> à la racine du projet, puis relancez <code>npm run build:mobile</code>.</p>
      </div>`
    })
  }
}

// Valeurs de repli : createClient lève si l'URL est vide. Avec ce repli, l'app
// affiche le message ci-dessus au lieu d'un écran blanc.
export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder', {
  auth: { persistSession: true, autoRefreshToken: true },
  realtime: { params: { eventsPerSecond: 10 } },
})

// Session anonyme : chaque vacancier reçoit une identité auth vérifiable côté base,
// ce qui permet le cloisonnement RLS par camping (aucun compte à créer pour l'utilisateur).
let _anonPromise = null
export function ensureAnonSession() {
  if (_anonPromise) return _anonPromise
  _anonPromise = (async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) return session
    const { data, error } = await supabase.auth.signInAnonymously()
    if (error) { _anonPromise = null; return null }
    return data.session
  })()
  return _anonPromise
}

// Filtre "encore présent au camping" : pas de date de départ, ou départ aujourd'hui/futur.
// Usage : .or(presentFilter())  ou  .or(presentFilter(), { foreignTable: 'vacanciers' })
export const todayISO = () => new Date().toISOString().slice(0, 10)
export const presentFilter = () => `date_depart.is.null,date_depart.gte.${todayISO()}`