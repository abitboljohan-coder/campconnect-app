import { t, locale } from '../i18n'
import { Bouton, Carte, Texte, Pile, couleur, espace, graisse, rayon, texte as tailles } from '../design'

// La ligne d'un groupe existait en deux exemplaires — accueil et liste des
// groupes — avec deux tailles d'avatar, deux tailles de bouton et, dans la
// version de l'accueil, des libellés écrits en français dans le code, hors
// i18n : « Ouvert », « Rejoindre », « membres ». Un vacancier néerlandais
// lisait donc une liste à moitié traduite selon l'écran où il se trouvait.

function PileAvatars({ avatars }) {
  if (!avatars?.length) return null
  const total = avatars.length
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginTop: 5 }}>
      {avatars.slice(0, 4).map((a, i) => (
        <span key={i} aria-hidden="true" style={{
          width: 22, height: 22, borderRadius: rayon.rond, background: couleur.surface,
          border: `1.5px solid ${couleur.bordure}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: tailles.petit, marginLeft: i === 0 ? 0 : -7, zIndex: 5 - i,
          boxShadow: '0 1px 3px rgba(26, 26, 26, 0.12)',
        }}>{a}</span>
      ))}
      {total > 4 && (
        <Texte variante="micro" as="span" style={{ fontWeight: graisse.titre, color: 'var(--cc-accent)', marginLeft: 4 }}>
          +{total - 4}
        </Texte>
      )}
      <Texte variante="micro" as="span" style={{ marginLeft: 6 }}>
        {total > 1 ? t('commun.membres', { n: total }) : t('commun.membre', { n: total })}
      </Texte>
    </div>
  )
}

const tronque = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }

export default function CarteGroupe({ groupe, membre, avatars, onAction }) {
  const heure = groupe.heure
    ? new Date(groupe.heure).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' })
    : null
  const meta = [
    groupe.lieu && `📍 ${groupe.lieu}`,
    heure && `🕐 ${heure}`,
    groupe.max_membres && t('commun.places', { n: groupe.max_membres }),
  ].filter(Boolean).join(' · ')

  return (
    <Carte hauteur="posee" padding={`14px ${espace.lg}px`}>
      <Pile direction="ligne" espace="md" aligner="center">
        <span aria-hidden="true" style={{
          width: 48, height: 48, borderRadius: rayon.md, flexShrink: 0,
          background: membre ? 'var(--cc-accent-voile)' : couleur.fond,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24,
        }}>
          {groupe.emoji || '👥'}
        </span>

        <div style={{ flex: 1, overflow: 'hidden' }}>
          <Texte variante="sousTitre" style={{ fontSize: tailles.moyen, ...tronque }}>{groupe.titre}</Texte>
          {meta && <Texte variante="micro" style={{ marginTop: 2, ...tronque }}>{meta}</Texte>}
          <PileAvatars avatars={avatars} />
        </div>

        <Bouton
          variante={membre ? 'primaire' : 'secondaire'}
          taille="sm"
          onClick={onAction}
          style={{
            flexShrink: 0, borderRadius: rayon.rond,
            ...(membre ? null : { color: 'var(--cc-accent)', border: '1.5px solid var(--cc-accent)', background: 'transparent' }),
          }}
        >
          {membre ? t('groupes.ouvrir') : t('groupes.rejoindre')}
        </Bouton>
      </Pile>
    </Carte>
  )
}
