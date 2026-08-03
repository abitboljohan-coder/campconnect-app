// ─────────────────────────────────────────────────────────────────────────────
// Émetteur de notifications passagères.
//
// Séparé du composant d'affichage à dessein : `toast()` est appelé depuis des
// fonctions asynchrones un peu partout, souvent hors de l'arbre React. Le
// garder dans un module sans composant évite aussi de casser le rafraîchissement
// à chaud, qui exige qu'un fichier n'exporte que des composants.
// ─────────────────────────────────────────────────────────────────────────────

let abonnes = []
let compteur = 0

export function toast(message, ton = 'info') {
  if (!message) return
  const t = { id: ++compteur, message, ton }
  abonnes.forEach(fn => fn(t))
}

export function sAbonner(fn) {
  abonnes.push(fn)
  return () => { abonnes = abonnes.filter(x => x !== fn) }
}
