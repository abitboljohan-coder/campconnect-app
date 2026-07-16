import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: { params: { eventsPerSecond: 10 } },
})

// Filtre "encore présent au camping" : pas de date de départ, ou départ aujourd'hui/futur.
// Usage : .or(presentFilter())  ou  .or(presentFilter(), { foreignTable: 'vacanciers' })
export const todayISO = () => new Date().toISOString().slice(0, 10)
export const presentFilter = () => `date_depart.is.null,date_depart.gte.${todayISO()}`