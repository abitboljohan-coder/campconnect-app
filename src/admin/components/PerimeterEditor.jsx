import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../supabase'

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

  const [points, setPoints]     = useState(() => camping?.carte_config?.perimeter || [])
  const [saving, setSaving]     = useState(false)
  const [ready, setReady]       = useState(false)
  const [mode, setMode]         = useState('click') // 'click' | 'rect'
  const [search, setSearch]     = useState(camping?.nom || '')
  const [searchResults, setSearchResults] = useState([])
  const [importing, setImporting] = useState(false)
  const [notice, setNotice]     = useState('')

  const couleur = camping?.couleur_principale || '#639922'

  useEffect(() => {
    let mounted = true
    let map = null
    ;(async () => {
      const L = await loadLeaflet()
      LRef.current = L
      if (!mounted || !mapRef.current) return

      let start
      if (points.length) start = { lat: points[0][0], lng: points[0][1] }
      else {
        try {
          const res = await nominatimSearch((camping?.nom || 'camping') + ' France')
          start = res[0] ? { lat: +res[0].lat, lng: +res[0].lon } : { lat: 46.5, lng: 2.5 }
        } catch { start = { lat: 46.5, lng: 2.5 } }
      }

      map = L.map(mapRef.current, {
        center: [start.lat, start.lng],
        zoom: points.length ? 17 : 17,
        maxZoom: 20,
      })
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

  async function runSearch() {
    if (!search.trim()) return
    setSearchResults([])
    try {
      const res = await nominatimSearch(search)
      setSearchResults(res)
      if (res[0] && leafletMap.current) {
        leafletMap.current.setView([+res[0].lat, +res[0].lon], 17)
      }
    } catch (e) { setNotice('Recherche échouée') }
  }

  function pickResult(r) {
    leafletMap.current.setView([+r.lat, +r.lon], 18)
    setSearchResults([])
  }

  async function importFromOSM() {
    if (!leafletMap.current) return
    setImporting(true); setNotice('')
    const c = leafletMap.current.getCenter()
    try {
      const poly = await overpassCampsiteAround(c.lat, c.lng, 1500)
      if (poly) {
        setPoints(poly)
        leafletMap.current.fitBounds(poly, { padding: [40, 40] })
        setNotice(`✅ Contour importé depuis OpenStreetMap (${poly.length} points)`)
      } else {
        setNotice('❌ Aucun camping trouvé dans OSM autour de ce point. Zoomez sur votre camping et réessayez.')
      }
    } catch (e) { setNotice('Erreur Overpass : ' + e.message) }
    setImporting(false)
    setTimeout(() => setNotice(''), 5000)
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
      }}>
        <div style={{ minWidth: 180 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Tracer le contour</div>
          <div style={{ fontSize: 11, color: '#6b7280' }}>
            {points.length} pt · {mode === 'rect' ? 'Drag pour dessiner un rectangle' : 'Clic pour ajouter · drag pour bouger · clic droit pour retirer'}
          </div>
        </div>

        {/* Recherche */}
        <div style={{ display: 'flex', gap: 4, position: 'relative' }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && runSearch()}
            placeholder="Chercher un camping / lieu…"
            style={{ padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, width: 220 }} />
          <button onClick={runSearch}
            style={{ padding: '7px 12px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
            🔍
          </button>
          {searchResults.length > 0 && (
            <div style={{ position: 'absolute', top: '110%', left: 0, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, boxShadow: '0 6px 20px rgba(0,0,0,0.15)', minWidth: 300, maxHeight: 220, overflowY: 'auto', zIndex: 20 }}>
              {searchResults.map(r => (
                <button key={r.place_id} onClick={() => pickResult(r)}
                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: '#fff', cursor: 'pointer', fontSize: 12, borderBottom: '1px solid #f3f4f6' }}>
                  {r.display_name}
                </button>
              ))}
            </div>
          )}
        </div>

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
