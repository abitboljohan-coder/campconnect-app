// Supabase MOCK — uniquement pour le build démo (captures d'écran du site).
// Rend les vrais composants de l'app avec un jeu de données réaliste, sans backend.
export { todayISO, presentFilter } from '../lib/presence'
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

// Livret repris de scripts/sql/seed_flots_bleus.sql. Sans lui, l'onglet Infos
// de la démo n'afficherait que l'état « demandez à la réception » : les
// rubriques fictives de repli ont disparu de l'application.
const DEMO_INFOS = [
  { id: 'plage',     emoji: '🏖️', titre: 'Accès plage',        contenu: 'Accès direct à la plage de Saint-Pons-les-Mûres, 200 m.\nSurveillée 10h – 19h en juillet-août.\nDouches et rinçage à la sortie du camping.\nTransats et paddles en location sur place.' },
  { id: 'bateau',    emoji: '⛵', titre: 'Navette Saint-Tropez', contenu: "Départ du port de Port Grimaud, 15 minutes de traversée.\nToutes les heures de 9h à 19h en saison.\n8 € l'aller, 14 € l'aller-retour.\nBien plus agréable que la route en été." },
  { id: 'piscine',   emoji: '🏊', titre: 'Espace aquatique',   contenu: 'Bassin principal chauffé 9h – 20h.\nPataugeoire 9h – 19h.\nToboggans 11h – 13h et 15h – 18h.\nShort de bain interdit.' },
  { id: 'reception', emoji: '🏠', titre: 'Réception',          contenu: 'Basse saison : 9h – 12h et 14h – 18h.\nJuillet-août : 8h – 20h en continu.\nUrgence nuit : 06 12 34 56 78.' },
  { id: 'wifi',      emoji: '📶', titre: 'Wi-Fi',              contenu: 'Réseau : FlotsBleus-Invites\nCode : grimaud2026\nDébit renforcé près de la réception et du snack.' },
  { id: 'snack',     emoji: '🍺', titre: 'Bar & snack Le Ponton', contenu: "Petit-déjeuner 8h – 10h30.\nRestauration continue 12h – 22h.\nBar jusqu'à minuit, 1h les soirs d'animation.\nPizzas à emporter sur commande." },
  { id: 'epicerie',  emoji: '🥖', titre: 'Épicerie & dépôt de pain', contenu: 'Ouverte 8h – 12h30 et 16h – 19h30.\nPain et viennoiseries sur réservation la veille avant 19h.' },
  { id: 'laverie',   emoji: '👕', titre: 'Laverie',            contenu: 'Bloc sanitaire B, 7h – 22h.\nLave-linge 4 € · sèche-linge 3 €.\nJetons à la réception et au bar.' },
  { id: 'tri',       emoji: '♻️', titre: 'Tri & poubelles',    contenu: "Point tri à l'entrée et près du bloc C.\nVerre : conteneur du parking.\nCollecte tous les matins à 7h30.\nMistral : rentrez vos sacs, ils s'envolent." },
  { id: 'animaux',   emoji: '🐾', titre: 'Animaux',            contenu: 'Acceptés tenus en laisse, 4 €/nuit.\nInterdits à l\'espace aquatique et au snack.\nSac de ramassage disponible à la réception.' },
  { id: 'services',  emoji: '🚿', titre: 'Services',           contenu: "Aire de vidange camping-car à l'entrée.\nBornes de recharge électrique sur le parking visiteurs.\nLocation de vélos à la réception, 12 €/jour." },
  { id: 'urgences',  emoji: '🚨', titre: 'Urgences',           contenu: 'Réception : 04 94 56 00 00\nSAMU 15 · Police 17 · Pompiers 18\nUrgence européenne : 112\nPharmacie la plus proche : 600 m, av. de la Mer.' },
]

