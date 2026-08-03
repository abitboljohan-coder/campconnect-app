// Détection automatique des points d'intérêt d'un camping depuis OpenStreetMap

import { matchPoi, desencombrer } from '../../lib/poiCategories'

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
]

function tryOne(url, q, timeoutMs) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  return fetch(url, { method: 'POST', body: q, headers: { 'Content-Type': 'text/plain' }, signal: ctrl.signal })
    .then(async r => {
      const txt = await r.text()
      if (!txt.trim().startsWith('{')) throw new Error(`${new URL(url).host}: rejeté (surcharge)`)
      return JSON.parse(txt)
    })
    .finally(() => clearTimeout(t))
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

// Retry robuste : 3 miroirs en parallèle, jusqu'à 2 passes avec backoff
async function overpass(q, timeoutMs = 25000) {
  let lastErr
  for (let pass = 0; pass < 2; pass++) {
    if (pass > 0) await sleep(800)
    try {
      return await Promise.any(OVERPASS_ENDPOINTS.map(u => tryOne(u, q, timeoutMs)))
    } catch (e) {
      lastErr = e
      const errs = e.errors || []
      const msgs = errs.map(x => x?.message || String(x)).join(' | ')
      lastErr = new Error(msgs || 'timeout ' + timeoutMs + 'ms')
    }
  }
  throw lastErr
}

async function overpassRace(q, msMax = 8000) {
  return Promise.race([
    overpass(q, msMax),
    new Promise((_, rej) => setTimeout(() => rej(new Error('overpass-slow')), msMax)),
  ])
}

function stripAccents(s) {
  return (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
}

// Confiance CONTEXTUELLE :
// • DANS le contour tracé du camping → tout équipement mappé est fiable, même sans nom
//   (un court de tennis à l'intérieur du camping n'a presque jamais de "name" dans OSM).
// • HORS contour (détection par rayon) → on reste strict pour ne pas ramasser
//   le tennis municipal ou le resto du village d'à côté.
const NAMELESS_OK = new Set(['🏊', '🚻', '🚿', '🚰', '🍖', '🎠', '🛝', '🚐'])
const NAME_REQUIRED = new Set(['🎾', '🎳', '🏓', '🏀', '🏐', '⚽', '🏟️', '🍽️', '🍺', '☕', '🍔', '🍦', '💪', '🥖', '🛒'])

function isConfident(poi, tags, insidePerimeter) {
  if (insidePerimeter) return true
  if (NAME_REQUIRED.has(poi.emoji)) return !!tags?.name
  if (tags?.name) return true
  return NAMELESS_OK.has(poi.emoji)
}

// Dilate légèrement le polygone autour de son centroïde (~ tolérance de bordure).
// La réception ou l'épicerie sont souvent cartographiées à l'entrée, à cheval sur la limite.
function inflatePoly(poly, factor = 1.06) {
  let cx = 0, cy = 0
  for (const [a, b] of poly) { cx += a; cy += b }
  cx /= poly.length; cy /= poly.length
  return poly.map(([a, b]) => [cx + (a - cx) * factor, cy + (b - cy) * factor])
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
      node${filter}["attraction"];
      node${filter}["office"="camping"];
      way${filter}["amenity"];
      way${filter}["leisure"];
      way${filter}["sport"];
      way${filter}["shop"];
      way${filter}["attraction"];
    );
    out center tags;`

  const j = await overpass(q, 30000)  // POI = requête lourde, 30s max
  const pois = []
  const hasPerim = perimeter?.length >= 3
  const strictPoly  = hasPerim ? perimeter : null
  const bufferPoly  = hasPerim ? inflatePoly(perimeter) : null

  for (const el of j.elements || []) {
    const tags = el.tags
    const info = matchPoi(tags)
    if (!info) continue

    const lat = el.lat ?? el.center?.lat
    const lng = el.lon ?? el.center?.lon
    if (!lat || !lng) continue

    // Filtre géographique : contour + petite marge (réception/épicerie en bordure)
    let inside = false
    if (hasPerim) {
      if (!pointInPoly([lat, lng], bufferPoly)) continue
      inside = pointInPoly([lat, lng], strictPoly)
    }

    const poi = {
      ref_id:   `osm-${el.type}-${el.id}`,
      ref_type: 'lieu',
      label:    tags.name || info.label,
      emoji:    info.emoji,
      color:    info.color,
      lat, lng,
      osm:      true,
      _generic: !tags.name,
      _isWay:   el.type !== 'node',
    }
    if (!isConfident(poi, tags, inside)) continue
    pois.push(poi)
  }

  // Fusion des doublons (point + surface du même équipement, bassins multiples…)
  // puis plafonnement, pour que la carte reste lisible sur un grand camping.
  // Les drapeaux internes ne sont pas persistés : la base ne stocke que ce qui
  // décrit le point, pas la façon dont il a été trié.
  return desencombrer(pois).map(p => {
    const propre = { ...p }
    delete propre._generic
    delete propre._isWay
    return propre
  })
}

// Recherche Nominatim + retourne { lat, lng, display_name } de la meilleure correspondance
export async function geocodeCamping(query) {
  const r = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=3&polygon_geojson=1&addressdetails=1`,
    { headers: { 'Accept-Language': 'fr' } })
  const j = await r.json()
  return j
}

