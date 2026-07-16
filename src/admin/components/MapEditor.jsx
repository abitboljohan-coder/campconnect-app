import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../supabase'
import { CAMPING_LIEUX } from '../utils/analyzeMap'

let _L = null
async function getLeaflet() {
  if (_L) return _L
  _L = (await import('leaflet')).default
  await import('leaflet/dist/leaflet.css')
  return _L
}

const PIN_COLORS = {
  animation: '#f472b6',
  groupe:    '#fb923c',
  lieu:      '#60a5fa',
}

function localKey(id) { return `carte_config_${id}` }
function loadLocal(id) {
  try { return JSON.parse(localStorage.getItem(localKey(id)) || 'null') } catch { return null }
}
function saveLocal(id, config) { localStorage.setItem(localKey(id), JSON.stringify(config)) }

export default function MapEditor({ camping, setCamping }) {
  const mapDivRef   = useRef(null)
  const lfRef       = useRef(null)
  const markersRef  = useRef({})
  const selectedRef = useRef(null)
  const pinsRef     = useRef([])
  const saveFnRef   = useRef(null)

  const [animations, setAnimations] = useState([])
  const [groupes, setGroupes]       = useState([])
  const [pins, setPins]             = useState([])
  const [saving, setSaving]         = useState(false)
  const [selected, setSelected]     = useState(null)
  const [dbSupport, setDbSupport]   = useState(true)
  const [addrSearch, setAddrSearch] = useState(camping.nom || '')
  const [addrLoading, setAddrLoading] = useState(false)

  useEffect(() => { selectedRef.current = selected }, [selected])
  useEffect(() => { pinsRef.current = pins }, [pins])

  useEffect(() => {
    async function load() {
      const [{ data: anims }, { data: grps }] = await Promise.all([
        supabase.from('animations').select('id,titre,emoji,publiee').eq('camping_id', camping.id).order('debut'),
        supabase.from('groupes').select('id,titre,emoji,actif').eq('camping_id', camping.id).order('created_at', { ascending: false }),
      ])
      setAnimations(anims || [])
      setGroupes(grps || [])
      const cfg = camping.carte_config || loadLocal(camping.id) || {}
      if (cfg.pins) setPins(cfg.pins)
      if (!camping.carte_config && loadLocal(camping.id)) setDbSupport(false)
    }
    load()
  }, [camping.id])

  async function saveConfig(newPins) {
    setSaving(true)
    const config = { pins: newPins }
    const { error } = await supabase.from('campings').update({ carte_config: config }).eq('id', camping.id)
    if (error) { setDbSupport(false); saveLocal(camping.id, config) }
    else { setDbSupport(true); saveLocal(camping.id, config) }
    setCamping(c => ({ ...c, carte_config: config }))
    setSaving(false)
  }

  useEffect(() => { saveFnRef.current = saveConfig }, [camping]) // eslint-disable-line

  async function searchAddress() {
    if (!addrSearch.trim() || !lfRef.current) return
    setAddrLoading(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addrSearch)}&format=json&limit=1`,
        { headers: { 'Accept-Language': 'fr' } }
      )
      const data = await res.json()
      if (data[0]) lfRef.current.setView([parseFloat(data[0].lat), parseFloat(data[0].lon)], 17)
    } catch {}
    setAddrLoading(false)
  }

  function removePin(refId) {
    const newPins = pins.filter(p => p.ref_id !== refId)
    setPins(newPins)
    saveConfig(newPins)
  }

  // Init Leaflet une seule fois
  useEffect(() => {
    let lf = null
    let isMounted = true
    getLeaflet().then(Lf => {
      if (!isMounted || !mapDivRef.current || lfRef.current) return
      lf = Lf.map(mapDivRef.current, { center: [46.5, 2.5], zoom: 5, zoomControl: true, maxZoom: 19 })
      lfRef.current = lf
      lf.invalidateSize()

      Lf.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { attribution: '© Esri, Maxar, Earthstar Geographics', maxZoom: 19, maxNativeZoom: 19 }
      ).addTo(lf)

      // Centrer sur l'emplacement RÉEL réglé par le gérant (contour puis pins) ;
      // géocodage du nom seulement si le camping n'est pas encore configuré.
      const cfg0  = camping.carte_config || loadLocal(camping.id) || {}
      const peri0 = cfg0.perimeter || []
      const pin0  = (cfg0.pins || []).find(p => p.lat && p.lng)
      if (peri0.length >= 1) {
        const lat = peri0.reduce((s, p) => s + p[0], 0) / peri0.length
        const lng = peri0.reduce((s, p) => s + p[1], 0) / peri0.length
        lf.setView([lat, lng], 17)
      } else if (cfg0.lat && cfg0.lng) {
        lf.setView([cfg0.lat, cfg0.lng], 17)
      } else if (pin0) {
        lf.setView([pin0.lat, pin0.lng], 17)
      } else {
        fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(camping.nom + ' camping')}&format=json&limit=1`,
          { headers: { 'Accept-Language': 'fr' } }
        ).then(r => r.json()).then(data => {
          if (data[0] && lfRef.current)
            lfRef.current.setView([parseFloat(data[0].lat), parseFloat(data[0].lon)], 17)
        }).catch(() => {})
      }

      // Clic sur la carte → place le pin sélectionné en GPS
      lf.on('click', e => {
        const sel = selectedRef.current
        if (!sel) return
        const { lat, lng } = e.latlng
        const newPin = { ...sel, lat, lng }
        const newPins = [...pinsRef.current.filter(p => p.ref_id !== sel.ref_id), newPin]
        pinsRef.current = newPins
        setPins(newPins)
        saveFnRef.current(newPins)
        setSelected(null)
      })
    })
    return () => { isMounted = false; if (lf) { lf.remove(); lfRef.current = null } }
  }, []) // eslint-disable-line

  // Rafraîchir les markers quand les pins changent
  useEffect(() => {
    const lf = lfRef.current
    if (!lf || !_L) return
    Object.values(markersRef.current).forEach(m => m.remove())
    markersRef.current = {}
    pins.filter(p => p.lat && p.lng).forEach(pin => {
      const color = pin.color || PIN_COLORS[pin.ref_type] || '#60a5fa'
      const icon = _L.divIcon({
        html: `<div style="background:${color};width:36px;height:36px;border-radius:50%;border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;font-size:18px">${pin.emoji}</div>`,
        className: '', iconSize: [36, 36], iconAnchor: [18, 18],
      })
      markersRef.current[pin.ref_id] = _L.marker([pin.lat, pin.lng], { icon })
        .addTo(lf)
        .bindPopup(`<b>${pin.emoji} ${pin.label}</b>`)
    })
  }, [pins])

  const pinnedIds = new Set(pins.map(p => p.ref_id))

  return (
    <div>
      {!dbSupport && (
        <div style={{ marginBottom: 10, padding: '8px 12px', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8, fontSize: 12, color: '#92400e' }}>
          ⚠️ Pins sauvegardés localement. Exécutez dans Supabase SQL Editor :&nbsp;
          <code style={{ background: '#fef3c7', padding: '2px 6px', borderRadius: 4, fontSize: 11 }}>
            ALTER TABLE campings ADD COLUMN IF NOT EXISTS carte_config jsonb DEFAULT {'{}'}::jsonb;
          </code>
        </div>
      )}

      {/* Barre de recherche style Google Maps */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <input
          value={addrSearch}
          onChange={e => setAddrSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && searchAddress()}
          placeholder="Ex: Camping Les Naïades, Fréjus..."
          style={{ flex: 1, padding: '10px 18px', borderRadius: 28, border: '2px solid #e5e7eb', fontSize: 14, outline: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', transition: 'border-color 0.15s' }}
          onFocus={e => e.target.style.borderColor = '#639922'}
          onBlur={e => e.target.style.borderColor = '#e5e7eb'}
        />
        <button onClick={searchAddress} disabled={addrLoading} style={{
          padding: '10px 20px', borderRadius: 28, border: 'none',
          background: '#639922', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', flexShrink: 0,
          boxShadow: '0 2px 8px rgba(99,153,34,0.3)',
        }}>
          {addrLoading ? '...' : '🔍 Rechercher'}
        </button>
      </div>

      {/* Carte pleine largeur avec panel flottant */}
      <div style={{ position: 'relative', height: 560, borderRadius: 14, overflow: 'hidden', border: selected ? '2px solid #639922' : '2px solid #e5e7eb', cursor: selected ? 'crosshair' : 'grab', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>

        {/* Panel flottant gauche */}
        <div style={{
          position: 'absolute', top: 10, left: 10, zIndex: 1000,
          width: 210, maxHeight: 'calc(100% - 20px)', overflowY: 'auto',
          background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(10px)',
          borderRadius: 12, boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
          display: 'flex', flexDirection: 'column', gap: 4, padding: '10px 10px',
        }}>
          <div style={{ fontSize: 12, color: selected ? '#639922' : '#6b7280', fontWeight: 600, marginBottom: 4, lineHeight: 1.3 }}>
            {selected ? `🎯 Cliquez sur la carte pour placer « ${selected.label} »` : '💡 Sélectionnez puis cliquez sur la carte'}
          </div>

          {animations.length > 0 && (
            <>
              <SectionLabel>Animations</SectionLabel>
              {animations.map(a => (
                <ListItem key={a.id} emoji={a.emoji || '🎉'} label={a.titre}
                  pinned={pinnedIds.has(a.id)} selected={selected?.ref_id === a.id} color={PIN_COLORS.animation}
                  onClick={() => setSelected(selected?.ref_id === a.id ? null : { ref_id: a.id, ref_type: 'animation', label: a.titre, emoji: a.emoji || '🎉', color: PIN_COLORS.animation })}
                  onRemove={pinnedIds.has(a.id) ? () => removePin(a.id) : null} />
              ))}
            </>
          )}
          {groupes.length > 0 && (
            <>
              <SectionLabel style={{ marginTop: 6 }}>Groupes</SectionLabel>
              {groupes.map(g => (
                <ListItem key={g.id} emoji={g.emoji || '👥'} label={g.titre}
                  pinned={pinnedIds.has(g.id)} selected={selected?.ref_id === g.id} color={PIN_COLORS.groupe}
                  onClick={() => setSelected(selected?.ref_id === g.id ? null : { ref_id: g.id, ref_type: 'groupe', label: g.titre, emoji: g.emoji || '👥', color: PIN_COLORS.groupe })}
                  onRemove={pinnedIds.has(g.id) ? () => removePin(g.id) : null} />
              ))}
            </>
          )}
          {pins.filter(p => p.ref_type === 'lieu').length > 0 && (
            <>
              <SectionLabel style={{ marginTop: 6 }}>Lieux placés</SectionLabel>
              {pins.filter(p => p.ref_type === 'lieu').map(p => (
                <ListItem key={p.ref_id} emoji={p.emoji} label={p.label}
                  pinned selected={selected?.ref_id === p.ref_id} color={PIN_COLORS.lieu}
                  onClick={() => setSelected(selected?.ref_id === p.ref_id ? null : p)}
                  onRemove={() => removePin(p.ref_id)} />
              ))}
            </>
          )}
          <SectionLabel style={{ marginTop: 6 }}>+ Ajouter un lieu</SectionLabel>
          <LieuPicker
            onAdd={lieu => {
              const newPin = { ref_id: `lieu_${Date.now()}`, ref_type: 'lieu', label: lieu.label, emoji: lieu.emoji, color: lieu.color }
              setSelected(newPin)
            }}
            existingLabels={pins.filter(p => p.ref_type === 'lieu').map(p => p.label)}
          />
        </div>

        {/* Carte Leaflet */}
        <div ref={mapDivRef} style={{ position: 'absolute', inset: 0 }} />

        {/* Indicateur sauvegarde */}
        {saving && (
          <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 1000, background: 'rgba(255,255,255,0.95)', borderRadius: 20, padding: '4px 12px', fontSize: 12, color: '#639922', fontWeight: 700, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            💾 Sauvegarde...
          </div>
        )}
        {!saving && pins.length > 0 && (
          <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 1000, background: 'rgba(255,255,255,0.95)', borderRadius: 20, padding: '4px 12px', fontSize: 12, color: '#9ca3af', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            ✓ {pins.length} pin{pins.length > 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Composants utilitaires ──────────────────────────────────────────────────

const GROUPES_LIEUX = [
  { label: '💧 Aquatique',    ids: ['piscine', 'toboggan', 'pataugeoire', 'jacuzzi', 'plage'] },
  { label: '🍽️ Restauration', ids: ['bar', 'restaurant', 'epicerie', 'boulangerie', 'pizzeria', 'bbq', 'distributeur'] },
  { label: '⚽ Sports',       ids: ['tennis', 'foot', 'volley', 'petanque', 'pingpong', 'basket', 'minigolf', 'velo', 'fitness', 'skate', 'archery'] },
  { label: '🛝 Enfants',      ids: ['jeux', 'miniclub', 'trampoline'] },
  { label: '🎪 Animations',   ids: ['animation', 'jeux_salle', 'cinema', 'disco'] },
  { label: '🏠 Services',     ids: ['reception', 'sanitaires', 'laverie', 'infirmerie', 'wifi', 'poubelles', 'borne_elec', 'point_eau'] },
  { label: '🅿️ Transport',    ids: ['parking', 'parking_velo', 'navette', 'station_gaz'] },
  { label: '🌲 Nature',       ids: ['foret', 'rando'] },
]

function LieuPicker({ onAdd, existingLabels }) {
  const [search, setSearch] = useState('')
  const [groupe, setGroupe] = useState(null)
  const lieux = groupe
    ? CAMPING_LIEUX.filter(l => GROUPES_LIEUX.find(g => g.label === groupe)?.ids.includes(l.id))
    : search.trim()
      ? CAMPING_LIEUX.filter(l => l.label.toLowerCase().includes(search.toLowerCase()) || l.keywords.some(k => k.includes(search.toLowerCase())))
      : []
  return (
    <div style={{ marginTop: 4 }}>
      <input value={search} onChange={e => { setSearch(e.target.value); setGroupe(null) }} placeholder="Rechercher un lieu..."
        style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12, outline: 'none', marginBottom: 6, boxSizing: 'border-box' }} />
      {!search && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
          {GROUPES_LIEUX.map(g => (
            <button key={g.label} onClick={() => setGroupe(groupe === g.label ? null : g.label)}
              style={{ padding: '4px 8px', borderRadius: 14, fontSize: 11, fontWeight: 600, border: '1px solid #e5e7eb', background: groupe === g.label ? '#63992218' : '#f9fafb', color: groupe === g.label ? '#639922' : '#6b7280', cursor: 'pointer' }}>
              {g.label}
            </button>
          ))}
        </div>
      )}
      {lieux.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 180, overflowY: 'auto' }}>
          {lieux.map(lieu => {
            const already = existingLabels.includes(lieu.label)
            return (
              <button key={lieu.id} onClick={() => !already && onAdd(lieu)} disabled={already}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 7, background: already ? '#f3f4f6' : '#fff', border: '1px solid #e5e7eb', opacity: already ? 0.5 : 1, cursor: already ? 'default' : 'pointer', textAlign: 'left' }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{lieu.emoji}</span>
                <span style={{ fontSize: 12, fontWeight: 500, color: '#374151', flex: 1 }}>{lieu.label}</span>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: lieu.color, flexShrink: 0 }} />
                {already && <span style={{ fontSize: 10, color: '#9ca3af' }}>✓</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function SectionLabel({ children, style }) {
  return <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2, ...style }}>{children}</div>
}

function ListItem({ emoji, label, pinned, selected, color, onClick, onRemove }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', borderRadius: 8, cursor: 'pointer', background: selected ? `${color}18` : pinned ? '#f9fafb' : '#fff', border: selected ? `1.5px solid ${color}` : '1px solid #e5e7eb', transition: 'all 0.1s' }} onClick={onClick}>
      <span style={{ fontSize: 16, flexShrink: 0 }}>{emoji}</span>
      <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
      {pinned && <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />}
      {onRemove && (
        <button type="button" onClick={e => { e.stopPropagation(); onRemove() }}
          style={{ width: 18, height: 18, borderRadius: '50%', background: '#fef2f2', color: '#dc2626', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: 'none', cursor: 'pointer' }}>
          ×
        </button>
      )}
    </div>
  )
}
