import { afterEach, describe, expect, it, vi } from 'vitest'
import { estTableAbsente, toutCharger } from './reseau'

describe('toutCharger', () => {
  afterEach(() => vi.useRealTimers())

  it("renvoie les résultats dans l'ordre, sans erreur", async () => {
    const { resultats, error } = await toutCharger([
      Promise.resolve({ data: [1], error: null }),
      Promise.resolve({ count: 3, error: null }),
    ])
    expect(resultats[0].data).toEqual([1])
    expect(resultats[1].count).toBe(3)
    expect(error).toBe(null)
  })

  it("remonte la première erreur Supabase au lieu d'une liste vide", async () => {
    const { error } = await toutCharger([
      Promise.resolve({ data: [], error: null }),
      Promise.resolve({ data: null, error: { message: 'Failed to fetch' } }),
    ])
    expect(error.message).toBe('Failed to fetch')
  })

  it('transforme un rejet (hors ligne) en erreur', async () => {
    const { error } = await toutCharger([Promise.reject(new Error('offline'))])
    expect(error.message).toBe('offline')
  })

  it('abandonne après le délai maximal : le squelette ne tourne pas sans fin', async () => {
    vi.useFakeTimers()
    const attente = toutCharger([new Promise(() => {})], 1000)
    vi.advanceTimersByTime(1000)
    const { resultats, error } = await attente
    expect(error.code).toBe('delai')
    expect(resultats).toEqual([{}])
  })
})

describe('estTableAbsente', () => {
  it("distingue la table absente d'une coupure réseau", () => {
    expect(estTableAbsente({ code: '42P01' })).toBe(true)
    expect(estTableAbsente({ code: 'PGRST205' })).toBe(true)
    expect(estTableAbsente({ message: 'Failed to fetch' })).toBe(false)
    expect(estTableAbsente(null)).toBe(false)
  })
})
