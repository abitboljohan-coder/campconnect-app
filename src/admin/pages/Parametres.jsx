import { useEffect, useState } from 'react'
import { supabase } from '../../supabase'
import { lireVacanciersDuCamping } from '../../lib/vacanciers'
import QRCodeGenerator from '../components/QRCodeGenerator'
import { lienRejoindre, MESSAGE_ORDINATEUR } from '../lib/liens'
import { lireAccesCamping, changerCleAcces } from '../lib/accesCamping'
import { versCsv } from '../lib/csv'
import { traduireErreur } from '../lib/erreurs'
import { Bloc, EnTete } from '../components/Bloc'
import { toast } from '../../toast'
import { isNative } from '../../native'
import { libelleAvecFr } from '../../lib/profil'
import { Bouton, Texte, Pile, couleur as jetons, espace, graisse, rayon } from '../../design'

export default function Parametres({ camping, session, setCamping }) {
  const [email, setEmail]       = useState(session?.user?.email || '')
  const [newPwd, setNewPwd]     = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [campingNom, setCampingNom] = useState(camping?.nom || '')
  const [savingEmail, setSavingEmail]   = useState(false)
  const [savingPwd, setSavingPwd]       = useState(false)
  const [savingCamping, setSavingCamping] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [cleQR, setCleQR] = useState(null)
  const [cleIndispo, setCleIndispo] = useState(false)
  const [changementCle, setChangementCle] = useState(false)

  // Clé du QR code, lue par une fonction réservée au gérant (acces_camping).
  useEffect(() => {
    if (!camping?.id) return
    let actif = true
    lireAccesCamping(camping.id).then(({ data }) => {
      if (!actif) return
      setCleQR(data?.cle || null)
      setCleIndispo(!data?.cle)
    })
    return () => { actif = false }
  }, [camping?.id])

  // toast() plutôt qu'une alerte en tête de page : le gérant appuie sur un
  // bouton en bas d'écran, le message apparaissait 400 px plus haut, hors de vue.
  function flash(type, msg) {
    toast(msg, type === 'success' ? 'succes' : 'erreur')
  }

  async function updateEmail(e) {
    e.preventDefault()
    setSavingEmail(true)
    const { error: err } = await supabase.auth.updateUser({ email })
    if (err) flash('error', traduireErreur(err))
    else flash('success', 'Email mis à jour. Vérifiez votre boîte mail.')
    setSavingEmail(false)
  }

  async function updatePassword(e) {
    e.preventDefault()
    if (newPwd !== confirmPwd) { flash('error', 'Les mots de passe ne correspondent pas.'); return }
    // Même exigence qu'à la création du compte : 6 ici, 8 là-bas.
    if (newPwd.length < 8) { flash('error', 'Mot de passe trop court (8 caractères minimum).'); return }
    setSavingPwd(true)
    const { error: err } = await supabase.auth.updateUser({ password: newPwd })
    if (err) flash('error', traduireErreur(err))
    else { flash('success', 'Mot de passe modifié.'); setNewPwd(''); setConfirmPwd('') }
    setSavingPwd(false)
  }

  async function updateCamping(e) {
    e.preventDefault()
    setSavingCamping(true)
    if (!campingNom.trim()) { flash('error', 'Le nom du camping ne peut pas être vide.'); setSavingCamping(false); return }
    const { error: err } = await supabase.from('campings').update({ nom: campingNom.trim() }).eq('id', camping.id)
    if (err) flash('error', traduireErreur(err))
    else {
      // Le nouveau nom s'affiche tout de suite dans l'en-tête, pas au prochain rechargement.
      setCamping?.(c => ({ ...c, nom: campingNom.trim() }))
      flash('success', 'Camping mis à jour.')
    }
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
      flash('error', traduireErreur(err))
    }
    setResetting(false)
  }

  async function exporterCsv() {
    setExporting(true)
    // Emplacement et tranche d'âge : par vacanciers_du_camping, réservée aux
    // gérants (la table ne les livrera plus directement).
    const { data, error: err } = await lireVacanciersDuCamping(camping.id)
    setExporting(false)
    if (err) { flash('error', traduireErreur(err)); return }
    const rows = [...data].sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)))
    // versCsv neutralise les formules : les pseudos sont saisis par des
    // vacanciers anonymes, et « =LIEN_HYPERTEXTE(…) » s'exécutait dans Excel.
    const csv = versCsv(
      ['Pseudo', 'Emplacement', "Tranche d'âge", 'Avec', 'Inscrit le'],
      rows.map(v => [
        v.pseudo, v.emplacement || '', v.tranche_age || '', libelleAvecFr(v.avec),
        new Date(v.created_at).toLocaleDateString('fr-FR'),
      ]),
    )
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `vacanciers-${camping.slug}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
    flash('success', `${rows.length} vacancier${rows.length > 1 ? 's' : ''} exporté${rows.length > 1 ? 's' : ''}.`)
  }

  // Adresse publique (sans clé) pour l'affichage ; le QR code, lui, porte la
  // clé secrète du camping, qui seule vaut preuve de présence.
  const appUrl = lienRejoindre(camping?.slug)
  const qrUrl = cleQR ? lienRejoindre(camping?.slug, cleQR) : null

  async function changerCle() {
    const ok = window.confirm(
      'Changer la clé du QR code ?\n\nLes QR codes déjà imprimés ne marcheront plus : il faudra imprimer et afficher le nouveau. Le code du jour change aussi.'
    )
    if (!ok) return
    setChangementCle(true)
    const { data, error: err } = await changerCleAcces(camping.id)
    setChangementCle(false)
    if (err || !data) { flash('error', traduireErreur(err)); return }
    setCleQR(data)
    flash('success', 'Nouvelle clé : imprimez et affichez le nouveau QR code.')
  }

  return (
    <Pile espace="xl">
      <EnTete titre="Paramètres" />

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
              <label style={labelStyle}>Adresse de votre camping dans l'app</label>
              <input type="text" value={appUrl.replace('https://', '')} disabled aria-label="Adresse de votre camping dans l'app" style={{ ...inputStyle, background: jetons.surfaceDouce, color: jetons.texteDoux }} />
              <div style={{ fontSize: 12, color: jetons.texteDoux, marginTop: 4 }}>Cette adresse ne peut pas être modifiée : c'est celle de votre QR code.</div>
            </div>
            <button type="submit" disabled={savingCamping} style={btnStyle(savingCamping)}>
              {savingCamping ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </form>
        </Bloc>

        {/* QR Code */}
        {/* id : l'accueil gérant renvoie ici par /admin/parametres#qr. */}
        <Bloc id="qr" titre="QR Code de l'application">
          <p style={{ fontSize: 14, color: jetons.texteDoux, marginBottom: 16 }}>
            Affichez ce QR code à la réception : en le scannant, vos vacanciers entrent directement dans votre camping, sans code.
          </p>
          {qrUrl
            ? <QRCodeGenerator url={qrUrl} campingNom={camping?.nom} />
            : <p style={{ fontSize: 14, color: cleIndispo ? jetons.danger : jetons.texteDoux, margin: 0 }}>
                {cleIndispo ? 'QR code indisponible : vérifiez la connexion et rechargez la page.' : 'Chargement du QR code…'}
              </p>}
          {/* Un QR photographié et partagé hors du camping ouvre la porte à
              distance : changer la clé le rend inutilisable. */}
          <div style={{ marginTop: 18, paddingTop: 16, borderTop: `1px solid ${jetons.bordure}` }}>
            <p style={{ fontSize: 13, color: jetons.texteDoux, margin: '0 0 10px' }}>
              Votre QR code circule hors du camping ? Changez sa clé : les QR codes déjà imprimés ne marcheront plus.
            </p>
            <Bouton variante="secondaire" taille="sm" charge={changementCle} disabled={!cleQR}
                    onClick={changerCle} style={{ minHeight: 44 }}>
              Changer la clé du QR code
            </Bouton>
          </div>
        </Bloc>

        {/* Export CSV */}
        <Bloc titre="Export des données">
          <p style={{ fontSize: 14, color: jetons.texteDoux, marginBottom: 16 }}>
            Téléchargez la liste de vos vacanciers au format CSV (Excel).
          </p>
          {/* Dans l'app iPhone et Android, un lien de téléchargement ne fait rien. */}
          {isNative ? (
            <p style={{ fontSize: 14, color: jetons.texteMoyen, margin: 0 }}>{MESSAGE_ORDINATEUR}</p>
          ) : (
            <button onClick={exporterCsv} disabled={exporting} style={btnStyle(exporting)}>
              {exporting ? 'Export…' : '📥 Exporter les vacanciers (CSV)'}
            </button>
          )}
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
  // 44 px : taille minimale d'une cible tactile confortable.
  minHeight: 44, padding: '12px 18px', borderRadius: 10,
  background: disabled ? '#9ca3af' : jetons.marque,
  color: '#fff', fontWeight: 600, fontSize: 14,
  alignSelf: 'flex-start',
})
