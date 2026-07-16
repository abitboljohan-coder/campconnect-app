import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey, {
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