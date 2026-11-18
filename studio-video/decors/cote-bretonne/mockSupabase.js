// Supabase MOCK — uniquement pour le build démo (captures d'écran du site).
// Rend les vrais composants de l'app avec un jeu de données réaliste, sans backend.
export { todayISO, presentFilter } from '../lib/presence'
export const ensureAnonSession = async () => ({ user: { id: 'demo-uid' } })

const iso = (h, m = 0) => { const d = new Date(); d.setHours(h, m, 0, 0); return d.toISOString() }
const ago = (min) => new Date(Date.now() - min * 60000).toISOString()

// ── Décor de tournage « cote-bretonne » ──────────────────────────────────────
// Camping FICTIF 4★ sur la Côte de Granit Rose (Trégastel, Côtes-d’Armor) :
// criques, marées, sentier des douaniers, crêpes et fest-noz. Données seules :
// le code du mock est celui de src/demo/mockSupabase.js
// (voir studio-video/decors/README.md).
const jour = (j, h, m = 0) => { const d = new Date(); d.setDate(d.getDate() + j); d.setHours(h, m, 0, 0); return d.toISOString() }
const dansJours = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10) }
const dansHeures = (h) => new Date(Date.now() + h * 3600000).toISOString()

const CENTER = { lat: 48.8155, lng: -3.5035 }
const PERIMETER = [
  [48.8167, -3.5052], [48.8167, -3.5018], [48.8143, -3.5018], [48.8143, -3.5052],
]
const PINS = [
  { ref_id: 'l1', ref_type: 'lieu', label: 'Piscine couverte', emoji: '🏊', color: '#38bdf8', lat: 48.8159, lng: -3.5040, osm: true },
  { ref_id: 'l2', ref_type: 'lieu', label: 'Sanitaires',       emoji: '🚻', color: '#64748b', lat: 48.8149, lng: -3.5026, osm: true },
  { ref_id: 'l3', ref_type: 'lieu', label: 'Crêperie',         emoji: '🥞', color: '#ef4444', lat: 48.8163, lng: -3.5028, osm: true },
  { ref_id: 'l4', ref_type: 'lieu', label: 'Réception',        emoji: '🏠', color: '#3b82f6', lat: 48.8146, lng: -3.5048, osm: true },
  { ref_id: 'l5', ref_type: 'lieu', label: 'Accès crique',     emoji: '🏖️', color: '#f59e0b', lat: 48.8165, lng: -3.5020, osm: true },
  { ref_id: 'l6', ref_type: 'lieu', label: 'Chapiteau',        emoji: '🎪', color: '#a855f7', lat: 48.8152, lng: -3.5033, osm: true },
]

const DEMO_INFOS = [
  { id: 'plage',     emoji: '🏖️', titre: 'Crique & plages',    contenu: 'Crique de sable fin à 300 m par le petit chemin.\nPlage surveillée du bourg à 1 km, 13h – 19h en juillet-août.\nEau à 18° : les courageux sont récompensés.' },
  { id: 'marees',    emoji: '🌊', titre: 'Marées & pêche à pied', contenu: 'Horaires des marées affichés chaque jour à la réception.\nRemontez avant la marée montante, elle arrive vite.\nRespectez les tailles minimales : réglette offerte à l’accueil.' },
  { id: 'sentier',   emoji: '🥾', titre: 'Sentier des douaniers', contenu: 'Le GR34 passe à 200 m du portail nord.\nPloumanac’h et ses chaos de granit rose : 1 h 30 à pied.\nChaussures fermées conseillées.' },
  { id: 'piscine',   emoji: '🏊', titre: 'Piscine couverte',   contenu: 'Bassin chauffé à 28° 9h – 20h.\nJacuzzi réservé aux adultes 18h – 20h.\nShort de bain interdit.' },
  { id: 'reception', emoji: '🏠', titre: 'Réception',          contenu: 'Juillet-août : 8h30 – 20h en continu.\nSoazig et Erwan vous accueillent.\nPrêt de jeux de société et de jumelles.' },
  { id: 'wifi',      emoji: '📶', titre: 'Wi-Fi',              contenu: 'Réseau : PorsGwenn-Invites\nCode : bienvenue\nMeilleur signal à la crêperie.' },
  { id: 'creperie',  emoji: '🥞', titre: 'Crêperie Ty Gwenn',  contenu: 'Galettes et crêpes 12h – 14h et 18h30 – 21h30.\nKouign-amann le dimanche matin.\nCidre et jus de pomme bretons.' },
  { id: 'epicerie',  emoji: '🥖', titre: 'Épicerie & pain',    contenu: 'Ouverte 8h – 12h30 et 16h – 19h30.\nPain et viennoiseries : commande la veille avant 19h.\nHuîtres et poisson du port le vendredi.' },
  { id: 'kayak',     emoji: '🛶', titre: 'Kayak & paddle',     contenu: 'Location à la cale, 2 h avant et après la pleine mer.\nGilet obligatoire, fourni.\nSortie encadrée vers les Sept-Îles le mardi.' },
  { id: 'laverie',   emoji: '👕', titre: 'Laverie',            contenu: 'Bloc sanitaire A, 8h – 21h.\nLave-linge 5 € · sèche-linge 3 €.\nJetons à la réception.' },
  { id: 'tri',       emoji: '♻️', titre: 'Tri & poubelles',    contenu: 'Point tri à l’entrée et près du bloc B.\nVerre et coquilles : bac dédié au parking.\nCollecte chaque matin à 7h30.' },
  { id: 'animaux',   emoji: '🐾', titre: 'Animaux',            contenu: 'Acceptés tenus en laisse, 3,50 €/nuit.\nInterdits à la piscine et à la crêperie.' },
  { id: 'urgences',  emoji: '🚨', titre: 'Urgences',           contenu: 'Réception : 02 96 00 58 14\nSAMU 15 · Police 17 · Pompiers 18\nUrgence en mer : 196 · Europe : 112\nPharmacie au bourg, 1 km.' },
]

