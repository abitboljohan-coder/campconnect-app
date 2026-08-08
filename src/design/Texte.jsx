import { couleur, graisse, texte as tailles } from './tokens'

// Le rôle décide de la taille et de la couleur. Un « libellé » est un libellé
// partout dans l'application, et il change partout d'un seul endroit.
const ROLES = {
  titre:      { fontSize: tailles.grosTitre, fontWeight: graisse.affiche, color: couleur.texte, letterSpacing: '-0.4px', lineHeight: 1.2 },
  section:    { fontSize: tailles.titre,     fontWeight: graisse.titre,   color: couleur.texte, letterSpacing: '-0.2px', lineHeight: 1.25 },
  sousTitre:  { fontSize: tailles.grand,     fontWeight: graisse.fort,    color: couleur.texte, lineHeight: 1.35 },
  corps:      { fontSize: tailles.base,      fontWeight: graisse.normal,  color: couleur.texteMoyen, lineHeight: 1.55 },
  doux:       { fontSize: tailles.petit,     fontWeight: graisse.normal,  color: couleur.texteDoux, lineHeight: 1.5 },
  libelle:    { fontSize: tailles.micro,     fontWeight: graisse.titre,   color: couleur.texteDoux, textTransform: 'uppercase', letterSpacing: 0.8 },
  micro:      { fontSize: tailles.micro,     fontWeight: graisse.normal,  color: couleur.texteDoux, lineHeight: 1.4 },
}

export default function Texte({ role = 'corps', as, children, style, ...reste }) {
  const Balise = as || (role === 'titre' ? 'h1' : role === 'section' ? 'h2' : role === 'sousTitre' ? 'h3' : 'p')
  return (
    <Balise style={{ margin: 0, ...ROLES[role], ...style }} {...reste}>
      {children}
    </Balise>
  )
}
