// Supabase MOCK — uniquement pour le build démo (captures d'écran du site).
// Rend les vrais composants de l'app avec un jeu de données réaliste, sans backend.
export { todayISO, presentFilter } from '../lib/presence'
export const ensureAnonSession = async () => ({ user: { id: 'demo-uid' } })

const iso = (h, m = 0) => { const d = new Date(); d.setHours(h, m, 0, 0); return d.toISOString() }
const ago = (min) => new Date(Date.now() - min * 60000).toISOString()

// ── Décor de tournage « pins-landais » ───────────────────────────────────────
// Camping FICTIF 4★ dans les Landes (entre Vielle-Saint-Girons et l’océan) :
// pinède, plage océane, surf, Vélodyssée. Données seules : le code du mock est
// celui de src/demo/mockSupabase.js (voir studio-video/decors/README.md).
const jour = (j, h, m = 0) => { const d = new Date(); d.setDate(d.getDate() + j); d.setHours(h, m, 0, 0); return d.toISOString() }
const dansJours = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10) }
const dansHeures = (h) => new Date(Date.now() + h * 3600000).toISOString()

const CENTER = { lat: 43.9395, lng: -1.3445 }
const PERIMETER = [
  [43.9407, -1.3462], [43.9407, -1.3428], [43.9383, -1.3428], [43.9383, -1.3462],
]
const PINS = [
  { ref_id: 'l1', ref_type: 'lieu', label: 'Espace aquatique', emoji: '🏊', color: '#38bdf8', lat: 43.9399, lng: -1.3450, osm: true },
  { ref_id: 'l2', ref_type: 'lieu', label: 'Sanitaires',       emoji: '🚻', color: '#64748b', lat: 43.9389, lng: -1.3436, osm: true },
  { ref_id: 'l3', ref_type: 'lieu', label: 'Snack Le Spot',    emoji: '🍔', color: '#ef4444', lat: 43.9403, lng: -1.3438, osm: true },
  { ref_id: 'l4', ref_type: 'lieu', label: 'Réception',        emoji: '🏠', color: '#3b82f6', lat: 43.9386, lng: -1.3458, osm: true },
  { ref_id: 'l5', ref_type: 'lieu', label: 'Terrain de beach', emoji: '🏐', color: '#f59e0b', lat: 43.9396, lng: -1.3432, osm: true },
  { ref_id: 'l6', ref_type: 'lieu', label: 'Location vélos',   emoji: '🚲', color: '#22c55e', lat: 43.9391, lng: -1.3455, osm: true },
]

