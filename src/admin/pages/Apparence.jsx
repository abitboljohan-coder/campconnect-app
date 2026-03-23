import { useState } from 'react'
import { supabase } from '../../supabase'
import ColorPicker from '../components/ColorPicker'
import MapEditor from '../components/MapEditor'

// Compresse une image en JPEG et retourne un data URL
function compressImage(file, maxWidth = 1600, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      if (width > maxWidth) {
        height = Math.round((height / width) * maxWidth)
        width = maxWidth
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d').drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = reject
    img.src = url
  })
}

export default function Apparence({ camping, setCamping }) {
  const [nom, setNom]           = useState(camping?.nom || '')
  const [couleur1, setCouleur1] = useState(camping?.couleur_principale || '#639922')
  const [couleur2, setCouleur2] = useState(camping?.couleur_secondaire || '#0d1f0d')
  const [saving, setSaving]     = useState(false)
  const [success, setSuccess]   = useState('')
  const [error, setError]       = useState('')
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingPlan, setUploadingPlan] = useState(false)
  const [logoPreview, setLogoPreview] = useState(camping?.logo_url || null)
  const [planPreview, setPlanPreview] = useState(camping?.plan_url || null)

  function flash(type, msg) {
    if (type === 'success') { setSuccess(msg); setError('') }
    else { setError(msg); setSuccess('') }
  }

  async function handleImageUpload(file, field, maxMB, setUploading, setPreview) {
    if (!file) return
    if (file.size > maxMB * 1024 * 1024) {
      flash('error', `Fichier trop lourd (max ${maxMB}MB).`)
      return
    }
    setUploading(true)
    setError('')
    try {
      const dataUrl = await compressImage(file, field === 'plan_url' ? 1600 : 800, 0.75)

      // Vérifier la taille après compression
      const sizeKB = Math.round(dataUrl.length * 0.75 / 1024)
      if (sizeKB > 900) {
        flash('error', `Image trop lourde même après compression (${sizeKB}KB). Réduisez la résolution.`)
        setUploading(false)
        return
      }

      const { error: dbErr } = await supabase
        .from('campings')
        .update({ [field]: dataUrl })
        .eq('id', camping.id)

      if (dbErr) {
        flash('error', `Erreur DB : ${dbErr.message}`)
      } else {
        setPreview(dataUrl)
        setCamping(c => ({ ...c, [field]: dataUrl }))
        flash('success', 'Image mise à jour !')
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (err) {
      flash('error', `Erreur : ${err.message}`)
    }
    setUploading(false)
  }

  async function sauvegarder() {
    setSaving(true)
    setError('')
    const { error: dbErr } = await supabase.from('campings').update({
      nom: nom.trim(),
      couleur_principale: couleur1,
      couleur_secondaire: couleur2,
    }).eq('id', camping.id)

    if (dbErr) { flash('error', dbErr.message) }
    else {
      setCamping(c => ({ ...c, nom: nom.trim(), couleur_principale: couleur1, couleur_secondaire: couleur2 }))
      flash('success', 'Modifications enregistrées !')
      setTimeout(() => setSuccess(''), 3000)
    }
    setSaving(false)
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1a1a1a' }}>Apparence</h1>
        <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>Personnalisez l'application de vos vacanciers.</p>
      </div>

      {success && <Alert type="success">{success}</Alert>}
      {error   && <Alert type="error">{error}</Alert>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Nom */}
        <Card title="Nom du camping">
          <label style={labelStyle}>NOM</label>
          <input type="text" value={nom} onChange={e => setNom(e.target.value)} style={inputStyle} placeholder="ex: Camping Les Pins" />
        </Card>

        {/* Couleurs */}
        <Card title="Couleurs">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <ColorPicker label="Couleur principale (boutons, accents)" value={couleur1} onChange={setCouleur1} />
            <ColorPicker label="Couleur secondaire (fond header)" value={couleur2} onChange={setCouleur2} />
            <div>
              <label style={labelStyle}>APERÇU DE L'APP</label>
              <div style={{ marginTop: 8, borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.1)', width: 220, boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
                <div style={{ background: couleur2, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${couleur1}40`, border: `2px solid ${couleur1}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🏕️</div>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>{nom || camping?.nom}</div>
                </div>
                <div style={{ background: '#f5f2eb', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ background: '#fff', borderRadius: 8, padding: '8px 10px', borderLeft: `3px solid ${couleur1}` }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#374151' }}>🏊 Cours de natation</div>
                    <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>14:00 · Piscine</div>
                  </div>
                  <div style={{ background: couleur1, borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                    <span style={{ fontSize: 11, color: '#fff', fontWeight: 600 }}>+ Créer un groupe</span>
                  </div>
                </div>
                <div style={{ background: '#fff', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-around', padding: '6px 0' }}>
                  {['🏠','👥','🗺️','📅','👤'].map((ic, i) => (
                    <div key={i} style={{ textAlign: 'center', fontSize: 14, opacity: i === 0 ? 1 : 0.4 }}>
                      <div>{ic}</div>
                      {i === 0 && <div style={{ width: 12, height: 2, background: couleur1, borderRadius: 1, margin: '2px auto 0' }} />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Logo */}
        <Card title="Logo du camping">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
            {logoPreview && (
              <img src={logoPreview} alt="Logo" style={{ width: 80, height: 80, objectFit: 'contain', borderRadius: 12, border: '1px solid #e5e7eb', background: '#f5f2eb' }} />
            )}
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>FICHIER (PNG/JPG/SVG, max 2MB)</label>
              <input
                type="file" accept="image/png,image/jpeg,image/svg+xml"
                onChange={e => handleImageUpload(e.target.files[0], 'logo_url', 2, setUploadingLogo, setLogoPreview)}
                style={{ display: 'block', marginTop: 8, fontSize: 14, color: '#374151' }}
              />
              {uploadingLogo && <UploadProgress label="Compression et enregistrement..." />}
            </div>
          </div>
        </Card>

        {/* Plan du camping */}
        <Card title="Plan du camping">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {planPreview && (
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img src={planPreview} alt="Plan" style={{ width: '100%', maxWidth: 380, height: 180, objectFit: 'cover', borderRadius: 12, border: '1px solid #e5e7eb', display: 'block' }} />
                <button
                  onClick={async () => {
                    await supabase.from('campings').update({ plan_url: null }).eq('id', camping.id)
                    setPlanPreview(null)
                    setCamping(c => ({ ...c, plan_url: null }))
                  }}
                  style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >×</button>
              </div>
            )}
            <div>
              <label style={labelStyle}>
                {planPreview ? 'REMPLACER LE PLAN (JPG/PNG, max 5MB)' : 'FICHIER (JPG/PNG, max 5MB)'}
              </label>
              <input
                type="file" accept="image/png,image/jpeg"
                onChange={e => handleImageUpload(e.target.files[0], 'plan_url', 5, setUploadingPlan, setPlanPreview)}
                style={{ display: 'block', marginTop: 8, fontSize: 14, color: '#374151' }}
              />
              {uploadingPlan && <UploadProgress label="Compression de la carte en cours..." />}
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}>
                L'image sera automatiquement compressée et optimisée.
              </div>
            </div>
          </div>
        </Card>

        {/* Éditeur de carte satellite */}
        <Card title="Carte du camping">
          <MapEditor camping={camping} setCamping={setCamping} />
        </Card>

        {/* Bouton enregistrer */}
        <button
          onClick={sauvegarder}
          disabled={saving}
          style={{
            padding: '14px', borderRadius: 12,
            background: saving ? '#9ca3af' : '#639922',
            color: '#fff', fontWeight: 700, fontSize: 15,
            boxShadow: '0 4px 14px rgba(99,153,34,0.35)',
          }}
        >
          {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </button>

      </div>
    </div>
  )
}

function UploadProgress({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, padding: '8px 12px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
      <div style={{ width: 16, height: 16, border: '2px solid #639922', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
      <span style={{ fontSize: 13, color: '#166534', fontWeight: 500 }}>{label}</span>
    </div>
  )
}

function Card({ title, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: '20px 22px', border: '1px solid rgba(0,0,0,0.07)' }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', marginBottom: 18 }}>{title}</h2>
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

const labelStyle = { fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', marginBottom: 6 }
const inputStyle = { width: '100%', padding: '11px 13px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 15, outline: 'none', background: '#fafaf8', boxSizing: 'border-box' }
