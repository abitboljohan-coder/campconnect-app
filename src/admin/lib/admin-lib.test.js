import { describe, it, expect } from 'vitest'
import { barycentre } from './geo'
import { celluleCsv, versCsv } from './csv'
import { traduireErreur, ERREUR_GENERIQUE } from './erreurs'

describe('barycentre', () => {
  it('donne le centre d’un rectangle', () => {
    const c = barycentre([[44.2022, 6.2996], [44.2022, 6.3030], [44.1998, 6.3030], [44.1998, 6.2996]])
    expect(c.lat).toBeCloseTo(44.2010, 6)
    expect(c.lng).toBeCloseTo(6.3013, 6)
  })
  it('renvoie null sans point exploitable', () => {
    expect(barycentre([])).toBeNull()
    expect(barycentre(null)).toBeNull()
    expect(barycentre([[NaN, 1]])).toBeNull()
  })
  it('ignore les points invalides', () => {
    expect(barycentre([[10, 20], [null, 5], [20, 40]])).toEqual({ lat: 15, lng: 30 })
  })
})

describe('celluleCsv', () => {
  it('neutralise les formules', () => {
    expect(celluleCsv('=LIEN_HYPERTEXTE("http://x";"clic")')).toBe('"\'=LIEN_HYPERTEXTE(""http://x"";""clic"")"')
    expect(celluleCsv('+33612')).toBe('"\'+33612"')
    expect(celluleCsv('-2+3')).toBe('"\'-2+3"')
    expect(celluleCsv('@SOMME(A1)')).toBe('"\'@SOMME(A1)"')
    expect(celluleCsv('\tx')).toBe('"\'\tx"')
    expect(celluleCsv('\rx')).toBe('"\'\rx"')
  })
  it('laisse les valeurs ordinaires intactes et double les guillemets', () => {
    expect(celluleCsv('Julie')).toBe('"Julie"')
    expect(celluleCsv('Le "Chef"')).toBe('"Le ""Chef"""')
    expect(celluleCsv('a=b')).toBe('"a=b"')
    expect(celluleCsv(null)).toBe('""')
    expect(celluleCsv(12)).toBe('"12"')
  })
  it('assemble un fichier pour Excel', () => {
    expect(versCsv(['Pseudo', 'Emplacement'], [['Julie', 'B12'], ['=1+1', '']]))
      .toBe('﻿"Pseudo";"Emplacement"\r\n"Julie";"B12"\r\n"\'=1+1";""')
  })
})

describe('traduireErreur', () => {
  it('traduit les messages Supabase connus', () => {
    expect(traduireErreur({ message: 'Invalid login credentials' })).toBe('Email ou mot de passe incorrect.')
    expect(traduireErreur('Email rate limit exceeded')).toMatch(/Trop de tentatives/)
    expect(traduireErreur(new TypeError('Failed to fetch'))).toMatch(/Pas de connexion/)
    expect(traduireErreur({ message: 'User already registered' })).toMatch(/existe déjà/)
  })
  it('remplace un message inconnu par un texte en français', () => {
    expect(traduireErreur({ message: 'new row violates row-level security policy' })).toBe(ERREUR_GENERIQUE)
    expect(traduireErreur(null, 'Repli')).toBe('Repli')
  })
})