export const DEMO_CAMPING = {
  id: 'camp-demo',
  nom: 'Camping Pors Gwenn',
  slug: 'pors-gwenn',
  couleur_principale: '#1d4e89',
  couleur_secondaire: '#0b2545',
  logo_url: null,
  plan_url: null,
  carte_config: { center: CENTER, perimeter: PERIMETER, pins: PINS },
  infos: DEMO_INFOS,
}

// Margaux, en couple. Nolwenn partage trois centres d’intérêt avec elle
// (randonnée, photo, paddle), Yann un seul, Antoine aucun.
export const DEMO_VACANCIER = {
  id: 'vac-1', camping_id: 'camp-demo', pseudo: 'Margaux',
  avatar_emoji: '🚣‍♀️', emplacement: 'K21', date_depart: dansJours(4),
  tranche_age: '26-35', avec: 'couple', created_at: jour(-5, 17, 0),
  interests: ['randonnee', 'photo', 'paddle', 'cuisine', 'lecture', 'nature'],
}

const VACS = [
  DEMO_VACANCIER,
  { id: 'vac-2',  pseudo: 'Yann',    avatar_emoji: '⛵',    emplacement: 'K04', camping_id: 'camp-demo', tranche_age: '46-60', avec: 'famille', date_depart: dansJours(5), created_at: jour(-6, 16, 0),  interests: ['nature', 'jeux', 'petanque'] },
  { id: 'vac-3',  pseudo: 'Gwen',    avatar_emoji: '🐚',    emplacement: 'M12', camping_id: 'camp-demo', tranche_age: '36-45', avec: 'famille', date_depart: dansJours(3), created_at: jour(-4, 11, 20), interests: ['plage', 'enfants', 'piscine'] },
  { id: 'vac-4',  pseudo: 'Antoine', avatar_emoji: '🎻',    emplacement: 'M03', camping_id: 'camp-demo', tranche_age: '18-25', avec: 'amis',    date_depart: dansJours(2), created_at: jour(-3, 18, 15), interests: ['musique', 'soirees', 'sport'] },
  { id: 'vac-5',  pseudo: 'Nolwenn', avatar_emoji: '📸',    emplacement: 'K19', camping_id: 'camp-demo', tranche_age: '26-35', avec: 'amis',    date_depart: dansJours(4), created_at: jour(-4, 17, 30), interests: ['randonnee', 'photo', 'paddle', 'soirees'] },
  { id: 'vac-6',  pseudo: 'Jean-Luc',avatar_emoji: '🦀',    emplacement: 'A08', camping_id: 'camp-demo', tranche_age: '60+',   avec: 'couple',  date_depart: dansJours(10), created_at: jour(-9, 15, 0), interests: ['nature', 'cuisine', 'lecture'] },
  { id: 'vac-7',  pseudo: 'Pauline', avatar_emoji: '🌸',    emplacement: 'M15', camping_id: 'camp-demo', tranche_age: '36-45', avec: 'famille', date_depart: dansJours(6), created_at: jour(-2, 10, 45), interests: ['enfants', 'plage', 'cuisine'] },
  { id: 'vac-8',  pseudo: 'Malo',    avatar_emoji: '🪁',    emplacement: 'M16', camping_id: 'camp-demo', tranche_age: '18-25', avec: 'famille', date_depart: dansJours(6), created_at: jour(-2, 10, 50), interests: ['sport', 'jeux', 'plage'] },
  { id: 'vac-9',  pseudo: 'Brigitte',avatar_emoji: '🌿',    emplacement: 'A02', camping_id: 'camp-demo', tranche_age: '60+',   avec: 'couple',  date_depart: dansJours(0), created_at: jour(-8, 14, 30), interests: ['randonnee', 'nature', 'lecture'] },
  { id: 'vac-10', pseudo: 'Thomas',  avatar_emoji: '🏄',    emplacement: 'K11', camping_id: 'camp-demo', tranche_age: '26-35', avec: 'amis',    date_depart: dansJours(3), created_at: jour(-1, 19, 20), interests: ['sport', 'paddle', 'apero'] },
  { id: 'vac-11', pseudo: 'Sophie',  avatar_emoji: '🧶',    emplacement: 'A11', camping_id: 'camp-demo', tranche_age: '46-60', avec: 'couple',  date_depart: dansJours(7), created_at: jour(-3, 16, 40), interests: ['lecture', 'cuisine', 'yoga'] },
  { id: 'vac-12', pseudo: 'Enzo',    avatar_emoji: '🐬',    emplacement: 'M07', camping_id: 'camp-demo', tranche_age: '18-25', avec: 'famille', date_depart: dansJours(5), created_at: jour(0, 9, 40),   interests: ['piscine', 'jeux', 'sport'] },
  { id: 'vac-13', pseudo: 'Hélène',  avatar_emoji: '☕',    emplacement: 'K08', camping_id: 'camp-demo', tranche_age: '36-45', avec: 'solo',    date_depart: dansJours(4), created_at: jour(-1, 12, 10), interests: ['randonnee', 'yoga', 'photo'] },
  { id: 'vac-14', pseudo: 'Loïc',    avatar_emoji: '🎣',    emplacement: 'A05', camping_id: 'camp-demo', tranche_age: '46-60', avec: 'famille', date_depart: dansJours(8), created_at: jour(-5, 9, 30),  interests: ['nature', 'petanque', 'apero'] },
]
const qui = id => { const v = VACS.find(x => x.id === id); return { pseudo: v.pseudo, avatar_emoji: v.avatar_emoji } }

