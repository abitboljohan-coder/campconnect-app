// Échappe une valeur avant injection dans du HTML brut (Leaflet divIcon / popup).
// Empêche le XSS stocké via nom de camping, pseudo, libellés, etc.
const MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => MAP[c])
}
