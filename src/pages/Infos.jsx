import { useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { t, useLangue } from '../i18n'
import { decouperTelephones, infosPubliables, NUMEROS_URGENCE } from '../lib/infos'
import { Texte, Pile, Vide, couleur, espace, graisse, rayon, texte as tailles } from '../design'

export default function Infos({ camping }) {
  useLangue()
  // Plus de rubriques de repli : un vacancier tapait le faux code Wi-Fi et
  // lisait un faux numéro de réception. Sans livret, on le dit honnêtement.
  const infos = infosPubliables(camping?.infos)
  const [ouvert, setOuvert] = useState(null)
  const prefixe = useId()

  return (
    <Pile espace="xl" style={{ padding: `${espace.lg}px ${espace.lg}px ${espace.xl}px`, maxWidth: 520, margin: '0 auto' }}>

      <Pile espace="xs">
        <Texte variante="libelle" as="span" style={{ color: 'var(--cc-accent)' }}>{t('infos.livret')}</Texte>
        <Texte variante="titre">{t('infos.utiles')}</Texte>
        <Texte variante="doux">{t('infos.tout_sur', { camping: camping?.nom || '' })}</Texte>
      </Pile>

      <Pile espace="sm">
        {infos.map(info => {
          const actif = ouvert === info.id
          // Le panneau est décrit par le bouton qui le commande : sans
          // aria-expanded, un lecteur d'écran annonce un bouton sans dire qu'il
          // ouvre ou ferme quelque chose, ni dans quel état il se trouve.
          const idPanneau = `${prefixe}-${info.id}`
          // Le panneau est hors du bouton : il contient des liens d'appel, et
          // un lien dans un bouton n'est pas cliquable de façon fiable.
          return (
            <div
              key={info.id}
              style={{
                background: couleur.surface,
                border: `1.5px solid ${actif ? 'var(--cc-accent)' : couleur.bordure}`,
                borderRadius: rayon.lg,
                transition: 'border-color 0.15s',
              }}
            >
              <button
                onClick={() => setOuvert(actif ? null : info.id)}
                aria-expanded={actif}
                aria-controls={idPanneau}
                style={{
                  background: 'none', border: 'none',
                  padding: `14px ${espace.lg}px`,
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                }}
              >
                <Pile direction="ligne" aligner="center" justifier="space-between">
                  <Pile direction="ligne" espace="md" aligner="center">
                    <span
                      aria-hidden="true"
                      style={{
                        width: 42, height: 42, flexShrink: 0,
                        background: actif ? 'var(--cc-accent-voile)' : couleur.fond,
                        borderRadius: rayon.md,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: tailles.titre,
                      }}
                    >
                      {info.emoji}
                    </span>
                    <Texte variante="sousTitre" as="span" style={{ fontSize: tailles.moyen, fontWeight: graisse.titre }}>
                      {info.titre}
                    </Texte>
                  </Pile>
                  <span
                    aria-hidden="true"
                    style={{
                      fontSize: 18, color: couleur.texteDoux, display: 'inline-block',
                      transform: actif ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.2s',
                    }}
                  >›</span>
                </Pile>
              </button>

              {actif && (
                <div
                  id={idPanneau}
                  style={{
                    margin: `0 ${espace.lg}px`, padding: `${espace.md}px 0 14px`,
                    borderTop: `1px solid ${couleur.bordure}`,
                  }}
                >
                  <Texte variante="corps" style={{ whiteSpace: 'pre-line', lineHeight: 1.7 }}>
                    {decouperTelephones(info.contenu).map((m, i) => m.tel
                      ? <a key={i} href={`tel:${m.tel}`} style={lienTel}>{m.texte}</a>
                      : m.texte)}
                  </Texte>
                </div>
              )}
            </div>
          )
        })}
      </Pile>

      {infos.length === 0 && (
        <>
          <Vide emoji="🏕️" texte={t('infos.vide')} style={{ padding: `${espace.lg}px ${espace.lg}px 0` }} />
          <div style={{
            background: couleur.surface, border: `1.5px solid ${couleur.bordure}`,
            borderRadius: rayon.lg, padding: `14px ${espace.lg}px`,
          }}>
            <Texte variante="sousTitre" as="h2" style={{ fontSize: tailles.moyen, fontWeight: graisse.titre, margin: 0 }}>
              <span aria-hidden="true">🚨 </span>{t('infos.urgences')}
            </Texte>
            <Pile espace="xs" style={{ marginTop: espace.sm }}>
              {NUMEROS_URGENCE.map(({ numero, cle }) => (
                <a key={numero} href={`tel:${numero}`} style={{
                  display: 'flex', alignItems: 'center', gap: espace.md, minHeight: 44,
                  textDecoration: 'none', color: couleur.texte,
                }}>
                  <span style={{ ...lienTel, minWidth: 40, fontSize: tailles.grand, fontWeight: graisse.titre }}>{numero}</span>
                  <Texte variante="corps" as="span">{t(cle)}</Texte>
                </a>
              ))}
            </Pile>
          </div>
        </>
      )}

      {/* L'encadré invitait à « signaler un problème » sans mener nulle part. */}
      <Link to="/signaler" style={{ textDecoration: 'none' }}>
        <Pile
          direction="ligne" espace="md" aligner="center"
          style={{
            background: couleur.marqueSombre,
            borderRadius: rayon.lg,
            padding: `${espace.lg}px 20px`,
          }}
        >
          <span aria-hidden="true" style={{ fontSize: 28 }}>📞</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Texte variante="corps" style={{ fontWeight: graisse.titre, color: '#C0DD97' }}>{t('infos.question')}</Texte>
            <Texte variante="doux" style={{ color: 'rgba(255,255,255,0.72)', marginTop: 2 }}>
              {t('infos.question_texte')}
            </Texte>
          </div>
          <span aria-hidden="true" style={{ fontSize: 22, color: 'rgba(255,255,255,0.72)' }}>›</span>
        </Pile>
      </Link>
    </Pile>
  )
}

const lienTel = { color: 'var(--cc-accent)', fontWeight: graisse.fort, textDecoration: 'underline' }
