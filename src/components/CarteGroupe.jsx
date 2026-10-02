import { t, locale } from '../i18n'
import { estComplet, libelleHeure } from '../lib/groupes'
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

// Deux lignes au plus : sur une seule, un lieu un peu long coupait l'heure.
const deuxLignes = {
  overflowWrap: 'anywhere',
  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
}

export default function CarteGroupe({ groupe, membre, avatars, onAction }) {
  // Le maximum fixé par le créateur n'était qu'affiché : on rejoignait un
  // groupe « 4 places » à dix. Les membres, eux, gardent toujours l'accès.
  const complet = !membre && estComplet(groupe, avatars?.length || 0)
  // Quand, avant où : l'heure du rendez-vous est l'information décisive, et
  // elle passait après le lieu, coupée en bout de ligne et sans le jour.
  const heure = libelleHeure(groupe.heure, { aujourdhui: t('chat.aujourdhui'), demain: t('agenda.demain'), locale: locale() })
  const meta = [
    heure && `🕐 ${heure}`,
    groupe.lieu && `📍 ${groupe.lieu}`,
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

        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          {/* Deux lignes pour le titre : sur une seule, à côté du bouton, un
              petit téléphone n'en montrait que huit lettres. */}
          <Texte variante="sousTitre" style={{
            fontSize: tailles.moyen, overflowWrap: 'anywhere',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>{groupe.titre}</Texte>
          {meta && <Texte variante="micro" style={{ marginTop: 2, ...deuxLignes }}>{meta}</Texte>}
          <PileAvatars avatars={avatars} />
        </div>

        <Bouton
          variante={membre ? 'primaire' : 'secondaire'}
          taille="sm"
          onClick={onAction}
          disabled={complet}
          style={{
            flexShrink: 0, borderRadius: rayon.rond,
            ...(membre || complet ? null : { color: 'var(--cc-accent)', border: '1.5px solid var(--cc-accent)', background: 'transparent' }),
          }}
        >
          {membre ? t('groupes.ouvrir') : complet ? t('commun.complet') : t('groupes.rejoindre')}
        </Bouton>
      </Pile>
    </Carte>
  )
}
