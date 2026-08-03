// Catégories de points d'intérêt et désencombrement de la carte.
//
// Ce module est partagé entre l'admin (au moment de la détection OpenStreetMap)
// et l'application vacancier (au moment de l'affichage). Le nettoyage doit
// exister aux deux endroits : le plafonner uniquement à la détection laisse les
// campings déjà configurés avec leur carte encombrée jusqu'à ce qu'un gérant
// pense à relancer la détection — ce qu'il ne fera pas.

// Table (tags OSM) → { emoji, label, color }. Ordre = priorité, premier match gagne.
export const POI_MAP = [
  [t => t.leisure === 'swimming_pool' || t.leisure === 'water_park',  { emoji: '🏊', label: 'Piscine',        color: '#38bdf8' }],
  [t => t.attraction === 'water_slide',                               { emoji: '🛝', label: 'Toboggan',       color: '#22d3ee' }],
  [t => t.leisure === 'sauna' || t.amenity === 'spa' || t.leisure === 'hot_tub', { emoji: '🧖', label: 'Spa / Jacuzzi', color: '#c084fc' }],
  [t => t.amenity === 'reception_desk' || t.office === 'camping',     { emoji: '🏠', label: 'Réception',      color: '#3b82f6' }],
  [t => t.leisure === 'miniature_golf',                               { emoji: '⛳', label: 'Mini-golf',      color: '#4ade80' }],
  [t => t.sport === 'padel',                                          { emoji: '🎾', label: 'Padel',          color: '#a3e635' }],
  [t => t.amenity === 'sanitary_dump_station',                        { emoji: '🚐', label: 'Vidange camping-car', color: '#64748b' }],
  [t => t.amenity === 'vending_machine',                              { emoji: '🥤', label: 'Distributeur',   color: '#f472b6' }],
  [t => t.shop === 'laundry',                                         { emoji: '🧺', label: 'Laverie',        color: '#8b5cf6' }],
  [t => t.shop === 'bakery',                                          { emoji: '🥖', label: 'Boulangerie',    color: '#d97706' }],
  [t => t.sport === 'petanque' || t.sport === 'boules',               { emoji: '🎳', label: 'Pétanque',       color: '#f59e0b' }],
  [t => t.sport === 'tennis',                                         { emoji: '🎾', label: 'Tennis',         color: '#a3e635' }],
  [t => t.sport === 'table_tennis',                                   { emoji: '🏓', label: 'Ping-pong',      color: '#f472b6' }],
  [t => t.sport === 'basketball',                                     { emoji: '🏀', label: 'Basket',         color: '#fb923c' }],
  [t => t.sport === 'volleyball' || t.sport === 'beachvolleyball',    { emoji: '🏐', label: 'Volley',         color: '#fbbf24' }],
  [t => t.sport === 'soccer' || t.sport === 'football',               { emoji: '⚽', label: 'Foot',           color: '#22c55e' }],
  [t => t.sport === 'multi',                                          { emoji: '🏟️', label: 'Terrain multi',   color: '#84cc16' }],
  [t => t.leisure === 'pitch',                                        { emoji: '🏟️', label: 'Terrain',        color: '#84cc16' }],
  [t => t.leisure === 'playground',                                   { emoji: '🎠', label: 'Aire de jeux',   color: '#f472b6' }],
  [t => t.leisure === 'fitness_station' || t.leisure === 'fitness_centre', { emoji: '💪', label: 'Fitness',   color: '#fb7185' }],
  [t => t.amenity === 'restaurant',                                   { emoji: '🍽️', label: 'Restaurant',     color: '#ef4444' }],
  [t => t.amenity === 'bar' || t.amenity === 'pub',                   { emoji: '🍺', label: 'Bar',            color: '#eab308' }],
  [t => t.amenity === 'cafe',                                         { emoji: '☕', label: 'Café',           color: '#a16207' }],
  [t => t.amenity === 'fast_food',                                    { emoji: '🍔', label: 'Snack',          color: '#f97316' }],
  [t => t.amenity === 'ice_cream',                                    { emoji: '🍦', label: 'Glacier',        color: '#f9a8d4' }],
  [t => t.amenity === 'bbq',                                          { emoji: '🍖', label: 'BBQ',            color: '#dc2626' }],
  [t => t.shop === 'convenience' || t.shop === 'supermarket',         { emoji: '🛒', label: 'Supérette',      color: '#0ea5e9' }],
  [t => t.tourism === 'information',                                  { emoji: 'ℹ️',  label: 'Accueil',        color: '#3b82f6' }],
  [t => t.amenity === 'toilets',                                      { emoji: '🚻', label: 'Sanitaires',     color: '#64748b' }],
  [t => t.amenity === 'shower',                                       { emoji: '🚿', label: 'Douches',        color: '#0891b2' }],
  [t => t.amenity === 'drinking_water',                               { emoji: '🚰', label: 'Point d\'eau',   color: '#06b6d4' }],
  [t => t.amenity === 'washing_machine' || t.amenity === 'laundry',   { emoji: '🧺', label: 'Laverie',        color: '#8b5cf6' }],
  [t => t.amenity === 'waste_disposal' || t.amenity === 'recycling',  { emoji: '♻️', label: 'Tri sélectif',   color: '#16a34a' }],
  [t => t.amenity === 'parking',                                      { emoji: '🅿️', label: 'Parking',        color: '#475569' }],
  [t => t.amenity === 'charging_station',                             { emoji: '🔌', label: 'Recharge',       color: '#22d3ee' }],
  [t => t.amenity === 'first_aid' || t.emergency === 'defibrillator', { emoji: '⛑️', label: 'Premiers secours', color: '#dc2626' }],
]