const DEMO_INFOS = [
  { id: 'plage',     emoji: '🏖️', titre: 'Plage de la Lette Blanche', contenu: 'À 900 m par le sentier à travers la dune.\nPoste de secours, surveillance 11h – 19h en juillet-août.\nDouche de rinçage à la sortie du sentier.' },
  { id: 'baignade',  emoji: '🌊', titre: 'Baignade & baïnes',  contenu: 'Baignez-vous uniquement entre les drapeaux bleus.\nDrapeau rouge : baignade interdite, même au bord.\nLes baïnes créent des courants : demandez conseil aux sauveteurs.' },
  { id: 'surf',      emoji: '🏄', titre: 'École de surf',      contenu: 'Cours débutants tous les matins, dès 7 ans.\nCombinaison et planche fournies.\nInscription à la réception la veille avant 19h.' },
  { id: 'velo',      emoji: '🚲', titre: 'Vélo & Vélodyssée',  contenu: 'La piste cyclable passe devant l’entrée.\nLac de Léon à 7 km, Moliets à 12 km.\nLocation à la réception : 14 €/jour, siège enfant offert.' },
  { id: 'piscine',   emoji: '🏊', titre: 'Espace aquatique',   contenu: 'Bassin chauffé et lagon enfants 9h30 – 20h.\nToboggans 11h – 13h et 15h – 19h.\nShort de bain interdit.' },
  { id: 'reception', emoji: '🏠', titre: 'Réception',          contenu: 'Juillet-août : 8h30 – 20h en continu.\nIsabelle et Laurent vous accueillent.\nUrgence nuit : sonnette à droite de la porte.' },
  { id: 'wifi',      emoji: '📶', titre: 'Wi-Fi',              contenu: 'Réseau : HautsDeLaLette-Invites\nCode : bienvenue\nMeilleur signal près de la réception et du snack.' },
  { id: 'snack',     emoji: '🍔', titre: 'Snack Le Spot',      contenu: 'Petit-déjeuner 8h – 10h30.\nBurgers, salades et glaces 12h – 22h.\nPoulet rôti landais le dimanche, sur réservation.' },
  { id: 'epicerie',  emoji: '🥖', titre: 'Épicerie & pain',    contenu: 'Ouverte 8h – 13h et 16h30 – 20h.\nPain et viennoiseries : commande la veille avant 19h.\nProduits du Sud-Ouest : pastis landais, canelés, fromages.' },
  { id: 'marche',    emoji: '🧺', titre: 'Marchés',            contenu: 'Marché nocturne au camping le mercredi dès 19h.\nMarché de Vielle-Saint-Girons le dimanche matin.' },
  { id: 'laverie',   emoji: '👕', titre: 'Laverie',            contenu: 'Bloc sanitaire 2, 8h – 21h.\nLave-linge 5 € · sèche-linge 3 €.\nJetons à la réception.' },
  { id: 'feux',      emoji: '🌲', titre: 'Forêt & barbecues',  contenu: 'Feux interdits dans la pinède.\nBarbecues électriques ou à gaz uniquement.\nBarbecue collectif près du terrain de pétanque.' },
  { id: 'tri',       emoji: '♻️', titre: 'Tri & poubelles',    contenu: 'Point tri à l’entrée et derrière le bloc 3.\nVerre : conteneur du parking.\nCollecte tous les matins à 7h.' },
  { id: 'animaux',   emoji: '🐾', titre: 'Animaux',            contenu: 'Bienvenus tenus en laisse, 4 €/nuit.\nInterdits à l’espace aquatique.\nPlage autorisée aux chiens à 2 km au sud.' },
  { id: 'urgences',  emoji: '🚨', titre: 'Urgences',           contenu: 'Réception : 05 58 00 47 20\nSAMU 15 · Police 17 · Pompiers 18\nUrgence européenne : 112\nPharmacie et médecin au bourg, 4 km.' },
]

export const DEMO_CAMPING = {
  id: 'camp-demo',
  nom: 'Camping Les Hauts de la Lette',
  slug: 'les-hauts-de-la-lette',
  couleur_principale: '#c2571a',
  couleur_secondaire: '#1f4d2e',
  logo_url: null,
  plan_url: null,
  carte_config: { center: CENTER, perimeter: PERIMETER, pins: PINS },
  infos: DEMO_INFOS,
}

// Inès : surfeuse, en vacances entre amis. Lou partage trois centres
// d’intérêt avec elle (plage, apéro, vélo), Bastien un seul, Mehdi aucun.
export const DEMO_VACANCIER = {
  id: 'vac-1', camping_id: 'camp-demo', pseudo: 'Inès',
  avatar_emoji: '🏄‍♀️', emplacement: 'P14', date_depart: dansJours(5),
  tranche_age: '26-35', avec: 'amis', created_at: jour(-4, 15, 20),
  interests: ['plage', 'velo', 'apero', 'photo', 'yoga', 'soirees'],
}