// Même identité que le camping vitrine créé en production par
// scripts/sql/seed_flots_bleus.sql : les captures des stores, la démo
// commerciale et le lien de revue montrent ainsi le même camping.
export const DEMO_CAMPING = {
  id: 'camp-demo',
  nom: 'Camping Les Flots Bleus',
  slug: 'les-flots-bleus',
  couleur_principale: '#0e7490',
  couleur_secondaire: '#134e4a',
  logo_url: null,
  plan_url: null,
  carte_config: { center: CENTER, perimeter: PERIMETER, pins: PINS },
  infos: DEMO_INFOS,
}

const dansJours = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10) }

// Profil complet, pour que l'écran Profil de la démo montre tout ce qu'il sait
// afficher. « Randonnée » est volontairement un ancien libellé français : la
// démo prouve ainsi qu'un profil d'avant les codes s'affiche toujours.
export const DEMO_VACANCIER = {
  id: 'vac-1', camping_id: 'camp-demo', pseudo: 'Julie',
  avatar_emoji: '🏄‍♀️', emplacement: 'B12', date_depart: dansJours(5),
  tranche_age: '26-35', avec: 'amis',
  interests: ['plage', 'paddle', 'apero', 'yoga', 'Randonnée', 'petanque'],
}

// Les personnages ont eux aussi des centres d'intérêt : leur mini-fiche
// (appui sur un avatar du chat, d'un statut) montre ce qu'ils partagent avec
// Julie. Léa en a trois en commun, Marc un seul, Tom aucun ; Sophie garde un
// ancien libellé français (« Plage ») qui doit compter comme « plage ».
const VACS = [
  DEMO_VACANCIER,
  { id: 'vac-2', pseudo: 'Marc',   avatar_emoji: '🚴', emplacement: 'A04', camping_id: 'camp-demo',
    avec: 'famille', interests: ['velo', 'petanque', 'padel', 'cuisine'] },
  { id: 'vac-3', pseudo: 'Sophie', avatar_emoji: '🧘‍♀️', emplacement: 'C21', camping_id: 'camp-demo',
    avec: 'couple', interests: ['Plage', 'lecture', 'nature'] },
  { id: 'vac-4', pseudo: 'Tom',    avatar_emoji: '🎸', emplacement: 'D08', camping_id: 'camp-demo',
    avec: 'solo', interests: ['musique', 'soirees', 'jeux'] },
  { id: 'vac-5', pseudo: 'Léa',    avatar_emoji: '🏊‍♀️', emplacement: 'B15', camping_id: 'camp-demo',
    avec: 'amis', interests: ['piscine', 'plage', 'apero', 'paddle', 'photo', 'soirees'] },
]

const GROUPES = [
  { id: 'g1', camping_id: 'camp-demo', titre: 'Apéro pétanque', emoji: '🍹', lieu: 'Terrain de pétanque', heure: iso(18, 30), max_membres: 12, actif: true, created_at: ago(120), createur_id: 'vac-2' },
  { id: 'g2', camping_id: 'camp-demo', titre: 'Rando cascade', emoji: '🥾', lieu: 'Entrée principale', heure: iso(9), max_membres: 8, actif: true, created_at: ago(300), createur_id: 'vac-3' },
  { id: 'g3', camping_id: 'camp-demo', titre: 'Tournoi de volley', emoji: '🏐', lieu: 'Plage', heure: iso(16), max_membres: 16, actif: true, created_at: ago(60), createur_id: 'vac-4' },
  { id: 'g4', camping_id: 'camp-demo', titre: 'Soirée jeux de société', emoji: '🎲', lieu: 'Bar du camping', heure: iso(21), max_membres: 10, actif: true, created_at: ago(30), createur_id: 'vac-5' },
]

