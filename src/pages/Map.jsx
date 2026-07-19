import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { esc } from '../utils/esc'

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

function haversineM(p1, p2) {
  const R = 6371000
  const dLat = (p2.lat - p1.lat) * Math.PI / 180
  const dLng = (p2.lng - p1.lng) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
function bearingDeg(p1, p2) {
  const dL = (p2.lng - p1.lng) * Math.PI / 180
  const lat1 = p1.lat * Math.PI / 180, lat2 = p2.lat * Math.PI / 180
  return (Math.atan2(Math.sin(dL) * Math.cos(lat2), Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dL)) * 180 / Math.PI + 360) % 360
}
function bearingArrow(deg) { return ['↑', '↗', '→', '↘', '↓', '↙', '←', '↖'][Math.round(deg / 45) % 8] }
function fmtDist(m) { return m < 1000 ? `${Math.round(m)}m` : `${(m / 1000).toFixed(1)}km` }

// "Sur site" : la position est-elle assez proche du camping pour être affichée ?
// Évite le marqueur parasite quand on teste hors du camping (GPS navigateur au loin).
// → à l'intérieur du contour + 800 m de marge (règle d'accès), ou < 1,5 km du centre.
function posSurSite(pos, perim, center) {
  if (!pos || !center) return true // pas d'ancrage camping → on n'exclut rien
  const d = haversineM(pos, center)
  if (perim && perim.length >= 3) {
    const rMax = Math.max(...perim.map(p => haversineM(center, { lat: p[0], lng: p[1] })))
    return d <= rMax + 800
  }
  return d <= 1500
}