const VACS = [
  DEMO_VACANCIER,
  { id: 'vac-2',  pseudo: 'Bastien', avatar_emoji: '🚴',    emplacement: 'P03', camping_id: 'camp-demo', tranche_age: '36-45', avec: 'famille', date_depart: dansJours(3), created_at: jour(-6, 17, 5),  interests: ['velo', 'petanque', 'cuisine', 'enfants'] },
  { id: 'vac-3',  pseudo: 'Chloé',   avatar_emoji: '🧘‍♀️', emplacement: 'D27', camping_id: 'camp-demo', tranche_age: '26-35', avec: 'couple',  date_depart: dansJours(6), created_at: jour(-2, 11, 40), interests: ['yoga', 'nature', 'lecture'] },
  { id: 'vac-4',  pseudo: 'Mehdi',   avatar_emoji: '🎸',    emplacement: 'D08', camping_id: 'camp-demo', tranche_age: '18-25', avec: 'amis',    date_depart: dansJours(2), created_at: jour(-5, 18, 30), interests: ['musique', 'jeux', 'sport'] },
  { id: 'vac-5',  pseudo: 'Lou',     avatar_emoji: '🏐',    emplacement: 'P16', camping_id: 'camp-demo', tranche_age: '26-35', avec: 'amis',    date_depart: dansJours(5), created_at: jour(-4, 16, 0),  interests: ['plage', 'apero', 'velo', 'sport', 'soirees'] },
  { id: 'vac-6',  pseudo: 'Pierre',  avatar_emoji: '🎣',    emplacement: 'A11', camping_id: 'camp-demo', tranche_age: '60+',   avec: 'couple',  date_depart: dansJours(9), created_at: jour(-8, 14, 10), interests: ['nature', 'petanque', 'lecture'] },
  { id: 'vac-7',  pseudo: 'Anaïs',   avatar_emoji: '🌞',    emplacement: 'P18', camping_id: 'camp-demo', tranche_age: '26-35', avec: 'amis',    date_depart: dansJours(5), created_at: jour(-4, 16, 30), interests: ['plage', 'photo', 'soirees'] },
  { id: 'vac-8',  pseudo: 'Kevin',   avatar_emoji: '🤿',    emplacement: 'B05', camping_id: 'camp-demo', tranche_age: '36-45', avec: 'famille', date_depart: dansJours(0), created_at: jour(-7, 12, 0),  interests: ['piscine', 'enfants', 'jeux'] },
  { id: 'vac-9',  pseudo: 'Sarah',   avatar_emoji: '🌺',    emplacement: 'B09', camping_id: 'camp-demo', tranche_age: '36-45', avec: 'famille', date_depart: dansJours(4), created_at: jour(-3, 10, 15), interests: ['piscine', 'yoga', 'cuisine'] },
  { id: 'vac-10', pseudo: 'Thibault',avatar_emoji: '🏄',    emplacement: 'D14', camping_id: 'camp-demo', tranche_age: '18-25', avec: 'amis',    date_depart: dansJours(3), created_at: jour(-1, 19, 0),  interests: ['plage', 'sport', 'soirees'] },
  { id: 'vac-11', pseudo: 'Jade',    avatar_emoji: '🦋',    emplacement: 'C02', camping_id: 'camp-demo', tranche_age: '46-60', avec: 'couple',  date_depart: dansJours(7), created_at: jour(-2, 15, 45), interests: ['randonnee', 'velo', 'nature'] },
  { id: 'vac-12', pseudo: 'Nathan',  avatar_emoji: '🛹',    emplacement: 'B12', camping_id: 'camp-demo', tranche_age: '18-25', avec: 'famille', date_depart: dansJours(4), created_at: jour(-3, 10, 20), interests: ['sport', 'jeux', 'musique'] },
  { id: 'vac-13', pseudo: 'Elsa',    avatar_emoji: '🍉',    emplacement: 'C15', camping_id: 'camp-demo', tranche_age: '46-60', avec: 'famille', date_depart: dansJours(8), created_at: jour(-1, 17, 25), interests: ['plage', 'cuisine', 'enfants'] },
  { id: 'vac-14', pseudo: 'Romain',  avatar_emoji: '🏓',    emplacement: 'A07', camping_id: 'camp-demo', tranche_age: '36-45', avec: 'couple',  date_depart: dansJours(6), created_at: jour(-5, 11, 0),  interests: ['padel', 'sport', 'apero'] },
  { id: 'vac-15', pseudo: 'Zoé',     avatar_emoji: '🐚',    emplacement: 'P21', camping_id: 'camp-demo', tranche_age: '18-25', avec: 'amis',    date_depart: dansJours(2), created_at: jour(0, 10, 30),  interests: ['plage', 'photo', 'musique'] },
  { id: 'vac-16', pseudo: 'Hugo',    avatar_emoji: '🚣',    emplacement: 'C09', camping_id: 'camp-demo', tranche_age: '60+',   avec: 'couple',  date_depart: dansJours(10), created_at: jour(-9, 16, 0), interests: ['nature', 'randonnee', 'lecture'] },
]
const qui = id => { const v = VACS.find(x => x.id === id); return { pseudo: v.pseudo, avatar_emoji: v.avatar_emoji } }

