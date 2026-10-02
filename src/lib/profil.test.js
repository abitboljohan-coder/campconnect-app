import { describe, it, expect, afterEach } from 'vitest'
import { setLangue } from '../i18n'
import {
  AVEC, INTERETS, champsArrivee, codeAvec, codesInterets,
  libelleAvec, libelleInteret, libelleAvecFr, libelleInteretFr,
} from './profil'

// Les profils enregistrés avant les codes portent des libellés français. Aucune
// migration n'est faite : ces règles de lecture sont la seule garantie que ces
// profils restent lisibles, modifiables et comptés dans les statistiques.

afterEach(() => setLangue('fr'))

describe('choix du profil', () => {
  it('ramène les anciennes valeurs françaises à leur code', () => {
    expect(codeAvec('En couple')).toBe('couple')
    expect(codeAvec('Entre amis')).toBe('amis')
    expect(codeAvec('Solo')).toBe('solo')
    expect(codesInterets(['Randonnée', 'Soirées', 'Sport'])).toEqual(['randonnee', 'soirees', 'sport'])
  })

  it('laisse les codes tels quels', () => {
    expect(codeAvec('famille')).toBe('famille')
    expect(codesInterets(['piscine'])).toEqual(['piscine'])
  })

  it('ne perd jamais une valeur inconnue', () => {
    expect(codeAvec('Avec mon chien')).toBe('Avec mon chien')
    expect(libelleAvec('Avec mon chien')).toBe('Avec mon chien')
    expect(codesInterets(['Pétanque'])).toEqual(['Pétanque'])
  })

  it('compte une seule fois un intérêt présent sous ses deux formes', () => {
    expect(codesInterets(['Sport', 'sport', null])).toEqual(['sport'])
  })

  it('tolère un profil vide', () => {
    expect(codeAvec(null)).toBe('')
    expect(codesInterets(null)).toEqual([])
    expect(libelleAvecFr(undefined)).toBe('')
  })

  it('traduit à l’affichage, ancienne valeur comme nouvelle', () => {
    setLangue('en')
    expect(libelleAvec('En couple')).toBe('As a couple')
    expect(libelleAvec('couple')).toBe('As a couple')
    expect(libelleInteret('Randonnée')).toBe('Hiking')
    expect(libelleInteret('randonnee')).toBe('Hiking')
  })

  it('a un libellé traduit pour chaque code, dans chaque langue', () => {
    for (const langue of ['fr', 'en', 'es', 'nl']) {
      setLangue(langue)
      for (const c of AVEC) expect(libelleAvec(c)).not.toMatch(/^profil\./)
      for (const c of INTERETS) expect(libelleInteret(c)).not.toMatch(/^profil\./)
    }
  })

  it('regroupe anciennes et nouvelles valeurs sous le même libellé pour le gérant', () => {
    expect(libelleAvecFr('couple')).toBe('En couple')
    expect(libelleAvecFr('En couple')).toBe('En couple')
    expect(libelleInteretFr('randonnee')).toBe('Randonnée')
    expect(libelleInteretFr('Randonnée')).toBe('Randonnée')
  })
})

describe('retour sur un profil existant', () => {
  const vierge = { pseudo: ' Julie ', emplacement: '', avatar_emoji: '', date_depart: '' }
  const existant = { avatar_emoji: '🦊', emplacement: 'B12', date_depart: '2026-10-10' }

  it('garde ce que le formulaire laisse vide', () => {
    expect(champsArrivee(vierge, existant, '2026-10-02')).toEqual({
      pseudo: 'Julie', avatar_emoji: '🦊', emplacement: 'B12', date_depart: '2026-10-10',
    })
  })

  it('prend ce qui a été saisi', () => {
    const saisi = { pseudo: 'Julie', emplacement: 'C3', avatar_emoji: '🌲', date_depart: '2026-10-12' }
    expect(champsArrivee(saisi, existant, '2026-10-02')).toEqual({
      pseudo: 'Julie', avatar_emoji: '🌲', emplacement: 'C3', date_depart: '2026-10-12',
    })
  })

  it('ne reprend pas un départ passé, qui terminerait le nouveau séjour', () => {
    const passe = { ...existant, date_depart: '2025-08-20' }
    expect(champsArrivee(vierge, passe, '2026-10-02').date_depart).toBeNull()
  })

  it('part des valeurs par défaut pour un nouveau vacancier', () => {
    expect(champsArrivee(vierge, null, '2026-10-02')).toEqual({
      pseudo: 'Julie', avatar_emoji: '🏕️', emplacement: null, date_depart: null,
    })
  })
})
