import { useEffect, useState } from 'react'
import Sheet from '../components/Sheet'
import { supabase } from '../supabase'
import { t, useLangue, locale } from '../i18n'

const TYPES = [
  { id: 'annonce', emoji: '📣', couleur: '#639922' },
  { id: 'trouve',  emoji: '🔎', couleur: '#0ea5e9' },
  { id: 'perdu',   emoji: '❓', couleur: '#f59e0b' },
]
const typeInfo = (id) => TYPES.find(x => x.id === id) || TYPES[0]

async function compresser(file, maxPx = 1200, qualite = 0.8) {
  const bitmap = await createImageBitmap(file)
  const ratio = Math.min(1, maxPx / Math.max(bitmap.width, bitmap.height))
  const w = Math.round(bitmap.width * ratio), h = Math.round(bitmap.height * ratio)
  const canvas = document.createElement('canvas')
  canvas.width = w; canvas.height = h
  canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h)
  return new Promise(res => canvas.toBlob(res, 'image/jpeg', qualite))
}

export default function Annonces({ camping, vacancier }) {
  useLangue()
  const couleur = camping?.couleur_principale || '#639922'

  const [annonces, setAnnonces] = useState([])
  const [loading, setLoading]   = useState(true)
  const [filtre, setFiltre]     = useState('tous')
  const [modal, setModal]       = useState(false)
  const [form, setForm]         = useState({ type: 'annonce', titre: '', description: '' })
  const [photo, setPhoto]       = useState(null)
  const [apercu, setApercu]     = useState(null)
  const [saving, setSaving]     = useState(false)
  const [erreur, setErreur]     = useState('')
  const [indispo, setIndispo]   = useState(false)

  async function charger() {
    const { data, error } = await supabase
      .from('annonces')
      .select('*, vacanciers(pseudo, avatar_emoji)')
      .eq('camping_id', camping.id)
      .eq('resolu', false)
      .gt('expire_at', new Date().toISOString())
      .order('created_at', { ascending: false })
    // Ne pas afficher « aucune annonce » si le chargement a échoué : ce serait
    // mensonger (table absente, réseau coupé…).
    setIndispo(!!error)
    if (error) console.error('Chargement des annonces échoué :', error)
    setAnnonces(data || [])
    setLoading(false)
  }

  useEffect(() => {
    async function init() { await charger() }
    init()
  }, [camping.id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function choisirPhoto(e) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const blob = await compresser(file)
      setPhoto(blob); setApercu(URL.createObjectURL(blob))
    } catch { setErreur(t('signaler.err_photo')) }
  }

  async function publier() {
    if (!form.titre.trim() || saving) return
    setSaving(true); setErreur('')

    let photo_url = null
    if (photo) {
      const chemin = `annonces/${camping.id}/${Date.now()}.jpg`
      const { error: upErr } = await supabase.storage
        .from('camping-assets').upload(chemin, photo, { contentType: 'image/jpeg' })
      if (!upErr) photo_url = supabase.storage.from('camping-assets').getPublicUrl(chemin).data.publicUrl
      else console.error('Upload photo échoué :', upErr)
    }

    const { data, error } = await supabase.from('annonces').insert({
      camping_id: camping.id,
      vacancier_id: vacancier.id,
      type: form.type,
      titre: form.titre.trim(),
      description: form.description.trim() || null,
      photo_url,
    }).select('*, vacanciers(pseudo, avatar_emoji)').single()

    setSaving(false)
    if (error || !data) {
      console.error('Publication annonce échouée :', error)
      setErreur(t('annonces.err_publier'))
      return
    }
    setAnnonces(prev => [data, ...prev])
    setModal(false)
    setForm({ type: 'annonce', titre: '', description: '' })
    setPhoto(null); setApercu(null)
  }

  async function marquerResolu(a) {
    if (!confirm(t('annonces.confirm_resolu'))) return
    setAnnonces(prev => prev.filter(x => x.id !== a.id))
    const { error } = await supabase.from('annonces').update({ resolu: true }).eq('id', a.id)
    if (error) { console.error(error); charger() } // rollback : on recharge
  }

  const affichees = filtre === 'tous' ? annonces : annonces.filter(a => a.type === filtre)

  return (
    <div style={{ padding: '20px 16px 100px', maxWidth: 600, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', marginBottom: 4 }}>
        {t('annonces.titre')}
      </h1>
      <p style={{ fontSize: 13.5, color: '#6b7280', marginBottom: 18, lineHeight: 1.6 }}>
        {t('annonces.sous_titre')}
      </p>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 7, marginBottom: 18, overflowX: 'auto', paddingBottom: 4 }}>
        {[{ id: 'tous', emoji: '✨' }, ...TYPES].map(f => (
          <button
            key={f.id}
            onClick={() => setFiltre(f.id)}
            style={{
              flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5,
              padding: '7px 14px', borderRadius: 20, cursor: 'pointer',
              fontSize: 13, fontWeight: 600,
              background: filtre === f.id ? `${couleur}18` : '#fff',
              border: filtre === f.id ? `1.5px solid ${couleur}` : '1.5px solid #e5e7eb',
              color: filtre === f.id ? couleur : '#6b7280',
            }}
          >
            <span>{f.emoji}</span>{t(`annonces.f_${f.id}`)}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3].map(i => <div key={i} style={{ height: 84, borderRadius: 14, background: '#e8e4da', animation: 'pulse 1.5s ease-in-out infinite' }} />)}
        </div>
      ) : indispo ? (
        <div style={{ textAlign: 'center', padding: '44px 20px', color: '#9ca3af', fontSize: 14, background: '#fff', borderRadius: 16, lineHeight: 1.8 }}>
          {t('annonces.indispo')}
        </div>
      ) : affichees.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '44px 20px', color: '#9ca3af', fontSize: 14, background: '#fff', borderRadius: 16, lineHeight: 1.8 }}>
          {t('annonces.aucune')}<br />{t('annonces.premier')}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {affichees.map(a => {
            const info = typeInfo(a.type)
            const mien = a.vacancier_id === vacancier.id
            return (
              <div key={a.id} style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
                {a.photo_url && (
                  <img src={a.photo_url} alt="" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', display: 'block' }} />
                )}
                <div style={{ padding: '13px 15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                    <span style={{
                      fontSize: 10.5, fontWeight: 700, padding: '3px 9px', borderRadius: 12,
                      background: `${info.couleur}18`, color: info.couleur,
                    }}>
                      {info.emoji} {t(`annonces.type_${a.type}`)}
                    </span>
                    <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 'auto' }}>
                      {new Date(a.created_at).toLocaleDateString(locale(), { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <div style={{ fontSize: 15.5, fontWeight: 700, color: '#1a1a1a', marginBottom: 3 }}>{a.titre}</div>
                  {a.description && (
                    <div style={{ fontSize: 13.5, color: '#6b7280', lineHeight: 1.6, marginBottom: 8 }}>{a.description}</div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                    <span style={{ fontSize: 15 }}>{a.vacanciers?.avatar_emoji || '🙂'}</span>
                    <span style={{ fontSize: 12.5, color: '#9ca3af', fontWeight: 500 }}>
                      {a.vacanciers?.pseudo || '—'}
                    </span>
                    {mien && (
                      <button
                        onClick={() => marquerResolu(a)}
                        style={{
                          marginLeft: 'auto', fontSize: 12, fontWeight: 600, color: couleur,
                          background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px',
                        }}
                      >
                        ✓ {t('annonces.marquer_resolu')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* FAB */}
      {!indispo && (
      <button
        onClick={() => { setErreur(''); setModal(true) }}
        style={{
          position: 'fixed', bottom: 82, right: 20, width: 56, height: 56, borderRadius: '50%',
          background: couleur, color: '#fff', fontSize: 28, fontWeight: 300, border: 'none',
          boxShadow: `0 4px 16px ${couleur}66`, cursor: 'pointer', zIndex: 50,
        }}
      >+</button>
      )}

      {/* Modal publication */}
      {modal && (
        <Sheet onClose={() => setModal(false)}>
            <h2 style={{ fontSize: 19, marginBottom: 16, color: '#1a1a1a' }}>{t('annonces.nouvelle')}</h2>

            {/* Type */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {TYPES.map(ty => (
                <button
                  key={ty.id}
                  onClick={() => setForm(f => ({ ...f, type: ty.id }))}
                  style={{
                    flex: 1, padding: '11px 6px', borderRadius: 12, cursor: 'pointer',
                    fontSize: 12.5, fontWeight: 600, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: 4,
                    background: form.type === ty.id ? `${ty.couleur}15` : '#fafafa',
                    border: form.type === ty.id ? `2px solid ${ty.couleur}` : '2px solid #e5e7eb',
                    color: form.type === ty.id ? ty.couleur : '#6b7280',
                  }}
                >
                  <span style={{ fontSize: 19 }}>{ty.emoji}</span>{t(`annonces.type_${ty.id}`)}
                </button>
              ))}
            </div>

            <label style={labelStyle}>{t('annonces.titre_champ')} *</label>
            <input
              value={form.titre}
              onChange={e => setForm(f => ({ ...f, titre: e.target.value }))}
              placeholder={t('annonces.titre_ph')}
              style={{ ...inputStyle, marginBottom: 14 }}
              autoFocus
            />

            <label style={labelStyle}>{t('annonces.description_champ')}</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder={t('annonces.description_ph')}
              rows={3}
              style={{ ...inputStyle, marginBottom: 14, resize: 'vertical', fontFamily: 'inherit' }}
            />

            {/* Photo */}
            {apercu ? (
              <div style={{ position: 'relative', marginBottom: 16 }}>
                <img src={apercu} alt="" style={{ width: '100%', borderRadius: 12, maxHeight: 200, objectFit: 'cover', display: 'block' }} />
                <button
                  onClick={() => { setPhoto(null); setApercu(null) }}
                  style={{ position: 'absolute', top: 8, right: 8, width: 30, height: 30, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', fontSize: 17, cursor: 'pointer' }}
                >×</button>
              </div>
            ) : (
              <label style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '14px', borderRadius: 12, marginBottom: 16,
                border: '2px dashed #d8d4ca', background: '#fdfcfa', cursor: 'pointer',
                fontSize: 13.5, color: '#6b7280', fontWeight: 600,
              }}>
                📷 {t('signaler.ajouter_photo')}
                <input type="file" accept="image/*" onChange={choisirPhoto} style={{ display: 'none' }} />
              </label>
            )}

            {erreur && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 10, padding: '10px 12px', fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
                ⚠️ {erreur}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setModal(false)}
                style={{ flex: 1, padding: '13px', borderRadius: 12, background: '#f3f4f6', color: '#374151', fontWeight: 600, border: 'none', cursor: 'pointer' }}
              >{t('commun.annuler')}</button>
              <button
                onClick={publier}
                disabled={!form.titre.trim() || saving}
                style={{
                  flex: 2, padding: '13px', borderRadius: 12, border: 'none',
                  background: !form.titre.trim() || saving ? '#d1d5db' : couleur,
                  color: '#fff', fontWeight: 700, fontSize: 15,
                  cursor: !form.titre.trim() || saving ? 'default' : 'pointer',
                }}
              >{saving ? t('annonces.publication') : t('annonces.publier')}</button>
            </div>
        </Sheet>
      )}
    </div>
  )
}

const labelStyle = { fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', marginBottom: 6 }
const inputStyle = { padding: '12px 14px', borderRadius: 12, border: '1.5px solid #e5e7eb', fontSize: 16, outline: 'none', width: '100%', background: '#fafafa', boxSizing: 'border-box' }