// Groupes du jour (créés par les vacanciers), puis ceux des jours passés :
// masqués côté vacancier, ils remplissent les statistiques du gérant.
const GROUPES = [
  { id: 'g1', camping_id: 'camp-demo', titre: 'Apéro coucher de soleil', emoji: '🌅', lieu: 'Haut de la dune', heure: jour(0, 20, 30), max_membres: 12, actif: true, created_at: ago(95),  createur_id: 'vac-2' },
  { id: 'g2', camping_id: 'camp-demo', titre: 'Session surf du matin',   emoji: '🏄', lieu: 'Poste de secours', heure: jour(0, 8, 30), max_membres: 8,  actif: true, created_at: ago(560), createur_id: 'vac-10' },
  { id: 'g3', camping_id: 'camp-demo', titre: 'Tournoi de ping-pong',    emoji: '🏓', lieu: 'Préau des jeux',   heure: jour(0, 17, 30), max_membres: 8,  actif: true, created_at: ago(70),  createur_id: 'vac-14' },
  { id: 'g4', camping_id: 'camp-demo', titre: 'Vélo jusqu’au lac de Léon', emoji: '🚲', lieu: 'Parking vélos',  heure: jour(0, 18, 0),  max_membres: 10, actif: true, created_at: ago(150), createur_id: 'vac-11' },
  { id: 'g5', camping_id: 'camp-demo', titre: 'Loup-garou géant',        emoji: '🐺', lieu: 'Terrasse du snack', heure: jour(0, 21, 45), max_membres: 14, actif: true, created_at: ago(35),  createur_id: 'vac-4' },
  { id: 'g6', camping_id: 'camp-demo', titre: 'Pétanque entre voisins',  emoji: '🎯', lieu: 'Terrain de pétanque', heure: jour(-1, 18, 0), max_membres: 8, actif: true, created_at: jour(-1, 11, 10), createur_id: 'vac-6' },
  { id: 'g7', camping_id: 'camp-demo', titre: 'Footing dans la pinède',  emoji: '🏃', lieu: 'Entrée du camping', heure: jour(-2, 8, 0), max_membres: 6,  actif: true, created_at: jour(-3, 21, 0),  createur_id: 'vac-12' },
  { id: 'g8', camping_id: 'camp-demo', titre: 'Pique-nique au lac',      emoji: '🧺', lieu: 'Parking vélos',     heure: jour(-3, 12, 0), max_membres: 12, actif: true, created_at: jour(-4, 18, 40), createur_id: 'vac-9' },
  { id: 'g9', camping_id: 'camp-demo', titre: 'Molkky sur la plage',     emoji: '🪵', lieu: 'Plage de la Lette', heure: jour(-5, 17, 0), max_membres: 10, actif: true, created_at: jour(-5, 10, 5),  createur_id: 'vac-14' },
  { id: 'g10', camping_id: 'camp-demo', titre: 'Balade des étoiles',     emoji: '✨', lieu: 'Haut de la dune',   heure: jour(-6, 22, 30), max_membres: 15, actif: true, created_at: jour(-6, 16, 20), createur_id: 'vac-16' },
]

