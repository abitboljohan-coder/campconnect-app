/**
 * Centre d'un contour `[[lat, lng], …]` : moyenne de ses sommets.
 *
 * L'inscription des vacanciers compare leur position GPS à
 * `carte_config.center` (tolérance 800 m). Ce centre n'était jamais écrit par
 * l'administration : le contrôle échouait pour tout camping neuf. La moyenne
 * des sommets suffit à l'échelle d'un camping, même pour un contour irrégulier.
 */
export function barycentre(points) {
  const valides = (points || []).filter(p => Number.isFinite(p?.[0]) && Number.isFinite(p?.[1]))
  if (!valides.length) return null
  return {
    lat: valides.reduce((s, p) => s + p[0], 0) / valides.length,
    lng: valides.reduce((s, p) => s + p[1], 0) / valides.length,
  }
}
