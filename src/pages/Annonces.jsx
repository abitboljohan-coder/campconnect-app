import { useEffect, useState } from 'react'
import Sheet from '../components/Sheet'
import { supabase } from '../supabase'
import { t, useLangue, locale } from '../i18n'
import {
  Bouton, Carte, Champ, Texte, Pile, Puce, Badge, Squelette, Vide, Fab,
  couleur, espace, graisse, rayon, texte as tailles,
} from '../design'

// Le ton vient du système ; le type d'annonce ne choisit plus sa propre teinte.
const TYPES = [
  { id: 'annonce', emoji: '📣', ton: 'accent' },
  { id: 'trouve',  emoji: '🔎', ton: 'succes' },
  { id: 'perdu',   emoji: '❓', ton: 'alerte' },
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
    <Pile espace="lg" style={{ padding: `${espace.xl}px ${espace.lg}px 100px`, maxWidth: 600, margin: '0 auto' }}>
      <Pile espace="xs">
        <Texte variante="titre">{t('annonces.titre')}</Texte>
        <Texte variante="doux" style={{ lineHeight: 1.6 }}>{t('annonces.sous_titre')}</Texte>
      </Pile>

      {/* Filtres */}
      <div role="group" aria-label={t('annonces.titre')}
           style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: espace.xs }}>
        {[{ id: 'tous', emoji: '✨' }, ...TYPES].map(f => (
          <Puce key={f.id} taille="sm" actif={filtre === f.id}
                onClick={() => setFiltre(f.id)} style={{ flexShrink: 0 }}>
            <span aria-hidden="true">{f.emoji}</span>{t(`annonces.f_${f.id}`)}
          </Puce>
        ))}
      </div>

      {loading ? (
        <Squelette lignes={3} hauteur={84} libelle={t('commun.chargement')} />
      ) : indispo ? (
        <Vide emoji="📭" texte={t('annonces.indispo')} />
      ) : affichees.length === 0 ? (
        <Vide
          emoji="📣"
          texte={`${t('annonces.aucune')} ${t('annonces.premier')}`}
          action={<Bouton onClick={() => { setErreur(''); setModal(true) }}>{t('annonces.nouvelle')}</Bouton>}
        />
      ) : (
        <Pile espace="sm">
          {affichees.map(a => {
            const info = typeInfo(a.type)
            const mien = a.vacancier_id === vacancier.id
            return (
              <Carte key={a.id} hauteur="posee" padding={0} style={{ overflow: 'hidden' }}>
                {a.photo_url && (
                  <img src={a.photo_url} alt="" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', display: 'block' }} />
                )}
                <Pile espace="sm" style={{ padding: `13px ${espace.lg}px` }}>
                  <Pile direction="ligne" espace="sm" aligner="center">
                    <Badge ton={info.ton}>{info.emoji} {t(`annonces.type_${a.type}`)}</Badge>
                    <Texte variante="micro" as="span" style={{ marginLeft: 'auto' }}>
                      {new Date(a.created_at).toLocaleDateString(locale(), { day: 'numeric', month: 'short' })}
                    </Texte>
                  </Pile>

                  <div>
                    <Texte variante="sousTitre" style={{ fontSize: tailles.moyen }}>{a.titre}</Texte>
                    {a.description && (
                      <Texte variante="doux" style={{ marginTop: espace.xs, lineHeight: 1.6 }}>{a.description}</Texte>
                    )}
                  </div>

                  <Pile direction="ligne" espace="xs" aligner="center">
                    <span aria-hidden="true" style={{ fontSize: tailles.moyen }}>{a.vacanciers?.avatar_emoji || '🙂'}</span>
                    <Texte variante="doux" as="span">{a.vacanciers?.pseudo || '—'}</Texte>
                    {mien && (
                      <Bouton variante="discret" taille="sm" onClick={() => marquerResolu(a)}
                              style={{ marginLeft: 'auto', color: 'var(--cc-accent)' }}>
                        ✓ {t('annonces.marquer_resolu')}
                      </Bouton>
                    )}
                  </Pile>
                </Pile>
              </Carte>
            )
          })}
        </Pile>
      )}

      {!indispo && <Fab label={t('annonces.nouvelle')} onClick={() => { setErreur(''); setModal(true) }} />}

      {/* Publication */}
      {modal && (
        <Sheet onClose={() => setModal(false)}>
          <Pile espace="lg">
            <Texte variante="section" as="h2">{t('annonces.nouvelle')}</Texte>

            <Pile direction="ligne" espace="sm" role="group" aria-label={t('annonces.nouvelle')}>
              {TYPES.map(ty => (
                <Puce
                  key={ty.id}
                  actif={form.type === ty.id}
                  onClick={() => setForm(f => ({ ...f, type: ty.id }))}
                  style={{
                    flex: 1, flexDirection: 'column', gap: espace.xs,
                    padding: `11px ${espace.xs}px`, borderRadius: rayon.md,
                    fontSize: tailles.petit,
                  }}
                >
                  <span aria-hidden="true" style={{ fontSize: 19 }}>{ty.emoji}</span>
                  {t(`annonces.type_${ty.id}`)}
                </Puce>
              ))}
            </Pile>

            <Champ
              libelle={`${t('annonces.titre_champ')} *`}
              value={form.titre}
              onChange={e => setForm(f => ({ ...f, titre: e.target.value }))}
              placeholder={t('annonces.titre_ph')}
              autoFocus
            />

            <Champ
              multiligne
              libelle={t('annonces.description_champ')}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder={t('annonces.description_ph')}
            />

            {apercu ? (
              <div style={{ position: 'relative' }}>
                <img src={apercu} alt="" style={{ width: '100%', borderRadius: rayon.md, maxHeight: 200, objectFit: 'cover', display: 'block' }} />
                <button
                  onClick={() => { setPhoto(null); setApercu(null) }}
                  aria-label={t('signaler.retirer_photo')}
                  style={{
                    position: 'absolute', top: 8, right: 8, width: 30, height: 30,
                    borderRadius: rayon.rond, background: 'rgba(0,0,0,0.6)',
                    color: '#fff', border: 'none', fontSize: 17, cursor: 'pointer',
                  }}
                >×</button>
              </div>
            ) : (
              <label style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: espace.sm,
                padding: espace.lg, borderRadius: rayon.md,
                border: `2px dashed ${couleur.bordure}`, background: couleur.fondClair, cursor: 'pointer',
              }}>
                <Texte variante="doux" as="span" style={{ fontWeight: graisse.fort }}>
                  📷 {t('signaler.ajouter_photo')}
                </Texte>
                <input type="file" accept="image/*" onChange={choisirPhoto} style={{ display: 'none' }} />
              </label>
            )}

            {erreur && (
              <Carte hauteur="posee" padding={espace.md} role="alert"
                     style={{ background: couleur.dangerFond, border: '1px solid #fecaca' }}>
                <Texte variante="doux" style={{ color: couleur.danger, fontWeight: graisse.fort }}>⚠️ {erreur}</Texte>
              </Carte>
            )}

            <Pile direction="ligne" espace="sm">
              <Bouton variante="secondaire" taille="lg" style={{ flex: 1 }} onClick={() => setModal(false)}>
                {t('commun.annuler')}
              </Bouton>
              <Bouton taille="lg" style={{ flex: 2 }} charge={saving}
                      disabled={!form.titre.trim()} onClick={publier}>
                {saving ? t('annonces.publication') : t('annonces.publier')}
              </Bouton>
            </Pile>
          </Pile>
        </Sheet>
      )}
    </Pile>
  )
}
