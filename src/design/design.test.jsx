import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { Bouton, Champ, Texte, Badge, Carte } from './index'

// Le système de conception porte les garanties d'accessibilité de toute
// l'application : si Champ lie correctement son libellé, tous les formulaires
// en héritent. Ces règles sont donc vérifiées ici plutôt que répétées écran
// par écran — c'est tout l'intérêt d'avoir un système.

const html = (n) => renderToStaticMarkup(n)

describe('Champ', () => {
  it('lie le libellé à la saisie', () => {
    const m = html(<Champ libelle="Pseudo" />)
    const idLabel = m.match(/<label for="([^"]+)"/)?.[1]
    const idInput = m.match(/<input[^>]*id="([^"]+)"/)?.[1]
    expect(idLabel).toBeTruthy()
    expect(idInput).toBe(idLabel)
  })

  it('ne descend jamais sous 16 px', () => {
    // En deçà, iOS zoome à la mise au point et décale la page.
    const m = html(<Champ libelle="Pseudo" />)
    expect(m).toMatch(/font-size:16px/)
  })

  it('rattache l’aide et l’erreur au champ pour les lecteurs d’écran', () => {
    const m = html(<Champ libelle="Pseudo" aide="Trois lettres minimum" erreur="Déjà pris" />)
    const decrit = m.match(/aria-describedby="([^"]+)"/)?.[1]
    expect(decrit).toBeTruthy()
    for (const id of decrit.split(' ')) expect(m).toContain(`id="${id}"`)
    expect(m).toContain('aria-invalid="true"')
  })

  it('n’affiche pas l’aide quand une erreur la remplace', () => {
    const m = html(<Champ libelle="X" aide="AIDE_VISIBLE" erreur="ERREUR" />)
    expect(m).toContain('ERREUR')
    expect(m).not.toContain('AIDE_VISIBLE')
  })
})

describe('Bouton', () => {
  it('devient inactif et se déclare occupé pendant un envoi', () => {
    const m = html(<Bouton charge>Envoyer</Bouton>)
    expect(m).toContain('disabled')
    expect(m).toContain('aria-busy="true"')
  })

  it('reste inactif quand on le désactive explicitement', () => {
    expect(html(<Bouton disabled>X</Bouton>)).toContain('disabled')
  })

  it('prend l’accent du camping, jamais une couleur figée', () => {
    // L'accent vient d'une propriété personnalisée : changer de camping ne
    // demande aucune reconstruction de composant.
    expect(html(<Bouton>X</Bouton>)).toContain('var(--cc-accent)')
  })

  it('propose une variante par intention, pas par apparence', () => {
    expect(html(<Bouton variante="danger">Supprimer</Bouton>)).toMatch(/#dc2626/i)
  })
})

describe('Texte', () => {
  it('choisit la balise selon le rôle', () => {
    expect(html(<Texte role="titre">T</Texte>)).toMatch(/^<h1/)
    expect(html(<Texte role="section">S</Texte>)).toMatch(/^<h2/)
    expect(html(<Texte role="corps">C</Texte>)).toMatch(/^<p/)
  })

  it('laisse forcer la balise sans perdre le style du rôle', () => {
    const m = html(<Texte role="libelle" as="span">L</Texte>)
    expect(m).toMatch(/^<span/)
    expect(m).toMatch(/text-transform:uppercase/)
  })
})

describe('Badge et Carte', () => {
  it('le badge décline ses tons par intention', () => {
    expect(html(<Badge ton="danger">3</Badge>)).toMatch(/#dc2626/i)
    expect(html(<Badge ton="succes">ok</Badge>)).toMatch(/#166534/i)
  })

  it('la carte n’a que trois hauteurs', () => {
    const p = html(<Carte hauteur="posee">x</Carte>)
    const f = html(<Carte hauteur="flottante">x</Carte>)
    expect(p).not.toBe(f)
    expect(p).toContain('box-shadow')
  })
})
