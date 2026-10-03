import { describe, it, expect } from 'vitest'
import { presentFilter, estPresent, avatarsPresentsParGroupe } from './presence'

const maintenant = new Date('2026-10-02T10:00:00Z')

describe('présence au camping', () => {
  it('compte présent jusqu’au jour du départ inclus', () => {
    expect(estPresent({ date_depart: '2026-10-02', created_at: '2026-08-01T10:00:00Z' }, maintenant)).toBe(true)
    expect(estPresent({ date_depart: '2026-10-01', created_at: '2026-09-30T10:00:00Z' }, maintenant)).toBe(false)
  })

  it('sans date de départ, ne compte présent que 7 jours après l’arrivée', () => {
    expect(estPresent({ date_depart: null, created_at: '2026-09-25T08:00:00Z' }, maintenant)).toBe(true)
    expect(estPresent({ date_depart: null, created_at: '2026-09-24T23:00:00Z' }, maintenant)).toBe(false)
    expect(estPresent({ date_depart: null, created_at: '2026-08-10T10:00:00Z' }, maintenant)).toBe(false)
  })

  it('traduit la même règle en filtre PostgREST', () => {
    expect(presentFilter(maintenant)).toBe(
      'date_depart.gte.2026-10-02,and(date_depart.is.null,created_at.gte.2026-09-25)'
    )
  })
})

describe('membres présents des groupes', () => {
  const presents = [
    { id: 'v1', avatar_emoji: '🏄‍♀️' },
    { id: 'v2', avatar_emoji: null },
  ]
  const membres = [
    { groupe_id: 'g1', vacancier_id: 'v1' },
    { groupe_id: 'g1', vacancier_id: 'v2' },
    { groupe_id: 'g1', vacancier_id: 'parti' },
    { groupe_id: 'g2', vacancier_id: 'parti' },
  ]

  it('ne garde que les présents, avec leur avatar ou 🙂 à défaut', () => {
    expect(avatarsPresentsParGroupe(membres, presents)).toEqual({ g1: ['🏄‍♀️', '🙂'] })
  })

  it('supporte des listes absentes', () => {
    expect(avatarsPresentsParGroupe(null, presents)).toEqual({})
    expect(avatarsPresentsParGroupe(membres, null)).toEqual({})
  })
})
