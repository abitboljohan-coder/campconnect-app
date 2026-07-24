import { useEffect, useState } from 'react'
import { t, useLangue, locale } from '../i18n'

// ─────────────────────────────────────────────────────────────────────────────
// Météo du camping — Open-Meteo (gratuit, sans clé API, sans compte)
// Affiche la température du jour + les 3 prochains jours.
// Se cache silencieusement si le camping n'a pas de coordonnées ou si l'API
// est injoignable : jamais d'écran cassé pour un module secondaire.
// ─────────────────────────────────────────────────────────────────────────────

// Codes météo WMO → emoji + libellé
const WMO = {
  0:  ['☀️', 'ciel_clair'],
  1:  ['🌤️', 'peu_nuageux'], 2: ['⛅', 'nuageux'], 3: ['☁️', 'couvert'],
  45: ['🌫️', 'brouillard'], 48: ['🌫️', 'brouillard'],
  51: ['🌦️', 'bruine'], 53: ['🌦️', 'bruine'], 55: ['🌦️', 'bruine'],
  56: ['🌧️', 'bruine'], 57: ['🌧️', 'bruine'],
  61: ['🌧️', 'pluie'], 63: ['🌧️', 'pluie'], 65: ['🌧️', 'pluie'],
  66: ['🌧️', 'pluie'], 67: ['🌧️', 'pluie'],
  71: ['🌨️', 'neige'], 73: ['🌨️', 'neige'], 75: ['🌨️', 'neige'], 77: ['🌨️', 'neige'],
  80: ['🌦️', 'averses'], 81: ['🌦️', 'averses'], 82: ['⛈️', 'averses'],
  85: ['🌨️', 'neige'], 86: ['🌨️', 'neige'],
  95: ['⛈️', 'orage'], 96: ['⛈️', 'orage'], 99: ['⛈️', 'orage'],
}
const meteoInfo = (code) => WMO[code] || ['🌡️', 'ciel_clair']

/** Coordonnées du camping : centre du contour, sinon lat/lng réglées. */
function coordsCamping(camping) {
  const cfg = camping?.carte_config || {}
  const perim = cfg.perimeter
  if (perim?.length >= 3) {
    return {
      lat: perim.reduce((s, p) => s + p[0], 0) / perim.length,
      lng: perim.reduce((s, p) => s + p[1], 0) / perim.length,
    }
  }
  if (cfg.lat && cfg.lng) return { lat: cfg.lat, lng: cfg.lng }
  try {
    const local = JSON.parse(localStorage.getItem(`carte_config_${camping?.id}`) || 'null')
    if (local?.lat && local?.lng) return { lat: local.lat, lng: local.lng }
  } catch { /* ignore */ }
  return null
}

export default function Meteo({ camping, couleur }) {
  useLangue()
  const coords = coordsCamping(camping)
  // Init paresseuse depuis le cache (évite un setState synchrone dans l'effet)
  const [data, setData] = useState(() => {
    try {
      const c = JSON.parse(sessionStorage.getItem(`meteo_${camping?.id}`) || 'null')
      return c && Date.now() - c.at < 3600_000 ? c.data : null
    } catch { return null }
  })

  useEffect(() => {
    if (!coords) return
    let annule = false
    if (data) return // déjà servi par le cache
    const cle = `meteo_${camping?.id}`

    const url = 'https://api.open-meteo.com/v1/forecast'
      + `?latitude=${coords.lat.toFixed(4)}&longitude=${coords.lng.toFixed(4)}`
      + '&current=temperature_2m,weather_code'
      + '&daily=weather_code,temperature_2m_max,temperature_2m_min'
      + '&timezone=auto&forecast_days=4'

    fetch(url)
      .then(r => r.ok ? r.json() : null)
      .then(json => {
        if (annule || !json?.current) return
        setData(json)
        try { sessionStorage.setItem(cle, JSON.stringify({ at: Date.now(), data: json })) } catch { /* ignore */ }
      })
      .catch(() => { /* météo indisponible : on n'affiche rien */ })

    return () => { annule = true }
  }, [camping?.id, coords?.lat, coords?.lng]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!coords || !data?.current) return null

  const [emoji, libelle] = meteoInfo(data.current.weather_code)
  const temp = Math.round(data.current.temperature_2m)
  const jours = data.daily?.time?.slice(1, 4) || []

  return (
    <div style={{
      background: '#fff', borderRadius: 16, padding: '14px 16px',
      margin: '14px 16px 0', boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
      display: 'flex', alignItems: 'center', gap: 14,
    }}>
      {/* Aujourd'hui */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, flexShrink: 0 }}>
        <span style={{ fontSize: 34, lineHeight: 1 }}>{emoji}</span>
        <div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#1a1a1a', lineHeight: 1.1 }}>
            {temp}°
          </div>
          <div style={{ fontSize: 11.5, color: '#6b7280' }}>{t(`meteo.${libelle}`)}</div>
        </div>
      </div>

      {/* 3 prochains jours */}
      {jours.length > 0 && (
        <div style={{
          display: 'flex', gap: 4, marginLeft: 'auto',
          borderLeft: '1px solid #f0ede6', paddingLeft: 12,
        }}>
          {jours.map((iso, i) => {
            const idx = i + 1
            const [em] = meteoInfo(data.daily.weather_code[idx])
            const max = Math.round(data.daily.temperature_2m_max[idx])
            const min = Math.round(data.daily.temperature_2m_min[idx])
            const jour = new Date(iso + 'T12:00').toLocaleDateString(locale(), { weekday: 'short' })
            return (
              <div key={iso} style={{ textAlign: 'center', minWidth: 42 }}>
                <div style={{ fontSize: 10, color: '#9ca3af', textTransform: 'capitalize', fontWeight: 600 }}>
                  {jour}
                </div>
                <div style={{ fontSize: 17, margin: '1px 0' }}>{em}</div>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: couleur }}>{max}°</div>
                <div style={{ fontSize: 9.5, color: '#c4c0b6' }}>{min}°</div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