export function matchPoi(tags) {
  if (!tags) return null
  for (const [pred, info] of POI_MAP) if (pred(tags)) return info
  return null
}

// Libellés génériques, dérivés de la table ci-dessus pour qu'ils ne puissent
// pas diverger. Un point enregistré en base a perdu son drapeau interne
// « anonyme » ; c'est son libellé qui le trahit : un équipement nommé dans
// OpenStreetMap porte son nom propre, pas le nom de sa catégorie.
export const LABELS_GENERIQUES = new Set(POI_MAP.map(([, info]) => info.label))

export function estGenerique(pin) {
  if (typeof pin._generic === 'boolean') return pin._generic
  return LABELS_GENERIQUES.has(pin.label)
}

// Distance approchée en mètres entre deux points proches.
export function distM(a, b) {
  const dLat = (a.lat - b.lat) * 111320
  const dLng = (a.lng - b.lng) * 111320 * Math.cos(a.lat * Math.PI / 180)
  return Math.hypot(dLat, dLng)
}

// Plafonds par catégorie, pour les équipements anonymes.
//
// OpenStreetMap recense chaque place de parking, chaque bac à tri et chaque
// borne de recharge comme un objet distinct. Sur un grand camping cela donne
// des dizaines de pastilles identiques qui s'empilent et masquent ce qu'un
// vacancier cherche vraiment — la piscine, la réception, les sanitaires.
export const PLAFONDS = { '🅿️': 2, '♻️': 2, '🔌': 2, '🚻': 5 }
export const PLAFOND_DEFAUT = 4

// Plafond par catégorie pour les équipements NOMMÉS.
//
// Porter un nom ne suffit pas à mériter une pastille. Un camping en bord de
// station est entouré de bars, de glaciers et d'épiceries qui portent tous un
// nom : sans limite, la carte du camping devient la carte du village. Trois
// restaurants suffisent à dire « on mange ici » ; le quatrième n'ajoute que du
// bruit.
export const PLAFOND_NOMME = 3

// Nombre total de pastilles au-delà duquel la carte cesse d'être lisible sur un
// écran de téléphone. Les catégories les plus utiles au vacancier sont servies
// en premier : l'ordre de POI_MAP fait foi, piscine et réception en tête.
export const PLAFOND_TOTAL = 26

