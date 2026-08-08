import { couleur, espace, graisse, rayon, texte, duree } from './tokens'

// Un bouton par intention, pas par apparence. « primaire » veut dire « l'action
// principale de cet écran », pas « vert et rempli » : le jour où la charte
// change, les appels ne bougent pas.

const TAILLES = {
  sm: { padding: `${espace.sm}px ${espace.md}px`, fontSize: texte.petit, minHeight: 36 },
  md: { padding: `${espace.md}px ${espace.lg}px`, fontSize: texte.base, minHeight: 44 },
  lg: { padding: `${espace.lg}px ${espace.xl}px`, fontSize: texte.moyen, minHeight: 52 },
}

const VARIANTES = {
  primaire: {
    background: 'var(--cc-accent)',
    color: couleur.texteSurAccent,
    border: '1px solid transparent',
  },
  secondaire: {
    background: couleur.surface,
    color: couleur.texteMoyen,
    border: `1px solid ${couleur.bordure}`,
  },
  discret: {
    background: 'transparent',
    color: couleur.texteDoux,
    border: '1px solid transparent',
  },
  danger: {
    background: couleur.dangerFond,
    color: couleur.danger,
    border: '1px solid rgba(220, 38, 38, 0.22)',
  },
}

export default function Bouton({
  variante = 'primaire',
  taille = 'md',
  pleineLargeur = false,
  charge = false,
  icone,
  enfants,
  children,
  style,
  disabled,
  ...reste
}) {
  const contenu = children ?? enfants
  const inactif = disabled || charge

  return (
    <button
      disabled={inactif}
      // L'état occupé est annoncé aux lecteurs d'écran, pas seulement montré.
      aria-busy={charge || undefined}
      style={{
        ...TAILLES[taille],
        ...VARIANTES[variante],
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: espace.sm,
        width: pleineLargeur ? '100%' : undefined,
        borderRadius: rayon.md,
        fontWeight: graisse.fort,
        fontFamily: 'inherit',
        lineHeight: 1.2,
        cursor: inactif ? 'default' : 'pointer',
        // Un bouton inactif garde sa forme et perd son intensité : le déplacer
        // ou le faire disparaître ferait sauter la mise en page.
        opacity: inactif ? 0.55 : 1,
        transition: `opacity ${duree.courte}ms ease-out, transform ${duree.instant}ms ease-out`,
        ...style,
      }}
      {...reste}
    >
      {charge ? <Rondelle /> : icone}
      {contenu}
    </button>
  )
}

function Rondelle() {
  return (
    <span
      aria-hidden="true"
      style={{
        width: 14, height: 14, flexShrink: 0,
        border: '2px solid currentColor',
        borderTopColor: 'transparent',
        borderRadius: rayon.rond,
        animation: 'spin 0.7s linear infinite',
        opacity: 0.85,
      }}
    />
  )
}