// Cherche DIRECTEMENT un camping par son nom dans tout OSM
// Renvoie [{ poly: [[lat,lng]], name, center: {lat,lng}, tags }]
export async function searchCampsiteByName(name, hintCity = '') {
  // Nettoie : enlève "camping" du début, articles, et accents pour un match large
  const cleaned = name.replace(/^camping\s+/i, '').trim()
  const noArticle = cleaned.replace(/^(les|la|le|l')\s+/i, '').trim()
  const noAccent = stripAccents(noArticle)
  // Mots significatifs (>3 lettres, sans articles)
  const words = noAccent.split(/\s+/).filter(w => w.length > 3)
  const patterns = new Set([cleaned, noArticle, noAccent, ...words].filter(Boolean))
  const regex = [...patterns].map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')

  const cityFilter = hintCity ? `["addr:city"~"${hintCity.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}",i]` : ''

  const q = `[out:json][timeout:12];
    (
      way["tourism"="camp_site"]["name"~"${regex}",i]${cityFilter};
      relation["tourism"="camp_site"]["name"~"${regex}",i]${cityFilter};
      node["tourism"="camp_site"]["name"~"${regex}",i]${cityFilter};
      way["leisure"="campsite"]["name"~"${regex}",i]${cityFilter};
      way["tourism"="caravan_site"]["name"~"${regex}",i]${cityFilter};
    );
    out geom tags center;`

  const j = await overpassRace(q, 10000)
  const results = []
  for (const el of j.elements || []) {
    let poly = null, center = null
    if (el.type === 'way' && el.geometry?.length >= 3) {
      poly = el.geometry.map(g => [g.lat, g.lon])
      center = { lat: poly[0][0], lng: poly[0][1] }
    } else if (el.type === 'relation' && el.members) {
      const outer = el.members.find(m => m.role === 'outer' && m.geometry)
      if (outer && outer.geometry.length >= 3) {
        poly = outer.geometry.map(g => [g.lat, g.lon])
        center = { lat: poly[0][0], lng: poly[0][1] }
      }
    } else if (el.type === 'node') {
      center = { lat: el.lat, lng: el.lon }
    } else if (el.center) {
      center = { lat: el.center.lat, lng: el.center.lon }
    }
    if (!center) continue
    results.push({ poly, center, name: el.tags?.name, tags: el.tags, addr: el.tags?.['addr:city'] || el.tags?.['addr:street'] || '' })
  }
  return results
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
