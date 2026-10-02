import { useState } from 'react'
import { supabase } from '../../supabase'
import ColorPicker from '../components/ColorPicker'
import { Bloc, EnTete } from '../components/Bloc'
import { traduireErreur } from '../lib/erreurs'
import { toast } from '../../toast'
import { Bouton, Champ, Texte, Pile, couleur as jetons, espace, graisse, rayon } from '../../design'

function compressImage(file, maxWidth = 800, quality = 0.75) {
  // Un PNG ou un SVG détouré devenait un JPEG, qui n'a pas de transparence :
  // le logo apparaissait sur un carré noir. On garde du PNG pour ces formats,
  // limité à 512 px de côté pour que le poids reste raisonnable.
  const transparent = file.type === 'image/png' || file.type === 'image/svg+xml'
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      if (transparent) {
        const echelle = Math.min(1, 512 / Math.max(width, height))
        width = Math.round(width * echelle); height = Math.round(height * echelle)
      } else if (width > maxWidth) { height = Math.round((height / width) * maxWidth); width = maxWidth }
      const canvas = document.createElement('canvas')
      canvas.width = width; canvas.height = height
      canvas.getContext('2d').drawImage(img, 0, 0, width, height)
      resolve(transparent ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = reject
    img.src = url
  })
}

export default function Apparence({ camping, setCamping }) {
  const [nom, setNom]           = useState(camping?.nom || '')
  const [couleur1, setCouleur1] = useState(camping?.couleur_principale || jetons.marque)
  const [couleur2, setCouleur2] = useState(camping?.couleur_secondaire || jetons.marqueSombre)
  const [saving, setSaving]     = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [logoPreview, setLogoPreview] = useState(camping?.logo_url || null)

  // toast() : l'alerte en tête de page n'était pas visible depuis le bouton
  // « Enregistrer », en bas de l'écran.
  function flash(type, msg) {
    toast(msg, type === 'success' ? 'succes' : 'erreur')
  }

  async function handleImageUpload(file, field, maxMB, setUploading, setPreview) {
    if (!file) return
    if (file.size > maxMB * 1024 * 1024) { flash('error', `Fichier trop lourd (${maxMB} Mo maximum).`); return }
    setUploading(true)
    try {
      const dataUrl = await compressImage(file)
      const sizeKB  = Math.round(dataUrl.length * 0.75 / 1024)
      if (sizeKB > 900) { flash('error', `Image trop lourde (${sizeKB} Ko). Réduisez sa taille.`); setUploading(false); return }
      const { error: dbErr } = await supabase.from('campings').update({ [field]: dataUrl }).eq('id', camping.id)
      if (dbErr) { flash('error', traduireErreur(dbErr)) }
      else {
        setPreview(dataUrl)
        setCamping(c => ({ ...c, [field]: dataUrl }))
        flash('success', 'Logo enregistré.')
      }
    } catch { flash('error', "Cette image n'a pas pu être lue. Essayez un fichier PNG ou JPG.") }
    setUploading(false)
  }

  async function retirerLogo() {
    if (!confirm('Retirer le logo ? Vos vacanciers ne le verront plus.')) return
    setUploadingLogo(true)
    const { error: dbErr } = await supabase.from('campings').update({ logo_url: null }).eq('id', camping.id)
    setUploadingLogo(false)
    if (dbErr) { flash('error', traduireErreur(dbErr)); return }
    setLogoPreview(null)
    setCamping(c => ({ ...c, logo_url: null }))
    flash('success', 'Logo retiré.')
  }

  async function sauvegarder() {
    // Même contrôle que dans Paramètres : un nom vide effaçait le camping de
    // l'app et de la recherche des vacanciers.
    if (!nom.trim()) { flash('error', 'Le nom du camping ne peut pas être vide.'); return }
    setSaving(true)
    const { error: dbErr } = await supabase.from('campings').update({
      nom: nom.trim(),
      couleur_principale: couleur1,
      couleur_secondaire: couleur2,
    }).eq('id', camping.id)

    if (dbErr) { flash('error', traduireErreur(dbErr)) }
    else {
      setCamping(c => ({ ...c, nom: nom.trim(), couleur_principale: couleur1, couleur_secondaire: couleur2 }))
      flash('success', 'Modifications enregistrées !')
    }
    setSaving(false)
  }

  return (
    <Pile espace="xl">
      <EnTete titre="Apparence" sous="Nom, couleurs et logo de votre camping dans l'app." />

      <Bloc titre="Nom du camping">
        <Champ libelle="Nom" value={nom} onChange={e => setNom(e.target.value)}
               placeholder="ex : Camping Les Pins" />
      </Bloc>

      <Bloc titre="Couleurs">
        <ColorPicker label="Couleur principale (boutons, accents)" value={couleur1} onChange={setCouleur1} />
        <ColorPicker label="Couleur secondaire (bandeau du haut)" value={couleur2} onChange={setCouleur2} />

        <Pile espace="sm">
          <Texte variante="libelle" as="span">Aperçu de l’app</Texte>
          <div style={{
            borderRadius: rayon.lg, overflow: 'hidden',
            border: `1px solid ${jetons.bordure}`, width: 220,
            boxShadow: '0 4px 16px rgba(26, 26, 26, 0.12)',
          }}>
            <div style={{ background: couleur2, padding: `${espace.md}px 14px`, display: 'flex', alignItems: 'center', gap: espace.sm }}>
              <span aria-hidden="true" style={{
                width: 28, height: 28, borderRadius: rayon.rond,
                background: `${couleur1}40`, border: `2px solid ${couleur1}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
              }}>🏕️</span>
              <span style={{ color: '#fff', fontWeight: graisse.titre, fontSize: 13 }}>{nom || camping?.nom}</span>
            </div>
            <div style={{ background: jetons.fond, padding: `10px ${espace.md}px`, display: 'flex', flexDirection: 'column', gap: espace.xs }}>
              <div style={{ background: jetons.surface, borderRadius: rayon.sm, padding: '8px 10px', borderLeft: `3px solid ${couleur1}` }}>
                <div style={{ fontSize: 11, fontWeight: graisse.fort, color: jetons.texteMoyen }}>🏊 Cours de natation</div>
                <div style={{ fontSize: 10, color: jetons.texteDoux, marginTop: 2 }}>14:00 · Piscine</div>
              </div>
              <div style={{ background: couleur1, borderRadius: rayon.sm, padding: '8px 10px', textAlign: 'center' }}>
                <span style={{ fontSize: 11, color: '#fff', fontWeight: graisse.fort }}>+ Créer un groupe</span>
              </div>
            </div>
            <div style={{ background: jetons.surface, borderTop: `1px solid ${jetons.bordure}`, display: 'flex', justifyContent: 'space-around', padding: '6px 0' }}>
              {['🏠','👥','🗺️','📅','👤'].map((ic, i) => (
                <div key={i} aria-hidden="true" style={{ textAlign: 'center', fontSize: 14, opacity: i === 0 ? 1 : 0.4 }}>
                  <div>{ic}</div>
                  {i === 0 && <div style={{ width: 12, height: 2, background: couleur1, borderRadius: 1, margin: '2px auto 0' }} />}
                </div>
              ))}
            </div>
          </div>
        </Pile>
      </Bloc>

      <Bloc titre="Logo du camping">
        <Pile direction="ligne" espace="xl" aligner="flex-start" retour>
          {logoPreview && (
            <img src={logoPreview} alt="Logo du camping" style={{
              width: 80, height: 80, objectFit: 'contain',
              borderRadius: rayon.md, border: `1px solid ${jetons.bordure}`, background: jetons.fond,
            }} />
          )}
          {/* minWidth 0 + largeur bornée : le champ fichier impose sinon sa
              largeur native et sortait de l'écran d'un petit téléphone. */}
          <Pile espace="sm" style={{ flex: 1, minWidth: 0 }}>
            <Texte variante="libelle" as="span">Fichier (PNG/JPG/SVG, max 2 Mo)</Texte>
            <input
              type="file" accept="image/png,image/jpeg,image/svg+xml"
              aria-label="Logo du camping"
              onChange={e => handleImageUpload(e.target.files[0], 'logo_url', 2, setUploadingLogo, setLogoPreview)}
              style={{ display: 'block', width: '100%', maxWidth: '100%', fontSize: 14, color: jetons.texteMoyen }}
            />
            {uploadingLogo && <UploadProgress label="Enregistrement…" />}
            {logoPreview && !uploadingLogo && (
              <Bouton variante="secondaire" onClick={retirerLogo} style={{ alignSelf: 'flex-start' }}>
                Retirer le logo
              </Bouton>
            )}
          </Pile>
        </Pile>
      </Bloc>

      <Bouton taille="lg" charge={saving} onClick={sauvegarder}>
        {saving ? 'Enregistrement…' : 'Enregistrer les modifications'}
      </Bouton>
    </Pile>
  )
}

function UploadProgress({ label }) {
  return (
    <div role="status" style={{
      display: 'flex', alignItems: 'center', gap: espace.sm,
      padding: `${espace.sm}px ${espace.md}px`, background: '#f0fdf4',
      borderRadius: rayon.sm, border: '1px solid #bbf7d0',
    }}>
      <span aria-hidden="true" style={{
        width: 16, height: 16, border: `2px solid ${jetons.marque}`,
        borderTopColor: 'transparent', borderRadius: rayon.rond,
        animation: 'spin 0.8s linear infinite', flexShrink: 0,
      }} />
      <Texte variante="corps" as="span" style={{ color: jetons.succes }}>{label}</Texte>
    </div>
  )
}