const PRIORITE = new Map(POI_MAP.map(([, info], i) => [info.emoji, i]))

/**
 * Fusionne les doublons puis plafonne, pour que la carte reste lisible.
 * Les points ajoutés à la main par le gérant (`osm` absent) traversent la
 * fonction intacts : ce sont des choix humains, jamais du bruit.
 */
export function desencombrer(pins) {
  const garde = []
  const candidats = []
  for (const p of pins || []) {
    if (!p || p.osm !== true || !p.lat || !p.lng) garde.push(p)
    else candidats.push(p)
  }

  // Fusion des doublons du même type. Les équipements anonymes fusionnent sur
  // un rayon bien plus large : deux bornes de tri à 60 m n'apportent rien de
  // plus qu'une. On préfère le point nommé, puis la surface au point.
  const fusionnes = []
  for (const p of candidats) {
    const anonyme = estGenerique(p)
    const rayon = anonyme ? 110 : 35
    const jumeau = fusionnes.find(o => o.emoji === p.emoji && distM(o, p) < rayon)
    if (!jumeau) { fusionnes.push(p); continue }
    const jumeauAnonyme = estGenerique(jumeau)
    const remplace = (!anonyme && jumeauAnonyme)
      || (anonyme === jumeauAnonyme && p._isWay && !jumeau._isWay)
    if (remplace) fusionnes[fusionnes.indexOf(jumeau)] = p
  }

  // Plafond par catégorie. Les nommés ont droit à davantage de place que les
  // anonymes, mais pas à une place illimitée.
  // Les deux compteurs sont distincts : partagés, une quinzaine de parkings
  // anonymes épuiseraient le quota avant que « Parking visiteurs Nord » ne
  // soit examiné, et l'équipement réellement identifié serait le seul écarté.
  const compteAnonyme = {}, compteNomme = {}
  const parCategorie = fusionnes.filter(p => {
    if (estGenerique(p)) {
      compteAnonyme[p.emoji] = (compteAnonyme[p.emoji] || 0) + 1
      return compteAnonyme[p.emoji] <= (PLAFONDS[p.emoji] ?? PLAFOND_DEFAUT)
    }
    compteNomme[p.emoji] = (compteNomme[p.emoji] || 0) + 1
    return compteNomme[p.emoji] <= PLAFOND_NOMME
  })

  // Plafond global, en deux temps. D'abord une place réservée à chaque
  // catégorie présente : trancher uniquement par priorité ferait disparaître
  // les parkings et le tri sélectif d'un coup, alors qu'un vacancier a besoin
  // de savoir qu'il y en a — juste pas de les voir seize fois. Ensuite les
  // places restantes vont aux exemplaires supplémentaires, nommés d'abord,
  // puis par ordre d'utilité (l'ordre de POI_MAP).
  const budget = Math.max(0, PLAFOND_TOTAL - garde.length)
  const indexes = parCategorie.map((p, i) => ({ p, i }))
  const rang = ({ p, i }) => [estGenerique(p) ? 1 : 0, PRIORITE.get(p.emoji) ?? 999, i]
  const parRang = (a, b) => {
    const ra = rang(a), rb = rang(b)
    return ra[0] - rb[0] || ra[1] - rb[1] || ra[2] - rb[2]
  }

  const vus = new Set()
  const premiers = [], supplements = []
  for (const e of indexes) {
    if (vus.has(e.p.emoji)) supplements.push(e)
    else { vus.add(e.p.emoji); premiers.push(e) }
  }

  const retenus = [
    ...premiers.sort(parRang).slice(0, budget),
    ...supplements.sort(parRang).slice(0, Math.max(0, budget - premiers.length)),
  ]
    .sort((a, b) => a.i - b.i)
    .map(({ p }) => p)

  return [...garde, ...retenus]
}
