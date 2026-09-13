// ─────────────────────────────────────────────────────────────────────────────
// Émetteur de notifications passagères.
//
// Séparé du composant d'affichage à dessein : `toast()` est appelé depuis des
// fonctions asynchrones un peu partout, souvent hors de l'arbre React. Le
// garder dans un module sans composant évite aussi de casser le rafraîchissement
// à chaud, qui exige qu'un fichier n'exporte que des composants.
// ─────────────────────────────────────────────────────────────────────────────

import { reussite, echec } from './haptique'

let abonnes = []
let compteur = 0

export function toast(message, ton = 'info') {
  if (!message) return
  const t = { id: ++compteur, message, ton }
  abonnes.forEach(fn => fn(t))

  // Le ton porte déjà l'information : tout ce qui aboutit ou échoue dans
  // l'application passe par ici. Un seul branchement suffit donc à donner un
  // retour tactile partout, plutôt qu'un appel dispersé dans chaque écran.
  if (ton === 'succes') reussite()
  else if (ton === 'erreur') echec()
}

export function sAbonner(fn) {
  abonnes.push(fn)
  return () => { abonnes = abonnes.filter(x => x !== fn) }
}
