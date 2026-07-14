import { useState } from 'react'
import { supabase } from '../../supabase'
import MapEditor from '../components/MapEditor'

function compressImage(file, maxWidth = 1600, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      if (width > maxWidth) { height = Math.round((height / width) * maxWidth); width = maxWidth }
      const canvas = document.createElement('canvas')
      canvas.width = width; canvas.height = height
      canvas.getContext('2d').drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = reject
    img.src = url
  })
}

export default function Carte({ camping, setCamping }) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview]     = useState(camping?.plan_url || null)
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState('')

  async function handleUpload(file) {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError('Fichier trop lourd (max 5 MB).'); return }
    setUploading(true); setError('')
    try {
      const dataUrl = await compressImage(file, 1600, 0.75)
      const sizeKB  = Math.round(dataUrl.length * 0.75 / 1024)
      if (sizeKB > 900) {
        setError(`Image trop lourde après compression (${sizeKB} KB). Réduisez la résolution.`)
        setUploading(false); return
      }
      const { error: dbErr } = await supabase.from('campings').update({ plan_url: dataUrl }).eq('id', camping.id)
      if (dbErr) { setError(dbErr.message) }
      else {
        setPreview(dataUrl)
        setCamping(c => ({ ...c, plan_url: dataUrl }))
        setSuccess('Plan mis à jour !'); setTimeout(() => setSuccess(''), 3000)
      }
    } catch (err) { setError(err.message) }
    setUploading(false)
  }

  async function supprimerPlan() {
    await supabase.from('campings').update({ plan_url: null }).eq('id', camping.id)
    setPreview(null)
    setCamping(c => ({ ...c, plan_url: null }))
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1a1a1a' }}>Carte du camping</h1>
        <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>
          Plan image et points d'intérêt visibles par vos vacanciers.
        </p>
      </div>

      {success && <Alert type="success">{success}</Alert>}
      {error   && <Alert type="error">{error}</Alert>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Plan du camping */}
        <Card title="Plan image">
          {!preview ? (
            <label style={{ display: 'block', cursor: 'pointer' }}>
              <div style={{
                border: '2px dashed #d1d5db', borderRadius: 14,
                padding: '40px 20px', textAlign: 'center', background: '#fafaf8',
                transition: 'border-color .15s',
              }}>
                <div style={{ fontSize: 44, marginBottom: 12 }}>🗺️</div>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#374151', marginBottom: 6 }}>
                  Aucun plan téléchargé
                </div>
                <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 20 }}>
                  Uploadez le plan de votre camping (JPG / PNG, max 5 MB)
                </div>
                <span style={{
                  background: '#639922', color: '#fff',
                  padding: '10px 22px', borderRadius: 8,
                  fontSize: 14, fontWeight: 600,
                }}>
                  Choisir un fichier
                </span>
                <input
                  type="file" accept="image/png,image/jpeg"
                  onChange={e => handleUpload(e.target.files[0])}
                  style={{ display: 'none' }}
                />
              </div>
            </label>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img
                  src={preview} alt="Plan"
                  style={{ width: '100%', maxWidth: 400, height: 200, objectFit: 'cover', borderRadius: 12, border: '1px solid #e5e7eb', display: 'block' }}
                />
                <button
                  onClick={supprimerPlan}
                  style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >×</button>
              </div>
              <label style={{ cursor: 'pointer', display: 'inline-block' }}>
                <span style={{ background: '#f3f4f6', color: '#374151', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
                  Remplacer le plan
                </span>
                <input
                  type="file" accept="image/png,image/jpeg"
                  onChange={e => handleUpload(e.target.files[0])}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          )}
          {uploading && <UploadProgress label="Compression et enregistrement..." />}
        </Card>

        {/* Points d'intérêt */}
        <Card title="Points d'intérêt">
          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16, lineHeight: 1.6 }}>
            Placez les équipements de votre camping sur la carte satellite ou sur le plan image.
            Vos vacanciers les verront directement dans l'app.
          </p>
          <MapEditor camping={camping} setCamping={setCamping} />
        </Card>

      </div>
    </div>
  )
}

function UploadProgress({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, padding: '8px 12px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
      <div style={{ width: 16, height: 16, border: '2px solid #639922', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
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
    <div style={{ background: ok ? '#dcfce7' : '#fef2f2', color: ok ? '#166534' : '#dc2626', padding: '12px 16px', borderRadius: 10, fontSize: 14, fontWeight: 500, marginBottom: 16 }}>
      {ok ? '✅ ' : '❌ '}{children}
    </div>
  )
}
