// Supabase MOCK — uniquement pour le build démo (captures d'écran du site).
// Rend les vrais composants de l'app avec un jeu de données réaliste, sans backend.
export const todayISO = () => new Date().toISOString().slice(0, 10)
export const presentFilter = () => `date_depart.is.null,date_depart.gte.${todayISO()}`
export const ensureAnonSession = async () => ({ user: { id: 'demo-uid' } })

const iso = (h, m = 0) => { const d = new Date(); d.setHours(h, m, 0, 0); return d.toISOString() }
const ago = (min) => new Date(Date.now() - min * 60000).toISOString()

const CENTER = { lat: 44.2010, lng: 6.3013 }
const PERIMETER = [
  [44.2022, 6.2996], [44.2022, 6.3030], [44.1998, 6.3030], [44.1998, 6.2996],
]
const PINS = [
  { ref_id: 'l1', ref_type: 'lieu', label: 'Piscine',      emoji: '🏊', color: '#38bdf8', lat: 44.2015, lng: 6.3008, osm: true },
  { ref_id: 'l2', ref_type: 'lieu', label: 'Sanitaires',   emoji: '🚻', color: '#64748b', lat: 44.2004, lng: 6.3020, osm: true },
  { ref_id: 'l3', ref_type: 'lieu', label: 'Restaurant',   emoji: '🍽️', color: '#ef4444', lat: 44.2019, lng: 6.3023, osm: true },
  { ref_id: 'l4', ref_type: 'lieu', label: 'Réception',    emoji: '🏠', color: '#3b82f6', lat: 44.2001, lng: 6.3000, osm: true },
  { ref_id: 'l5', ref_type: 'lieu', label: 'Aire de jeux', emoji: '🎠', color: '#f472b6', lat: 44.2009, lng: 6.3026, osm: true },
  { ref_id: 'l6', ref_type: 'lieu', label: 'Épicerie',     emoji: '🛒', color: '#0ea5e9', lat: 44.2012, lng: 6.2999, osm: true },
]

export const DEMO_CAMPING = {
  id: 'camp-demo',
  nom: 'Camping des Cigales',
  slug: 'camping-des-cigales',
  couleur_principale: '#639922',
  logo_url: null,
  plan_url: null,
  carte_config: { center: CENTER, perimeter: PERIMETER, pins: PINS },
  infos: [],
}

export const DEMO_VACANCIER = {
  id: 'vac-1', camping_id: 'camp-demo', pseudo: 'Julie',
  avatar_emoji: '🏄‍♀️', emplacement: 'B12', date_depart: null,
}

const VACS = [
  DEMO_VACANCIER,
  { id: 'vac-2', pseudo: 'Marc',   avatar_emoji: '🚴', emplacement: 'A04', camping_id: 'camp-demo' },
  { id: 'vac-3', pseudo: 'Sophie', avatar_emoji: '🧘‍♀️', emplacement: 'C21', camping_id: 'camp-demo' },
  { id: 'vac-4', pseudo: 'Tom',    avatar_emoji: '🎸', emplacement: 'D08', camping_id: 'camp-demo' },
  { id: 'vac-5', pseudo: 'Léa',    avatar_emoji: '🏊‍♀️', emplacement: 'B15', camping_id: 'camp-demo' },
]

const GROUPES = [
  { id: 'g1', camping_id: 'camp-demo', titre: 'Apéro pétanque', emoji: '🍹', lieu: 'Terrain de pétanque', heure: iso(18, 30), max_membres: 12, actif: true, created_at: ago(120), createur_id: 'vac-2' },
  { id: 'g2', camping_id: 'camp-demo', titre: 'Rando cascade', emoji: '🥾', lieu: 'Entrée principale', heure: iso(9), max_membres: 8, actif: true, created_at: ago(300), createur_id: 'vac-3' },
  { id: 'g3', camping_id: 'camp-demo', titre: 'Tournoi de volley', emoji: '🏐', lieu: 'Plage', heure: iso(16), max_membres: 16, actif: true, created_at: ago(60), createur_id: 'vac-4' },
  { id: 'g4', camping_id: 'camp-demo', titre: 'Soirée jeux de société', emoji: '🎲', lieu: 'Bar du camping', heure: iso(21), max_membres: 10, actif: true, created_at: ago(30), createur_id: 'vac-5' },
]

const ANIMATIONS = [
  { id: 'a1', camping_id: 'camp-demo', titre: 'Cours d\'aquagym', emoji: '💦', lieu: 'Piscine', debut: iso(10), places_max: 20, publiee: true },
  { id: 'a2', camping_id: 'camp-demo', titre: 'Marché nocturne', emoji: '🛍️', lieu: 'Place centrale', debut: iso(19), places_max: 0, publiee: true },
  { id: 'a3', camping_id: 'camp-demo', titre: 'Concert live', emoji: '🎤', lieu: 'Scène', debut: iso(21, 30), places_max: 0, publiee: true },
  { id: 'a4', camping_id: 'camp-demo', titre: 'Atelier poterie enfants', emoji: '🏺', lieu: 'Club enfants', debut: iso(15), places_max: 12, publiee: true },
]