// Groupes du jour (créés par les vacanciers), puis ceux des jours passés :
// masqués côté vacancier, ils remplissent les statistiques du gérant.
const GROUPES = [
  { id: 'g1', camping_id: 'camp-demo', titre: 'Coucher de soleil à Ploumanac’h', emoji: '🌅', lieu: 'Portail nord', heure: jour(0, 20, 45), max_membres: 10, actif: true, created_at: ago(100), createur_id: 'vac-5' },
  { id: 'g2', camping_id: 'camp-demo', titre: 'Baignade du matin',        emoji: '🥶', lieu: 'Crique',             heure: jour(0, 8, 0),   max_membres: 10, actif: true, created_at: ago(780), createur_id: 'vac-10' },
  { id: 'g3', camping_id: 'camp-demo', titre: 'Cerf-volant sur la grève', emoji: '🪁', lieu: 'Plage du bourg',     heure: jour(0, 17, 30), max_membres: 10, actif: true, created_at: ago(55),  createur_id: 'vac-8' },
  { id: 'g4', camping_id: 'camp-demo', titre: 'Palets bretons',           emoji: '🥏', lieu: 'Terrain de boules',  heure: jour(0, 18, 0),  max_membres: 8,  actif: true, created_at: ago(130), createur_id: 'vac-14' },
  { id: 'g5', camping_id: 'camp-demo', titre: 'Initiation danses bretonnes', emoji: '💃', lieu: 'Chapiteau',       heure: jour(0, 20, 30), max_membres: 16, actif: true, created_at: ago(30),  createur_id: 'vac-4' },
  { id: 'g6', camping_id: 'camp-demo', titre: 'Balade aux Sept-Îles',     emoji: '⛵', lieu: 'Parking',            heure: jour(-1, 10, 0), max_membres: 6,  actif: true, created_at: jour(-2, 19, 10), createur_id: 'vac-2' },
  { id: 'g7', camping_id: 'camp-demo', titre: 'Pêche aux crabes',         emoji: '🦀', lieu: 'Rochers de la crique', heure: jour(-2, 11, 0), max_membres: 10, actif: true, created_at: jour(-3, 18, 0), createur_id: 'vac-6' },
  { id: 'g8', camping_id: 'camp-demo', titre: 'Apéro huîtres',            emoji: '🦪', lieu: 'Allée des Hortensias', heure: jour(-3, 19, 0), max_membres: 12, actif: true, created_at: jour(-3, 12, 20), createur_id: 'vac-14' },
  { id: 'g9', camping_id: 'camp-demo', titre: 'Footing sur le GR34',      emoji: '🏃', lieu: 'Portail nord',       heure: jour(-5, 7, 30), max_membres: 6,  actif: true, created_at: jour(-6, 21, 0),  createur_id: 'vac-13' },
]

