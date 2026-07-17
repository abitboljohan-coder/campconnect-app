import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../../supabase'
import { searchCampsiteByName } from '../lib/osmPois'

let LPromise = null
function loadLeaflet() {
  if (LPromise) return LPromise
  LPromise = (async () => {
    const L = (await import('leaflet')).default
    await import('leaflet/dist/leaflet.css')
    return L
  })()
  return LPromise
}

async function nominatimSearch(q) {
  const r = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&polygon_geojson=1`,
    { headers: { 'Accept-Language': 'fr' } })
  return r.json()
}

// Polygone renvoyé directement par Nominatim/OSM (camping déjà cartographié) → [ [lat,lng], … ]
function extractPolygon(r) {
  const g = r?.geojson
  if (!g) return null
  if (g.type === 'Polygon')      return g.coordinates[0].map(([lon, lat]) => [lat, lon])
  if (g.type === 'MultiPolygon') return g.coordinates[0][0].map(([lon, lat]) => [lat, lon])
  return null
}

// Extrait { cp, ville } d'une adresse libre — cherche un code postal à 5 chiffres
// suivi du nom de ville, où qu'il soit dans le texte (gère "83310 Grimaud" collé).
function extractCity(raw) {
  const parts = raw.split(',').map(s => s.trim())
  for (const p of parts) {
    const m = p.match(/^(\d{5})\s+(.+)$/)
    if (m) return { cp: m[1], ville: m[2].trim() }
  }
  const m2 = raw.match(/\b(\d{5})\b\s+([A-Za-zÀ-ÿ'’-]+(?:[ -][A-Za-zÀ-ÿ'’-]+)*)/)
  return m2 ? { cp: m2[1], ville: m2[2].trim() } : { cp: '', ville: '' }
}

// Variantes de recherche dégradées : une adresse complète échoue souvent telle quelle.
function geocodeVariants(raw) {
  const parts = raw.split(',').map(s => s.trim()).filter(Boolean)
  const name  = parts[0] || raw
  const { cp, ville } = extractCity(raw)
  const out = [raw]
  if (name && ville) out.push(`${name}, ${ville} France`)
  if (cp && ville)   out.push(`${cp} ${ville} France`)
  if (ville)         out.push(`${ville} France`)
  return [...new Set(out.filter(Boolean))]
}

async function geocodeBest(raw) {
  for (const q of geocodeVariants(raw)) {
    try { const res = await nominatimSearch(q); if (res?.length) return res } catch { /* variante suivante */ }
  }
  return []
}

// Miroirs Overpass (le principal est souvent surchargé)
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
]

async function overpassQuery(q) {
  let lastErr
  for (const url of OVERPASS_ENDPOINTS) {
    try {
      const r = await fetch(url, {
        method: 'POST', body: q, headers: { 'Content-Type': 'text/plain' },
      })
      const txt = await r.text()
      if (!txt.trim().startsWith('{')) {
        lastErr = new Error(`Overpass ${new URL(url).host} : réponse non-JSON (rate-limit?)`)
        continue
      }
      return JSON.parse(txt)
    } catch (e) { lastErr = e }
  }
  throw lastErr || new Error('Tous les miroirs Overpass sont indisponibles')
}

// Cherche un polygone de camping dans un rayon (les 2 tags OSM les plus utilisés)
async function overpassCampsiteAround(lat, lng, radius = 1500) {
  const q = `[out:json][timeout:20];
    (
      way(around:${radius},${lat},${lng})["tourism"="camp_site"];
      relation(around:${radius},${lat},${lng})["tourism"="camp_site"];
      way(around:${radius},${lat},${lng})["leisure"="campsite"];
      relation(around:${radius},${lat},${lng})["leisure"="campsite"];
      way(around:${radius},${lat},${lng})["tourism"="caravan_site"];
      relation(around:${radius},${lat},${lng})["tourism"="caravan_site"];
    );
    out geom tags;`
  const j = await overpassQuery(q)
  // Prend le plus grand polygone (aire) trouvé
  const polys = []
  for (const el of j.elements) {
    if (el.type === 'way' && el.geometry && el.geometry.length >= 3) {
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
  // Prend le polygone dont le centre est le plus proche du point cliqué
  function centroid(pts) {
    let sx = 0, sy = 0
    for (const [a, b] of pts) { sx += a; sy += b }
    return [sx / pts.length, sy / pts.length]
  }
  polys.sort((a, b) => {
    const ca = centroid(a.poly), cb = centroid(b.poly)
    const da = (ca[0] - lat) ** 2 + (ca[1] - lng) ** 2
    const db = (cb[0] - lat) ** 2 + (cb[1] - lng) ** 2
    return da - db
  })
  return polys[0].poly
}

export default function PerimeterEditor({ camping, onClose, onSaved }) {
  const mapRef = useRef(null)
  const leafletMap = useRef(null)
  const polygonRef = useRef(null)
  const markersRef = useRef([])
  const rectPreviewRef = useRef(null)
  const LRef = useRef(null)
  const searchWrapRef = useRef(null)

  const [points, setPoints]     = useState(() => camping?.carte_config?.perimeter || [])
  const [saving, setSaving]     = useState(false)
  const [ready, setReady]       = useState(false)
  const [mode, setMode]         = useState('click') // 'click' | 'rect'
  const [search, setSearch]     = useState(camping?.nom || '')
  const [searchResults, setSearchResults] = useState([])
  const [searchTouched, setSearchTouched] = useState(false)
  const [dropdownRect, setDropdownRect] = useState(null)
  const [importing, setImporting] = useState(false)
  const [notice, setNotice]     = useState('')

  // Position du menu déroulant calculée en viewport — rendu via portail pour
  // échapper à tout contexte d'empilement créé par la carte Leaflet.
  useLayoutEffect(() => {
    if (searchResults.length === 0 || !searchWrapRef.current) { setDropdownRect(null); return }
    const r = searchWrapRef.current.getBoundingClientRect()
    setDropdownRect({ top: r.bottom + 4, left: r.left, width: Math.max(r.width, 300) })
  }, [searchResults])

  const couleur = camping?.couleur_principale || '#639922'

  useEffect(() => {
    let mounted = true
    let map = null
    ;(async () => {
      const L = await loadLeaflet()
      LRef.current = L
      if (!mounted || !mapRef.current) return

      // Centrage : périmètre existant → point GPS connu du camping → pin existant
      // → géocodage du nom → sinon vue large France (zoom 5) avec invite à chercher.
      let start, startZoom = 17
      const cfg = camping?.carte_config || {}
      const pin = (cfg.pins || []).find(p => p.lat && p.lng)
      if (points.length) {
        start = { lat: points[0][0], lng: points[0][1] }
      } else if (cfg.center?.lat && cfg.center?.lng) {
        start = cfg.center
      } else if (pin) {
        start = { lat: pin.lat, lng: pin.lng }
      } else {
        try {
          const res = await nominatimSearch((camping?.nom || 'camping') + ' France')
          if (res[0]) start = { lat: +res[0].lat, lng: +res[0].lon }
          else { start = { lat: 46.6, lng: 2.4 }; startZoom = 5 }
        } catch { start = { lat: 46.6, lng: 2.4 }; startZoom = 5 }
      }

      map = L.map(mapRef.current, {
        center: [start.lat, start.lng],
        zoom: startZoom,
        maxZoom: 20,
      })
      if (startZoom === 5) {
        setNotice('🔎 Cherchez votre camping dans la barre de recherche, ou zoomez sur la carte, avant de tracer.')
      }
      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 20, maxNativeZoom: 19, attribution: '© Esri' }
      ).addTo(map)

      leafletMap.current = map
      setReady(true)
    })()

    return () => {
      mounted = false
      if (map) map.remove()
      leafletMap.current = null
    }
  }, []) // eslint-disable-line

  // Attache le comportement selon le mode (click / rect)
  useEffect(() => {
    if (!ready || !leafletMap.current) return
    const map = leafletMap.current
    const L = LRef.current

    // Mode CLIC : chaque clic ajoute un point
    function onClick(e) {
      setPoints(p => [...p, [e.latlng.lat, e.latlng.lng]])
    }

    // Mode RECT : mousedown → mousemove aperçu → mouseup crée les 4 coins
    let dragStart = null
    function onMouseDown(e) {
      if (e.originalEvent.button !== 0) return
      dragStart = e.latlng
      map.dragging.disable()
      if (rectPreviewRef.current) rectPreviewRef.current.remove()
      rectPreviewRef.current = L.rectangle([dragStart, dragStart], {
        color: couleur, weight: 2, dashArray: '5,5', fillOpacity: 0.15,
      }).addTo(map)
    }
    function onMouseMove(e) {
      if (!dragStart || !rectPreviewRef.current) return
      rectPreviewRef.current.setBounds([dragStart, e.latlng])
    }
    function onMouseUp(e) {
      if (!dragStart) return
      const a = dragStart, b = e.latlng
      dragStart = null
      map.dragging.enable()
      if (rectPreviewRef.current) { rectPreviewRef.current.remove(); rectPreviewRef.current = null }
      // Assez de mouvement ?
      if (Math.abs(a.lat - b.lat) < 0.00005 && Math.abs(a.lng - b.lng) < 0.00005) return
      const nw = [Math.max(a.lat, b.lat), Math.min(a.lng, b.lng)]
      const ne = [Math.max(a.lat, b.lat), Math.max(a.lng, b.lng)]
      const se = [Math.min(a.lat, b.lat), Math.max(a.lng, b.lng)]
      const sw = [Math.min(a.lat, b.lat), Math.min(a.lng, b.lng)]
      setPoints([nw, ne, se, sw])
      setMode('click') // repasse en mode ajustement
    }

    if (mode === 'click') {
      map.on('click', onClick)
    } else if (mode === 'rect') {
      map.on('mousedown', onMouseDown)
      map.on('mousemove', onMouseMove)
      map.on('mouseup',   onMouseUp)
    }
    return () => {
      map.off('click', onClick)
      map.off('mousedown', onMouseDown)
      map.off('mousemove', onMouseMove)
      map.off('mouseup',   onMouseUp)
    }
  }, [mode, ready, couleur])

  // Rendu polygone + poignées
  useEffect(() => {
    if (!ready || !leafletMap.current || !LRef.current) return
    const L = LRef.current
    const map = leafletMap.current

    if (polygonRef.current) { polygonRef.current.remove(); polygonRef.current = null }
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    if (points.length >= 2) {
      polygonRef.current = L.polygon(points, {
        color: couleur, weight: 3, fillColor: couleur, fillOpacity: 0.18,
      }).addTo(map)
    }

    points.forEach((pt, i) => {
      const icon = L.divIcon({
        html: `<div style="background:#fff;border:3px solid ${couleur};width:18px;height:18px;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.4);cursor:grab"></div>`,
        className: '', iconSize: [18, 18], iconAnchor: [9, 9],
      })
      const m = L.marker(pt, { icon, draggable: true }).addTo(map)
      m.on('drag',  (e) => {
        const ll = e.target.getLatLng()
        setPoints(prev => prev.map((p, j) => j === i ? [ll.lat, ll.lng] : p))
      })
      m.on('contextmenu', (e) => {
        e.originalEvent.preventDefault()
        setPoints(prev => prev.filter((_, j) => j !== i))
      })
      m.bindTooltip(`Point ${i + 1} — clic droit pour retirer`, { direction: 'top', offset: [0, -8] })
      markersRef.current.push(m)
    })
  }, [points, ready, couleur])

  // Centre sur un résultat Nominatim et trace le contour automatiquement si possible.
  async function useResult(r) {
    setSearchResults([])
    const lat = +r.lat, lng = +r.lon
    leafletMap.current?.setView([lat, lng], 17)

    const poly = extractPolygon(r)
    if (poly && poly.length >= 4) {
      setPoints(poly)
      leafletMap.current?.fitBounds(poly, { padding: [40, 40] })
      setNotice(`✅ Contour trouvé (${poly.length} points)`)
      setTimeout(() => setNotice(''), 4000); return
    }

    setNotice('📍 Localisé — détection du contour…')
    try {
      const p = await overpassCampsiteAround(lat, lng, 2000)
      if (p) {
        setPoints(p)
        leafletMap.current?.fitBounds(p, { padding: [40, 40] })
        setNotice(`✅ Contour importé (${p.length} points)`)
      } else {
        setNotice('📍 Camping localisé. Trace le contour à la main (clic ou ▭ Rectangle).')
      }
    } catch { setNotice('📍 Localisé. Trace le contour à la main.') }
    setTimeout(() => setNotice(''), 6000)
  }

  function pickResult(r) { useResult(r) }

  // Menu déroulant en direct : dès 3 caractères, on propose les adresses correspondantes
  // pour que le gérant clique sur la bonne au lieu de deviner à sa place.
  // (Ne s'ouvre pas tout seul à l'ouverture : attend une vraie saisie.)
  useEffect(() => {
    if (!searchTouched || search.trim().length < 3) { setSearchResults([]); return }
    let cancelled = false
    const t = setTimeout(async () => {
      try {
        const res = await nominatimSearch(search)
        if (!cancelled) setSearchResults(res || [])
      } catch { if (!cancelled) setSearchResults([]) }
    }, 400)
    return () => { cancelled = true; clearTimeout(t) }
  }, [search, searchTouched])

  // Tentative auto rapide : cherche DIRECTEMENT le camping dans OSM par nom + ville
  // (bien plus fiable qu'un géocodage d'adresse postale). Ne fait rien si rien trouvé —
  // le menu déroulant reste disponible pour un choix manuel.
  async function tryAutoOsm(raw) {
    const parts = raw.split(',').map(s => s.trim()).filter(Boolean)
    const name = parts[0] || raw
    const { ville } = extractCity(raw)
    try {
      const osmResults = await searchCampsiteByName(name, ville)
      if (!osmResults.length) return false
      const best = osmResults.find(r => r.poly) || osmResults[0]
      leafletMap.current?.setView([best.center.lat, best.center.lng], 17)
      if (best.poly) {
        setPoints(best.poly)
        leafletMap.current?.fitBounds(best.poly, { padding: [40, 40] })
        setNotice(`✅ Contour trouvé sur OpenStreetMap (${best.poly.length} points)`)
        setTimeout(() => setNotice(''), 4000)
        return true
      }
      setNotice('📍 Camping localisé — détection du contour…')
      const p = await overpassCampsiteAround(best.center.lat, best.center.lng, 1000)
      if (p) {
        setPoints(p); leafletMap.current?.fitBounds(p, { padding: [40, 40] })
        setNotice(`✅ Contour importé (${p.length} points)`)
      } else {
        setNotice('📍 Camping localisé. Trace le contour à la main (clic ou ▭ Rectangle).')
      }
      setTimeout(() => setNotice(''), 6000)
      return true
    } catch { return false }
  }

  async function runSearch() {
    if (!search.trim()) return
    setNotice('🔍 Recherche…')
    const found = await tryAutoOsm(search)
    if (found) return
    const res = await geocodeBest(search)
    setSearchResults(res)
    setNotice(res.length ? '👇 Choisissez la bonne adresse dans la liste' : '❌ Introuvable. Essayez juste « nom + ville », ou tracez le contour à la main.')
    setTimeout(() => setNotice(''), 6000)
  }

  async function importFromOSM() {
    if (!leafletMap.current) return
    setImporting(true); setNotice('')
    try {
      if (search.trim()) {
        const found = await tryAutoOsm(search)
        if (found) { setImporting(false); return }
      }
      const c = leafletMap.current.getCenter()
      const poly = await overpassCampsiteAround(c.lat, c.lng, 2000)
      if (poly) {
        setPoints(poly)
        leafletMap.current.fitBounds(poly, { padding: [40, 40] })
        setNotice(`✅ Contour importé depuis OpenStreetMap (${poly.length} points)`)
      } else {
        setNotice('❌ Aucun camping trouvé ici. Tapez le nom + la ville dans la recherche, ou tracez à la main.')
      }
    } catch (e) { setNotice('Erreur : ' + e.message) }
    setImporting(false)
    setTimeout(() => setNotice(''), 6000)
  }

  async function save() {
    setSaving(true)
    const newCfg = { ...(camping.carte_config || {}), perimeter: points }
    const { error } = await supabase.from('campings')
      .update({ carte_config: newCfg }).eq('id', camping.id)
    setSaving(false)
    if (error) { alert('Erreur : ' + error.message); return }
    onSaved?.(newCfg)
    onClose?.()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.85)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Barre du haut */}
      <div style={{
        padding: '10px 16px', background: '#fff',
        display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
        borderBottom: '1px solid #e5e7eb',
        position: 'relative', zIndex: 30,
      }}>
        <div style={{ minWidth: 180 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Tracer le contour</div>
          <div style={{ fontSize: 11, color: '#6b7280' }}>
            {points.length} pt · {mode === 'rect' ? 'Drag pour dessiner un rectangle' : 'Clic pour ajouter · drag pour bouger · clic droit pour retirer'}
          </div>
        </div>

        {/* Recherche */}
        <div ref={searchWrapRef} style={{ display: 'flex', gap: 4, position: 'relative' }}>
          <input value={search} onChange={e => { setSearch(e.target.value); setSearchTouched(true) }}
            onKeyDown={e => e.key === 'Enter' && runSearch()}
            placeholder="Ex : Camping du Lac, 12345 Villeneuve"
            style={{ padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, width: 220 }} />
          <button onClick={runSearch}
            style={{ padding: '7px 12px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
            🔍
          </button>
        </div>

        {/* Menu déroulant en portail : échappe à tout contexte d'empilement de la carte Leaflet */}
        {searchResults.length > 0 && dropdownRect && createPortal(
          <div style={{
            position: 'fixed', top: dropdownRect.top, left: dropdownRect.left, width: dropdownRect.width,
            background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10,
            boxShadow: '0 6px 20px rgba(0,0,0,0.25)', maxHeight: 260, overflowY: 'auto', zIndex: 999999,
          }}>
            {searchResults.map(r => (
              <button key={r.place_id} onClick={() => pickResult(r)}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: '#fff', cursor: 'pointer', fontSize: 12, borderBottom: '1px solid #f3f4f6' }}>
                {r.display_name}
              </button>
            ))}
          </div>,
          document.body
        )}

        {/* Outils */}
        <button onClick={() => setMode(mode === 'rect' ? 'click' : 'rect')}
          style={{ padding: '7px 12px', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 600,
                   background: mode === 'rect' ? '#639922' : '#f3f4f6',
                   color:      mode === 'rect' ? '#fff'    : '#374151',
                   border: '1px solid ' + (mode === 'rect' ? '#639922' : '#d1d5db') }}>
          ▭ Rectangle
        </button>

        <button onClick={importFromOSM} disabled={importing}
          style={{ padding: '7px 12px', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 600,
                   background: '#eef2ff', color: '#4338ca', border: '1px solid #c7d2fe' }}>
          {importing ? '⏳ Détection…' : '🔍 Détecter le camping'}
        </button>

        <button onClick={() => setPoints([])} disabled={!points.length}
          style={{ padding: '7px 10px', border: '1px solid #d1d5db', background: '#fff', borderRadius: 8, fontSize: 12, cursor: points.length ? 'pointer' : 'not-allowed', opacity: points.length ? 1 : 0.4 }}>
          Effacer
        </button>

        <div style={{ flex: 1 }} />

        <button onClick={onClose}
          style={{ padding: '7px 12px', border: '1px solid #d1d5db', background: '#fff', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
          Annuler
        </button>
        <button onClick={save} disabled={saving || points.length < 3}
          style={{ padding: '7px 14px', background: '#639922', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: (saving || points.length < 3) ? 'not-allowed' : 'pointer', opacity: points.length < 3 ? 0.5 : 1 }}>
          {saving ? '…' : 'Enregistrer'}
        </button>
      </div>

      {notice && (
        <div style={{ padding: '8px 16px', background: notice.startsWith('✅') ? '#dcfce7' : '#fef2f2',
                      color: notice.startsWith('✅') ? '#166534' : '#dc2626', fontSize: 13, fontWeight: 500 }}>
          {notice}
        </div>
      )}

      <div ref={mapRef} style={{ flex: 1, background: '#000', cursor: mode === 'rect' ? 'crosshair' : 'crosshair' }} />
    </div>
  )
}
