import { describe, it, expect } from 'vitest'
import { estJoignable } from './Onboarding'

// Un camping sans accès libre et sans centre GPS ne peut dire oui à personne :
// le contrôle de présence n'a rien à comparer, il échoue, et l'écran retombe
// sur un code du jour qu'un camping non configuré n'affiche nulle part. La
// règle ci-dessous est ce qui évite d'envoyer un vacancier devant cette porte.

describe('estJoignable', () => {
  it('accepte un camping en accès libre, même sans centre', () => {
    expect(estJoignable({ carte_config: { acces_libre: true } })).toBe(true)
  })

  it('accepte un camping calibré, même sans accès libre', () => {
    expect(estJoignable({ carte_config: { center: { lat: 43.6, lng: 3.9 } } })).toBe(true)
  })

  it('refuse un camping sans accès libre ni centre', () => {
    expect(estJoignable({ carte_config: {} })).toBe(false)
    expect(estJoignable({ carte_config: null })).toBe(false)
    expect(estJoignable({})).toBe(false)
    expect(estJoignable(null)).toBe(false)
  })

  it('refuse un centre incomplet plutôt que de calculer sur undefined', () => {
    expect(estJoignable({ carte_config: { center: { lat: 43.6 } } })).toBe(false)
    expect(estJoignable({ carte_config: { center: {} } })).toBe(false)
  })

  it("ne prend pas une chaîne « true » pour un accès libre", () => {
    // carte_config est du jsonb : une valeur mal écrite ne doit pas ouvrir
    // un camping que personne n'a configuré.
    expect(estJoignable({ carte_config: { acces_libre: 'true' } })).toBe(false)
  })
})