// Dans l’ordre des horaires : le faux client ignore .order('debut').
// Le fest-noz, publié ce matin, n’a pas encore d’inscrit : l’agenda y montre « S’inscrire ».
const ANIMATIONS = [
  { id: 'a1', camping_id: 'camp-demo', titre: 'Pêche à pied',              emoji: '🦀', lieu: 'Grève de la crique', debut: jour(0, 10, 0),  places_max: 8, publiee: true },
  { id: 'a2', camping_id: 'camp-demo', titre: 'Initiation kayak de mer',   emoji: '🛶', lieu: 'Cale de mise à l’eau', debut: jour(0, 11, 30), places_max: 6, publiee: true },
  { id: 'a3', camping_id: 'camp-demo', titre: 'Rando sentier des douaniers', emoji: '🥾', lieu: 'Portail nord',     debut: jour(0, 17, 0),  places_max: 12, publiee: true },
  { id: 'a4', camping_id: 'camp-demo', titre: 'Crêpes party',              emoji: '🥞', lieu: 'Crêperie Ty Gwenn',  debut: jour(0, 18, 30), places_max: 0,  publiee: true },
  { id: 'a5', camping_id: 'camp-demo', titre: 'Fest-noz',                  emoji: '🎻', lieu: 'Chapiteau',          debut: jour(0, 21, 30), places_max: 0,  publiee: true },
]

const STATUTS = [
  { id: 's1', camping_id: 'camp-demo', vacancier_id: 'vac-5', emoji: '🌅', texte: 'Coucher de soleil à Ploumanac’h ce soir, qui vient ?', created_at: ago(24),  vacanciers: qui('vac-5') },
  { id: 's2', camping_id: 'camp-demo', vacancier_id: 'vac-6', emoji: '🦀', texte: 'Marée basse à 10h, la pêche a été bonne 🦐', created_at: ago(300), vacanciers: qui('vac-6') },
  { id: 's3', camping_id: 'camp-demo', vacancier_id: 'vac-7', emoji: '🥞', texte: 'La galette complète de la crêperie, validée !', created_at: ago(80),  vacanciers: qui('vac-7') },
  { id: 's4', camping_id: 'camp-demo', vacancier_id: 'vac-4', emoji: '🎻', texte: 'Qui m’apprend l’an-dro avant le fest-noz ?', created_at: ago(40),  vacanciers: qui('vac-4') },
]

const MESSAGES = [
  { id: 'm1', groupe_id: 'g1', auteur_id: 'vac-5', contenu: 'Départ 20h45 du portail nord, on longe le sentier jusqu’au phare 🌅', created_at: ago(62), reactions: { '😍': 2 }, vacanciers: qui('vac-5') },
  { id: 'm2', groupe_id: 'g1', auteur_id: 'vac-1', contenu: 'Top ! J’apporte mon appareil photo et des crêpes 📸', created_at: ago(55), reactions: { '👍': 3 }, vacanciers: qui('vac-1') },
  { id: 'm3', groupe_id: 'g1', auteur_id: 'vac-5', contenu: 'Génial, à tout à l’heure !', created_at: ago(49), reactions: { '🎉': 2 }, vacanciers: qui('vac-5') },
  { id: 'm4', groupe_id: 'g1', auteur_id: 'vac-13', contenu: 'Je viens aussi ! Il faut une lampe pour le retour ?', created_at: ago(20), reactions: {}, vacanciers: qui('vac-13') },
  { id: 'm5', groupe_id: 'g1', auteur_id: 'vac-5', contenu: 'Oui, une frontale, et un coupe-vent : ça souffle au bout de la pointe.', created_at: ago(14), reactions: { '🙏': 1 }, vacanciers: qui('vac-5') },
]

