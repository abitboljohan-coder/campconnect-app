import { useState } from 'react'
import { supabase } from '../../supabase'
import MapEditor from '../components/MapEditor'
import PlanCalibrator from '../components/PlanCalibrator'
import PerimeterEditor from '../components/PerimeterEditor'
import { detectPois } from '../lib/osmPois'

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
      const existing = camping?.carte_config?.pins || []
      const existingIds = new Set(existing.map(p => p.ref_id))
      const merged = [...existing, ...pois.filter(p => !existingIds.has(p.ref_id))]
      const newCfg = { ...(camping.carte_config || {}), pins: merged }
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

        <Card title="Contour du camping">
          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 14, lineHeight: 1.6 }}>
            Délimitez votre camping sur le satellite. Ce contour sert de zone d'accès pour les vacanciers
            et de repère avant même d'ajouter un plan.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{
              padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 500,
              background: perimeter.length >= 3 ? '#dcfce7' : '#fef3c7',
              color:      perimeter.length >= 3 ? '#166534' : '#92400e',
            }}>
              {perimeter.length >= 3
                ? `✅ Contour tracé (${perimeter.length} points)`
                : '⚠️ Aucun contour tracé'}
            </div>
            <button onClick={() => setShowPerimeter(true)}
              style={{ background: '#639922', color: '#fff', padding: '10px 18px',
                       borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              🗺️ {perimeter.length >= 3 ? 'Modifier le contour' : 'Tracer le contour'}
            </button>
          </div>
        </Card>

        <Card title="Plan du camping">
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
        </Card>

        <Card title="Points d'intérêt">
          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 12, lineHeight: 1.6 }}>
            Placez les équipements sur la carte satellite ou sur le plan.
            Vos vacanciers les verront dans l'app.
          </p>
          <div style={{ marginBottom: 16 }}>
            <button onClick={autoDetectPois} disabled={detecting}
              style={{ background: '#eef2ff', color: '#4338ca', border: '1px solid #c7d2fe',
                       padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                       cursor: detecting ? 'wait' : 'pointer' }}>
              {detecting ? '⏳ Détection en cours…' : '🎯 Détecter les POI automatiquement (OSM)'}
            </button>
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 6 }}>
              Piscine, sanitaires, restaurant, pétanque, tennis, aire de jeux… récupérés depuis OpenStreetMap.
              {perimeter.length >= 3 ? ' Limité au contour du camping.' : ' Astuce : tracez d\'abord le contour pour un meilleur ciblage.'}
            </div>
          </div>
          <MapEditor camping={camping} setCamping={setCamping} />
        </Card>
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