// Dans l’ordre des horaires : le faux client ignore .order('debut').
// Le cinéma, publié ce matin, n’a pas encore d’inscrit : l’agenda y montre « S’inscrire ».
const ANIMATIONS = [
  { id: 'a1', camping_id: 'camp-demo', titre: 'Initiation surf',           emoji: '🏄', lieu: 'Plage de la Lette', debut: jour(0, 9, 30),  places_max: 6,  publiee: true },
  { id: 'a2', camping_id: 'camp-demo', titre: 'Balade vélo en forêt',      emoji: '🚲', lieu: 'Réception',         debut: jour(0, 11, 0),  places_max: 0,  publiee: true },
  { id: 'a3', camping_id: 'camp-demo', titre: 'Tournoi de beach-volley',   emoji: '🏐', lieu: 'Terrain de beach',  debut: jour(0, 17, 30), places_max: 8,  publiee: true },
  { id: 'a4', camping_id: 'camp-demo', titre: 'Marché nocturne',           emoji: '🧺', lieu: 'Place du camping',  debut: jour(0, 19, 0),  places_max: 0,  publiee: true },
  { id: 'a5', camping_id: 'camp-demo', titre: 'Cinéma en plein air',       emoji: '🎬', lieu: 'Clairière des pins', debut: jour(0, 22, 0), places_max: 0,  publiee: true },
]

const STATUTS = [
  { id: 's1', camping_id: 'camp-demo', vacancier_id: 'vac-2', emoji: '🌅', texte: 'Qui monte voir le coucher de soleil sur la dune ce soir ?', created_at: ago(20),  vacanciers: qui('vac-2') },
  { id: 's2', camping_id: 'camp-demo', vacancier_id: 'vac-10', emoji: '🌊', texte: 'Vagues parfaites ce matin, 1 m bien rangé 🤙', created_at: ago(240), vacanciers: qui('vac-10') },
  { id: 's3', camping_id: 'camp-demo', vacancier_id: 'vac-9', emoji: '🍦', texte: 'Les glaces du snack sont incroyables, foncez !', created_at: ago(75),  vacanciers: qui('vac-9') },
  { id: 's4', camping_id: 'camp-demo', vacancier_id: 'vac-4', emoji: '🎸', texte: 'Je ramène ma guitare au loup-garou ce soir', created_at: ago(30),  vacanciers: qui('vac-4') },
]

const MESSAGES = [
  { id: 'm1', groupe_id: 'g1', auteur_id: 'vac-2', contenu: 'Rendez-vous 20h30 en haut de la dune, le soleil se couche vers 21h40 🌅', created_at: ago(55), reactions: { '🔥': 2 }, vacanciers: qui('vac-2') },
  { id: 'm2', groupe_id: 'g1', auteur_id: 'vac-1', contenu: 'Super ! J’apporte les chips et une enceinte 🎶', created_at: ago(50), reactions: { '👍': 3 }, vacanciers: qui('vac-1') },
  { id: 'm3', groupe_id: 'g1', auteur_id: 'vac-5', contenu: 'Génial, à tout à l’heure !', created_at: ago(41), reactions: { '🎉': 2 }, vacanciers: qui('vac-5') },
  { id: 'm4', groupe_id: 'g1', auteur_id: 'vac-7', contenu: 'On peut venir à trois ? On a des canelés à partager 😋', created_at: ago(18), reactions: { '😍': 2 }, vacanciers: qui('vac-7') },
  { id: 'm5', groupe_id: 'g1', auteur_id: 'vac-2', contenu: 'Bien sûr, plus on est de fous… Pensez à une petite laine, ça souffle là-haut.', created_at: ago(12), reactions: {}, vacanciers: qui('vac-2') },
]

