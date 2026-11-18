import { couleur } from '../design'

/**
 * Palette de l'espace gérant (direction « Ardoise », 2 nov. 2026).
 *
 * L'administration reprenait les jetons de l'app vacancier, dont la marque
 * vert pomme : boutons, barres, onglet actif et titres étaient tous verts, sur
 * une barre latérale vert-noir. Le gérant y voyait un outil « tout vert », pas
 * un logiciel de gestion. Ici l'encre porte les actions, le saumon de la marque
 * ne sert que de repère, et le vert ne dit plus que « réussi ».
 *
 * Les clés restent celles de `couleur` : les écrans de l'admin changent de
 * palette sans changer de code, et l'app vacancier n'est pas touchée.
 */
export const jetons = {
  ...couleur,
  fond: '#F4F4F1',
  fondClair: '#FAFAF8',
  surface: '#FFFFFF',
  surfaceDouce: '#F1F1EE',
  bordure: '#E7E7E2',

  texte: '#17191C',
  texteMoyen: '#3A3D42',
  texteDoux: '#62666C',   // 5,8:1 sur blanc

  danger: '#B42318',
  dangerFond: '#FEF3F2',

  // Les clés « marque » désignent ici l'encre des actions de l'admin.
  marque: '#17191C',
  marqueTexte: '#A8402B',   // saumon foncé, 6,1:1 sur blanc
  marqueSombre: '#17191C',

  // Saumon de la marque : repères visuels seulement (jamais sous du texte blanc).
  accent: '#FA8072',
  accentVoile: '#FDECE8',
}

/**
 * Couleur par défaut d'un camping, celle que voient ses vacanciers.
 * À ne pas confondre avec l'encre de l'admin : c'est elle qu'on compare pour
 * savoir si le gérant a choisi ses couleurs.
 */
export const couleurCampingParDefaut = couleur.marque
export const couleurCampingSecondaireParDefaut = couleur.marqueSombre

/** Barre latérale et barres sombres du téléphone. */
export const barre = {
  fond: '#17191C',
  actif: '#26292E',
  texte: '#A3A6AC',
  texteActif: '#FFFFFF',
  titre: '#888C92',      // 5,2:1 sur la barre (#7A7E84 : 4,3:1)
  separation: 'rgba(255,255,255,0.07)',
}

/**
 * Propriétés CSS lues par les composants partagés (boutons, champs…).
 * Posées sur la racine tant que l'admin est affichée, puis retirées : dans
 * l'app native, le gérant repasse côté vacancier sans recharger la page.
 */
export const variablesAdmin = {
  '--cc-accent': jetons.marque,
  '--cc-accent-sombre': jetons.marqueSombre,
  '--cc-accent-voile': '#17191C0D',
  '--cc-accent-bordure': '#17191C33',
  '--cc-fond': jetons.fond,
  '--cc-bordure': jetons.bordure,
  '--cc-texte': jetons.texte,
  '--cc-texte-doux': jetons.texteDoux,
}

/**
 * Boutons et titres de section, communs aux neuf pages.
 *
 * Chaque page avait son bouton : 13 px et rayon 8 sur la Carte, 14 px et
 * rayon 10 dans Paramètres, un troisième dans le QR code. Mêmes mesures que le
 * `Bouton` « md » du design : un seul bouton, quelle que soit la page.
 */
const baseBouton = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  minHeight: 44, padding: '10px 18px', borderRadius: 12,
  fontFamily: 'inherit', fontSize: 14, fontWeight: 600, lineHeight: 1.2,
  textDecoration: 'none', whiteSpace: 'nowrap', cursor: 'pointer', boxSizing: 'border-box',
}
export const bouton = {
  principal:  { ...baseBouton, background: jetons.marque, color: '#fff', border: `1px solid ${jetons.marque}` },
  secondaire: { ...baseBouton, background: jetons.surface, color: jetons.texte, border: `1px solid ${jetons.bordure}` },
  danger:     { ...baseBouton, background: jetons.dangerFond, color: jetons.danger, border: '1px solid #FECDCA' },
  inactif:    { ...baseBouton, background: jetons.bordure, color: jetons.texteDoux, border: `1px solid ${jetons.bordure}`, cursor: 'not-allowed' },
}

/** Titre de section : une seule taille, une seule graisse, sur toutes les pages. */
export const titreSection = {
  fontSize: 17, fontWeight: 700, color: jetons.texte, letterSpacing: '-0.01em', lineHeight: 1.3, margin: 0,
}
