import { useState } from 'react'
import { supabase } from '../../supabase'
import QRCodeGenerator from '../components/QRCodeGenerator'
import { Bloc, Alerte, EnTete } from '../components/Bloc'
import { Bouton, Texte, Pile, couleur as jetons, espace, graisse, rayon } from '../../design'

export default function Parametres({ gerant, camping, session }) {
  const [email, setEmail]       = useState(session?.user?.email || '')
  const [newPwd, setNewPwd]     = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [campingNom, setCampingNom] = useState(camping?.nom || '')
  const [savingEmail, setSavingEmail]   = useState(false)
  const [savingPwd, setSavingPwd]       = useState(false)
  const [savingCamping, setSavingCamping] = useState(false)
  const [success, setSuccess]   = useState('')
  const [error, setError]       = useState('')
  const [resetting, setResetting] = useState(false)

  function flash(type, msg) {
    if (type === 'success') { setSuccess(msg); setError('') }
    else { setError(msg); setSuccess('') }
    setTimeout(() => { setSuccess(''); setError('') }, 4000)
  }

  async function updateEmail(e) {
    e.preventDefault()
    setSavingEmail(true)
    const { error: err } = await supabase.auth.updateUser({ email })
    if (err) flash('error', err.message)
    else flash('success', 'Email mis à jour. Vérifiez votre boîte mail.')
    setSavingEmail(false)
  }

  async function updatePassword(e) {
    e.preventDefault()
    if (newPwd !== confirmPwd) { flash('error', 'Les mots de passe ne correspondent pas.'); return }
    if (newPwd.length < 6) { flash('error', 'Mot de passe trop court (6 caractères minimum).'); return }
    setSavingPwd(true)
    const { error: err } = await supabase.auth.updateUser({ password: newPwd })
    if (err) flash('error', err.message)
    else { flash('success', 'Mot de passe modifié.'); setNewPwd(''); setConfirmPwd('') }
    setSavingPwd(false)
  }

  async function updateCamping(e) {
    e.preventDefault()
    setSavingCamping(true)
    const { error: err } = await supabase.from('campings').update({ nom: campingNom.trim() }).eq('id', camping.id)
    if (err) flash('error', err.message)
    else flash('success', 'Camping mis à jour.')
    setSavingCamping(false)
  }

  async function resetDonnees() {
    const confirmText = `Êtes-vous sûr de vouloir supprimer TOUTES les données de la saison ?\n\nCela supprimera :\n• Tous les vacanciers\n• Tous les groupes et messages\n• Toutes les inscriptions\n\nCette action est irréversible. Tapez "CONFIRMER" pour continuer.`
    const input = prompt(confirmText)
    if (input !== 'CONFIRMER') { alert('Opération annulée.'); return }

    setResetting(true)
    try {
      // Récupérer IDs des groupes et animations pour ce camping
      const [{ data: groupes }, { data: anims }] = await Promise.all([
        supabase.from('groupes').select('id').eq('camping_id', camping.id),
        supabase.from('animations').select('id').eq('camping_id', camping.id),
      ])
      const groupeIds = (groupes || []).map(g => g.id)
      const animIds   = (anims || []).map(a => a.id)

      const ops = []
      if (groupeIds.length > 0) {
        ops.push(supabase.from('messages').delete().in('groupe_id', groupeIds))
        ops.push(supabase.from('membres_groupes').delete().in('groupe_id', groupeIds))
      }
      if (animIds.length > 0) {
        ops.push(supabase.from('inscriptions').delete().in('animation_id', animIds))
      }
      await Promise.all(ops)

      if (groupeIds.length > 0) {
        await supabase.from('groupes').delete().eq('camping_id', camping.id)
      }
      await supabase.from('vacanciers').delete().eq('camping_id', camping.id)

      flash('success', 'Toutes les données ont été réinitialisées.')
    } catch (err) {
      flash('error', `Erreur: ${err.message}`)
    }
    setResetting(false)
  }

  const appUrl = `${window.location.origin}?camping=${camping?.slug || 'demo'}`

  return (
    <Pile espace="xl">
      <EnTete titre="Paramètres" />

      {success && <Alerte type="succes">{success}</Alerte>}
      {error   && <Alerte type="erreur">{error}</Alerte>}

        {/* Email */}
        <Bloc titre="Adresse email">
          <form onSubmit={updateEmail} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              style={inputStyle}
            />
            <button type="submit" disabled={savingEmail} style={btnStyle(savingEmail)}>
              {savingEmail ? 'Mise à jour...' : 'Modifier l\'email'}
            </button>
          </form>
        </Bloc>

        {/* Mot de passe */}
        <Bloc titre="Mot de passe">
          <form onSubmit={updatePassword} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              type="password" value={newPwd}
              onChange={e => setNewPwd(e.target.value)}
              placeholder="Nouveau mot de passe"
              style={inputStyle}
            />
            <input
              type="password" value={confirmPwd}
              onChange={e => setConfirmPwd(e.target.value)}
              placeholder="Confirmer le mot de passe"
              style={inputStyle}
            />
            <button type="submit" disabled={savingPwd} style={btnStyle(savingPwd)}>
              {savingPwd ? 'Modification...' : 'Changer le mot de passe'}
            </button>
          </form>
        </Bloc>

        {/* Infos camping */}
        <Bloc titre="Informations du camping">
          <form onSubmit={updateCamping} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={labelStyle}>NOM DU CAMPING</label>
              <input
                type="text" value={campingNom}
                onChange={e => setCampingNom(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>SLUG (identifiant URL)</label>
              <input type="text" value={camping?.slug || ''} disabled style={{ ...inputStyle, background: jetons.surfaceDouce, color: jetons.texteDoux }} />
              <div style={{ fontSize: 12, color: jetons.texteDoux, marginTop: 4 }}>Le slug ne peut pas être modifié.</div>
            </div>
            <button type="submit" disabled={savingCamping} style={btnStyle(savingCamping)}>
              {savingCamping ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </form>
        </Bloc>

        {/* QR Code */}
        <Bloc titre="QR Code de l'application">
          <p style={{ fontSize: 14, color: jetons.texteDoux, marginBottom: 16 }}>
            Partagez ce QR code avec vos vacanciers pour qu'ils accèdent à l'application.
          </p>
          <QRCodeGenerator url={appUrl} campingNom={camping?.nom} />
        </Bloc>

        {/* Export CSV */}
        <Bloc titre="Export des données">
          <p style={{ fontSize: 14, color: jetons.texteDoux, marginBottom: 16 }}>
            Téléchargez la liste de vos vacanciers au format CSV (Excel).
          </p>
          <button
            onClick={async () => {
              const { data } = await supabase.from('vacanciers')
                .select('pseudo, emplacement, tranche_age, avec, created_at')
                .eq('camping_id', camping.id).order('created_at')
              const rows = data || []
              const header = 'Pseudo;Emplacement;Tranche d\'age;Avec;Inscrit le'
              const lines = rows.map(v => [
                v.pseudo, v.emplacement || '', v.tranche_age || '', v.avec || '',
                new Date(v.created_at).toLocaleDateString('fr-FR'),
              ].map(x => `"${String(x).replace(/"/g, '""')}"`).join(';'))
              const csv = '﻿' + [header, ...lines].join('\r\n')
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
              const a = document.createElement('a')
              a.href = URL.createObjectURL(blob)
              a.download = `vacanciers-${camping.slug}-${new Date().toISOString().slice(0, 10)}.csv`
              a.click()
              URL.revokeObjectURL(a.href)
            }}
            style={{
              background: jetons.marque, color: '#fff', padding: '11px 20px',
              borderRadius: 10, border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}
          >
            📥 Exporter les vacanciers (CSV)
          </button>
        </Bloc>

      {/* Zone danger */}
      <Bloc style={{ background: jetons.dangerFond, border: '1.5px solid #fecaca' }}>
        <Texte variante="sousTitre" as="h2" style={{ fontSize: 16, color: jetons.danger }}>
          ⚠️ Zone de danger
        </Texte>
        <Texte variante="corps">
          Supprime tous les vacanciers, groupes, messages et inscriptions de cette saison. Les animations et la configuration du camping sont conservées.
        </Texte>
        <Bouton
          taille="lg" charge={resetting} onClick={resetDonnees}
          style={{ alignSelf: 'flex-start', background: jetons.danger, color: '#fff' }}
        >
          {resetting ? 'Réinitialisation…' : 'Réinitialiser les données de la saison'}
        </Bouton>
      </Bloc>
    </Pile>
  )
}



const labelStyle = {
  fontSize: 11, fontWeight: graisse.titre, color: jetons.texteDoux,
  textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', marginBottom: espace.xs,
}
const inputStyle = {
  width: '100%', padding: `11px 13px`, borderRadius: rayon.md,
  border: `1.5px solid ${jetons.bordure}`, fontSize: 16, outline: 'none',
  background: jetons.fondClair, boxSizing: 'border-box',
}
const btnStyle = (disabled) => ({
  padding: '12px', borderRadius: 10,
  background: disabled ? '#9ca3af' : jetons.marque,
  color: '#fff', fontWeight: 600, fontSize: 14,
  alignSelf: 'flex-start',
})
