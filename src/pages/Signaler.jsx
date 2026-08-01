import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { t, useLangue } from '../i18n'

const CATEGORIES = [
  { id: 'proprete', emoji: '🧹' },
  { id: 'panne',    emoji: '🔧' },
  { id: 'securite', emoji: '⚠️' },
  { id: 'bruit',    emoji: '🔊' },
  { id: 'autre',    emoji: '💬' },
]

/** Compresse la photo côté client (les originaux téléphone font 3-8 Mo). */
async function compresser(file, maxPx = 1400, qualite = 0.8) {
  const bitmap = await createImageBitmap(file)
  const ratio = Math.min(1, maxPx / Math.max(bitmap.width, bitmap.height))
  const w = Math.round(bitmap.width * ratio)
  const h = Math.round(bitmap.height * ratio)
  const canvas = document.createElement('canvas')
  canvas.width = w; canvas.height = h
  canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h)
  return new Promise(res => canvas.toBlob(res, 'image/jpeg', qualite))
}

export default function Signaler({ camping, vacancier }) {
  useLangue()
  const navigate = useNavigate()
  const couleur = camping?.couleur_principale || '#639922'

  const [categorie, setCategorie] = useState('proprete')
  const [description, setDescription] = useState('')
  const [lieu, setLieu] = useState('')
  const [photo, setPhoto] = useState(null)      // Blob compressé
  const [apercu, setApercu] = useState(null)    // URL locale d'aperçu
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')
  const [envoye, setEnvoye] = useState(false)

  async function choisirPhoto(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setErreur('')
    try {
      const blob = await compresser(file)
      setPhoto(blob)
      setApercu(URL.createObjectURL(blob))
    } catch {
      setErreur(t('signaler.err_photo'))
    }
  }

  async function envoyer() {
    if (!description.trim() || envoi) return
    setEnvoi(true)
    setErreur('')

    let photo_url = null
    if (photo) {
      const chemin = `signalements/${camping.id}/${Date.now()}.jpg`
      const { error: upErr } = await supabase.storage
        .from('camping-assets').upload(chemin, photo, { contentType: 'image/jpeg', upsert: false })
      if (upErr) {
        // La photo est un bonus : on continue sans elle plutôt que de tout perdre
        console.error('Upload photo échoué :', upErr)
      } else {
        photo_url = supabase.storage.from('camping-assets').getPublicUrl(chemin).data.publicUrl
      }
    }

    const { error } = await supabase.from('signalements').insert({
      camping_id: camping.id,
      vacancier_id: vacancier.id,
      categorie,
      description: description.trim(),
      lieu: lieu.trim() || null,
      photo_url,
    })

    setEnvoi(false)
    if (error) {
      console.error('Signalement échoué :', error)
      setErreur(t('signaler.err_envoi'))
      return
    }
    setEnvoye(true)
  }

  if (envoye) return (
    <div style={{ padding: '60px 24px', textAlign: 'center', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
      <h1 style={{ fontSize: 21, fontWeight: 800, color: '#1a1a1a', marginBottom: 10 }}>
        {t('signaler.merci_titre')}
      </h1>
      <p style={{ fontSize: 14.5, color: '#6b7280', lineHeight: 1.7, marginBottom: 30 }}>
        {t('signaler.merci_texte')}
      </p>
      <button
        onClick={() => navigate('/')}
        style={{
          padding: '13px 28px', borderRadius: 14, border: 'none',
          background: couleur, color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer',
        }}
      >
        {t('signaler.retour')}
      </button>
    </div>
  )

  return (
    <div style={{ padding: '20px 16px 40px', maxWidth: 600, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', marginBottom: 4 }}>
        {t('signaler.titre')}
      </h1>
      <p style={{ fontSize: 13.5, color: '#6b7280', marginBottom: 22, lineHeight: 1.6 }}>
        {t('signaler.sous_titre')}
      </p>

      {/* Catégorie */}
      <label style={labelStyle}>{t('signaler.categorie')}</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        {CATEGORIES.map(c => (
          <button
            key={c.id}
            onClick={() => setCategorie(c.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '9px 14px', borderRadius: 22, cursor: 'pointer',
              fontSize: 13.5, fontWeight: 600,
              background: categorie === c.id ? `${couleur}18` : '#fff',
              border: categorie === c.id ? `2px solid ${couleur}` : '2px solid #e5e7eb',
              color: categorie === c.id ? couleur : '#374151',
            }}
          >
            <span style={{ fontSize: 16 }}>{c.emoji}</span>{t(`signaler.cat_${c.id}`)}
          </button>
        ))}
      </div>

      {/* Description */}
      <label style={labelStyle}>{t('signaler.description')} *</label>
      <textarea
        value={description}
        onChange={e => { setDescription(e.target.value); if (erreur) setErreur('') }}
        placeholder={t('signaler.description_ph')}
        rows={4}
        style={{ ...inputStyle, resize: 'vertical', marginBottom: 18, fontFamily: 'inherit' }}
      />

      {/* Lieu */}
      <label style={labelStyle}>{t('signaler.lieu')}</label>
      <input
        value={lieu}
        onChange={e => setLieu(e.target.value)}
        placeholder={t('signaler.lieu_ph')}
        style={{ ...inputStyle, marginBottom: 18 }}
      />

      {/* Photo */}
      <label style={labelStyle}>{t('signaler.photo')}</label>
      {apercu ? (
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <img src={apercu} alt="" style={{ width: '100%', borderRadius: 14, display: 'block', maxHeight: 260, objectFit: 'cover' }} />
          <button
            onClick={() => { setPhoto(null); setApercu(null) }}
            style={{
              position: 'absolute', top: 10, right: 10, width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', fontSize: 18, cursor: 'pointer',
            }}
          >×</button>
        </div>
      ) : (
        <label style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 6, padding: '26px', borderRadius: 14, marginBottom: 20,
          border: '2px dashed #d8d4ca', background: '#fdfcfa', cursor: 'pointer',
        }}>
          <span style={{ fontSize: 26 }}>📷</span>
          <span style={{ fontSize: 13.5, color: '#6b7280', fontWeight: 600 }}>{t('signaler.ajouter_photo')}</span>
          <input type="file" accept="image/*" capture="environment" onChange={choisirPhoto} style={{ display: 'none' }} />
        </label>
      )}

      {erreur && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 10, padding: '10px 12px', fontSize: 13, fontWeight: 600, marginBottom: 14 }}>
          ⚠️ {erreur}
        </div>
      )}

      <button
        onClick={envoyer}
        disabled={!description.trim() || envoi}
        style={{
          width: '100%', padding: '15px', borderRadius: 14, border: 'none',
          background: !description.trim() || envoi ? '#d1d5db' : couleur,
          color: '#fff', fontWeight: 700, fontSize: 15.5,
          cursor: !description.trim() || envoi ? 'default' : 'pointer',
        }}
      >
        {envoi ? t('signaler.envoi') : t('signaler.envoyer')}
      </button>
    </div>
  )
}

const labelStyle = { fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', marginBottom: 7 }
const inputStyle = { padding: '12px 14px', borderRadius: 12, border: '1.5px solid #e5e7eb', fontSize: 16, outline: 'none', width: '100%', background: '#fafafa', boxSizing: 'border-box' }
