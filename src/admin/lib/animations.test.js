import { describe, it, expect } from 'vitest'
import { creneauParDefaut, estPasse, dupliquerAnimation, dateLocale, heureLocale, tauxRemplissage } from './animations'

// Dates construites en heure locale : le test ne dépend pas du fuseau de la machine.
const local = (a, m, j, h, min = 0) => new Date(a, m - 1, j, h, min)

describe('créneau par défaut d’une nouvelle animation', () => {
  it('propose la prochaine heure pleine, le jour même', () => {
    expect(creneauParDefaut(local(2026, 10, 2, 18, 6))).toEqual({ dateStr: '2026-10-02', heureStr: '19:00' })
  })

  it('passe à l’heure suivante même pile sur l’heure', () => {
    expect(creneauParDefaut(local(2026, 10, 2, 9, 0))).toEqual({ dateStr: '2026-10-02', heureStr: '10:00' })
  })

  it('passe au lendemain après 23 h', () => {
    expect(creneauParDefaut(local(2026, 10, 2, 23, 40))).toEqual({ dateStr: '2026-10-03', heureStr: '00:00' })
    expect(creneauParDefaut(local(2026, 12, 31, 23, 5))).toEqual({ dateStr: '2027-01-01', heureStr: '00:00' })
  })

  it('n’est jamais dans le passé', () => {
    const maintenant = local(2026, 10, 2, 18, 59)
    const { dateStr, heureStr } = creneauParDefaut(maintenant)
    expect(estPasse(dateStr, heureStr, maintenant)).toBe(false)
  })
})

describe('animation dans le passé', () => {
  const maintenant = local(2026, 10, 2, 18, 6)
  it('repère un créneau déjà passé', () => {
    expect(estPasse('2026-10-02', '14:00', maintenant)).toBe(true)
    expect(estPasse('2026-10-01', '20:00', maintenant)).toBe(true)
  })
  it('accepte un créneau à venir', () => {
    expect(estPasse('2026-10-02', '18:30', maintenant)).toBe(false)
    expect(estPasse('2026-10-03', '09:00', maintenant)).toBe(false)
  })
  it('ne bloque pas une animation sans date', () => {
    expect(estPasse('', '', maintenant)).toBe(false)
  })
})

describe('dupliquer une animation', () => {
  const anim = {
    id: 'a1', created_at: '2026-09-01T10:00:00Z', camping_id: 'c1',
    titre: 'Aquagym', emoji: '🏊', lieu: 'Piscine', places_max: 12,
    description: 'Bonnet obligatoire', publiee: true,
    debut: local(2026, 10, 2, 10, 30).toISOString(),
  }

  it('garde tout sauf l’identifiant, à la même heure une semaine plus tard', () => {
    const copie = dupliquerAnimation(anim)
    expect(copie.id).toBeUndefined()
    expect(copie.created_at).toBeUndefined()
    expect(copie).toMatchObject({ titre: 'Aquagym', emoji: '🏊', lieu: 'Piscine', places_max: 12, description: 'Bonnet obligatoire' })
    const d = new Date(copie.debut)
    expect(dateLocale(d)).toBe('2026-10-09')
    expect(heureLocale(d)).toBe('10:30')
  })

  it('garde l’heure d’horloge au changement d’heure', () => {
    const copie = dupliquerAnimation({ ...anim, debut: local(2026, 10, 21, 10, 0).toISOString() })
    const d = new Date(copie.debut)
    expect(dateLocale(d)).toBe('2026-10-28')
    expect(heureLocale(d)).toBe('10:00')
  })
})

describe('taux de remplissage', () => {
  const maintenant = new Date('2026-10-02T12:00:00Z').getTime()
  const anims = [
    { id: 'aqua',    places_max: 10, debut: '2026-10-03T08:00:00Z' },
    { id: 'concert', places_max: null, debut: '2026-10-03T19:00:00Z' },
    { id: 'passee',  places_max: 10, debut: '2026-09-30T08:00:00Z' },
    { id: 'poterie', places_max: 10, debut: '2026-10-04T14:00:00Z' },
  ]
  const inscrits = (id, n) => Array.from({ length: n }, () => ({ animation_id: id }))

  it('ne compte que les animations à venir à places limitées', () => {
    const insc = [...inscrits('aqua', 10), ...inscrits('concert', 30), ...inscrits('passee', 10)]
    expect(tauxRemplissage(anims, insc, maintenant)).toBe(50)
  })

  it('ne dépasse jamais 100 %', () => {
    const insc = [...inscrits('aqua', 25), ...inscrits('poterie', 10)]
    expect(tauxRemplissage(anims, insc, maintenant)).toBe(100)
  })

  it('vaut 0 sans animation comptable', () => {
    expect(tauxRemplissage([], [], maintenant)).toBe(0)
    expect(tauxRemplissage([anims[1]], inscrits('concert', 5), maintenant)).toBe(0)
  })
})
