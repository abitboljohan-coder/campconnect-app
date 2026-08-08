// Jetons de conception de CampConnect.
//
// Avant ce fichier, l'application comptait 865 styles écrits à la main, douze
// tailles de police et trente-deux ombres distinctes pour quarante-quatre
// usages. Chaque écran réinventait ce que le précédent avait déjà décidé.
//
// L'échelle ci-dessous n'est pas inventée : elle est dérivée des valeurs
// réellement employées, resserrées jusqu'à ce qu'il reste un choix par
// intention. Une échelle qui contient déjà toutes les valeurs ne sert à rien.
//
// Les jetons existent en deux formes, volontairement :
//   • ici, en JavaScript, pour les styles en ligne qui subsistent ;
//   • dans index.css, en propriétés personnalisées, pour tout ce que le CSS
//     doit pouvoir lire — dont l'accent, qui change selon le camping.

/** Espacements. Base de 4, avec un cran à 12 : la moitié des marges de
 *  l'application s'y trouvaient déjà. */
export const espace = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
}

/** Tailles de texte. La base est à 14 : c'est la valeur la plus employée dans
 *  l'application, et la plus lisible au soleil sur un écran de téléphone. */
export const texte = {
  micro: 11,   // horodatages, mentions légales
  petit: 12.5, // libellés, aides
  base: 14,    // corps
  moyen: 15,   // corps mis en avant
  grand: 17,   // sous-titres
  titre: 20,   // titres de section
  grosTitre: 24,
}

/** Graisses. Trois suffisent — l'application en utilisait six. */
export const graisse = {
  normal: 500,
  fort: 600,
  titre: 700,
  affiche: 800,
}

/** Rayons. Le pas suit la taille de l'élément : plus il est grand, plus le
 *  rayon l'est, sinon les angles paraissent durcir en montant en taille. */
export const rayon = {
  sm: 8,    // puces, petits boutons
  md: 12,   // champs, boutons
  lg: 16,   // cartes
  xl: 22,   // feuilles, cartes principales
  rond: 999,
}

/** Ombres. Trois niveaux au lieu de trente-deux. Chacune répond à une question
 *  simple : à quelle hauteur du fond se trouve l'élément ? */
export const ombre = {
  posee: '0 1px 4px rgba(26, 26, 26, 0.07)',
  levee: '0 4px 14px rgba(26, 26, 26, 0.09)',
  flottante: '0 12px 40px rgba(47, 74, 38, 0.14)',
}

/** Couleurs. Nommées par leur rôle, jamais par leur teinte : « texteDoux »
 *  survit à un changement de gris, « gris400 » non.
 *
 *  Les valeurs de texte respectent toutes le seuil AA de 4,5:1 sur fond clair —
 *  c'est vérifié par le test de contraste, pas par bonne volonté. */
export const couleur = {
  // Fonds
  fond: '#f5f2eb',        // fond de l'application
  fondClair: '#faf7f0',   // écrans d'entrée, splash
  surface: '#ffffff',     // cartes
  surfaceDouce: '#f3f4f6',// zones en retrait
  bordure: '#e8e4da',

  // Textes
  texte: '#1a1a1a',
  texteMoyen: '#374151',
  texteDoux: '#6b7280',   // 4,83:1 sur blanc
  texteSurAccent: '#ffffff',

  // Intentions
  succes: '#166534',
  danger: '#dc2626',
  dangerFond: '#fef2f2',
  alerte: '#9a3412',
  alerteFond: '#fff7ed',

  // Marque, employée en repli quand un camping n'a pas de couleur propre
  marque: '#639922',
  marqueTexte: '#54821d', // 4,58:1 — la marque en tant que couleur de texte
  marqueSombre: '#0d1f0d',
}

/** Durées d'animation. Au-delà de 300 ms, une interface paraît lente ; en
 *  deçà de 90 ms, le mouvement n'est pas perçu, seulement subi. */
export const duree = {
  instant: 90,
  courte: 160,
  moyenne: 240,
}

/**
 * Applique la couleur d'un camping à toute l'application.
 *
 * L'accent était jusqu'ici transmis de composant en composant sous forme de
 * propriété `couleur`, ce qui obligeait chaque écran à la connaître pour la
 * repasser à ses enfants. En propriété personnalisée, il est lu là où il sert
 * et nulle part ailleurs.
 */
export function appliquerTheme(camping) {
  const racine = document.documentElement
  const accent = camping?.couleur_principale || couleur.marque
  const sombre = camping?.couleur_secondaire || couleur.marqueSombre
  racine.style.setProperty('--cc-accent', accent)
  racine.style.setProperty('--cc-accent-sombre', sombre)
  // Teintes dérivées, pour les fonds légers et les bordures d'état actif.
  racine.style.setProperty('--cc-accent-voile', `${accent}18`)
  racine.style.setProperty('--cc-accent-bordure', `${accent}40`)
}
