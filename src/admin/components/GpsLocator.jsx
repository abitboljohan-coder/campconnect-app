import { useEffect, useRef, useState } from 'react'

let L = null
async function getLeaflet() {
  if (L) return L
  L = (await import('leaflet')).default
  await import('leaflet/dist/leaflet.css')
  delete L.Icon.Default.prototype._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  })
  return L
}

export default function GpsLocator({ camping, onSave }) {
  const mapRef    = useRef(null)
  const leafMap   = useRef(null)
  const markerRef = useRef(null)
  const [search, setSearch]   = useState(camping?.nom || '')
  const [pos, setPos]         = useState(null)
  const [searching, setSearching] = useState(false)
  const [saved, setSaved]     = useState(false)

  // Coords existantes
  const existing = (() => {
    const cfg = camping?.carte_config
    if (cfg?.lat && cfg?.lng) return { lat: cfg.lat, lng: cfg.lng }
    try {
      const local = JSON.parse(localStorage.getItem(`carte_config_${camping?.id}`) || 'null')
      if (local?.lat) return { lat: local.lat, lng: local.lng }
    } catch {}
    return null
  })()

  useEffect(() => {
    if (!mapRef.current || leafMap.current) return
    getLeaflet().then(Lf => {
      if (!mapRef.current) return
      const center = existing || { lat: 44.5, lng: 6.3 }
      const map = Lf.map(mapRef.current, { center: [center.lat, center.lng], zoom: existing ? 15 : 6, zoomControl: true })
      Lf.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map)

      if (existing) {
        markerRef.current = Lf.marker([existing.lat, existing.lng], { draggable: true }).addTo(map)
        markerRef.current.on('dragend', () => {
          const ll = markerRef.current.getLatLng()
          setPos({ lat: ll.lat, lng: ll.lng })
        })
        setPos(existing)
      }

      map.on('click', e => {
        const { lat, lng } = e.latlng
        if (markerRef.current) markerRef.current.setLatLng([lat, lng])
        else markerRef.current = Lf.marker([lat, lng], { draggable: true }).addTo(map)
        markerRef.current.on('dragend', () => {
          const ll = markerRef.current.getLatLng()
          setPos({ lat: ll.lat, lng: ll.lng })
        })
        setPos({ lat, lng })
      })

      leafMap.current = map
    })
    return () => { if (leafMap.current) { leafMap.current.remove(); leafMap.current = null } }
  }, [])

  async function searchPlace() {
    if (!search.trim()) return
    setSearching(true)
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(search)}&format=json&limit=1`, { headers: { 'Accept-Language': 'fr' } })
      const data = await res.json()
      if (data[0] && leafMap.current && L) {
        const lat = parseFloat(data[0].lat)
        const lng = parseFloat(data[0].lon)
        leafMap.current.setView([lat, lng], 15)
        if (markerRef.current) markerRef.current.setLatLng([lat, lng])
        else {
          markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(leafMap.current)
          markerRef.current.on('dragend', () => {
            const ll = markerRef.current.getLatLng()
            setPos({ lat: ll.lat, lng: ll.lng })
          })
        }
        setPos({ lat, lng })
      }
    } catch {}
    setSearching(false)
  }

  function save() {
    if (!pos) return
    onSave(pos)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && searchPlace()}
          placeholder="Rechercher une adresse..."
          style={{ flex: 1, padding: '9px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none' }}
        />
        <button onClick={searchPlace} disabled={searching} style={{ padding: '9px 14px', borderRadius: 8, background: '#639922', color: '#fff', fontWeight: 600, fontSize: 14 }}>
          {searching ? '...' : '🔍'}
        </button>
      </div>

      <div ref={mapRef} style={{ width: '100%', height: 260, borderRadius: 10, overflow: 'hidden', border: '1px solid #e5e7eb', marginBottom: 10 }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 12, color: '#9ca3af' }}>
          {pos ? `📍 ${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}` : 'Cliquez sur la carte pour positionner le camping'}
        </div>
        <button onClick={save} disabled={!pos} style={{
          padding: '8px 16px', borderRadius: 8, fontWeight: 600, fontSize: 13,
          background: saved ? '#16a34a' : pos ? '#639922' : '#9ca3af', color: '#fff',
        }}>
          {saved ? '✓ Enregistré' : 'Enregistrer'}
        </button>
      </div>
    </div>
  )
}