async function geocodeCamping(nom) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(nom + ' camping France')}&format=json&limit=1`,
      { headers: { 'Accept-Language': 'fr' } }
    )
    const data = await res.json()
    if (data[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
  } catch {}
  return { lat: 44.5, lng: 6.3 }
}

export default function Map({ camping: campingProp, vacancier }) {
  const navigate      = useNavigate()
  const mapRef        = useRef(null)
  const leafletMap    = useRef(null)
  const markersRef    = useRef([])
  const userMarker    = useRef(null)
  const guideLineRef  = useRef(null)

  const [camping, setCampingLocal]      = useState(campingProp)
  const [animations, setAnimations]     = useState([])
  const [groupes, setGroupes]           = useState([])
  const [inscriptions, setInscriptions] = useState([])
  const [mesGroupes, setMesGroupes]     = useState([])
  const [counts, setCounts]             = useState({})
  const [activePin, setActivePin]       = useState(null)
  const [guideTarget, setGuideTarget]   = useState(null) // POI vers lequel on guide
  const [pins, setPins]                 = useState([])
  const [userPos, setUserPos]           = useState(null)
  const [mapReady, setMapReady]         = useState(false)
  const [following, setFollowing]       = useState(true)
  const followingRef                    = useRef(true)
  const [mapMode, setMapMode]           = useState('satellite') // 'satellite' | 'plan'
  useEffect(() => { followingRef.current = following }, [following])
  const [simulating, setSimulating]     = useState(false)
  const [simPos, setSimPos]             = useState(null)
  const [simStep, setSimStep]           = useState(0.00005) // ~5m par défaut
  const simPosRef = useRef(null)
  useEffect(() => { simPosRef.current = simPos }, [simPos])

  // Position effective : simulation ou GPS réel
  const effectivePos = simulating ? simPos : userPos

  const couleur = camping?.couleur_principale || '#639922'


  const campingCoords = (() => {
    const cfg = camping?.carte_config || {}
    if (cfg.lat && cfg.lng) return { lat: cfg.lat, lng: cfg.lng }
    try {
      const local = JSON.parse(localStorage.getItem(`carte_config_${campingProp.id}`) || 'null')
      if (local?.lat && local?.lng) return { lat: local.lat, lng: local.lng }
    } catch {}
    return null
  })()

  // Centre du camping = centre du contour si défini, sinon coords réglées.
  const perimeter = camping?.carte_config?.perimeter
  const campingCenter = (() => {
    if (perimeter?.length >= 3) {
      return {
        lat: perimeter.reduce((s, p) => s + p[0], 0) / perimeter.length,
        lng: perimeter.reduce((s, p) => s + p[1], 0) / perimeter.length,
      }
    }
    return campingCoords
  })()

  // La position affichée est-elle sur le site ? (simulation = toujours volontaire)
  const posSurSiteNow = effectivePos ? (simulating || posSurSite(effectivePos, perimeter, campingCenter)) : false

  useEffect(() => {
    async function load() {
      const { data: freshCamping } = await supabase
        .from('campings').select('*').eq('id', campingProp.id).single()
      if (freshCamping) {
        setCampingLocal(freshCamping)
        const dbPins = freshCamping?.carte_config?.pins
        if (dbPins?.length) {
          setPins(dbPins)
        } else {
          try {
            const local = JSON.parse(localStorage.getItem(`carte_config_${campingProp.id}`) || 'null')
            if (local?.pins?.length) setPins(local.pins)
          } catch {}
        }
      }

      const [{ data: anims }, { data: grps }, { data: inscs }, { data: membres }] = await Promise.all([
        supabase.from('animations').select('*').eq('camping_id', campingProp.id).eq('publiee', true),
        supabase.from('groupes').select('*').eq('camping_id', campingProp.id).eq('actif', true),
        supabase.from('inscriptions').select('animation_id').eq('vacancier_id', vacancier.id),
        supabase.from('membres_groupes').select('groupe_id').eq('vacancier_id', vacancier.id),
      ])

      const animsList = anims || []
      setAnimations(animsList)
      setGroupes(grps || [])
      setInscriptions((inscs || []).map(i => i.animation_id))
      setMesGroupes((membres || []).map(m => m.groupe_id))

      if (animsList.length > 0) {
        const { data: allInscs } = await supabase.from('inscriptions').select('animation_id')
          .in('animation_id', animsList.map(a => a.id))
        const c = {}
        for (const ins of (allInscs || [])) c[ins.animation_id] = (c[ins.animation_id] || 0) + 1
        setCounts(c)
      }
    }
    load()

    // Realtime : met à jour les pins dès que l'admin sauvegarde
    const channel = supabase
      .channel(`camping_map_${campingProp.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'campings', filter: `id=eq.${campingProp.id}` },
        (payload) => {
          if (!payload.new) return
          setCampingLocal(payload.new)
          const dbPins = payload.new?.carte_config?.pins
          if (dbPins?.length) setPins(dbPins)
          else {
            try {
              const local = JSON.parse(localStorage.getItem(`carte_config_${campingProp.id}`) || 'null')
              if (local?.pins?.length) setPins(local.pins)
            } catch {}
          }
        }
      )
      .subscribe()

    let watchId = null
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        pos => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        null, { enableHighAccuracy: true }
      )
    }

    return () => {
      supabase.removeChannel(channel)
      if (watchId !== null) navigator.geolocation.clearWatch(watchId)
    }
  }, [campingProp.id, vacancier.id])

  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return
    let map = null
    let isMounted = true
    getLeaflet().then(async (Lf) => {
      if (!isMounted || !mapRef.current || leafletMap.current) return
      const coords = campingCoords || await geocodeCamping(camping?.nom || 'camping')
      if (!isMounted || !mapRef.current || leafletMap.current) return

      map = Lf.map(mapRef.current, {
        center: [coords.lat, coords.lng],
        zoom: 18,
        zoomControl: false,
        maxZoom: 19,
      })

      Lf.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { attribution: '© Esri, Maxar, Earthstar Geographics', maxZoom: 19, maxNativeZoom: 19,
          className: 'cc-toon-tiles' }
      ).addTo(map)

      Lf.control.zoom({ position: 'topright' }).addTo(map)

      const campingIcon = Lf.divIcon({
        html: `<div style="background:${couleur};width:44px;height:44px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"><div style="transform:rotate(45deg);display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-size:22px">🏕️</div></div>`,
        className: '',
        iconSize: [44, 44],
        iconAnchor: [22, 44],
      })
      // Contour du camping (défini par l'admin) + label nom
      const perim = camping?.carte_config?.perimeter
      if (perim && perim.length >= 3) {
        const poly = Lf.polygon(perim, {
          color: couleur, weight: 3, fillColor: couleur, fillOpacity: 0.15,
          interactive: false,
        }).addTo(map)
        map.fitBounds(poly.getBounds(), { padding: [30, 30] })

        // Label au bord nord du polygone (haut) pour ne pas cacher les POI du centre
        const bnds = poly.getBounds()
        const labelPos = [bnds.getNorth(), (bnds.getWest() + bnds.getEast()) / 2]
        const labelIcon = Lf.divIcon({
          html: `<div class="cc-camping-label">🌲 ${esc(camping.nom)}</div>`,
          className: '', iconSize: [0, 0],
        })
        Lf.marker(labelPos, { icon: labelIcon, interactive: false, zIndexOffset: 500 }).addTo(map)
      } else {
        // Pas de contour : pin classique + label au-dessus
        Lf.marker([coords.lat, coords.lng], { icon: campingIcon })
          .addTo(map).bindPopup(`<b>${camping?.nom || 'Camping'}</b>`)
        const labelIcon = Lf.divIcon({
          html: `<div class="cc-camping-label" style="transform:translateY(-58px)">🌲 ${esc(camping?.nom || 'Camping')}</div>`,
          className: '', iconSize: [0, 0],
        })
        Lf.marker([coords.lat, coords.lng], { icon: labelIcon, interactive: false, zIndexOffset: 500 }).addTo(map)
      }

      // Drag → désync du suivi GPS
      map.on('dragstart', () => {
        followingRef.current = false
        setFollowing(false)
      })

      leafletMap.current = map
      map.invalidateSize()
      setMapReady(true)
    })

    return () => {
      isMounted = false
      if (map) { map.remove(); leafletMap.current = null }
    }
  }, []) // eslint-disable-line

  // Markers POIs
  useEffect(() => {
    if (!leafletMap.current || !mapReady) return
    const Lf = L
    if (!Lf) return

    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    function pinForLieu(lieu) {
      if (!lieu) return null
      const lt = lieu.toLowerCase()
      return pins.find(p => p.ref_type === 'lieu' && p.lat && p.lng &&
        (p.label.toLowerCase().includes(lt) || lt.includes(p.label.toLowerCase()))) || null
    }

    // Lieux
    pins.filter(p => p.ref_type === 'lieu' && p.lat && p.lng).forEach(pin => {
      const icon = Lf.divIcon({
        html: `<div style="background:${esc(pin.color || '#60a5fa')};width:38px;height:38px;border-radius:50%;border:2.5px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:18px">${esc(pin.emoji)}</div>`,
        className: '', iconSize: [38, 38], iconAnchor: [19, 19],
      })
      const m = Lf.marker([pin.lat, pin.lng], { icon })
        .addTo(leafletMap.current)
        .on('click', () => setActivePin(pin))
      markersRef.current.push(m)
    })

    // Animations → positionnées au POI correspondant
    animations.forEach(anim => {
      const matchPin = pinForLieu(anim.lieu)
      if (!matchPin) return
      const icon = Lf.divIcon({
        html: `<div style="background:#f472b6;width:34px;height:34px;border-radius:50%;border:2.5px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:16px">${esc(anim.emoji || '🎉')}</div>`,
        className: '', iconSize: [34, 34], iconAnchor: [17, 17],
      })
      const m = Lf.marker([matchPin.lat, matchPin.lng], { icon, zIndexOffset: 20 })
        .addTo(leafletMap.current)
        .on('click', () => setActivePin({ ref_type: 'animation', ref_id: anim.id }))
      markersRef.current.push(m)
    })

    // Groupes → positionnés au POI correspondant
    groupes.forEach(grp => {
      const matchPin = pinForLieu(grp.lieu)
      if (!matchPin) return
      const icon = Lf.divIcon({
        html: `<div style="background:#fb923c;width:34px;height:34px;border-radius:50%;border:2.5px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:16px">${esc(grp.emoji || '👥')}</div>`,
        className: '', iconSize: [34, 34], iconAnchor: [17, 17],
      })
      const m = Lf.marker([matchPin.lat, matchPin.lng], { icon, zIndexOffset: 20 })
        .addTo(leafletMap.current)
        .on('click', () => setActivePin({ ref_type: 'groupe', ref_id: grp.id }))
      markersRef.current.push(m)
    })
  }, [mapReady, animations, groupes, campingCoords, pins])

  // Marker position utilisateur (GPS réel ou simulé)
  useEffect(() => {
    if (!leafletMap.current || !effectivePos || !L) return
    if (userMarker.current) { userMarker.current.remove(); userMarker.current = null }

    // Position hors site (ex : test depuis chez soi) → pas de marqueur parasite au loin
    if (!posSurSiteNow) return

    const avatar = esc(vacancier?.avatar_emoji || '🏕️')
    const icon = L.divIcon({
      html: `<div style="background:${couleur};width:46px;height:46px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 5px ${couleur}40, 0 3px 14px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;font-size:24px;">${avatar}</div>`,
      className: '', iconSize: [46, 46], iconAnchor: [23, 23],
    })
    userMarker.current = L.marker([effectivePos.lat, effectivePos.lng], { icon, zIndexOffset: 1000 })
      .addTo(leafletMap.current)
      .bindPopup(`<b>${avatar} Vous êtes ici</b>`)

    if (followingRef.current) {
      leafletMap.current.setView([effectivePos.lat, effectivePos.lng], 19, { animate: true })
    }
  }, [effectivePos, mapReady])

  // Trait de guidage entre l'utilisateur et le POI cible
  useEffect(() => {
    if (!leafletMap.current || !L) return
    if (guideLineRef.current) { guideLineRef.current.remove(); guideLineRef.current = null }
    if (guideTarget?.lat && guideTarget?.lng && effectivePos) {
      guideLineRef.current = L.polyline(
        [[effectivePos.lat, effectivePos.lng], [guideTarget.lat, guideTarget.lng]],
        { color: couleur, weight: 4, dashArray: '2 10', opacity: 0.9, lineCap: 'round' }
      ).addTo(leafletMap.current)
    }
  }, [guideTarget, effectivePos, mapReady, couleur])

  const pinData = activePin ? (() => {
    if (activePin.ref_type === 'animation') return animations.find(a => a.id === activePin.ref_id)
    if (activePin.ref_type === 'groupe')    return groupes.find(g => g.id === activePin.ref_id)
    if (activePin.ref_type === 'lieu')      return activePin
    return null
  })() : null

  const walkAnimRef = useRef(null)

  function startSim() {
    // Démarre au centre du contour si dispo, sinon GPS réel, sinon coords camping
    const perim = camping?.carte_config?.perimeter
    let start
    if (perim?.length >= 3) {
      const lat = perim.reduce((s, p) => s + p[0], 0) / perim.length
      const lng = perim.reduce((s, p) => s + p[1], 0) / perim.length
      start = { lat, lng }
    } else {
      start = userPos || campingCoords || { lat: 44.5, lng: 6.3 }
    }
    setSimPos(start)
    setSimulating(true)
    followingRef.current = true
    setFollowing(true)
  }
  function stopSim() {
    if (walkAnimRef.current) cancelAnimationFrame(walkAnimRef.current)
    setSimulating(false); setSimPos(null)
  }

  function moveSimPos(dlat, dlng) {
    if (walkAnimRef.current) cancelAnimationFrame(walkAnimRef.current)
    setSimPos(p => p ? { lat: p.lat + dlat, lng: p.lng + dlng } : p)
  }

  // Marche animée vers une destination (vitesse ~ 1.4 m/s x20 pour la démo)
  function walkTo(dest) {
    if (walkAnimRef.current) cancelAnimationFrame(walkAnimRef.current)
    const from = simPosRef.current
    if (!from) { setSimPos(dest); return }
    const distM = haversineM(from, dest)
    const durationMs = Math.min(8000, Math.max(600, distM / 28 * 1000)) // 28 m/s ≈ marche x20
    const t0 = performance.now()
    function step(now) {
      const k = Math.min(1, (now - t0) / durationMs)
      setSimPos({
        lat: from.lat + (dest.lat - from.lat) * k,
        lng: from.lng + (dest.lng - from.lng) * k,
      })
      if (k < 1) walkAnimRef.current = requestAnimationFrame(step)
    }
    walkAnimRef.current = requestAnimationFrame(step)
  }

  // Clic sur la carte quand simulation active → marche animée vers ce point
  useEffect(() => {
    if (!simulating || !leafletMap.current) return
    const map = leafletMap.current
    function onMapClick(e) {
      walkTo({ lat: e.latlng.lat, lng: e.latlng.lng })
    }
    map.on('click', onMapClick)
    return () => { map.off('click', onMapClick) }
  }, [simulating, mapReady]) // eslint-disable-line

  // Flèches clavier quand simulation active
  useEffect(() => {
    if (!simulating) return
    function onKey(e) {
      if (!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) return
      e.preventDefault()
      const d = simStep
      if (e.key === 'ArrowUp')    moveSimPos( d, 0)
      if (e.key === 'ArrowDown')  moveSimPos(-d, 0)
      if (e.key === 'ArrowLeft')  moveSimPos(0, -d)
      if (e.key === 'ArrowRight') moveSimPos(0,  d)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [simulating, simStep]) // eslint-disable-line

  async function toggleInscription(anim) {
    const inscrit = inscriptions.includes(anim.id)
    if (inscrit) {
      await supabase.from('inscriptions').delete().eq('animation_id', anim.id).eq('vacancier_id', vacancier.id)
      setInscriptions(p => p.filter(id => id !== anim.id))
      setCounts(p => ({ ...p, [anim.id]: Math.max(0, (p[anim.id] || 1) - 1) }))
    } else {
      if (anim.places_max && (counts[anim.id] || 0) >= anim.places_max) return
      await supabase.from('inscriptions').insert({ animation_id: anim.id, vacancier_id: vacancier.id })
      setInscriptions(p => [...p, anim.id])
      setCounts(p => ({ ...p, [anim.id]: (p[anim.id] || 0) + 1 }))
    }
  }

  async function rejoindreGroupe(id) {
    await supabase.from('membres_groupes').insert({ groupe_id: id, vacancier_id: vacancier.id })
    setMesGroupes(p => [...p, id])
    navigate(`/chat/${id}`)
  }

  const planUrl = camping?.plan_url

  return (
    <div style={{ position: 'relative', height: 'calc(100dvh - 88px - env(safe-area-inset-bottom))', overflow: 'hidden', background: '#0d1f0d' }}>

      {/* Panneau simulation GPS */}
      {simulating && simPos && (
        <div style={{
          position: 'absolute', bottom: 80, left: 12, zIndex: 1000,
          background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(10px)',
          borderRadius: 16, padding: '12px 14px', color: '#fff',
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)', minWidth: 200,
          border: '1px solid rgba(255,255,255,0.12)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#f472b6' }}>🎮 Simulation GPS</span>
            <button onClick={stopSim} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: 6, padding: '2px 8px', cursor: 'pointer', fontSize: 12 }}>Stop ✕</button>
          </div>
          <div style={{ fontSize: 10, color: '#cbd5e1', marginBottom: 8, lineHeight: 1.4 }}>
            💡 Cliquez sur la carte : l'avatar s'y déplace en marchant · flèches pour ajuster
          </div>

          {/* Coords */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
            {[['Lat', 'lat'], ['Lng', 'lng']].map(([label, key]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 10, color: '#94a3b8', width: 22 }}>{label}</span>
                <input
                  type="number" step="0.00001"
                  value={simPos[key].toFixed(6)}
                  onChange={e => setSimPos(p => ({ ...p, [key]: parseFloat(e.target.value) || p[key] }))}
                  style={{ flex: 1, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: '#fff', fontSize: 11, padding: '4px 6px', outline: 'none' }}
                />
              </div>
            ))}
          </div>

          {/* Boutons flèches */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, width: 120, margin: '0 auto 10px' }}>
            {[
              [null, '↑', null],
              ['←', null, '→'],
              [null, '↓', null],
            ].map((row, ri) => row.map((btn, ci) => btn ? (
              <button key={`${ri}-${ci}`} onMouseDown={e => { e.preventDefault(); moveSimPos(btn==='↑'?simStep:btn==='↓'?-simStep:0, btn==='→'?simStep:btn==='←'?-simStep:0) }}
                style={{ padding: '8px', borderRadius: 8, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: 16, cursor: 'pointer', lineHeight: 1 }}>
                {btn}
              </button>
            ) : (
              <div key={`${ri}-${ci}`} />
            )))}
          </div>

          {/* Pas */}
          <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
            {[[0.000005,'~0.5m'], [0.00005,'~5m'], [0.0005,'~50m']].map(([val, label]) => (
              <button key={label} onClick={() => setSimStep(val)} style={{
                padding: '3px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700, cursor: 'pointer', border: 'none',
                background: simStep === val ? '#f472b6' : 'rgba(255,255,255,0.1)',
                color: simStep === val ? '#fff' : '#94a3b8',
              }}>{label}</button>
            ))}
          </div>
        </div>
      )}

      {/* Bouton lancer simulation */}
      {!simulating && (
        <button onClick={startSim} style={{
          position: 'absolute', bottom: 80, left: 12, zIndex: 1000,
          padding: '8px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700,
          background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(8px)',
          color: '#94a3b8', border: '1px solid rgba(255,255,255,0.12)',
          cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
        }}>🎮 Simuler GPS</button>
      )}

      {/* Bouton recentrer / suivre */}
      <button
        onClick={() => {
          if (!leafletMap.current) return
          followingRef.current = true
          setFollowing(true)
          // Recentre sur soi seulement si on est sur site, sinon sur le camping
          if (effectivePos && posSurSiteNow) leafletMap.current.setView([effectivePos.lat, effectivePos.lng], 19, { animate: true })
          else if (campingCenter) leafletMap.current.setView([campingCenter.lat, campingCenter.lng], 16, { animate: true })
        }}
        style={{
          position: 'absolute', bottom: activePin ? 200 : 70, right: 14, zIndex: 1000,
          width: 44, height: 44, borderRadius: 12,
          background: following ? couleur : 'rgba(255,255,255,0.95)',
          boxShadow: following ? `0 2px 14px ${couleur}80` : '0 2px 10px rgba(0,0,0,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
          border: 'none', cursor: 'pointer',
          transition: 'background 0.2s, box-shadow 0.2s',
        }}
      >🎯</button>

      {/* Toggle Satellite / Plan */}
      {planUrl && (
        <div style={{
          position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
          zIndex: 1000, background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(10px)',
          borderRadius: 30, padding: 3, display: 'flex', gap: 2,
          boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
        }}>
          {[['satellite', '🛰️', 'Satellite'], ['plan', '🗺️', 'Plan']].map(([mode, icon, label]) => (
            <button key={mode} onClick={() => setMapMode(mode)} style={{
              padding: '7px 16px', borderRadius: 26, fontSize: 13, fontWeight: 600,
              border: 'none', cursor: 'pointer', transition: 'all 0.2s',
              background: mapMode === mode ? couleur : 'transparent',
              color: mapMode === mode ? '#fff' : 'rgba(255,255,255,0.5)',
            }}>{icon} {label}</button>
          ))}
        </div>
      )}

      {/* Vue Plan */}
      {mapMode === 'plan' && planUrl && (
        <div style={{
          position: 'absolute', inset: 0, overflow: 'auto',
          background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
          onClick={() => setActivePin(null)}
        >
          <img
            src={planUrl}
            alt="Plan du camping"
            style={{ maxWidth: 'none', height: '100%', objectFit: 'contain', touchAction: 'pan-x pan-y pinch-zoom' }}
            draggable={false}
          />
        </div>
      )}

      {/* Carte Leaflet (satellite) */}
      <div
        ref={mapRef}
        style={{ position: 'absolute', inset: 0, display: mapMode === 'satellite' ? 'block' : 'none' }}
        onClick={() => setActivePin(null)}
      />

      {/* Légende */}
      {!activePin && (
        <div style={{
          position: 'absolute', bottom: 12, left: 12, zIndex: 1000,
          background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(6px)',
          borderRadius: 12, padding: '7px 12px',
          display: 'flex', gap: 12, alignItems: 'center',
          boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
        }}>
          {[['#f472b6', 'Animations'], ['#fb923c', 'Groupes']].map(([c, l]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
              <span style={{ fontSize: 11, color: '#374151', fontWeight: 500 }}>{l}</span>
            </div>
          ))}
          {effectivePos && posSurSiteNow && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: couleur }} />
              <span style={{ fontSize: 11, color: '#374151', fontWeight: 500 }}>{simulating ? '🎮 Simulé' : 'Vous'}</span>
            </div>
          )}
        </div>
      )}

      {/* Fiche pin active */}
      {activePin && pinData && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 2000,
          background: '#fff', borderRadius: '20px 20px 0 0',
          boxShadow: '0 -6px 32px rgba(0,0,0,0.18)',
          animation: 'slideUp 0.25s ease',
        }}>
          <div style={{ width: 40, height: 4, background: '#e5e7eb', borderRadius: 2, margin: '12px auto 0' }} />
          <div style={{ padding: '16px 20px 28px' }}>
            {activePin.ref_type === 'animation' && (
              <AnimFiche
                anim={pinData}
                inscrit={inscriptions.includes(pinData.id)}
                nbInscrits={counts[pinData.id] || 0}
                couleur={couleur}
                onToggle={() => toggleInscription(pinData)}
                onClose={() => setActivePin(null)}
              />
            )}
            {activePin.ref_type === 'groupe' && (
              <GroupeFiche
                groupe={pinData}
                isMember={mesGroupes.includes(pinData.id)}
                couleur={couleur}
                onAction={() => mesGroupes.includes(pinData.id) ? navigate(`/chat/${pinData.id}`) : rejoindreGroupe(pinData.id)}
                onClose={() => setActivePin(null)}
              />
            )}
            {activePin.ref_type === 'lieu' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: `${activePin.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>{activePin.emoji}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 17 }}>{activePin.label}</div>
                    {effectivePos && activePin.lat && activePin.lng && (
                      <div style={{ fontSize: 13, color: '#639922', fontWeight: 600, marginTop: 3 }}>
                        {bearingArrow(bearingDeg(effectivePos, activePin))} {fmtDist(haversineM(effectivePos, activePin))}
                      </div>
                    )}
                  </div>
                </div>
                <button onClick={() => setActivePin(null)} style={{ color: '#9ca3af', fontSize: 22, background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
              </div>
            )}

            {activePin.lat && activePin.lng && (
              <button
                onClick={() => { setGuideTarget(activePin); setActivePin(null); setFollowing(true); followingRef.current = true }}
                style={{
                  marginTop: 16, width: '100%', padding: '13px', borderRadius: 12, border: 'none',
                  background: couleur, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                🧭 M'y guider
              </button>
            )}
          </div>
        </div>
      )}

      {/* Bandeau de guidage GPS simplifié */}
      {guideTarget && (
        <GuideBanner
          target={guideTarget}
          pos={effectivePos}
          couleur={couleur}
          onClose={() => setGuideTarget(null)}
        />
      )}
    </div>
  )
}

function GuideBanner({ target, pos, couleur, onClose }) {
  if (!pos) {
    return (
      <div style={guideBannerBox}>
        <div style={{ flex: 1, fontSize: 13, color: '#fff', fontWeight: 600 }}>
          📍 Activez votre position pour être guidé vers « {target.label} »
        </div>
        <button onClick={onClose} style={guideCloseBtn}>×</button>
      </div>
    )
  }
  const dist = haversineM(pos, target)
  const bearing = bearingDeg(pos, target)
  const arrived = dist < 8
  return (
    <div style={{ ...guideBannerBox, background: arrived ? '#166534' : 'rgba(13,31,13,0.94)' }}>
      {arrived ? (
        <div style={{ fontSize: 30, lineHeight: 1 }}>✅</div>
      ) : (
        <div style={{
          width: 46, height: 46, borderRadius: '50%', background: `${couleur}`, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 10px rgba(0,0,0,0.35)',
        }}>
          <span style={{ fontSize: 26, color: '#fff', transform: `rotate(${bearing}deg)`, display: 'inline-block', lineHeight: 1 }}>↑</span>
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {target.emoji} {target.label}
        </div>
        <div style={{ fontSize: 13, color: arrived ? '#bbf7d0' : '#C0DD97', fontWeight: 600, marginTop: 2 }}>
          {arrived ? 'Vous y êtes ! 🎉' : `${fmtDist(dist)} · tout droit dans le sens de la flèche`}
        </div>
      </div>
      <button onClick={onClose} style={guideCloseBtn}>×</button>
    </div>
  )
}

const guideBannerBox = {
  position: 'absolute', top: 'calc(12px + env(safe-area-inset-top))', left: 12, right: 12, zIndex: 2500,
  background: 'rgba(13,31,13,0.94)', backdropFilter: 'blur(10px)',
  borderRadius: 16, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12,
  boxShadow: '0 6px 24px rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.12)',
}
const guideCloseBtn = {
  width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
  background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none',
  fontSize: 18, cursor: 'pointer', lineHeight: 1,
}

/* ─── Fiches ─── */
function AnimFiche({ anim, inscrit, nbInscrits, couleur, onToggle, onClose }) {
  const debut = anim.debut ? new Date(anim.debut) : null
  const complet = anim.places_max && nbInscrits >= anim.places_max && !inscrit
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', gap: 12, flex: 1 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: '#f472b618', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>{anim.emoji || '🎉'}</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17 }}>{anim.titre}</div>
            <div style={{ display: 'flex', gap: 10, marginTop: 5, flexWrap: 'wrap' }}>
              {debut && <span style={{ fontSize: 13, color: '#639922', fontWeight: 600 }}>🕐 {debut.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>}
              {anim.lieu && <span style={{ fontSize: 13, color: '#6b7280' }}>📍 {anim.lieu}</span>}
            </div>
            {anim.places_max && <div style={{ fontSize: 12, color: complet ? '#ef4444' : '#9ca3af', marginTop: 4 }}>{nbInscrits}/{anim.places_max} places</div>}
          </div>
        </div>
        <button onClick={onClose} style={{ color: '#9ca3af', fontSize: 22, background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
      </div>
      <button onClick={onToggle} disabled={complet} style={{
        marginTop: 14, width: '100%', padding: '13px', borderRadius: 14, fontWeight: 700, fontSize: 15,
        background: complet ? '#e5e7eb' : inscrit ? `${couleur}18` : couleur,
        color: complet ? '#9ca3af' : inscrit ? couleur : '#fff',
        border: inscrit ? `2px solid ${couleur}` : 'none',
        cursor: complet ? 'default' : 'pointer',
      }}>
        {complet ? 'Complet' : inscrit ? '✓ Inscrit — Se désinscrire' : "S'inscrire"}
      </button>
    </div>
  )
}

function GroupeFiche({ groupe, isMember, couleur, onAction, onClose }) {
  const heureStr = groupe.heure ? new Date(groupe.heure).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : null
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', gap: 12, flex: 1 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: '#fb923c18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>{groupe.emoji || '👥'}</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17 }}>{groupe.titre}</div>
            <div style={{ display: 'flex', gap: 10, marginTop: 5, flexWrap: 'wrap' }}>
              {heureStr && <span style={{ fontSize: 13, color: '#f59e0b', fontWeight: 600 }}>🕐 {heureStr}</span>}
              {groupe.lieu && <span style={{ fontSize: 13, color: '#6b7280' }}>📍 {groupe.lieu}</span>}
            </div>
          </div>
        </div>
        <button onClick={onClose} style={{ color: '#9ca3af', fontSize: 22, background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
      </div>
      <button onClick={onAction} style={{
        marginTop: 14, width: '100%', padding: '13px', borderRadius: 14, fontWeight: 700, fontSize: 15,
        background: isMember ? couleur : 'transparent', color: isMember ? '#fff' : couleur, border: `2px solid ${couleur}`,
        cursor: 'pointer',
      }}>
        {isMember ? '💬 Ouvrir le chat' : 'Rejoindre le groupe'}
      </button>
    </div>
  )
}
