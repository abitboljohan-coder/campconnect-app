/**
 * Qui peut entrer dans quel camping.
 *
 * Ces règles vivent hors de l'écran d'inscription : elles décident si un
 * vacancier peut rejoindre un camping, et cette décision se teste seule.
 */

/**
 * Camping en accès libre : contrôle de présence désactivé pour ce camping-là.
 *
 * Réservé au camping de démonstration, qui doit rester ouvrable depuis
 * n'importe où — par un prospect à qui l'on fait la démonstration, et surtout
 * par les testeurs d'Apple et de Google, à des milliers de kilomètres du site.
 * Les campings réels n'ont pas ce drapeau et gardent leur vérification GPS.
 */
export const estAccesLibre = c => c?.carte_config?.acces_libre === true

/**
 * Un camping n'est joignable que s'il sait dire oui à quelqu'un.
 *
 * Sans accès libre et sans centre GPS, le contrôle de présence n'a rien à
 * comparer : il échoue, et l'écran retombe sur le code du jour — un code que
 * seule la réception affiche, et qu'un camping non configuré n'affiche nulle
 * part. Le visiteur se retrouvait donc devant une porte dont personne ne
 * possède la clé. Mieux vaut le lui dire.
 */
export const estJoignable = c =>
  estAccesLibre(c) || !!(c?.carte_config?.center?.lat && c?.carte_config?.center?.lng)
