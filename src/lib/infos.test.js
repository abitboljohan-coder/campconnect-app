import { describe, expect, it } from 'vitest'
import { MODELES_INFOS, decouperTelephones, estModele, infosPubliables } from './infos'

describe('infosPubliables', () => {
  it("ne retombe jamais sur des modèles quand rien n'est saisi", () => {
    expect(infosPubliables(undefined)).toEqual([])
    expect(infosPubliables(null)).toEqual([])
    expect(infosPubliables({})).toEqual([]) // valeur par défaut de la colonne
    expect(infosPubliables([])).toEqual([])
  })

  it('écarte les modèles enregistrés tels quels, même renommés', () => {
    expect(infosPubliables(MODELES_INFOS)).toEqual([])
    const wifi = MODELES_INFOS.find(m => m.id === 'wifi')
    expect(estModele({ ...wifi, titre: 'Internet' })).toBe(true)
  })

  it('garde le contenu réel du gérant, et lui seul', () => {
    const vraie = { id: 'wifi', emoji: '📶', titre: 'Wi-Fi', contenu: 'Code : grimaud2026' }
    expect(infosPubliables([
      vraie,
      { id: 'x', titre: 'Sans contenu', contenu: '  ' },
      { id: 'y', titre: '', contenu: 'Sans titre' },
    ])).toEqual([vraie])
  })
})

describe('decouperTelephones', () => {
  const numeros = (texte) => decouperTelephones(texte).filter(m => m.tel).map(m => m.tel)

  it('rend appelables les numéros complets', () => {
    expect(numeros('Réception : 04 94 56 00 00')).toEqual(['0494560000'])
    expect(numeros('Urgence nuit : 06.12.34.56.78')).toEqual(['0612345678'])
    expect(numeros('Gardien +33 6 12 34 56 78')).toEqual(['+33612345678'])
  })

  it("rend appelables les numéros d'urgence courts placés après leur nom", () => {
    expect(numeros('SAMU 15 · Police 17 · Pompiers 18\nUrgence européenne : 112'))
      .toEqual(['15', '17', '18', '112'])
  })

  it("ne prend pas pour un numéro une heure, un prix ou une durée", () => {
    expect(numeros('Toboggans 11h – 13h et 15h – 18h')).toEqual([])
    expect(numeros('15 minutes de traversée, 8 € l’aller')).toEqual([])
    expect(numeros('Réception : 04 XX XX XX XX')).toEqual([])
    expect(numeros('Commande n° 1204945600001')).toEqual([])
  })

  it('restitue le texte intact autour des liens', () => {
    const texte = 'Réception : 04 94 56 00 00\nSAMU : 15 · fin'
    expect(decouperTelephones(texte).map(m => m.texte).join('')).toBe(texte)
    expect(decouperTelephones('')).toEqual([])
  })
})
