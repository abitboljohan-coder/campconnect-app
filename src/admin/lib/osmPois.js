// Détection automatique des points d'intérêt d'un camping depuis OpenStreetMap

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
]

async function overpass(q) {
  let lastErr
  for (const url of OVERPASS_ENDPOINTS) {
    try {
      const r = await fetch(url, { method: 'POST', body: q, headers: { 'Content-Type': 'text/plain' } })
      const t = await r.text()
      if (!t.trim().startsWith('{')) { lastErr = new Error('non-JSON'); continue }
      return JSON.parse(t)
    } catch (e) { lastErr = e }
  }
  throw lastErr || new Error('Overpass indisponible')
}

// Map (tags OSM) → { emoji, label, color }. Ordre = priorité (premier match gagne).
const POI_MAP = [
  [t => t.leisure === 'swimming_pool',                                { emoji: '🏊', label: 'Piscine',        color: '#38bdf8' }],
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

function matchPoi(tags) {
  if (!tags) return null
  for (const [pred, info] of POI_MAP) if (pred(tags)) return info
  return null
}

// Ne garde que les POI "sûrs" pour lesquels on est confiant
// Un POI est "sûr" si :
//   - il a un tag amenity/leisure/sport/tourism spécifique bien mappé (POI_MAP l'a trouvé)
//   - ET il a un nom OU c'est un type non-ambigu (piscine, tennis, resto...)
const NAMELESS_OK = new Set([
  '🏊', '🎾', '🎳', '🏓', '🏀', '🏐', '⚽',      // équipements sportifs identifiables sans nom
  '🚻', '🚿', '🚰',                              // sanitaires évidents
  '🅿️', '🍖', '🎠',                             // parking, BBQ, aire de jeux
])
function isConfident(poi, tags) {
  if (tags?.name) return true
  return NAMELESS_OK.has(poi.emoji)
}

// Bounding box d'un polygone [[lat,lng], ...]
function bbox(polygon) {
  let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity
  for (const [la, ln] of polygon) {
    if (la < minLat) minLat = la; if (la > maxLat) maxLat = la
    if (ln < minLng) minLng = ln; if (ln > maxLng) maxLng = ln
  }
  return { minLat, maxLat, minLng, maxLng }
}

// Point dans polygone (ray casting)
function pointInPoly(pt, poly) {
  const [x, y] = pt
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j]
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)
    if (intersect) inside = !inside
  }
  return inside
}

/**
 * Détecte les POI dans le périmètre du camping (ou dans un rayon si pas de périmètre)
 * @param {[[lat,lng]]} perimeter - polygone du camping ou null
 * @param {{lat,lng}} fallbackCenter - centre si pas de périmètre
 * @returns {[{ref_id,ref_type:'lieu',label,emoji,color,lat,lng}]}
 */
export async function detectPois(perimeter, fallbackCenter) {
  let bounds, filter
  if (perimeter?.length >= 3) {
    bounds = bbox(perimeter)
    filter = `(${bounds.minLat},${bounds.minLng},${bounds.maxLat},${bounds.maxLng})`
  } else if (fallbackCenter) {
    filter = `(around:400,${fallbackCenter.lat},${fallbackCenter.lng})`
  } else {
    throw new Error('Aucun périmètre ni position de fallback')
  }

  const q = `[out:json][timeout:25];
    (
      node${filter}["amenity"];
      node${filter}["leisure"];
      node${filter}["sport"];
      node${filter}["tourism"];
      node${filter}["shop"];
      way${filter}["amenity"];
      way${filter}["leisure"];
      way${filter}["sport"];
    );
    out center tags;`

  const j = await overpass(q)
  const pois = []
  const seen = new Set()

  for (const el of j.elements || []) {
    const tags = el.tags
    const info = matchPoi(tags)
    if (!info) continue

    const lat = el.lat ?? el.center?.lat
    const lng = el.lon ?? el.center?.lon
    if (!lat || !lng) continue

    // Si périmètre défini, filtrer aux POI inside
    if (perimeter?.length >= 3 && !pointInPoly([lat, lng], perimeter)) continue

    const poi = {
      ref_id:   `osm-${el.type}-${el.id}`,
      ref_type: 'lieu',
      label:    tags.name || info.label,
      emoji:    info.emoji,
      color:    info.color,
      lat, lng,
      osm:      true,
    }
    if (!isConfident(poi, tags)) continue

    const key = `${info.emoji}-${lat.toFixed(5)}-${lng.toFixed(5)}`
    if (seen.has(key)) continue
    seen.add(key)
    pois.push(poi)
  }
  return pois
}

// Recherche Nominatim + retourne { lat, lng, display_name } de la meilleure correspondance
export async function geocodeCamping(query) {
  const r = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=3&polygon_geojson=1&addressdetails=1`,
    { headers: { 'Accept-Language': 'fr' } })
  const j = await r.json()
  return j
}

// Cherche un polygone camping dans un rayon
export async function findCampsitePolygon(lat, lng, radius = 800) {
  const q = `[out:json][timeout:20];
    (
      way(around:${radius},${lat},${lng})["tourism"="camp_site"];
      relation(around:${radius},${lat},${lng})["tourism"="camp_site"];
      way(around:${radius},${lat},${lng})["leisure"="campsite"];
      relation(around:${radius},${lat},${lng})["leisure"="campsite"];
    );
    out geom tags;`
  const j = await overpass(q)
  const polys = []
  for (const el of j.elements || []) {
    if (el.type === 'way' && el.geometry?.length >= 3) {
      polys.push({ poly: el.geometry.map(g => [g.lat, g.lon]), tags: el.tags })
    }
    if (el.type === 'relation' && el.members) {
      const outer = el.members.find(m => m.role === 'outer' && m.geometry)
      if (outer && outer.geometry.length >= 3) {
        polys.push({ poly: outer.geometry.map(g => [g.lat, g.lon]), tags: el.tags })
      }
    }
  }
  if (!polys.length) return null
  // Prend le plus proche du point cliqué
  polys.sort((a, b) => {
    const ca = a.poly.reduce((s, [x, y]) => [s[0] + x, s[1] + y], [0, 0]).map(v => v / a.poly.length)
    const cb = b.poly.reduce((s, [x, y]) => [s[0] + x, s[1] + y], [0, 0]).map(v => v / b.poly.length)
    return ((ca[0] - lat) ** 2 + (ca[1] - lng) ** 2) - ((cb[0] - lat) ** 2 + (cb[1] - lng) ** 2)
  })
  return polys[0].poly
}
