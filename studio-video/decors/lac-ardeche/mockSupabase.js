// Supabase MOCK — uniquement pour le build démo (captures d'écran du site).
// Rend les vrais composants de l'app avec un jeu de données réaliste, sans backend.
export { todayISO, presentFilter } from '../lib/presence'
export const ensureAnonSession = async () => ({ user: { id: 'demo-uid' } })

const iso = (h, m = 0) => { const d = new Date(); d.setHours(h, m, 0, 0); return d.toISOString() }
const ago = (min) => new Date(Date.now() - min * 60000).toISOString()

// ── Décor de tournage « lac-ardeche » ────────────────────────────────────────
// Camping FICTIF 3★ au bord de l’Ardèche (Sud Ardèche, près de
// Vallon-Pont-d’Arc) : rivière, canoë, garrigue, producteurs locaux.
// Données seules : le code du mock est celui de src/demo/mockSupabase.js
// (voir studio-video/decors/README.md).
const jour = (j, h, m = 0) => { const d = new Date(); d.setDate(d.getDate() + j); d.setHours(h, m, 0, 0); return d.toISOString() }
const dansJours = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10) }
const dansHeures = (h) => new Date(Date.now() + h * 3600000).toISOString()

const CENTER = { lat: 44.3962, lng: 4.3812 }
const PERIMETER = [
  [44.3974, 4.3795], [44.3974, 4.3829], [44.3950, 4.3829], [44.3950, 4.3795],
]
const PINS = [
  { ref_id: 'l1', ref_type: 'lieu', label: 'Plage de galets', emoji: '🏞️', color: '#38bdf8', lat: 44.3953, lng: 4.3818, osm: true },
  { ref_id: 'l2', ref_type: 'lieu', label: 'Sanitaires',      emoji: '🚻', color: '#64748b', lat: 44.3965, lng: 4.3806, osm: true },
  { ref_id: 'l3', ref_type: 'lieu', label: 'Guinguette',      emoji: '🍷', color: '#ef4444', lat: 44.3957, lng: 4.3824, osm: true },
  { ref_id: 'l4', ref_type: 'lieu', label: 'Réception',       emoji: '🏠', color: '#3b82f6', lat: 44.3971, lng: 4.3799, osm: true },
  { ref_id: 'l5', ref_type: 'lieu', label: 'Base canoë',      emoji: '🛶', color: '#f59e0b', lat: 44.3952, lng: 4.3808, osm: true },
  { ref_id: 'l6', ref_type: 'lieu', label: 'Piscine',         emoji: '🏊', color: '#0ea5e9', lat: 44.3968, lng: 4.3815, osm: true },
]

const DEMO_INFOS = [
  { id: 'riviere',   emoji: '🏞️', titre: 'Baignade en rivière', contenu: 'Plage de galets au bout de l’allée des Chênes.\nBaignade non surveillée : enfants accompagnés.\nChaussures d’eau conseillées, en vente à l’épicerie.' },
  { id: 'canoe',     emoji: '🛶', titre: 'Canoë & kayak',      contenu: 'Départ depuis notre base, au bord de l’eau.\nMini-descente 8 km jusqu’au Pont d’Arc, retour en navette.\nGilets fournis · réservation à la réception.' },
  { id: 'piscine',   emoji: '🏊', titre: 'Piscine',            contenu: 'Bassin et pataugeoire 10h – 19h30.\nTransats à disposition.\nShort de bain interdit.' },
  { id: 'reception', emoji: '🏠', titre: 'Réception',          contenu: 'Juillet-août : 8h30 – 12h30 et 14h – 20h.\nFabrice et Nadège vous accueillent.\nUrgence nuit : numéro affiché à la porte.' },
  { id: 'wifi',      emoji: '📶', titre: 'Wi-Fi',              contenu: 'Réseau : RiveAuxCigales-Invites\nCode : bienvenue\nMeilleur signal à la guinguette.' },
  { id: 'guinguette', emoji: '🍷', titre: 'Guinguette & snack', contenu: 'Pizzas au feu de bois et planches de producteurs 18h – 22h.\nBar jusqu’à 23h30.\nConcert le vendredi soir.' },
  { id: 'epicerie',  emoji: '🥖', titre: 'Épicerie & pain',    contenu: 'Ouverte 8h – 12h et 17h – 19h30.\nPain à commander la veille avant 19h.\nPicodon, crème de marrons et vins d’Ardèche.' },
  { id: 'marche',    emoji: '🧺', titre: 'Marchés',            contenu: 'Vallon-Pont-d’Arc : jeudi matin.\nMarché des producteurs au camping : mardi 18h.' },
  { id: 'visites',   emoji: '🦣', titre: 'À voir autour',      contenu: 'Pont d’Arc et belvédères des gorges.\nGrotte Chauvet 2, à 10 min en voiture : réservez en ligne.\nVillages perchés de Balazuc et Labeaume.' },
  { id: 'laverie',   emoji: '👕', titre: 'Laverie',            contenu: 'Bloc sanitaire nord, 8h – 21h.\nLave-linge 5 € · sèche-linge 3 €.' },
  { id: 'meteo',     emoji: '⛈️', titre: 'Orages & montée des eaux', contenu: 'Par temps d’orage, sortez de l’eau sans attendre.\nL’alerte est affichée à la réception et envoyée dans l’app.' },
  { id: 'tri',       emoji: '♻️', titre: 'Tri & poubelles',    contenu: 'Point tri près de l’entrée.\nVerre : conteneur du parking.\nCollecte chaque matin à 7h30.' },
  { id: 'animaux',   emoji: '🐾', titre: 'Animaux',            contenu: 'Acceptés tenus en laisse, 3 €/nuit.\nInterdits à la piscine.' },
  { id: 'urgences',  emoji: '🚨', titre: 'Urgences',           contenu: 'Réception : 04 75 00 31 62\nSAMU 15 · Police 17 · Pompiers 18\nUrgence européenne : 112\nPharmacie à Vallon-Pont-d’Arc, 2 km.' },
]

