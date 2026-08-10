import { useState } from 'react'
import Sheet from './Sheet'
import { toast } from '../toast'
import { bloquer, signalerContenu } from '../lib/moderation'
import { t } from '../i18n'
import { Texte, Pile, couleur, espace, graisse, rayon, texte as tailles } from '../design'

const MOTIFS = ['harcelement', 'haine', 'sexuel', 'arnaque', 'autre']

/**
 * Menu de modération d'un contenu publié par un autre vacancier.
 *
 * Signaler et bloquer sont deux gestes distincts, et c'est voulu : signaler
 * s'adresse au gérant et met du temps à produire un effet, bloquer agit tout
 * de suite et ne regarde que soi. Les confondre obligerait à dénoncer
 * quelqu'un pour avoir la paix.
 */
export default function MenuModeration({ cible, camping, vacancier, onClose, onBloque }) {
  const [etape, setEtape] = useState('menu')   // menu | motif
  const [envoi, setEnvoi] = useState(false)
  if (!cible) return null

  const pseudo = cible.pseudo || t('moderation.ce_vacancier')

  async function envoyerSignalement(motif) {
    if (envoi) return
    setEnvoi(true)
    const ok = await signalerContenu({
      campingId: camping.id,
      vacancierId: vacancier.id,
      cibleType: cible.type,
      cibleId: cible.id,
      texte: cible.texte,
      auteurId: cible.auteurId,
      motif: t(`moderation.motif_${motif}`),
    })
    setEnvoi(false)
    toast(ok ? t('moderation.signale') : t('moderation.err_signal'), ok ? 'succes' : 'erreur')
    onClose?.()
  }

  async function confirmerBlocage() {
    if (envoi) return
    setEnvoi(true)
    await bloquer(vacancier.id, cible.auteurId, {
      campingId: camping.id,
      cibleType: cible.type,
      cibleId: cible.id,
      texte: cible.texte,
    })
    setEnvoi(false)
    toast(t('moderation.bloque', { pseudo }), 'succes')
    onBloque?.(cible.auteurId)
    onClose?.()
  }

  return (
    <Sheet onClose={onClose}>
      <Pile espace="lg" style={{ padding: '4px 0 8px' }}>
        {etape === 'menu' ? (
          <>
            <Pile espace="xs">
              <Texte variante="sousTitre" as="h2">{pseudo}</Texte>
              <Texte variante="doux">{t('moderation.sous_titre')}</Texte>
            </Pile>
            <Pile espace="sm">
              <Action emoji="🚩" libelle={t('moderation.signaler')}
                      detail={t('moderation.signaler_detail')}
                      onClick={() => setEtape('motif')} />
              <Action emoji="🚫" libelle={t('moderation.bloquer', { pseudo })}
                      detail={t('moderation.bloquer_detail')}
                      danger onClick={confirmerBlocage} disabled={envoi} />
            </Pile>
          </>
        ) : (
          <>
            <Pile espace="xs">
              <Texte variante="sousTitre" as="h2">{t('moderation.motif_titre')}</Texte>
              <Texte variante="doux">{t('moderation.motif_sous_titre')}</Texte>
            </Pile>
            <Pile espace="sm">
              {MOTIFS.map(m => (
                <Action key={m} libelle={t(`moderation.motif_${m}`)}
                        onClick={() => envoyerSignalement(m)} disabled={envoi} />
              ))}
            </Pile>
          </>
        )}
      </Pile>
    </Sheet>
  )
}

function Action({ emoji, libelle, detail, onClick, danger, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{
        display: 'flex', alignItems: 'center', gap: espace.md, width: '100%',
        textAlign: 'left', padding: `14px ${espace.lg}px`,
        borderRadius: rayon.lg, background: couleur.surfaceDouce,
        border: `1px solid ${couleur.bordure}`,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.55 : 1,
        color: danger ? couleur.danger : couleur.texte,
      }}>
      {emoji && <span aria-hidden="true" style={{ fontSize: tailles.titre }}>{emoji}</span>}
      <span>
        <span style={{ display: 'block', fontWeight: graisse.fort, fontSize: tailles.moyen }}>{libelle}</span>
        {detail && (
          <Texte variante="doux" as="span" style={{ display: 'block', marginTop: 2 }}>{detail}</Texte>
        )}
      </span>
    </button>
  )
}
