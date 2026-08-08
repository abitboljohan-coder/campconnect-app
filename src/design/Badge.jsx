import { couleur, espace, graisse, rayon, texte as tailles } from './tokens'

const TONS = {
  neutre:  { background: couleur.surfaceDouce, color: couleur.texteMoyen },
  accent:  { background: 'var(--cc-accent-voile)', color: 'var(--cc-accent)' },
  succes:  { background: '#f0fdf4', color: couleur.succes },
  alerte:  { background: couleur.alerteFond, color: couleur.alerte },
  danger:  { background: couleur.dangerFond, color: couleur.danger },
}

export default function Badge({ ton = 'neutre', children, style, ...reste }) {
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: espace.xs,
        padding: `3px ${espace.sm}px`,
        borderRadius: rayon.rond,
        fontSize: tailles.micro,
        fontWeight: graisse.titre,
        lineHeight: 1.4,
        whiteSpace: 'nowrap',
        ...TONS[ton],
        ...style,
      }}
      {...reste}
    >
      {children}
    </span>
  )
}
