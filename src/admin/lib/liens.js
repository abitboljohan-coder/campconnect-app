/**
 * Lien d'entrée des vacanciers, celui que le QR code de la réception encode.
 *
 * Toujours le domaine public. Construit à partir de l'adresse de la page, il
 * valait « capacitor://localhost » dans l'application iPhone et
 * « http://localhost » sur un poste de développement : un QR imprimé depuis
 * là n'ouvrait rien. Et c'est /join/ qu'il faut, pas ?camping= : seul /join/
 * vaut preuve de présence et dispense du contrôle GPS.
 */
export const lienRejoindre = slug => `https://app.campconnect.fr/join/${slug}`