const STATUTS = [
  { id: 's1', camping_id: 'camp-demo', vacancier_id: 'vac-2', emoji: '🍻', texte: 'Qui est chaud pour l\'apéro ce soir ?', created_at: ago(25), vacanciers: { pseudo: 'Marc', avatar_emoji: '🚴' } },
  { id: 's2', camping_id: 'camp-demo', vacancier_id: 'vac-3', emoji: '🏊', texte: 'Piscine parfaite là maintenant 🔥', created_at: ago(70), vacanciers: { pseudo: 'Sophie', avatar_emoji: '🧘‍♀️' } },
  { id: 's3', camping_id: 'camp-demo', vacancier_id: 'vac-4', emoji: '🎸', texte: 'Je ramène ma guitare au feu de camp !', created_at: ago(140), vacanciers: { pseudo: 'Tom', avatar_emoji: '🎸' } },
]

const MESSAGES = [
  { id: 'm1', groupe_id: 'g1', auteur_id: 'vac-2', contenu: 'On se retrouve à 18h30 au terrain ?', created_at: ago(40), reactions: {}, vacanciers: { pseudo: 'Marc', avatar_emoji: '🚴' } },
  { id: 'm2', groupe_id: 'g1', auteur_id: 'vac-1', contenu: 'Parfait, j\'apporte les boules et le rosé 🍹', created_at: ago(38), reactions: { '👍': 3 }, vacanciers: { pseudo: 'Julie', avatar_emoji: '🏄‍♀️' } },
  { id: 'm3', groupe_id: 'g1', auteur_id: 'vac-5', contenu: 'Génial, à tout à l\'heure !', created_at: ago(12), reactions: { '🎉': 2 }, vacanciers: { pseudo: 'Léa', avatar_emoji: '🏊‍♀️' } },
]

const INSCRIPTIONS = [
  { id: 'i1', animation_id: 'a1', vacancier_id: 'vac-1', created_at: ago(200), vacanciers: { pseudo: 'Julie', emplacement: 'B12' }, animations: { titre: 'Cours d\'aquagym' } },
  { id: 'i2', animation_id: 'a1', vacancier_id: 'vac-3', created_at: ago(150), vacanciers: { pseudo: 'Sophie', emplacement: 'C21' }, animations: { titre: 'Cours d\'aquagym' } },
]

const MEMBRES = [
  { id: 'mb1', groupe_id: 'g1', vacancier_id: 'vac-1', vacanciers: { pseudo: 'Julie', avatar_emoji: '🏄‍♀️' } },
  { id: 'mb2', groupe_id: 'g1', vacancier_id: 'vac-2', vacanciers: { pseudo: 'Marc', avatar_emoji: '🚴' } },
  { id: 'mb3', groupe_id: 'g1', vacancier_id: 'vac-5', vacanciers: { pseudo: 'Léa', avatar_emoji: '🏊‍♀️' } },
]

const SEED = {
  campings: [DEMO_CAMPING],
  vacanciers: VACS,
  groupes: GROUPES,
  animations: ANIMATIONS,
  statuts: STATUTS,
  messages: MESSAGES,
  inscriptions: INSCRIPTIONS,
  membres_groupes: MEMBRES,
  positions: [],
}

class Query {
  constructor(table) { this.table = table; this._head = false; this._single = false }
  select(_c, opts) { if (opts?.head) this._head = true; if (opts?.count) this._count = true; return this }
  eq() { return this } neq() { return this } or() { return this } in() { return this }
  gte() { return this } lte() { return this } gt() { return this } lt() { return this }
  ilike() { return this } is() { return this } not() { return this }
  order() { return this } limit() { return this } range() { return this }
  insert(rows) { this._ret = Array.isArray(rows) ? rows[0] : rows; return this }
  update() { return this } delete() { return this } upsert() { return this }
  single() { this._single = true; return this }
  maybeSingle() { this._single = true; return this }
  then(resolve) { resolve(this._resolve()) }
  _resolve() {
    const rows = SEED[this.table] || []
    if (this._head || this._count) return { count: rows.length, data: null, error: null }
    if (this._ret) return { data: this._ret, error: null }
    if (this._single) return { data: rows[0] || null, error: null }
    return { data: rows, error: null }
  }
}

const noopChannel = { on() { return this }, subscribe() { return this }, unsubscribe() { return this } }

export const supabase = {
  from: (t) => new Query(t),
  channel: () => noopChannel,
  removeChannel: () => {},
  rpc: async () => ({ data: null, error: null }),
  auth: {
    getSession: async () => ({ data: { session: { user: { id: 'demo-uid', email: 'demo@camp.fr' } } } }),
    getUser: async () => ({ data: { user: { id: 'demo-uid', email: 'demo@camp.fr' } } }),
    signInAnonymously: async () => ({ data: { session: {} }, error: null }),
    signInWithPassword: async () => ({ data: { session: {} }, error: null }),
    signUp: async () => ({ data: { session: {} }, error: null }),
    signOut: async () => {},
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
  },
  storage: {
    from: () => ({
      getPublicUrl: () => ({ data: { publicUrl: '' } }),
      upload: async () => ({ error: null }),
    }),
  },
}
