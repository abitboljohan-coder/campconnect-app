/**
 * Lien d'entrée des vacanciers, celui que le QR code de la réception encode.
 *
 * Toujours le domaine public. Construit à partir de l'adresse de la page, il
 * valait « capacitor://localhost » dans l'application iPhone et
 * « http://localhost » sur un poste de développement : un QR imprimé depuis
 * là n'ouvrait rien. Et c'est /join/ qu'il faut, pas ?camping= : c'est le
 * chemin que l'app iPhone et Android intercepte (native.js).
 *
 * Avec la clé secrète du camping (lue par la fonction acces_camping, réservée
 * au gérant), le lien vaut preuve de présence : c'est celui du QR code. Sans
 * clé, c'est l'adresse publique du camping, qui demande le GPS ou le code.
 */
export const lienRejoindre = (slug, cle) =>
  `https://app.campconnect.fr/join/${slug}${cle ? `?k=${cle}` : ''}`

/**
 * Dans l'app iPhone et Android, un lien de téléchargement (`<a download>`) ou
 * `window.print()` ne fait rien : la WebView l'ignore sans erreur. On le dit
 * au gérant au lieu de lui laisser un bouton muet.
 */
export const MESSAGE_ORDINATEUR = 'Pour télécharger ou imprimer, ouvrez app.campconnect.fr/admin depuis un ordinateur.'