export const DEMO_CAMPING = {
  id: 'camp-demo',
  nom: 'Camping La Rive aux Cigales',
  slug: 'la-rive-aux-cigales',
  couleur_principale: '#6b46a8',
  couleur_secondaire: '#2e1f4d',
  logo_url: null,
  plan_url: null,
  carte_config: { center: CENTER, perimeter: PERIMETER, pins: PINS },
  infos: DEMO_INFOS,
}

// Thomas, en famille. Sami partage trois centres d’intérêt avec lui
// (paddle, randonnée, nature), Nadia un seul, Manon aucun.
export const DEMO_VACANCIER = {
  id: 'vac-1', camping_id: 'camp-demo', pseudo: 'Thomas',
  avatar_emoji: '🛶', emplacement: 'R08', date_depart: dansJours(6),
  tranche_age: '36-45', avec: 'famille', created_at: jour(-3, 16, 10),
  interests: ['paddle', 'randonnee', 'nature', 'cuisine', 'enfants', 'photo'],
}

const VACS = [
  DEMO_VACANCIER,
  { id: 'vac-2',  pseudo: 'Nadia',   avatar_emoji: '🍇',    emplacement: 'C14', camping_id: 'camp-demo', tranche_age: '46-60', avec: 'couple',  date_depart: dansJours(4), created_at: jour(-5, 15, 0),  interests: ['cuisine', 'lecture', 'piscine'] },
  { id: 'vac-3',  pseudo: 'Gilles',  avatar_emoji: '🎣',    emplacement: 'R02', camping_id: 'camp-demo', tranche_age: '60+',   avec: 'couple',  date_depart: dansJours(9), created_at: jour(-8, 11, 30), interests: ['nature', 'petanque', 'lecture'] },
  { id: 'vac-4',  pseudo: 'Manon',   avatar_emoji: '🎨',    emplacement: 'C05', camping_id: 'camp-demo', tranche_age: '18-25', avec: 'amis',    date_depart: dansJours(3), created_at: jour(-2, 18, 0),  interests: ['musique', 'soirees', 'jeux'] },
  { id: 'vac-5',  pseudo: 'Sami',    avatar_emoji: '🧗',    emplacement: 'R11', camping_id: 'camp-demo', tranche_age: '36-45', avec: 'famille', date_depart: dansJours(5), created_at: jour(-3, 17, 45), interests: ['paddle', 'randonnee', 'nature', 'sport'] },
  { id: 'vac-6',  pseudo: 'Laura',   avatar_emoji: '🌻',    emplacement: 'C09', camping_id: 'camp-demo', tranche_age: '26-35', avec: 'famille', date_depart: dansJours(6), created_at: jour(-4, 10, 20), interests: ['enfants', 'piscine', 'cuisine'] },
  { id: 'vac-7',  pseudo: 'Julien',  avatar_emoji: '🚵',    emplacement: 'B03', camping_id: 'camp-demo', tranche_age: '26-35', avec: 'amis',    date_depart: dansJours(2), created_at: jour(-1, 19, 10), interests: ['velo', 'sport', 'apero'] },
  { id: 'vac-8',  pseudo: 'Martine', avatar_emoji: '🌿',    emplacement: 'A12', camping_id: 'camp-demo', tranche_age: '60+',   avec: 'couple',  date_depart: dansJours(0), created_at: jour(-9, 14, 0),  interests: ['randonnee', 'nature', 'photo'] },
  { id: 'vac-9',  pseudo: 'Karim',   avatar_emoji: '⚽',    emplacement: 'B10', camping_id: 'camp-demo', tranche_age: '36-45', avec: 'famille', date_depart: dansJours(4), created_at: jour(-2, 12, 40), interests: ['sport', 'enfants', 'petanque'] },
  { id: 'vac-10', pseudo: 'Océane',  avatar_emoji: '🦋',    emplacement: 'C18', camping_id: 'camp-demo', tranche_age: '18-25', avec: 'amis',    date_depart: dansJours(3), created_at: jour(0, 11, 15),  interests: ['musique', 'soirees', 'plage'] },
  { id: 'vac-11', pseudo: 'Benoît',  avatar_emoji: '🧀',    emplacement: 'A04', camping_id: 'camp-demo', tranche_age: '46-60', avec: 'famille', date_depart: dansJours(7), created_at: jour(-6, 16, 30), interests: ['cuisine', 'apero', 'nature'] },
  { id: 'vac-12', pseudo: 'Lina',    avatar_emoji: '🐞',    emplacement: 'R05', camping_id: 'camp-demo', tranche_age: '26-35', avec: 'couple',  date_depart: dansJours(5), created_at: jour(-1, 15, 50), interests: ['yoga', 'photo', 'randonnee'] },
  { id: 'vac-13', pseudo: 'Arthur',  avatar_emoji: '🦖',    emplacement: 'B07', camping_id: 'camp-demo', tranche_age: '36-45', avec: 'famille', date_depart: dansJours(8), created_at: jour(-5, 9, 50),  interests: ['enfants', 'jeux', 'velo'] },
]
const qui = id => { const v = VACS.find(x => x.id === id); return { pseudo: v.pseudo, avatar_emoji: v.avatar_emoji } }

