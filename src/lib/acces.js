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

/**
 * Clé du QR code de la réception, lue dans le lien d'entrée
 * (https://app.campconnect.fr/join/<slug>?k=<clé>, ou campconnect://join/…).
 *
 * C'est elle, et non plus le simple chemin /join/, qui vaut preuve de
 * présence : le serveur la compare à la clé secrète du camping
 * (rejoindre_camping). Un QR imprimé avant un changement de clé, ou un lien
 * sans clé, ne prouve rien — le vacancier passe alors par le GPS ou le code.
 */
export function cleDuLien(url) {
  const m = String(url || '').match(/[?&]k=([0-9a-f]{32,128})(?:[&#]|$)/i)
  return m ? m[1].toLowerCase() : null
}

/**
 * Texte (clé i18n) à afficher pour un refus du serveur
 * (verifier_acces_camping, rejoindre_camping).
 */
const MESSAGES_ACCES = {
  code_faux: 'onb.code_erreur',
  trop_essais: 'onb.code_trop',
  qr_perime: 'onb.qr_perime',
  hors_camping: 'onb.gps_echec',
  verification_expiree: 'onb.verif_expiree',
  preuve_manquante: 'onb.verif_expiree',
}
export const messageAcces = erreur => MESSAGES_ACCES[erreur] || 'onb.err_generique'

/** Refus qui tiennent à la preuve de présence : il faut la redonner. */
export const estRefusDePreuve = erreur => Object.hasOwn(MESSAGES_ACCES, erreur)
