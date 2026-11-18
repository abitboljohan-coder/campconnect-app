import { useState } from 'react'
import { supabase } from '../supabase'
import { t } from '../i18n'
import { toast } from '../toast'
import { Bouton, Carte, Champ, Texte, Pile, couleur, espace, graisse } from '../design'
import {
  LONGUEUR_MAX_CAMPING, LONGUEUR_MAX_CONTACT,
  bandeauDejaVu, memoriserBandeau, preparerDemandeApercu,
} from '../lib/apercuDemo'

/**
 * Bandeau des campings de démo : un gérant curieux laisse le nom de son
 * camping et un moyen de le joindre. À ne rendre que si `estCampingDemo`.
 *
 * Une carte dans le fil de l'Accueil, pas un élément flottant : elle ne peut
 * masquer ni la navigation ni le contenu.
 */
export default function BandeauGerantDemo({ camping }) {
  // 'replie' | 'ouvert' | 'envoye' | 'cache'
  const [etat, setEtat] = useState(() => bandeauDejaVu() ? 'cache' : 'replie')
  const [nomCamping, setNomCamping] = useState('')
  const [contact, setContact] = useState('')
  const [piege, setPiege] = useState('')
  const [erreur, setErreur] = useState(null)
  const [envoi, setEnvoi] = useState(false)

  if (etat === 'cache') return null

  const fermer = () => {
    memoriserBandeau(etat === 'envoye' ? 'envoye' : 'ferme')
    setEtat('cache')
  }

  const envoyer = async (e) => {
    e.preventDefault()
    if (envoi) return
    const { ligne, erreur: refus } = preparerDemandeApercu({ nomCamping, contact, slug: camping?.slug })
    if (refus) { setErreur(refus); return }
    setErreur(null)
    // Champ piège : invisible, seul un robot le remplit. On le remercie sans
    // rien enregistrer.
    if (!piege) {
      setEnvoi(true)
      // Pas de .select() : la table n'est pas lisible depuis l'app.
      const { error } = await supabase.from('candidatures').insert(ligne)
      setEnvoi(false)
      if (error) { toast(t('commun.erreur'), 'erreur'); return }
    }
    memoriserBandeau('envoye')
    setEtat('envoye')
  }

  return (
    <Carte padding={espace.md} style={{ margin: `14px ${espace.lg}px 0` }}>
      <Pile direction="ligne" espace="sm" aligner="flex-start">
        <div style={{ flex: 1, minWidth: 0 }}>
          {etat === 'envoye' ? (
            <Texte role="status" style={{ color: couleur.succes, fontWeight: graisse.fort }}>
              {t('apercu.merci')}
            </Texte>
          ) : (
            <>
              <Texte style={{ color: couleur.texte, fontWeight: graisse.titre }}>{t('apercu.question')}</Texte>
              <Texte variante="doux">{t('apercu.promesse')}</Texte>
            </>
          )}
        </div>
        <button type="button" onClick={fermer} aria-label={t('commun.fermer')} style={{
          width: 40, height: 40, margin: '-8px -8px -8px 0', flexShrink: 0,
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 22, lineHeight: 1, color: couleur.texteDoux,
        }}>×</button>
      </Pile>

      {etat === 'replie' && (
        <Bouton variante="secondaire" taille="sm" onClick={() => setEtat('ouvert')}
                style={{ marginTop: espace.sm, color: 'var(--cc-accent)' }}>
          {t('apercu.ouvrir')}
        </Bouton>
      )}

      {etat === 'ouvert' && (
        <form onSubmit={envoyer} noValidate style={{ marginTop: espace.md }}>
          <Pile espace="md">
            <Champ
              libelle={t('apercu.camping')}
              value={nomCamping}
              onChange={e => { setNomCamping(e.target.value); setErreur(null) }}
              maxLength={LONGUEUR_MAX_CAMPING}
              autoComplete="organization"
              erreur={erreur === 'camping' ? t('apercu.err_camping') : undefined}
            />
            <Champ
              libelle={t('apercu.contact')}
              value={contact}
              onChange={e => { setContact(e.target.value); setErreur(null) }}
              maxLength={LONGUEUR_MAX_CONTACT}
              autoCapitalize="none"
              autoCorrect="off"
              erreur={erreur === 'contact' ? t('apercu.err_contact') : undefined}
            />
            {/* Champ piège anti-robot : hors écran, hors tabulation, ignoré
                des lecteurs d'écran. */}
            <input
              type="text" name="site_web" value={piege} onChange={e => setPiege(e.target.value)}
              tabIndex={-1} autoComplete="off" aria-hidden="true"
              style={{ position: 'absolute', left: -9999, width: 1, height: 1, opacity: 0 }}
            />
            <Bouton type="submit" pleineLargeur charge={envoi}>{t('apercu.envoyer')}</Bouton>
          </Pile>
        </form>
      )}
    </Carte>
  )
}
