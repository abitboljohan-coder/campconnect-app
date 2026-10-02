import { describe, expect, it } from 'vitest'
import { estActuel, estComplet, heurePrevue, libelleHeure } from './groupes'

const H = 3600 * 1000

describe('estActuel', () => {
  const maintenant = new Date('2026-08-10T20:00:00').getTime()

  it("garde un groupe jusqu'à trois heures après son heure", () => {
    expect(estActuel({ heure: new Date(maintenant - 2 * H).toISOString() }, maintenant)).toBe(true)
    expect(estActuel({ heure: new Date(maintenant - 4 * H).toISOString() }, maintenant)).toBe(false)
    expect(estActuel({ heure: new Date(maintenant + 12 * H).toISOString() }, maintenant)).toBe(true)
  })

  it('garde un groupe sans heure pendant vingt-quatre heures', () => {
    expect(estActuel({ created_at: new Date(maintenant - 20 * H).toISOString() }, maintenant)).toBe(true)
    expect(estActuel({ created_at: new Date(maintenant - 30 * H).toISOString() }, maintenant)).toBe(false)
  })

  it("ne cache pas un groupe dont l'heure est illisible", () => {
    const recent = new Date(maintenant - 2 * H).toISOString()
    expect(estActuel({ heure: '20:00', created_at: recent }, maintenant)).toBe(true)
    expect(estActuel({ heure: 'n/importe quoi' }, maintenant)).toBe(true)
  })
})

describe('heurePrevue', () => {
  it("rattache l'heure au jour même quand elle est à venir", () => {
    const d = heurePrevue('21:30', new Date('2026-08-10T20:00:00'))
    expect(d.getDate()).toBe(10)
    expect(d.getHours()).toBe(21)
    expect(d.getMinutes()).toBe(30)
  })

  it('passe au lendemain une heure déjà largement dépassée', () => {
    const d = heurePrevue('08:00', new Date('2026-08-10T20:00:00'))
    expect(d.getDate()).toBe(11)
    expect(d.getHours()).toBe(8)
  })

  it("garde le jour même pour un rendez-vous qui vient de commencer", () => {
    const d = heurePrevue('19:30', new Date('2026-08-10T20:00:00'))
    expect(d.getDate()).toBe(10)
  })

  it('ignore une saisie vide ou illisible', () => {
    expect(heurePrevue('')).toBe(null)
    expect(heurePrevue('xx:yy')).toBe(null)
  })
})

describe('estComplet', () => {
  it('compare au maximum fixé, et ne limite rien sans maximum', () => {
    expect(estComplet({ max_membres: 4 }, 4)).toBe(true)
    expect(estComplet({ max_membres: 4 }, 3)).toBe(false)
    expect(estComplet({ max_membres: null }, 99)).toBe(false)
  })
})

describe('libelleHeure', () => {
  const libelles = { aujourdhui: "Aujourd'hui", demain: 'Demain', locale: 'fr-FR' }
  const maintenant = new Date('2026-08-10T20:00:00')

  it("préfixe « Aujourd'hui » un rendez-vous du jour", () => {
    expect(libelleHeure(new Date('2026-08-10T21:30:00').toISOString(), libelles, maintenant)).toBe("Aujourd'hui 21:30")
  })

  it('préfixe « Demain » un rendez-vous du lendemain', () => {
    expect(libelleHeure(new Date('2026-08-11T08:00:00').toISOString(), libelles, maintenant)).toBe('Demain 08:00')
  })

  it('donne la date courte au-delà, et pour la veille', () => {
    const plusTard = libelleHeure(new Date('2026-08-13T18:00:00').toISOString(), libelles, maintenant)
    expect(plusTard).toMatch(/13/)
    expect(plusTard).toMatch(/18:00$/)
    expect(plusTard).not.toMatch(/Demain|Aujourd/)
    const veille = libelleHeure(new Date('2026-08-09T23:00:00').toISOString(), libelles, maintenant)
    expect(veille).toMatch(/23:00$/)
    expect(veille).not.toMatch(/Demain|Aujourd/)
  })

  it('ne renvoie rien sans heure lisible', () => {
    expect(libelleHeure(null, libelles, maintenant)).toBe(null)
    expect(libelleHeure('20:00', libelles, maintenant)).toBe(null)
  })
})
