// Retrait du calque de démarrage posé par index.html.
//
// Ce calque couvre l'écran jusqu'à ce que React ait quelque chose à afficher.
// Sa suppression vivait dans App.jsx, l'application du vacancier — si bien que
// l'application du gérant, qui monte AdminApp et non App, ne le retirait
// jamais. L'administration se chargeait correctement, mais restait invisible
// sous un voile crème et une barre de progression qui tournait indéfiniment.
//
// D'où ce module : le retrait n'appartient à aucune des deux applications, il
// appartient au démarrage. Et le garde-fou ci-dessous fait que le prochain
// point d'entrée ne pourra pas rejouer la même panne — le calque disparaît de
// toute façon, même si personne ne pense à le demander.

const DUREE_FONDU = 320
const DELAI_MAXIMUM = 8000

let fait = false

export function retirerSplash() {
  if (fait) return
  fait = true
  const boot = document.getElementById('cc-boot')
  if (!boot) return
  boot.classList.add('cc-parti')
  setTimeout(() => boot.remove(), DUREE_FONDU)
}

// Garde-fou. La borne est calée sur celle du chargement de session dans
// App.jsx : passé ce délai, l'application affiche ce qu'elle a, et le calque
// n'a plus de raison d'être — quelle qu'en soit la raison.
if (typeof window !== 'undefined') {
  setTimeout(retirerSplash, DELAI_MAXIMUM)
}