const inscrits = (animId, titre, ids, depuisMin) => ids.map((v, k) => {
  const p = VACS.find(x => x.id === v)
  return { id: `i-${animId}-${k}`, animation_id: animId, vacancier_id: v, created_at: ago(depuisMin - k * 23),
    vacanciers: { pseudo: p.pseudo, emplacement: p.emplacement }, animations: { titre } }
})
// Le faux client ignore les filtres : chaque ligne compte aussi comme une
// inscription de Margaux (agenda « Inscrit », compteur du Profil). D’où un
// total modeste, concentré sur les animations à places limitées.
const INSCRIPTIONS = [
  ...inscrits('a1', 'Pêche à pied', ['vac-1', 'vac-6'], 1700),
  ...inscrits('a2', 'Initiation kayak de mer', ['vac-1', 'vac-10', 'vac-5'], 1400),
  ...inscrits('a3', 'Rando sentier des douaniers', ['vac-1', 'vac-5', 'vac-13', 'vac-9', 'vac-11', 'vac-2', 'vac-14', 'vac-6'], 600),
  ...inscrits('a4', 'Crêpes party', ['vac-7'], 200),
]

const MEMBRES = [
  { id: 'mb1', groupe_id: 'g1', vacancier_id: 'vac-1', vacanciers: qui('vac-1') },
  { id: 'mb2', groupe_id: 'g1', vacancier_id: 'vac-5', vacanciers: qui('vac-5') },
  { id: 'mb3', groupe_id: 'g1', vacancier_id: 'vac-13', vacanciers: qui('vac-13') },
]

const SIGNALEMENTS = [
  { id: 'sg1', camping_id: 'camp-demo', vacancier_id: 'vac-11', categorie: 'bruit', statut: 'nouveau', lieu: 'Allée des Hortensias',
    description: 'Un groupe chante encore après minuit près du bloc B.', created_at: ago(38),
    vacanciers: { ...qui('vac-11'), emplacement: 'A11' } },
  { id: 'sg2', camping_id: 'camp-demo', vacancier_id: 'vac-2', categorie: 'contenu', statut: 'nouveau', cible_type: 'message', cible_id: 'm9',
    description: 'Publicité', cible_texte: 'Sortie en bateau pas chère, écrivez-moi en privé !', auteur_signale_id: 'vac-10', created_at: ago(125),
    vacanciers: { ...qui('vac-2'), emplacement: 'K04' }, auteur: { ...qui('vac-10'), banni: false } },
  { id: 'sg3', camping_id: 'camp-demo', vacancier_id: 'vac-7', categorie: 'panne', statut: 'en_cours', lieu: 'Bloc sanitaire A',
    description: 'Le sèche-linge n°2 ne chauffe plus.', created_at: ago(280),
    vacanciers: { ...qui('vac-7'), emplacement: 'M15' } },
]

const ANNONCES = [
  { id: 'an1', camping_id: 'camp-demo', vacancier_id: 'vac-3', type: 'trouve', titre: 'Épuisette verte trouvée sur la grève',
    description: 'Laissée près des rochers à marée basse. Je la garde en M12.', photo_url: null, resolu: false,
    created_at: ago(60), expire_at: dansHeures(70), vacanciers: qui('vac-3') },
  { id: 'an2', camping_id: 'camp-demo', vacancier_id: 'vac-13', type: 'perdu', titre: 'Jumelles noires perdues',
    description: 'Sans doute sur le sentier des douaniers, vers le phare.', photo_url: null, resolu: false,
    created_at: ago(210), expire_at: dansHeures(60), vacanciers: qui('vac-13') },
  { id: 'an3', camping_id: 'camp-demo', vacancier_id: 'vac-14', type: 'annonce', titre: 'Je prête un jeu de palets',
    description: 'Emplacement A05, passez quand vous voulez avant 18 h.', photo_url: null, resolu: false,
    created_at: ago(310), expire_at: dansHeures(48), vacanciers: qui('vac-14') },
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
