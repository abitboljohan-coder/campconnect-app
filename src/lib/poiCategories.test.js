import { describe, it, expect } from 'vitest'
import { desencombrer, estGenerique, PLAFOND_TOTAL } from './poiCategories'

// La lisibilité de la carte est ce qui décide un gérant en démonstration : une
// carte criblée de dizaines de pastilles identiques a déjà coûté un aller-retour.
// Ces règles sont donc vérifiées, pas seulement écrites.

const point = (emoji, label, i = 0, osm = true) => ({
  osm, emoji, label,
  lat: 43.2745 + i * 0.0019,
  lng: 6.5810 + i * 0.0013,
  id: `${emoji}-${i}`,
})

describe('desencombrer', () => {
  it('plafonne les équipements anonymes par catégorie', () => {
    const entree = Array.from({ length: 14 }, (_, i) => point('🅿️', 'Parking', i))
    const sortie = desencombrer(entree)
    expect(sortie.length).toBe(2)          // plafond des parkings anonymes
  })

  it('ne touche jamais aux points ajoutés à la main par le gérant', () => {
    const manuels = [
      { emoji: '🎪', label: 'Scène', lat: 43.27, lng: 6.58 },
      { emoji: '🏊', label: 'Bassin nordique', lat: 43.28, lng: 6.59 },
    ]
    const bruit = Array.from({ length: 30 }, (_, i) => point('♻️', 'Tri sélectif', i))
    const sortie = desencombrer([...manuels, ...bruit])
    for (const m of manuels) {
      expect(sortie.some(p => p.label === m.label)).toBe(true)
    }
  })

  it('garde un équipement nommé qu’une foule d’anonymes précède', () => {
    // Le bug corrigé : les compteurs étant partagés, quinze parkings sans nom
    // épuisaient le quota et le seul parking identifié était écarté.
    const anonymes = Array.from({ length: 15 }, (_, i) => point('🅿️', 'Parking', i))
    const nomme = point('🅿️', 'Parking visiteurs Nord', 40)
    const sortie = desencombrer([...anonymes, nomme])
    expect(sortie.some(p => p.label === 'Parking visiteurs Nord')).toBe(true)
  })

  it('respecte le plafond global sans faire disparaître une catégorie entière', () => {
    const entree = []
    const familles = ['🅿️', '♻️', '🚻', '🔌', '🚰', '🍽️', '🛒', '🍺', '🏊', '🎠', '🎾', '🧺']
    familles.forEach((e, f) => {
      for (let i = 0; i < 8; i++) entree.push(point(e, 'Générique', f * 10 + i))
    })
    const sortie = desencombrer(entree)
    expect(sortie.length).toBeLessThanOrEqual(PLAFOND_TOTAL)
    // chaque famille garde au moins un représentant
    const presents = new Set(sortie.map(p => p.emoji))
    expect(presents.size).toBe(familles.length)
  })

  it('résiste aux entrées vides ou mal formées', () => {
    expect(desencombrer([]).length).toBe(0)
    expect(desencombrer(null).length).toBe(0)
    expect(desencombrer([null, undefined, {}]).length).toBe(3)   // conservés tels quels
  })
})

describe('estGenerique', () => {
  it('reconnaît un libellé de catégorie comme anonyme', () => {
    expect(estGenerique({ label: 'Parking' })).toBe(true)
    expect(estGenerique({ label: 'Sanitaires' })).toBe(true)
  })

  it('considère un nom propre comme un choix humain', () => {
    expect(estGenerique({ label: 'Le Ponton' })).toBe(false)
    expect(estGenerique({ label: 'Piscine lagon' })).toBe(false)
  })

  it('fait confiance au drapeau interne quand il est présent', () => {
    // Un point fraîchement détecté le porte ; un point relu depuis la base non.
    expect(estGenerique({ label: 'Le Ponton', _generic: true })).toBe(true)
  })
})