// Groupes du jour (créés par les vacanciers), puis ceux des jours passés :
// masqués côté vacancier, ils remplissent les statistiques du gérant.
const GROUPES = [
  { id: 'g1', camping_id: 'camp-demo', titre: 'Baignade et pique-nique',  emoji: '🏞️', lieu: 'Plage de galets',    heure: jour(0, 18, 0),  max_membres: 12, actif: true, created_at: ago(110), createur_id: 'vac-5' },
  { id: 'g2', camping_id: 'camp-demo', titre: 'Rando lever de soleil',    emoji: '🌄', lieu: 'Portail du haut',    heure: jour(0, 6, 30),  max_membres: 8,  actif: true, created_at: ago(900), createur_id: 'vac-12' },
  { id: 'g3', camping_id: 'camp-demo', titre: 'Pétanque à l’ombre',       emoji: '🎯', lieu: 'Sous les platanes',  heure: jour(0, 17, 30), max_membres: 8,  actif: true, created_at: ago(60),  createur_id: 'vac-3' },
  { id: 'g4', camping_id: 'camp-demo', titre: 'Foot des enfants',         emoji: '⚽', lieu: 'Terrain multisport', heure: jour(0, 18, 30), max_membres: 14, actif: true, created_at: ago(140), createur_id: 'vac-9' },
  { id: 'g5', camping_id: 'camp-demo', titre: 'Jeux de cartes à la fraîche', emoji: '🃏', lieu: 'Guinguette',      heure: jour(0, 22, 0),  max_membres: 6,  actif: true, created_at: ago(25),  createur_id: 'vac-4' },
  { id: 'g6', camping_id: 'camp-demo', titre: 'Covoiturage Grotte Chauvet', emoji: '🚗', lieu: 'Parking',          heure: jour(-1, 9, 30), max_membres: 4,  actif: true, created_at: jour(-2, 20, 15), createur_id: 'vac-11' },
  { id: 'g7', camping_id: 'camp-demo', titre: 'VTT dans la garrigue',     emoji: '🚵', lieu: 'Réception',          heure: jour(-2, 8, 0),  max_membres: 6,  actif: true, created_at: jour(-3, 19, 0),  createur_id: 'vac-7' },
  { id: 'g8', camping_id: 'camp-demo', titre: 'Apéro des voisins',        emoji: '🍷', lieu: 'Allée des Chênes',   heure: jour(-3, 19, 0), max_membres: 12, actif: true, created_at: jour(-3, 14, 30), createur_id: 'vac-2' },
  { id: 'g9', camping_id: 'camp-demo', titre: 'Marché de Vallon',         emoji: '🧺', lieu: 'Parking',            heure: jour(-6, 9, 0),  max_membres: 6,  actif: true, created_at: jour(-7, 18, 0),  createur_id: 'vac-8' },
]

