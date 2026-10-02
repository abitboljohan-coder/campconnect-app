import { describe, it, expect, vi, beforeEach } from 'vitest'

// La base est simulée : chaque cas décide si elle efface la ligne, la refuse
// en silence (zéro ligne, pas d'erreur — c'est ainsi qu'une RLS dit non) ou
// échoue.
const reponse = { data: [{ id: 'm1' }], error: null }
const filtres = []

vi.mock('../supabase', () => ({
  supabase: {
    from: () => {
      const q = {
        delete: () => q,
        eq: (col, val) => { filtres.push([col, val]); return q },
        select: async () => reponse,
      }
      return q
    },
  },
}))

const { retirerMessage, supprimerMessage } = await import('./messages')

describe('retirerMessage', () => {
  const liste = [{ id: 'm1', auteur_id: 'a' }, { id: 'm2', auteur_id: 'a' }, { id: 'm3', auteur_id: 'b' }]

  it('retire le message, et ses réactions avec lui', () => {
    const avec = [...liste, { id: 'm4', reactions: { '❤️': ['b'] } }]
    expect(retirerMessage(avec, 'm4').map(m => m.id)).toEqual(['m1', 'm2', 'm3'])
    expect(retirerMessage(liste, 'm2').map(m => m.id)).toEqual(['m1', 'm3'])
  })

  it("ignore un message d'un autre groupe sans recréer la liste", () => {
    expect(retirerMessage(liste, 'ailleurs')).toBe(liste)
  })
})

describe('supprimerMessage', () => {
  beforeEach(() => {
    filtres.length = 0
    reponse.data = [{ id: 'm1' }]
    reponse.error = null
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it("ne vise que le message de l'auteur", async () => {
    expect(await supprimerMessage('m1', 'moi')).toBe(true)
    expect(filtres).toEqual([['id', 'm1'], ['auteur_id', 'moi']])
  })

  it('tient un refus silencieux de la base pour un échec', async () => {
    reponse.data = []
    expect(await supprimerMessage('m1', 'moi')).toBe(false)
  })

  it('tient une erreur réseau pour un échec', async () => {
    reponse.data = null
    reponse.error = new Error('hors ligne')
    expect(await supprimerMessage('m1', 'moi')).toBe(false)
  })
})