const inscrits = (animId, titre, ids, depuisMin) => ids.map((v, k) => {
  const p = VACS.find(x => x.id === v)
  return { id: `i-${animId}-${k}`, animation_id: animId, vacancier_id: v, created_at: ago(depuisMin - k * 23),
    vacanciers: { pseudo: p.pseudo, emplacement: p.emplacement }, animations: { titre } }
})
// Le faux client ignore les filtres : chaque ligne compte aussi comme une
// inscription d’Inès (agenda « Inscrit », compteur du Profil). D’où un total
// modeste, concentré sur les animations à places limitées.
const INSCRIPTIONS = [
  ...inscrits('a1', 'Initiation surf', ['vac-1', 'vac-10', 'vac-15'], 1500),
  ...inscrits('a2', 'Balade vélo en forêt', ['vac-11', 'vac-2'], 1100),
  ...inscrits('a3', 'Tournoi de beach-volley', ['vac-1', 'vac-5', 'vac-10', 'vac-4', 'vac-14', 'vac-12'], 400),
  ...inscrits('a4', 'Marché nocturne', ['vac-6'], 260),
]

const MEMBRES = [
  { id: 'mb1', groupe_id: 'g1', vacancier_id: 'vac-1', vacanciers: qui('vac-1') },
  { id: 'mb2', groupe_id: 'g1', vacancier_id: 'vac-2', vacanciers: qui('vac-2') },
  { id: 'mb3', groupe_id: 'g1', vacancier_id: 'vac-5', vacanciers: qui('vac-5') },
  { id: 'mb4', groupe_id: 'g1', vacancier_id: 'vac-7', vacanciers: qui('vac-7') },
]

const SIGNALEMENTS = [
  { id: 'sg1', camping_id: 'camp-demo', vacancier_id: 'vac-3', categorie: 'panne', statut: 'nouveau', lieu: 'Allée des Arbousiers',
    description: 'Le lampadaire au bout de l’allée ne s’allume plus le soir.', created_at: ago(40),
    vacanciers: { ...qui('vac-3'), emplacement: 'D27' } },
  { id: 'sg2', camping_id: 'camp-demo', vacancier_id: 'vac-6', categorie: 'contenu', statut: 'nouveau', cible_type: 'message', cible_id: 'm9',
    description: 'Publicité', cible_texte: 'Location de vélos électriques pas chère, écrivez-moi en privé !', auteur_signale_id: 'vac-12', created_at: ago(110),
    vacanciers: { ...qui('vac-6'), emplacement: 'A11' }, auteur: { ...qui('vac-12'), banni: false } },
  { id: 'sg3', camping_id: 'camp-demo', vacancier_id: 'vac-9', categorie: 'proprete', statut: 'en_cours', lieu: 'Bloc sanitaire 2',
    description: 'Plus de papier dans les toilettes côté femmes.', created_at: ago(190),
    vacanciers: { ...qui('vac-9'), emplacement: 'B09' } },
]

const ANNONCES = [
  { id: 'an1', camping_id: 'camp-demo', vacancier_id: 'vac-13', type: 'trouve', titre: 'Seau et pelle rouges trouvés à la plage',
    description: 'Oubliés près du poste de secours. Je les garde à l’emplacement C15.', photo_url: null, resolu: false,
    created_at: ago(65), expire_at: dansHeures(70), vacanciers: qui('vac-13') },
  { id: 'an2', camping_id: 'camp-demo', vacancier_id: 'vac-10', type: 'perdu', titre: 'Leash de surf bleu perdu',
    description: 'Sans doute sur le sentier de la dune ce matin.', photo_url: null, resolu: false,
    created_at: ago(200), expire_at: dansHeures(60), vacanciers: qui('vac-10') },
  { id: 'an3', camping_id: 'camp-demo', vacancier_id: 'vac-2', type: 'annonce', titre: 'Je prête une remorque vélo enfant',
    description: 'Emplacement P03, passez avant 18 h.', photo_url: null, resolu: false,
    created_at: ago(320), expire_at: dansHeures(48), vacanciers: qui('vac-2') },
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