// Dans l’ordre des horaires : le faux client ignore .order('debut').
// Le concert, publié ce matin, n’a pas encore d’inscrit : l’agenda y montre « S’inscrire ».
const ANIMATIONS = [
  { id: 'a1', camping_id: 'camp-demo', titre: 'Descente en canoë',         emoji: '🛶', lieu: 'Base canoë',          debut: jour(0, 9, 0),   places_max: 8, publiee: true },
  { id: 'a2', camping_id: 'camp-demo', titre: 'Chasse au trésor enfants',  emoji: '🗺️', lieu: 'Club enfants',        debut: jour(0, 10, 30), places_max: 0,  publiee: true },
  { id: 'a3', camping_id: 'camp-demo', titre: 'Rando des belvédères',      emoji: '🥾', lieu: 'Portail du haut',     debut: jour(0, 17, 30), places_max: 10, publiee: true },
  { id: 'a4', camping_id: 'camp-demo', titre: 'Apéro des producteurs',     emoji: '🧀', lieu: 'Terrasse de la guinguette', debut: jour(0, 19, 0), places_max: 0, publiee: true },
  { id: 'a5', camping_id: 'camp-demo', titre: 'Concert guinguette',        emoji: '🪗', lieu: 'Guinguette',          debut: jour(0, 21, 30), places_max: 0,  publiee: true },
]

const STATUTS = [
  { id: 's1', camping_id: 'camp-demo', vacancier_id: 'vac-5', emoji: '🏞️', texte: 'L’eau est à 24°, qui vient se baigner ?', created_at: ago(22),  vacanciers: qui('vac-5') },
  { id: 's2', camping_id: 'camp-demo', vacancier_id: 'vac-12', emoji: '🌄', texte: 'Lever de soleil sur les gorges ce matin, magique', created_at: ago(560), vacanciers: qui('vac-12') },
  { id: 's3', camping_id: 'camp-demo', vacancier_id: 'vac-11', emoji: '🧀', texte: 'Le picodon de l’épicerie, une tuerie !', created_at: ago(90),  vacanciers: qui('vac-11') },
  { id: 's4', camping_id: 'camp-demo', vacancier_id: 'vac-4', emoji: '🪗', texte: 'Hâte d’être au concert ce soir !', created_at: ago(35),  vacanciers: qui('vac-4') },
]

const MESSAGES = [
  { id: 'm1', groupe_id: 'g1', auteur_id: 'vac-5', contenu: 'On se retrouve à 18h sur la plage de galets ? Je prends la glacière 🧊', created_at: ago(58), reactions: { '👍': 3 }, vacanciers: qui('vac-5') },
  { id: 'm2', groupe_id: 'g1', auteur_id: 'vac-1', contenu: 'Parfait ! On descend avec les enfants et le melon 🍈', created_at: ago(52), reactions: { '😋': 2 }, vacanciers: qui('vac-1') },
  { id: 'm3', groupe_id: 'g1', auteur_id: 'vac-5', contenu: 'Génial, à tout à l’heure !', created_at: ago(47), reactions: { '🎉': 2 }, vacanciers: qui('vac-5') },
  { id: 'm4', groupe_id: 'g1', auteur_id: 'vac-6', contenu: 'On vous rejoint, Léon a déjà mis son masque de plongée 🤿', created_at: ago(21), reactions: { '😂': 3 }, vacanciers: qui('vac-6') },
  { id: 'm5', groupe_id: 'g1', auteur_id: 'vac-9', contenu: 'Je ramène le ballon pour les petits ⚽', created_at: ago(9), reactions: {}, vacanciers: qui('vac-9') },
]

