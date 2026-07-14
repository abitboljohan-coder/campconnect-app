import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../supabase'

// Charge Leaflet + leaflet-distortableimage à la demande
let LPromise = null
function loadLeaflet() {
  if (LPromise) return LPromise
  LPromise = (async () => {
    const L = (await import('leaflet')).default
    await import('leaflet/dist/leaflet.css')
    await import('leaflet-distortableimage/dist/vendor.css')
    await import('leaflet-distortableimage/dist/leaflet.distortableimage.css')
    // La lib s'auto-enregistre sur L global
    window.L = L
    await import('leaflet-distortableimage/dist/vendor.js')
    await import('leaflet-distortableimage/dist/leaflet.distortableimage.js')
    return L
  })()
  return LPromise
}

async function geocode(nom) {
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(nom + ' camping France')}&format=json&limit=1`,
      { headers: { 'Accept-Language': 'fr' } })
    const d = await r.json()
    if (d[0]) return { lat: +d[0].lat, lng: +d[0].lon }
  } catch {}
  return { lat: 46.5, lng: 2.5 }
}

export default function PlanCalibrator({ camping, onClose, onSaved }) {
  const mapRef = useRef(null)
  const leafletMap = useRef(null)
  const overlayRef = useRef(null)
  const [saving, setSaving] = useState(false)
  const [opacity, setOpacity] = useState(0.6)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let mounted = true
    let map = null
    ;(async () => {
      const L = await loadLeaflet()
      if (!mounted || !mapRef.current) return

      const start = await geocode(camping?.nom || 'camping')

      map = L.map(mapRef.current, {
        center: [start.lat, start.lng],
        zoom: 18,
        maxZoom: 21,
        zoomControl: true,
      })
      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 21, maxNativeZoom: 19, attribution: '© Esri' }
      ).addTo(map)

      // Corners : soit ceux stockés, soit auto-générés autour du centre
      let corners
      if (camping.plan_bounds?.nw) {
        const b = camping.plan_bounds
        corners = [L.latLng(b.nw), L.latLng(b.ne), L.latLng(b.sw), L.latLng(b.se)]
      } else {
        const delta = 0.0015
        corners = [
          L.latLng(start.lat + delta, start.lng - delta), // NW
          L.latLng(start.lat + delta, start.lng + delta), // NE
          L.latLng(start.lat - delta, start.lng - delta), // SW
          L.latLng(start.lat - delta, start.lng + delta), // SE
        ]
      }

      const overlay = L.distortableImageOverlay(camping.plan_url, {
        corners,
        actions: [],   // pas de toolbar : juste drag des coins
        editable: true,
        mode: 'distort',
        suppressToolbar: true,
      }).addTo(map)

      overlay.setOpacity(opacity)
      overlayRef.current = overlay
      leafletMap.current = map

      map.fitBounds(L.latLngBounds(corners), { padding: [40, 40] })
      setReady(true)
    })()

    return () => {
      mounted = false
      if (map) map.remove()
      leafletMap.current = null
      overlayRef.current = null
    }
  }, []) // eslint-disable-line

  useEffect(() => {
    if (overlayRef.current) overlayRef.current.setOpacity(opacity)
  }, [opacity])

  async function save() {
    if (!overlayRef.current) return
    setSaving(true)
    const c = overlayRef.current.getCorners()
    // c = [NW, NE, SW, SE] (ordre du plugin)
    const plan_bounds = {
      nw: [c[0].lat, c[0].lng],
      ne: [c[1].lat, c[1].lng],
      sw: [c[2].lat, c[2].lng],
      se: [c[3].lat, c[3].lng],
    }
    const { error } = await supabase.from('campings')
      .update({ plan_bounds }).eq('id', camping.id)
    setSaving(false)
    if (error) { alert('Erreur : ' + error.message); return }
    onSaved?.(plan_bounds)
    onClose?.()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column',
    }}>
      {/* Toolbar */}
      <div style={{
        padding: '12px 20px', background: '#fff', display: 'flex', alignItems: 'center', gap: 20,
        borderBottom: '1px solid #e5e7eb',
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>Caler le plan sur le satellite</div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
            Glissez les 4 coins pour aligner le plan sur les repères visibles (bâtiments, allées, contour…).
          </div>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          Opacité
          <input type="range" min="0.1" max="1" step="0.05" value={opacity}
            onChange={e => setOpacity(+e.target.value)}
            style={{ width: 120 }} />
        </label>
        <button onClick={onClose}
          style={{ padding: '8px 14px', border: '1px solid #d1d5db', background: '#fff', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
          Annuler
        </button>
        <button onClick={save} disabled={saving || !ready}
          style={{ padding: '8px 16px', background: '#639922', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: saving ? 'wait' : 'pointer' }}>
          {saving ? 'Enregistrement…' : 'Enregistrer le calage'}
        </button>
      </div>
      {/* Carte plein écran */}
      <div ref={mapRef} style={{ flex: 1, background: '#000' }} />
    </div>
  )
}
