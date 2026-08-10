import { useId, useState } from 'react'
import { t, useLangue } from '../i18n'
import { Texte, Pile, couleur, espace, graisse, rayon, texte as tailles } from '../design'

const DEFAULT_INFOS = [
  { id: 'piscine',    emoji: '🏊', titre: 'Piscine',          contenu: 'Ouverte 9h – 20h\nSurveillée 10h – 19h' },
  { id: 'snack',      emoji: '🍺', titre: 'Bar / Snack',       contenu: 'Ouvert 10h – 23h\nPetit-déjeuner 8h – 10h30' },
  { id: 'reception',  emoji: '🏠', titre: 'Réception',         contenu: 'Lun – Ven : 8h – 19h\nSam – Dim : 8h – 20h' },
  { id: 'wifi',       emoji: '📶', titre: 'Wi-Fi',             contenu: 'Réseau : CampConnect\nCode : CAMPING2026' },
  { id: 'laverie',    emoji: '👕', titre: 'Laverie',           contenu: 'Ouverte 7h – 22h\nMachines disponibles en libre-service' },
  { id: 'poubelles',  emoji: '♻️', titre: 'Tri & Poubelles',  contenu: 'Zone tri au bloc sanitaire A\nEnlèvement : chaque matin à 8h' },
  { id: 'animaux',    emoji: '🐾', titre: 'Animaux',           contenu: 'Acceptés en laisse\nZone détente chiens : allée B' },
  { id: 'urgences',   emoji: '🚨', titre: 'Urgences',          contenu: 'Réception : 04 XX XX XX XX\nSAMU : 15 · Police : 17 · Pompiers : 18' },
]

export default function Infos({ camping }) {
  useLangue()
  const infos = (camping?.infos && camping.infos.length > 0) ? camping.infos : DEFAULT_INFOS
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
          return (
            <button
              key={info.id}
              onClick={() => setOuvert(actif ? null : info.id)}
              aria-expanded={actif}
              aria-controls={idPanneau}
              style={{
                background: couleur.surface,
                border: `1.5px solid ${actif ? 'var(--cc-accent)' : couleur.bordure}`,
                borderRadius: rayon.lg,
                padding: `14px ${espace.lg}px`,
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'border-color 0.15s',
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

              {actif && (
                <div
                  id={idPanneau}
                  style={{
                    marginTop: espace.md, paddingTop: espace.md,
                    borderTop: `1px solid ${couleur.bordure}`,
                  }}
                >
                  <Texte variante="corps" style={{ whiteSpace: 'pre-line', lineHeight: 1.7 }}>
                    {info.contenu}
                  </Texte>
                </div>
              )}
            </button>
          )
        })}
      </Pile>

      <Pile
        direction="ligne" espace="md" aligner="center"
        style={{
          background: couleur.marqueSombre,
          borderRadius: rayon.lg,
          padding: `${espace.lg}px 20px`,
        }}
      >
        <span aria-hidden="true" style={{ fontSize: 28 }}>📞</span>
        <div>
          <Texte variante="corps" style={{ fontWeight: graisse.titre, color: '#C0DD97' }}>{t('infos.question')}</Texte>
          <Texte variante="doux" style={{ color: 'rgba(255,255,255,0.72)', marginTop: 2 }}>
            Passez à la réception ou signalez un problème à l’équipe.
          </Texte>
        </div>
      </Pile>
    </Pile>
  )
}
