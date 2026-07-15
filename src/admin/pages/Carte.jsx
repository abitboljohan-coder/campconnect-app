import { useState } from 'react'
import { supabase } from '../../supabase'
import MapEditor from '../components/MapEditor'
import PlanCalibrator from '../components/PlanCalibrator'
import PerimeterEditor from '../components/PerimeterEditor'
import { detectPois, geocodeCamping, findCampsitePolygon, searchCampsiteByName } from '../lib/osmPois'

async function compressToBlob(file, maxWidth = 2000, quality = 0.82) {
  const bmp = await createImageBitmap(file)
  let { width, height } = bmp
  if (width > maxWidth) { height = Math.round((height / width) * maxWidth); width = maxWidth }
  const canvas = document.createElement('canvas')
  canvas.width = width; canvas.height = height
  canvas.getContext('2d').drawImage(bmp, 0, 0, width, height)
  return await new Promise(res => canvas.toBlob(res, 'image/jpeg', quality))
}

export default function Carte({ camping, setCamping }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState('')
  const [showCalibrator, setShowCalibrator] = useState(false)
  const [showPerimeter, setShowPerimeter]   = useState(false)
  const [detecting, setDetecting]           = useState(false)
  const [autoAddress, setAutoAddress]       = useState('')
  const [autoRunning, setAutoRunning]       = useState(false)
  const [autoLog, setAutoLog]               = useState([])

  const planUrl    = camping?.plan_url
  const planBounds = camping?.plan_bounds
  const perimeter  = camping?.carte_config?.perimeter || []

  async function handleUpload(file) {
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { setError('Fichier trop lourd (max 10 MB).'); return }
    setUploading(true); setError('')
    try {
      const blob = await compressToBlob(file, 2000, 0.82)
      const ext  = 'jpg'
      const path = `plans/${camping.id}-${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('camping-assets').upload(path, blob, {
          contentType: 'image/jpeg', upsert: true, cacheControl: '3600',
        })
      if (upErr) throw upErr
      const { data: pub } = supabase.storage.from('camping-assets').getPublicUrl(path)
      const publicUrl = pub.publicUrl
      const { error: dbErr } = await supabase.from('campings')
        .update({ plan_url: publicUrl, plan_bounds: null }).eq('id', camping.id)
      if (dbErr) throw dbErr
      setCamping(c => ({ ...c, plan_url: publicUrl, plan_bounds: null }))
      setSuccess('Plan uploadé ! Vous pouvez maintenant le caler sur le satellite.')
      setTimeout(() => setSuccess(''), 4000)
    } catch (err) { setError(err.message) }
    setUploading(false)
  }

  async function autoConfigure() {
    if (autoRunning) return
    setAutoRunning(true); setError(''); setSuccess(''); setAutoLog([])
    const log = (msg) => setAutoLog(prev => [...prev, msg])
    let savedSomething = false
    try {
      const addr = autoAddress.trim()
      const cityHint = addr ? (addr.split(',').pop() || '').replace(/\d{5}/, '').trim() : ''

      // ⚡ Lancement PARALLÈLE : Overpass-par-nom + plusieurs variantes Nominatim
      log(`⚡ Recherche parallèle (OSM + géocodage)…`)

      const nomQueries = []
      if (addr) {
        nomQueries.push(addr + ' France')
        const parts = addr.split(',').map(s => s.trim()).filter(Boolean)
        if (parts.length > 1) {
          nomQueries.push(parts.slice(-2).join(', ') + ' France')
          nomQueries.push(parts[parts.length - 1] + ' France')
        }
        if (addr.includes('-')) nomQueries.push(addr.split('-')[0].trim() + ' France')
      }
      nomQueries.push(`${camping.nom} ${cityHint} France`.replace(/\s+/g, ' ').trim())
      nomQueries.push(`${camping.nom} France`)
      nomQueries.push(camping.nom)

      // On lance tout en parallèle
      const osmPromise = searchCampsiteByName(camping.nom, cityHint)
        .then(r => ({ src: 'osm', results: r }))
        .catch(e => ({ src: 'osm', results: [], err: e.message }))
      const nomPromises = nomQueries.map(q =>
        geocodeCamping(q).then(r => ({ src: 'nom', query: q, results: r }))
                         .catch(() => ({ src: 'nom', query: q, results: [] }))
      )

      // On attend TOUS pour départager (OSM > Nominatim si les 2 trouvent)
      const all = await Promise.all([osmPromise, ...nomPromises])
      const osm = all.find(a => a.src === 'osm' && a.results.length)
      const nom = all.find(a => a.src === 'nom' && a.results.length)

      let poly = null, lat, lng
      if (osm) {
        const best = osm.results.sort((a, b) => (b.poly ? 1 : 0) - (a.poly ? 1 : 0))[0]
        lat = best.center.lat; lng = best.center.lng
        if (best.poly) poly = best.poly
        log(`✅ OSM : « ${best.name} »${best.addr ? ' — ' + best.addr : ''} (${osm.results.length} match${osm.results.length > 1 ? 's' : ''})`)
      } else if (nom) {
        const b = nom.results[0]
        lat = +b.lat; lng = +b.lon
        log(`📍 Géocodé (${nom.query}) : ${b.display_name.split(',').slice(0, 3).join(',')}`)
      } else {
        throw new Error('Introuvable partout. Utilisez « Tracer le contour » à la main.')
      }

      if (!poly) {
        log(`🗺️  Recherche du contour dans un rayon de 800 m…`)
        try {
          poly = await findCampsitePolygon(lat, lng, 800)
          if (poly) log(`✅ Contour importé (${poly.length} points)`)
          else     log(`⚠️  Pas de contour dans OSM autour de ce point`)
        } catch (e) {
          log(`⚠️  Recherche contour indisponible (${e.message})`)
        }
      } else {
        log(`✅ Contour déjà obtenu via OSM (${poly.length} points)`)
      }

      let newCfg = { ...(camping.carte_config || {}) }

      // Sauvegarde intermédiaire : si on a un contour, on l'enregistre TOUT DE SUITE
      if (poly) {
        newCfg.perimeter = poly
        const { error: dbErr1 } = await supabase.from('campings')
          .update({ carte_config: newCfg }).eq('id', camping.id)
        if (!dbErr1) {
          setCamping(c => ({ ...c, carte_config: newCfg }))
          savedSomething = true
        }
      }

      log(`🎯 Détection des POI fiables…`)
      let pois = []
      try {
        pois = await detectPois(poly || null, { lat, lng })
        log(`✅ ${pois.length} POI détectés`)
      } catch (e) {
        log(`⚠️  POI OSM indisponibles (retry a échoué) — le contour est enregistré, ajoutez les POI à la main.`)
      }
      const manuals = (camping?.carte_config?.pins || []).filter(p => !p.osm)
      newCfg.pins = [...manuals, ...pois]
      if (pois.length) log(`   (${manuals.length} POI manuels conservés)`)

      const { error: dbErr } = await supabase.from('campings')
        .update({ carte_config: newCfg }).eq('id', camping.id)
      if (dbErr) throw dbErr
      setCamping(c => ({ ...c, carte_config: newCfg }))
      savedSomething = true
      log(`💾 Configuration enregistrée`)
      setSuccess('Auto-configuration terminée !')
      setTimeout(() => setSuccess(''), 5000)
    } catch (e) {
      log(`❌ ${e.message}`)
      // Si on a déjà sauvé quelque chose (le contour), on ne montre PAS d'erreur globale
      if (savedSomething) {
        setSuccess('Contour enregistré (POI à ajouter manuellement)')
        setTimeout(() => setSuccess(''), 5000)
      } else {
        setError('Erreur : ' + e.message)
      }
    }
    setAutoRunning(false)
  }

  async function autoDetectPois() {
    if (detecting) return
    setDetecting(true); setError(''); setSuccess('')
    try {
      const fallback = perimeter.length >= 3
        ? { lat: perimeter[0][0], lng: perimeter[0][1] }
        : null
      const pois = await detectPois(perimeter.length >= 3 ? perimeter : null, fallback)
      if (!pois.length) {
        setError('Aucun POI détecté dans OSM. Ajoutez-les manuellement.')
        setDetecting(false); return
      }
      // Remplace tous les POI OSM par la détection fraîche ; garde uniquement les manuels
      const manuals = (camping?.carte_config?.pins || []).filter(p => !p.osm)
      const newCfg = { ...(camping.carte_config || {}), pins: [...manuals, ...pois] }
      const { error: dbErr } = await supabase.from('campings')
        .update({ carte_config: newCfg }).eq('id', camping.id)
      if (dbErr) throw dbErr
      setCamping(c => ({ ...c, carte_config: newCfg }))
      setSuccess(`✅ ${pois.length} POI détectés depuis OpenStreetMap`)
      setTimeout(() => setSuccess(''), 5000)
    } catch (e) { setError('Erreur : ' + e.message) }
    setDetecting(false)
  }

  async function supprimerPlan() {
    await supabase.from('campings').update({ plan_url: null, plan_bounds: null }).eq('id', camping.id)
    setCamping(c => ({ ...c, plan_url: null, plan_bounds: null }))
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1a1a1a' }}>Carte du camping</h1>
        <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>
          Plan image (calé sur satellite) et points d'intérêt visibles par vos vacanciers.
        </p>
      </div>

      {success && <Alert type="success">{success}</Alert>}
      {error   && <Alert type="error">{error}</Alert>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ÉTAPE 1 — CONTOUR */}
        <Step n={1} title="Tracer le contour du camping"
              subtitle="Délimitez votre camping sur le satellite. Sert de repère à vos vacanciers et prépare la détection des équipements."
              done={perimeter.length >= 3}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {perimeter.length >= 3
              ? <Badge ok>✅ Contour tracé ({perimeter.length} points)</Badge>
              : <Badge>⚠️ Pas encore tracé</Badge>}
            <button onClick={() => setShowPerimeter(true)}
              style={btnPrimary}>
              🗺️ {perimeter.length >= 3 ? 'Modifier le contour' : 'Tracer le contour'}
            </button>
            <span style={{ fontSize: 12, color: '#6b7280' }}>
              (import OSM auto, rectangle ou clic-à-clic — au choix dans l'éditeur)
            </span>
          </div>
        </Step>

        {/* ÉTAPE 2 — POI AUTO */}
        <Step n={2} title="Détecter les points d'intérêt"
              subtitle="Piscine, sanitaires, restaurant, tennis, pétanque, aire de jeux… récupérés automatiquement depuis OpenStreetMap."
              done={(camping?.carte_config?.pins || []).some(p => p.osm)}
              disabled={perimeter.length < 3}
              disabledReason="Terminez l'étape 1 (contour) pour un ciblage précis.">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {(camping?.carte_config?.pins || []).some(p => p.osm)
              ? <Badge ok>✅ {(camping?.carte_config?.pins || []).filter(p => p.osm).length} POI détectés</Badge>
              : <Badge>⚠️ Pas encore détectés</Badge>}
            <button onClick={autoDetectPois}
              disabled={detecting || perimeter.length < 3}
              style={perimeter.length < 3 ? btnDisabled : btnPrimary}>
              {detecting ? '⏳ Détection…' : '🎯 Détecter automatiquement'}
            </button>
          </div>
          <div style={{ marginTop: 14 }}>
            <MapEditor
              key={`${camping?.id}-${(camping?.carte_config?.pins || []).length}-${(camping?.carte_config?.perimeter || []).length}`}
              camping={camping}
              setCamping={setCamping}
            />
          </div>
        </Step>

        {/* ÉTAPE 3 — PLAN (OPTIONNEL) */}
        <Step n={3} title="Ajouter votre plan (optionnel)"
              subtitle="Si vous avez un plan illustré du camping, uploadez-le et calez-le sur le satellite."
              done={!!planUrl && !!planBounds}
              optional>
          {!planUrl ? (
            <label style={{ display: 'block', cursor: 'pointer' }}>
              <div style={{
                border: '2px dashed #d1d5db', borderRadius: 14,
                padding: '40px 20px', textAlign: 'center', background: '#fafaf8',
              }}>
                <div style={{ fontSize: 44, marginBottom: 12 }}>🗺️</div>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#374151', marginBottom: 6 }}>
                  Aucun plan téléchargé
                </div>
                <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 20 }}>
                  Uploadez le plan de votre camping (JPG / PNG, max 10 MB)
                </div>
                <span style={{
                  background: '#639922', color: '#fff',
                  padding: '10px 22px', borderRadius: 8, fontSize: 14, fontWeight: 600,
                }}>
                  Choisir un fichier
                </span>
                <input type="file" accept="image/png,image/jpeg"
                  onChange={e => handleUpload(e.target.files[0])}
                  style={{ display: 'none' }} />
              </div>
            </label>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img src={planUrl} alt="Plan"
                  style={{ width: '100%', maxWidth: 400, maxHeight: 260, objectFit: 'contain',
                           borderRadius: 12, border: '1px solid #e5e7eb', display: 'block',
                           background: '#f3f4f6' }} />
                <button onClick={supprimerPlan}
                  style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28,
                           borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: '#fff',
                           border: 'none', fontSize: 16, cursor: 'pointer' }}>×</button>
              </div>

              <div style={{
                padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 500,
                background: planBounds ? '#dcfce7' : '#fef3c7',
                color:      planBounds ? '#166534' : '#92400e',
              }}>
                {planBounds
                  ? '✅ Plan calé sur le satellite — visible pour vos vacanciers'
                  : '⚠️ Plan non calé — cliquez sur « Caler sur satellite » pour l\'aligner'}
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button onClick={() => setShowCalibrator(true)}
                  style={{ background: '#639922', color: '#fff', padding: '10px 18px',
                           borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  🎯 {planBounds ? 'Ajuster le calage' : 'Caler sur satellite'}
                </button>
                <label style={{ cursor: 'pointer' }}>
                  <span style={{ background: '#f3f4f6', color: '#374151', padding: '10px 18px',
                                 borderRadius: 8, fontSize: 13, fontWeight: 600, display: 'inline-block' }}>
                    Remplacer le plan
                  </span>
                  <input type="file" accept="image/png,image/jpeg"
                    onChange={e => handleUpload(e.target.files[0])}
                    style={{ display: 'none' }} />
                </label>
              </div>
            </div>
          )}
          {uploading && <UploadProgress label="Compression et upload..." />}
        </Step>
      </div>

      {showCalibrator && (
        <PlanCalibrator
          camping={camping}
          onClose={() => setShowCalibrator(false)}
          onSaved={(bounds) => setCamping(c => ({ ...c, plan_bounds: bounds }))}
        />
      )}
      {showPerimeter && (
        <PerimeterEditor
          camping={camping}
          onClose={() => setShowPerimeter(false)}
          onSaved={(newCfg) => setCamping(c => ({ ...c, carte_config: newCfg }))}
        />
      )}
    </div>
  )
}

function UploadProgress({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, padding: '8px 12px',
                  background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
      <div style={{ width: 16, height: 16, border: '2px solid #639922', borderTopColor: 'transparent',
                    borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
      <span style={{ fontSize: 13, color: '#166534', fontWeight: 500 }}>{label}</span>
    </div>
  )
}

const btnPrimary = {
  background: '#639922', color: '#fff', padding: '10px 18px',
  borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
}
const btnDisabled = {
  ...btnPrimary, background: '#e5e7eb', color: '#9ca3af', cursor: 'not-allowed',
}

function Badge({ ok, children }) {
  return (
    <span style={{
      padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600,
      background: ok ? '#dcfce7' : '#fef3c7',
      color:      ok ? '#166534' : '#92400e',
      whiteSpace: 'nowrap',
    }}>{children}</span>
  )
}

function Step({ n, title, subtitle, done, disabled, disabledReason, optional, children }) {
  const state = disabled ? 'disabled' : done ? 'done' : 'active'
  const numBg = state === 'done'     ? '#639922'
              : state === 'disabled' ? '#e5e7eb'
                                     : '#1a4d1a'
  const numFg = state === 'disabled' ? '#9ca3af' : '#fff'
  return (
    <div style={{
      background: '#fff', borderRadius: 16,
      border: '1px solid ' + (state === 'active' ? '#639922' : 'rgba(0,0,0,0.07)'),
      boxShadow: state === 'active' ? '0 4px 20px rgba(99,153,34,0.10)' : 'none',
      opacity: state === 'disabled' ? 0.55 : 1,
      overflow: 'hidden', transition: 'all 0.2s',
    }}>
      <div style={{ display: 'flex', gap: 14, padding: '18px 22px', alignItems: 'flex-start',
                    borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
        <div style={{
          width: 36, height: 36, borderRadius: 12, background: numBg, color: numFg,
          fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {state === 'done' ? '✓' : n}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>{title}</h2>
            {optional && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6,
                                        background: '#f3f4f6', color: '#6b7280', fontWeight: 600 }}>
              OPTIONNEL
            </span>}
          </div>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>
            {subtitle}
          </p>
        </div>
      </div>
      <div style={{ padding: '18px 22px' }}>
        {disabled ? (
          <div style={{ fontSize: 13, color: '#9ca3af', fontStyle: 'italic' }}>
            🔒 {disabledReason || 'Terminez l\'étape précédente.'}
          </div>
        ) : children}
      </div>
    </div>
  )
}

function Card({ title, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: '20px 22px', border: '1px solid rgba(0,0,0,0.07)' }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', marginBottom: 16 }}>{title}</h2>
      {children}
    </div>
  )
}

function Alert({ type, children }) {
  const ok = type === 'success'
  return (
    <div style={{ background: ok ? '#dcfce7' : '#fef2f2', color: ok ? '#166534' : '#dc2626',
                  padding: '12px 16px', borderRadius: 10, fontSize: 14, fontWeight: 500, marginBottom: 16 }}>
      {ok ? '✅ ' : '❌ '}{children}
    </div>
  )
}
