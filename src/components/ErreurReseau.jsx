import { t, useLangue } from '../i18n'
import { Bouton, Vide } from '../design'

/**
 * Chargement échoué : on le dit, et on propose de réessayer.
 *
 * Une requête échouée s'affichait comme une liste vide — « Aucun groupe…
 * Soyez le premier ! » — et le vacancier, sur le réseau fragile du camping,
 * créait un groupe en double ou croyait l'agenda vide.
 */
export default function ErreurReseau({ onReessayer, style }) {
  useLangue()
  return (
    <Vide
      emoji="📶"
      titre={t('commun.reseau_titre')}
      texte={t('commun.reseau')}
      action={<Bouton onClick={onReessayer}>{t('commun.reessayer')}</Bouton>}
      style={style}
    />
  )
}
