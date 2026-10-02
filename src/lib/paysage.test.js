import { describe, it, expect } from 'vitest'
import { accentLisible, accentSur, contraste, melange, teintesPaysage, versRvb } from './paysage'
import { couleur } from '../design/tokens'

// Le paysage du profil se teinte à l'accent de chaque camping. Ces règles
// garantissent qu'il reste dessinable — et lisible — quelle que soit la
// couleur choisie par le gérant dans la console.

const ACCENTS = {
  vert: '#639922', canard: '#0e7490', bleu: '#1f6fd1', orange: '#e8590c', rouge: '#c92a2a',
  jaune: '#f5c400', clair: '#a5d8ff',
}
const HEX = /^#[0-9a-f]{6}$/

describe('couleurs', () => {
  it('lit les formes courte et longue, refuse le reste', () => {
    expect(versRvb('#0e7490')).toEqual([14, 116, 144])
    expect(versRvb('#fff')).toEqual([255, 255, 255])
    expect(versRvb(' #FFFFFF ')).toEqual([255, 255, 255])
    expect(versRvb('rouge')).toBeNull()
    expect(versRvb(null)).toBeNull()
  })

  it('mélange deux couleurs dans la proportion demandée', () => {
    expect(melange('#000000', '#ffffff', 1)).toBe('#000000')
    expect(melange('#000000', '#ffffff', 0)).toBe('#ffffff')
    expect(melange('#000000', '#ffffff', 0.5)).toBe('#808080')
  })

  it('retombe sur la couleur de la marque sans accent valide', () => {
    expect(accentSur(undefined)).toBe(couleur.marque)
    expect(accentSur('n’importe quoi')).toBe(couleur.marque)
    expect(teintesPaysage('').avant).toBe(couleur.marque)
  })
})

describe('accent en texte', () => {
  it('atteint 4,5:1 sur le fond, quel que soit l’accent', () => {
    for (const a of Object.values(ACCENTS)) {
      expect(contraste(accentLisible(a), couleur.fondClair)).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('ne touche pas un accent déjà lisible', () => {
    expect(accentLisible('#0e7490')).toBe('#0e7490')
  })
})

describe('paysage', () => {
  for (const [nom, a] of Object.entries(ACCENTS)) {
    it(`donne des teintes valides et étagées avec l’accent ${nom}`, () => {
      const c = teintesPaysage(a)
      for (const v of Object.values(c)) expect(v).toMatch(HEX)
      // Le ciel reste clair, la forêt sombre : les plans se lisent toujours.
      expect(contraste(c.cielHaut, '#000000')).toBeGreaterThan(12)
      expect(contraste(c.foret, '#ffffff')).toBeGreaterThan(4.5)
      // Le soleil se détache du ciel, la forêt du premier plan.
      expect(contraste(c.foret, c.avant)).toBeGreaterThan(1.4)
    })
  }

  it('garde un ciel et un soleil chauds, indépendants de l’accent', () => {
    expect(teintesPaysage(ACCENTS.vert).cielBas).toBe(teintesPaysage(ACCENTS.rouge).cielBas)
    expect(teintesPaysage(ACCENTS.bleu).soleil).toBe(teintesPaysage(ACCENTS.orange).soleil)
  })
})