// Dans l'ordre des horaires : le faux client ignore .order('debut'), et
// l'agenda de la démo affichait « Ce soir » avant « Cet après-midi ».
const ANIMATIONS = [
  { id: 'a1', camping_id: 'camp-demo', titre: 'Cours d\'aquagym', emoji: '💦', lieu: 'Piscine', debut: iso(10), places_max: 20, publiee: true },
  { id: 'a4', camping_id: 'camp-demo', titre: 'Atelier poterie enfants', emoji: '🏺', lieu: 'Club enfants', debut: iso(15), places_max: 12, publiee: true },
  { id: 'a2', camping_id: 'camp-demo', titre: 'Marché nocturne', emoji: '🛍️', lieu: 'Place centrale', debut: iso(19), places_max: 0, publiee: true },
  { id: 'a3', camping_id: 'camp-demo', titre: 'Concert live', emoji: '🎤', lieu: 'Scène', debut: iso(21, 30), places_max: 0, publiee: true },
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

const SIGNALEMENTS = [
  { id: 'sg1', camping_id: 'camp-demo', vacancier_id: 'vac-3', categorie: 'bruit', statut: 'nouveau', lieu: 'Sanitaires allée C',
    description: 'Musique forte après minuit près des sanitaires, trois soirs de suite.', created_at: ago(35),
    vacanciers: { pseudo: 'Sophie', avatar_emoji: '🧘‍♀️', emplacement: 'C21' } },
  { id: 'sg2', camping_id: 'camp-demo', vacancier_id: 'vac-2', categorie: 'contenu', statut: 'nouveau', cible_type: 'message', cible_id: 'm9',
    description: 'Harcèlement', cible_texte: 'Message insultant envoyé dans le groupe Apéro pétanque', auteur_signale_id: 'vac-4', created_at: ago(90),
    vacanciers: { pseudo: 'Marc', avatar_emoji: '🚴', emplacement: 'A04' }, auteur: { pseudo: 'Tom', avatar_emoji: '🎸', banni: false } },
  { id: 'sg3', camping_id: 'camp-demo', vacancier_id: 'vac-5', categorie: 'panne', statut: 'en_cours', lieu: 'Douche n°4',
    description: 'Plus d’eau chaude depuis ce matin.', created_at: ago(300),
    vacanciers: { pseudo: 'Léa', avatar_emoji: '🏊‍♀️', emplacement: 'B15' } },
]

// Petites annonces et objets trouvés : sans elles, l'écran Annonces de la démo
// ne montrait que son état vide.
const dansHeures = (h) => new Date(Date.now() + h * 3600000).toISOString()
const ANNONCES = [
  { id: 'an1', camping_id: 'camp-demo', vacancier_id: 'vac-3', type: 'trouve', titre: 'Doudou lapin trouvé près de la piscine',
    description: 'Gris, avec un ruban bleu. Je le garde à l’emplacement C21.', photo_url: null, resolu: false,
    created_at: ago(50), expire_at: dansHeures(70), vacanciers: { pseudo: 'Sophie', avatar_emoji: '🧘‍♀️' } },
  { id: 'an2', camping_id: 'camp-demo', vacancier_id: 'vac-4', type: 'perdu', titre: 'Lunettes de soleil perdues',
    description: 'Monture écaille, sans doute au terrain de volley hier soir.', photo_url: null, resolu: false,
    created_at: ago(180), expire_at: dansHeures(60), vacanciers: { pseudo: 'Tom', avatar_emoji: '🎸' } },
  { id: 'an3', camping_id: 'camp-demo', vacancier_id: 'vac-2', type: 'annonce', titre: 'Je prête un jeu de pétanque',
    description: 'Emplacement A04, passez quand vous voulez avant 18 h.', photo_url: null, resolu: false,
    created_at: ago(300), expire_at: dansHeures(48), vacanciers: { pseudo: 'Marc', avatar_emoji: '🚴' } },
]

const SEED = {
  signalements: SIGNALEMENTS,
  annonces: ANNONCES,
  campings: [DEMO_CAMPING],
  vacanciers: VACS,
  groupes: GROUPES,
  animations: ANIMATIONS,
  statuts: STATUTS,
  messages: MESSAGES,
  inscriptions: INSCRIPTIONS,
  membres_groupes: MEMBRES,
  positions: [],
  // L'espace gérant de la démo (/admin) : sans gérant, il restait sur l'écran
  // de connexion et la carte du code d'accès ne se montrait pas.
  gerants: [{ id: 'ger-demo', user_id: 'demo-uid', camping_id: 'camp-demo', campings: DEMO_CAMPING }],
}

class Query {
  constructor(table) { this.table = table; this._head = false; this._single = false; this._eq = [] }
  select(_c, opts) { if (opts?.head) this._head = true; if (opts?.count) this._count = true; return this }
  eq(col, val) { this._eq.push([col, val]); return this }
  neq() { return this } or() { return this } in() { return this }
  gte() { return this } lte() { return this } gt() { return this } lt() { return this }
  ilike() { return this } is() { return this } not() { return this }
  order() { return this } limit() { return this } range() { return this }
  // Comme la base : la ligne créée revient avec un id et sa date. Sans date,
  // un message envoyé dans la démo s'affichait sous « Invalid Date ».
  insert(rows) {
    const row = Array.isArray(rows) ? rows[0] : rows
    this._ret = { id: `demo-${Date.now()}`, created_at: new Date().toISOString(), ...row }
    return this
  }
  update() { return this } delete() { this._delete = true; return this } upsert() { return this }
  single() { this._single = true; return this }
  maybeSingle() { this._single = true; return this }
  then(resolve) { resolve(this._resolve()) }
  _resolve() {
    const rows = SEED[this.table] || []
    // Suppression : réussit toujours, comme le veut l'app (.select() non vide).
    // Seuls les messages sont réellement retirés, pour que celui que l'on
    // supprime dans la démo ne revienne pas au retour au premier plan ; les
    // autres tables gardent leur jeu de données intact pendant la présentation.
    if (this._delete) {
      if (this.table === 'messages') {
        const vise = r => this._eq.every(([c, v]) => r[c] === v)
        for (let i = rows.length - 1; i >= 0; i--) if (vise(rows[i])) rows.splice(i, 1)
      }
      return { data: [Object.fromEntries(this._eq)], error: null }
    }
    if (this._head || this._count) return { count: rows.length, data: null, error: null }
    if (this._ret) return { data: this._ret, error: null }
    // Les filtres .eq() comptent pour une ligne unique : la mini-fiche de Léa
    // doit ramener Léa, pas la première vacancière de la table. Sans
    // correspondance, l'ancien comportement (la première ligne) est gardé.
    if (this._single) {
      const vise = r => this._eq.every(([c, v]) => !(c in r) || r[c] === v)
      return { data: rows.find(vise) || rows[0] || null, error: null }
    }
    return { data: rows, error: null }
  }
}

// Doit exposer toute la surface de RealtimeChannel utilisée par l'app, sinon la
// démo lève « canal.untrack is not a function » et l'écran se vide en pleine
// présentation. usePresence.js appelle track / untrack / presenceState.
const noopChannel = {
  on() { return this },
  subscribe(cb) { cb?.('SUBSCRIBED'); return this },
  unsubscribe() { return this },
  track: async () => ({ status: 'ok' }),
  untrack: async () => ({ status: 'ok' }),
  presenceState: () => ({ 'vac-1': [{}] }),   // un vacancier « en ligne »
  send: async () => ({ status: 'ok' }),
}

// Entrée dans le camping (verifier_acces_camping, rejoindre_camping) et carte
// du gérant (acces_camping, changer_cle_acces), simulées avec les mêmes règles
// que la base : QR code (clé), code du jour, GPS à moins de 800 m du centre,
// dix codes faux au plus. Arriver par un lien /join/ fait de la démo un
// nouveau visiteur, pour montrer l'inscription ; sinon Julie est déjà inscrite.
export const DEMO_CODE = '4821'
let demoCleQR = 'c0ffee00c0ffee00c0ffee00c0ffee00'
let demoEchecs = 0
let demoInscrit = !(typeof window !== 'undefined' && /^\/join\//.test(window.location.pathname))
const DEMO_JETON = 'jeton-demo'

function demoPreuve(p = {}) {
  if (p.jeton) return p.jeton === DEMO_JETON ? null : 'verification_expiree'
  if (p.cle) return p.cle === demoCleQR ? null : 'qr_perime'
  if (p.lat != null || p.lng != null) {
    const d = Math.hypot((p.lat - CENTER.lat) * 111_000, (p.lng - CENTER.lng) * 111_000 * Math.cos(CENTER.lat * Math.PI / 180))
    return d < 800 ? null : 'hors_camping'
  }
  if (p.code != null) {
    if (demoEchecs >= 10) return 'trop_essais'
    if (p.code === DEMO_CODE) return null
    demoEchecs++
    return 'code_faux'
  }
  return 'preuve_manquante'
}

// Fonctions de la base (src/lib/vacanciers.js) : les profils complets ne se
// lisent que par elles. Les personnages restent présents toute la démo.
const RPC = {
  verifier_acces_camping: ({ p_preuve } = {}) => {
    const refus = demoPreuve(p_preuve)
    return refus ? { ok: false, erreur: refus } : { ok: true, jeton: DEMO_JETON }
  },
  rejoindre_camping: ({ p_preuve, p_profil } = {}) => {
    if (!p_profil?.pseudo?.trim()) return { ok: false, erreur: 'pseudo_obligatoire' }
    if (p_profil.cgu !== true) return { ok: false, erreur: 'cgu_obligatoires' }
    const refus = demoPreuve(p_preuve)
    if (refus) return { ok: false, erreur: refus }
    Object.assign(DEMO_VACANCIER, {
      pseudo: p_profil.pseudo.trim(),
      avatar_emoji: p_profil.avatar_emoji || DEMO_VACANCIER.avatar_emoji,
      emplacement: p_profil.emplacement || DEMO_VACANCIER.emplacement,
      date_depart: p_profil.date_depart || DEMO_VACANCIER.date_depart,
    })
    demoInscrit = true
    return { ok: true, id: DEMO_VACANCIER.id }
  },
  acces_camping: () => ({ code: DEMO_CODE, cle: demoCleQR }),
  changer_cle_acces: () => {
    demoCleQR = Array.from({ length: 32 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('')
    return demoCleQR
  },
  mon_profil: () => (demoInscrit ? [DEMO_VACANCIER] : []),
  vacanciers_du_camping: () => VACS.map(v => ({ created_at: ago(600), date_depart: dansJours(4), banni: false, ...v })),
  vacanciers_presents: () => VACS.map(v => ({ id: v.id, avatar_emoji: v.avatar_emoji })),
}

export const supabase = {
  from: (t) => new Query(t),
  channel: () => noopChannel,
  removeChannel: () => {},
  rpc: async (nom, args) => ({ data: RPC[nom]?.(args) ?? null, error: null }),
  auth: {
    getSession: async () => ({ data: { session: { user: { id: 'demo-uid', email: 'demo@camp.fr' } } } }),
    getUser: async () => ({ data: { user: { id: 'demo-uid', email: 'demo@camp.fr' } } }),
    signInAnonymously: async () => ({ data: { session: {} }, error: null }),
    signInWithPassword: async () => ({ data: { session: {} }, error: null }),
    signUp: async () => ({ data: { session: {} }, error: null }),
    signOut: async () => {},
    // Paramètres (email, mot de passe) et « Mot de passe oublié ? » de la connexion gérant.
    updateUser: async () => ({ data: { user: { id: 'demo-uid' } }, error: null }),
    resetPasswordForEmail: async () => ({ data: {}, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
  },
  storage: {
    from: () => ({
      getPublicUrl: () => ({ data: { publicUrl: '' } }),
      upload: async () => ({ error: null }),
    }),
  },
}
