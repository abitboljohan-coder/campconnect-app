import { describe, it, expect, beforeEach, vi } from 'vitest'

// Le client Supabase est remplacé : ces tests portent sur les règles de
// modération, pas sur le réseau. Chaque cas décide lui-même si la base répond,
// échoue, ou reste muette — c'est précisément là que les bugs se logent.
const etatBase = { blocages: [], erreurLecture: false, insertions: [] }

vi.mock('../supabase', () => ({
  supabase: {
    from(table) {
      const q = {
        select: () => q,
        eq: () => q,
        then: (r) => r(
          etatBase.erreurLecture
            ? { data: null, error: new Error('hors ligne') }
            : { data: etatBase.blocages, error: null }
        ),
        upsert: async (lignes) => {
          const l = Array.isArray(lignes) ? lignes : [lignes]
          if (table === 'blocages') etatBase.blocages.push(...l.map(x => ({ bloque_id: x.bloque_id })))
          return { error: null }
        },
        insert: async (ligne) => { etatBase.insertions.push({ table, ...ligne }); return { error: null } },
        delete: () => ({ eq: () => ({ eq: async () => ({ error: null }) }) }),
      }
      return q
    },
  },
}))

const { blocages, bloquer, chargerBlocages, estBloque } = await import('./moderation')

const MOI = 'vac-moi'

beforeEach(() => {
  etatBase.blocages = []
  etatBase.erreurLecture = false
  etatBase.insertions = []
  localStorage.clear()
  // le cache du module suit l'identifiant : on le force à se recharger
  blocages('autre-identite')
})

describe('blocage', () => {
  it('masque immédiatement, sans attendre le réseau', async () => {
    const p = bloquer(MOI, 'vac-gene')
    // l'effet est visible avant même que la promesse ne soit résolue
    expect(estBloque(MOI, 'vac-gene')).toBe(true)
    await p
  })

  it('prévient l’équipe du camping du contenu à l’origine du blocage', async () => {
    await bloquer(MOI, 'vac-gene', {
      campingId: 'camp-1', cibleType: 'message', cibleId: 'msg-9', texte: 'propos déplacés',
    })
    const remontee = etatBase.insertions.find(i => i.table === 'signalements')
    expect(remontee).toBeTruthy()
    expect(remontee.categorie).toBe('blocage')
    expect(remontee.auteur_signale_id).toBe('vac-gene')
    expect(remontee.cible_texte).toBe('propos déplacés')
  })

  it('ne remonte rien si le camping est inconnu', async () => {
    await bloquer(MOI, 'vac-gene')
    expect(etatBase.insertions.length).toBe(0)
  })

  it('refuse qu’un vacancier se bloque lui-même', async () => {
    expect(await bloquer(MOI, MOI)).toBe(false)
    expect(estBloque(MOI, MOI)).toBe(false)
  })
})

describe('synchronisation des blocages', () => {
  it('ne perd pas un blocage que la base ignore encore', async () => {
    // Le bug corrigé : remplacer le cache local par la réponse du serveur
    // faisait réapparaître une personne bloquée dès que l'enregistrement avait
    // échoué — hors ligne, par exemple.
    localStorage.setItem(`blocages_${MOI}`, JSON.stringify(['vac-gene']))
    blocages('autre')                    // vide le cache mémoire
    etatBase.blocages = []               // la base, elle, ne le connaît pas
    await chargerBlocages(MOI)
    expect(estBloque(MOI, 'vac-gene')).toBe(true)
  })

  it('rattrape en base ce qui n’existait qu’en local', async () => {
    localStorage.setItem(`blocages_${MOI}`, JSON.stringify(['vac-gene']))
    blocages('autre')
    etatBase.blocages = []
    await chargerBlocages(MOI)
    expect(etatBase.blocages.some(b => b.bloque_id === 'vac-gene')).toBe(true)
  })

  it('retrouve un blocage posé sur un autre appareil', async () => {
    etatBase.blocages = [{ bloque_id: 'vac-ailleurs' }]
    await chargerBlocages(MOI)
    expect(estBloque(MOI, 'vac-ailleurs')).toBe(true)
  })

  it('garde le cache local quand la base est injoignable', async () => {
    localStorage.setItem(`blocages_${MOI}`, JSON.stringify(['vac-gene']))
    blocages('autre')
    etatBase.erreurLecture = true
    await chargerBlocages(MOI)
    expect(estBloque(MOI, 'vac-gene')).toBe(true)
  })
})
