// ─────────────────────────────────────────────────────────────────────────────
// Jeu d'icônes de l'application.
//
// Les emoji sont pratiques pour du contenu saisi par les utilisateurs, mais pas
// pour le châssis de l'app : leur dessin change d'un système à l'autre, ils ne
// prennent pas la couleur de l'élément actif, leurs graisses et leurs marges
// intérieures ne s'accordent pas entre eux, et sur une capture d'écran de fiche
// Store ils signalent immédiatement un produit bricolé.
//
// Ces tracés partagent une grille de 24, une graisse de 1,8 et des extrémités
// arrondies, et héritent de `currentColor` — l'état actif de la barre se gère
// donc uniquement par la couleur du camping.
// ─────────────────────────────────────────────────────────────────────────────

const TRACES = {
  // Tente : le châssis de l'app parle de camping, pas de « maison ».
  accueil: (
    <>
      <path d="M12 4 3.5 19.2h17L12 4Z" />
      <path d="M12 10.5 7 19.2" />
      <path d="M12 10.5 17 19.2" />
    </>
  ),
  // Deux silhouettes : un groupe, pas un contact isolé.
  groupes: (
    <>
      <circle cx="9.2" cy="8.4" r="3.1" />
      <path d="M3.4 19.4a5.8 5.8 0 0 1 11.6 0" />
      <path d="M16.4 6.1a3.1 3.1 0 0 1 0 5.9" />
      <path d="M17.6 13.9a5.8 5.8 0 0 1 3 5.5" />
    </>
  ),
  // Carte pliée : lecture immédiate, et cohérente avec la vue satellite.
  carte: (
    <>
      <path d="M9 4.6 3.6 6.8v12.6L9 17.2l6 2.2 5.4-2.2V4.6L15 6.8 9 4.6Z" />
      <path d="M9 4.6v12.6" />
      <path d="M15 6.8v12.6" />
    </>
  ),
  // Calendrier sans chiffre : le nombre changerait à chaque jour affiché.
  agenda: (
    <>
      <rect x="3.6" y="5.4" width="16.8" height="15" rx="2.6" />
      <path d="M3.6 10.2h16.8" />
      <path d="M8.2 3.4v3.6" />
      <path d="M15.8 3.4v3.6" />
    </>
  ),
  // Information : cercle et hampe, la forme la plus universelle.
  infos: (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M12 11v5.4" />
      <path d="M12 7.9v.1" />
    </>
  ),
}

export default function Icon({ nom, taille = 23, actif = false }) {
  const trace = TRACES[nom]
  if (!trace) return null
  return (
    <svg
      width={taille}
      height={taille}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      // L'élément actif est légèrement plus gras : la couleur seule ne suffit
      // pas à distinguer l'onglet courant pour un œil qui perçoit mal les
      // contrastes de teinte.
      strokeWidth={actif ? 2.1 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      style={{ display: 'block', flexShrink: 0 }}
    >
      {trace}
    </svg>
  )
}
