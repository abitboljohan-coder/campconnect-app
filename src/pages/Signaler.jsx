import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { t, useLangue } from '../i18n'
import { Bouton, Carte, Champ, Texte, Pile, couleur as jetonsCouleur, espace, graisse, rayon, texte as jetonsTexte } from '../design'

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
    <Pile espace="lg" style={{ padding: '20px 16px 40px', maxWidth: 600, margin: '0 auto' }}>
      <Pile espace="xs">
        <Texte role="section">{t('signaler.titre')}</Texte>
        <Texte role="doux">{t('signaler.sous_titre')}</Texte>
      </Pile>

      {/* Catégorie */}
      <Pile espace="sm">
      <Texte role="libelle" as="span">{t('signaler.categorie')}</Texte>
      <Pile direction="ligne" espace="sm" retour>
        {CATEGORIES.map(c => (
          <button
            key={c.id}
            onClick={() => setCategorie(c.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: espace.xs,
              padding: `9px ${espace.lg}px`, borderRadius: rayon.rond, cursor: 'pointer',
              fontSize: jetonsTexte.petit, fontWeight: graisse.fort,
              background: categorie === c.id ? 'var(--cc-accent-voile)' : jetonsCouleur.surface,
              border: `2px solid ${categorie === c.id ? 'var(--cc-accent)' : jetonsCouleur.bordure}`,
              color: categorie === c.id ? 'var(--cc-accent)' : jetonsCouleur.texteMoyen,
            }}
          >
            <span style={{ fontSize: 16 }} aria-hidden="true">{c.emoji}</span>{t(`signaler.cat_${c.id}`)}
          </button>
        ))}
      </Pile>
      </Pile>

      <Champ
        multiligne
        libelle={`${t('signaler.description')} *`}
        value={description}
        onChange={e => { setDescription(e.target.value); if (erreur) setErreur('') }}
        placeholder={t('signaler.description_ph')}
      />

      <Champ
        libelle={t('signaler.lieu')}
        value={lieu}
        onChange={e => setLieu(e.target.value)}
        placeholder={t('signaler.lieu_ph')}
      />

      {/* Photo */}
      <Texte role="libelle" as="span">{t('signaler.photo')}</Texte>
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
        <Carte hauteur="posee" padding={12}
               role="alert"
               style={{ background: jetonsCouleur.dangerFond, border: '1px solid #fecaca' }}>
          <Texte role="doux" style={{ color: jetonsCouleur.danger, fontWeight: graisse.fort }}>
            ⚠️ {erreur}
          </Texte>
        </Carte>
      )}

      <Bouton taille="lg" pleineLargeur onClick={envoyer}
              charge={envoi} disabled={!description.trim()}>
        {envoi ? t('signaler.envoi') : t('signaler.envoyer')}
      </Bouton>
    </Pile>
  )
}

