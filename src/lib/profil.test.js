import { describe, it, expect, afterEach } from 'vitest'
import { setLangue } from '../i18n'
import {
  AVEC, COLONNES_FICHE, INTERETS, champsArrivee, codeAvec, codesInterets, emojiAvec, emojiInteret,
  jourLocal, libelleAvec, libelleInteret, libelleAvecFr, libelleInteretFr, nuitsRestantes,
  phraseAvec, phraseCommuns, pointsCommuns,
} from './profil'
import { emojiAutorise } from './emojis'

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
    expect(codesInterets(['Astronomie'])).toEqual(['Astronomie'])
    expect(libelleInteret('Astronomie')).toBe('Astronomie')
    expect(emojiInteret('Astronomie')).toBe('')
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

  it('garde proposés tous les codes déjà enregistrés en base', () => {
    const historiques = ['sport', 'musique', 'nature', 'cuisine', 'jeux', 'lecture', 'randonnee', 'piscine', 'soirees', 'enfants']
    for (const c of historiques) expect(INTERETS).toContain(c)
    expect(AVEC).toEqual(['solo', 'couple', 'amis', 'famille'])
  })

  it('propose une liste de centres d’intérêt raisonnable, sans doublon', () => {
    expect(new Set(INTERETS).size).toBe(INTERETS.length)
    expect(INTERETS.length).toBeGreaterThanOrEqual(16)
    expect(INTERETS.length).toBeLessThanOrEqual(18)
    for (const c of ['padel', 'paddle', 'yoga', 'velo', 'apero', 'petanque', 'plage', 'photo']) {
      expect(INTERETS).toContain(c)
    }
  })

  it('a un emoji autorisé pour chaque choix, ancien libellé compris', () => {
    for (const c of INTERETS) expect(emojiAutorise(emojiInteret(c))).toBe(true)
    for (const c of AVEC) expect(emojiAutorise(emojiAvec(c))).toBe(true)
    expect(emojiInteret('Randonnée')).toBe(emojiInteret('randonnee'))
    expect(emojiAvec('En famille')).toBe(emojiAvec('famille'))
  })

  it('donne aux nouveaux codes un libellé français pour le gérant', () => {
    expect(libelleInteretFr('apero')).toBe('Apéro')
    expect(libelleInteretFr('paddle')).toBe('Paddle & kayak')
    expect(libelleInteretFr('velo')).toBe('Vélo')
  })

  it('regroupe anciennes et nouvelles valeurs sous le même libellé pour le gérant', () => {
    expect(libelleAvecFr('couple')).toBe('En couple')
    expect(libelleAvecFr('En couple')).toBe('En couple')
    expect(libelleInteretFr('randonnee')).toBe('Randonnée')
    expect(libelleInteretFr('Randonnée')).toBe('Randonnée')
  })
})

describe('nuits restantes avant le départ', () => {
  it('compte les nuits jusqu’au départ', () => {
    expect(nuitsRestantes('2026-10-07', '2026-10-02')).toBe(5)
    expect(nuitsRestantes('2026-10-03', '2026-10-02')).toBe(1)
  })

  it('vaut 0 le jour du départ', () => {
    expect(nuitsRestantes('2026-10-02', '2026-10-02')).toBe(0)
  })

  it('ne renvoie rien sans date, ou une fois le départ passé', () => {
    expect(nuitsRestantes(null, '2026-10-02')).toBeNull()
    expect(nuitsRestantes('', '2026-10-02')).toBeNull()
    expect(nuitsRestantes('2026-09-30', '2026-10-02')).toBeNull()
  })

  it('franchit les changements de mois et d’heure', () => {
    expect(nuitsRestantes('2026-11-02', '2026-10-24')).toBe(9)   // passage à l'heure d'hiver le 25
  })

  it('prend la date du téléphone, pas celle de l’UTC', () => {
    expect(jourLocal(new Date(2026, 0, 5, 0, 30))).toBe('2026-01-05')
    expect(jourLocal(new Date(2026, 11, 31, 23, 59))).toBe('2026-12-31')
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

describe('mini-fiche d’un autre vacancier', () => {
  it('trouve les centres d’intérêt partagés, dans l’ordre de l’autre', () => {
    expect(pointsCommuns(['plage', 'apero', 'yoga'], ['padel', 'yoga', 'plage'])).toEqual(['yoga', 'plage'])
    expect(pointsCommuns(['plage'], ['padel'])).toEqual([])
  })

  it('reconnaît un ancien libellé français des deux côtés', () => {
    expect(pointsCommuns(['Randonnée', 'Sport'], ['randonnee', 'sport', 'jeux'])).toEqual(['randonnee', 'sport'])
    expect(pointsCommuns(['plage'], ['Plage', 'plage'])).toEqual(['plage'])
  })

  it('tolère un profil vide de part ou d’autre', () => {
    expect(pointsCommuns(null, ['plage'])).toEqual([])
    expect(pointsCommuns(['plage'], undefined)).toEqual([])
  })

  it('dit un point commun en une phrase, plusieurs en un compte', () => {
    expect(phraseCommuns(['padel'])).toBe('Vous aimez tous les deux le padel')
    expect(phraseCommuns(['apero'])).toBe('Vous aimez tous les deux l’apéro')
    expect(phraseCommuns(['plage', 'apero', 'paddle'])).toBe('3 centres d’intérêt en commun')
    expect(phraseCommuns([])).toBeNull()
    expect(phraseCommuns(['Pétanque géante'])).toBe('Vous aimez tous les deux Pétanque géante')
    setLangue('en')
    expect(phraseCommuns(['padel'])).toBe('You both love padel')
    expect(phraseCommuns(['plage', 'yoga'])).toBe('2 interests in common')
  })

  it('a une phrase traduite pour chaque centre d’intérêt et chaque « Je voyage »', () => {
    for (const langue of ['fr', 'en', 'es', 'nl']) {
      setLangue(langue)
      for (const c of INTERETS) expect(phraseCommuns([c])).not.toMatch(/profil\.|fiche\./)
      for (const c of AVEC) expect(phraseAvec(c)).not.toMatch(/^profil\./)
    }
  })

  it('dit le « Je voyage » en phrase, ancienne valeur comme nouvelle', () => {
    expect(phraseAvec('amis')).toBe('En vacances entre amis')
    expect(phraseAvec('Entre amis')).toBe('En vacances entre amis')
    expect(phraseAvec('Avec mon chien')).toBe('Avec mon chien')
  })

  it('ne lit ni l’emplacement, ni l’âge, ni la date de départ', () => {
    const colonnes = COLONNES_FICHE.split(',').map(c => c.trim())
    expect(colonnes).toEqual(['id', 'pseudo', 'avatar_emoji', 'avec', 'interests'])
    for (const interdite of ['*', 'emplacement', 'tranche_age', 'date_depart', 'device_id', 'user_id']) {
      expect(colonnes).not.toContain(interdite)
    }
  })
})
