import { describe, expect, it } from 'vitest'
import {
  CATEGORIES_EMOJIS, SUGGESTIONS_AVATARS, SUGGESTIONS_GROUPES, SUGGESTIONS_STATUTS,
  dernierEmoji, emojiAutorise, estEmoji, estRefuse,
} from './emojis'

describe('estEmoji', () => {
  it('accepte un emoji simple, composé, ou un drapeau', () => {
    expect(estEmoji('🎳')).toBe(true)
    expect(estEmoji('🏕️')).toBe(true)          // avec sélecteur de présentation
    expect(estEmoji('👨‍👩‍👧‍👦')).toBe(true)          // séquence ZWJ
    expect(estEmoji('👍🏽')).toBe(true)          // couleur de peau
    expect(estEmoji('🇫🇷')).toBe(true)
  })

  it('refuse le texte, les chiffres et plusieurs emojis', () => {
    expect(estEmoji('a')).toBe(false)
    expect(estEmoji('5')).toBe(false)
    expect(estEmoji('SEXE')).toBe(false)
    expect(estEmoji('🎳🎳')).toBe(false)
    expect(estEmoji('🎳 ')).toBe(false)
    expect(estEmoji('')).toBe(false)
    expect(estEmoji(null)).toBe(false)
  })
})

describe('estRefuse', () => {
  it('refuse les emojis à connotation sexuelle ou violente', () => {
    for (const e of ['🍆', '🍑', '💦', '👅', '🔞', '🖕', '🔫', '💊']) {
      expect(estRefuse(e)).toBe(true)
    }
  })

  it('refuse aussi leurs variantes de couleur de peau ou de présentation', () => {
    expect(estRefuse('🖕🏽')).toBe(true)
    expect(estRefuse('🗡')).toBe(true)          // sans sélecteur FE0F
    expect(estRefuse('🗡️')).toBe(true)
  })

  it('laisse passer le reste, drapeaux compris', () => {
    for (const e of ['🍌', '🍻', '🎳', '🏳️‍🌈', '🇳🇱', '❤️', '👍🏿']) {
      expect(estRefuse(e)).toBe(false)
    }
  })
})

describe('listes proposées', () => {
  it("ne contiennent que des emojis autorisés, sans doublon dans une liste", () => {
    const listes = [
      ...CATEGORIES_EMOJIS.map(c => c.emojis),
      SUGGESTIONS_GROUPES, SUGGESTIONS_STATUTS, SUGGESTIONS_AVATARS,
    ]
    for (const liste of listes) {
      for (const e of liste) expect(emojiAutorise(e), e).toBe(true)
      expect(new Set(liste).size).toBe(liste.length)
    }
  })
})

describe('dernierEmoji', () => {
  it('retrouve le dernier emoji tapé au clavier', () => {
    expect(dernierEmoji('🎳')).toBe('🎳')
    expect(dernierEmoji('🎳🏊')).toBe('🏊')
    expect(dernierEmoji('abc 👨‍👩‍👧 x')).toBe('👨‍👩‍👧')
  })

  it("renvoie null quand il n'y en a pas", () => {
    expect(dernierEmoji('bonjour')).toBe(null)
    expect(dernierEmoji('')).toBe(null)
  })
})
