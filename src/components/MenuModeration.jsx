import { useState } from 'react'
import Sheet from './Sheet'
import { toast } from '../toast'
import { bloquer, signalerContenu } from '../lib/moderation'
import { t } from '../i18n'

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
    await bloquer(vacancier.id, cible.auteurId)
    setEnvoi(false)
    toast(t('moderation.bloque', { pseudo }), 'succes')
    onBloque?.(cible.auteurId)
    onClose?.()
  }

  return (
    <Sheet onClose={onClose}>
      <div style={{ padding: '4px 20px 8px' }}>
        {etape === 'menu' ? (
          <>
            <h3 style={{ fontSize: 17, marginBottom: 4 }}>{pseudo}</h3>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 18 }}>
              {t('moderation.sous_titre')}
            </p>
            <Action emoji="🚩" libelle={t('moderation.signaler')}
                    detail={t('moderation.signaler_detail')}
                    onClick={() => setEtape('motif')} />
            <Action emoji="🚫" libelle={t('moderation.bloquer', { pseudo })}
                    detail={t('moderation.bloquer_detail')}
                    danger onClick={confirmerBlocage} disabled={envoi} />
          </>
        ) : (
          <>
            <h3 style={{ fontSize: 17, marginBottom: 4 }}>{t('moderation.motif_titre')}</h3>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 18 }}>
              {t('moderation.motif_sous_titre')}
            </p>
            {MOTIFS.map(m => (
              <Action key={m} libelle={t(`moderation.motif_${m}`)}
                      onClick={() => envoyerSignalement(m)} disabled={envoi} />
            ))}
          </>
        )}
      </div>
    </Sheet>
  )
}

function Action({ emoji, libelle, detail, onClick, danger, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, width: '100%',
        textAlign: 'left', padding: '14px 16px', marginBottom: 8,
        borderRadius: 14, background: '#f9fafb',
        border: '1px solid #eceae4',
        opacity: disabled ? 0.55 : 1,
        color: danger ? '#b91c1c' : '#1a1a1a',
      }}>
      {emoji && <span style={{ fontSize: 20 }}>{emoji}</span>}
      <span>
        <span style={{ display: 'block', fontWeight: 600, fontSize: 15 }}>{libelle}</span>
        {detail && (
          <span style={{ display: 'block', fontSize: 12.5, color: '#6b7280', marginTop: 2 }}>
            {detail}
          </span>
        )}
      </span>
    </button>
  )
}