const inscrits = (animId, titre, ids, depuisMin) => ids.map((v, k) => {
  const p = VACS.find(x => x.id === v)
  return { id: `i-${animId}-${k}`, animation_id: animId, vacancier_id: v, created_at: ago(depuisMin - k * 23),
    vacanciers: { pseudo: p.pseudo, emplacement: p.emplacement }, animations: { titre } }
})
// Le faux client ignore les filtres : chaque ligne compte aussi comme une
// inscription de Thomas (agenda « Inscrit », compteur du Profil). D’où un
// total modeste, concentré sur les animations à places limitées.
const INSCRIPTIONS = [
  ...inscrits('a1', 'Descente en canoë', ['vac-1', 'vac-5', 'vac-12', 'vac-7'], 1600),
  ...inscrits('a2', 'Chasse au trésor enfants', ['vac-1', 'vac-6'], 1300),
  ...inscrits('a3', 'Rando des belvédères', ['vac-1', 'vac-5', 'vac-8', 'vac-12', 'vac-3', 'vac-11', 'vac-2'], 500),
  ...inscrits('a4', 'Apéro des producteurs', ['vac-11'], 300),
]

const MEMBRES = [
  { id: 'mb1', groupe_id: 'g1', vacancier_id: 'vac-1', vacanciers: qui('vac-1') },
  { id: 'mb2', groupe_id: 'g1', vacancier_id: 'vac-5', vacanciers: qui('vac-5') },
  { id: 'mb3', groupe_id: 'g1', vacancier_id: 'vac-6', vacanciers: qui('vac-6') },
  { id: 'mb4', groupe_id: 'g1', vacancier_id: 'vac-9', vacanciers: qui('vac-9') },
  { id: 'mb5', groupe_id: 'g1', vacancier_id: 'vac-2', vacanciers: qui('vac-2') },
]

const SIGNALEMENTS = [
  { id: 'sg1', camping_id: 'camp-demo', vacancier_id: 'vac-2', categorie: 'panne', statut: 'nouveau', lieu: 'Douches bloc nord',
    description: 'La douche n°3 coule en continu, le bouton reste bloqué.', created_at: ago(45),
    vacanciers: { ...qui('vac-2'), emplacement: 'C14' } },
  { id: 'sg2', camping_id: 'camp-demo', vacancier_id: 'vac-3', categorie: 'contenu', statut: 'nouveau', cible_type: 'message', cible_id: 'm9',
    description: 'Publicité', cible_texte: 'Descente en canoë à moitié prix, contactez-moi en privé !', auteur_signale_id: 'vac-7', created_at: ago(130),
    vacanciers: { ...qui('vac-3'), emplacement: 'R02' }, auteur: { ...qui('vac-7'), banni: false } },
  { id: 'sg3', camping_id: 'camp-demo', vacancier_id: 'vac-6', categorie: 'proprete', statut: 'en_cours', lieu: 'Aire de jeux',
    description: 'Des guêpes autour de la poubelle près du toboggan.', created_at: ago(240),
    vacanciers: { ...qui('vac-6'), emplacement: 'C09' } },
]

const ANNONCES = [
  { id: 'an1', camping_id: 'camp-demo', vacancier_id: 'vac-12', type: 'trouve', titre: 'Chaussure d’eau enfant trouvée',
    description: 'Une petite chaussure verte, sur la plage de galets. Je la garde en R05.', photo_url: null, resolu: false,
    created_at: ago(70), expire_at: dansHeures(70), vacanciers: qui('vac-12') },
  { id: 'an2', camping_id: 'camp-demo', vacancier_id: 'vac-7', type: 'perdu', titre: 'Bidon étanche jaune perdu',
    description: 'Tombé du canoë hier, entre le camping et le Pont d’Arc.', photo_url: null, resolu: false,
    created_at: ago(260), expire_at: dansHeures(60), vacanciers: qui('vac-7') },
  { id: 'an3', camping_id: 'camp-demo', vacancier_id: 'vac-11', type: 'annonce', titre: 'Je donne des figues du jardin',
    description: 'Emplacement A04, servez-vous dans le panier devant la tente.', photo_url: null, resolu: false,
    created_at: ago(330), expire_at: dansHeures(48), vacanciers: qui('vac-11') },
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
