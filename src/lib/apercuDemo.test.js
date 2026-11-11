import { describe, it, expect, beforeEach } from 'vitest'
import {
  SLUGS_DEMO, estCampingDemo, preparerDemandeApercu, bandeauDejaVu, memoriserBandeau,
} from './apercuDemo'

// Le bandeau « Vous êtes gérant ? » ne doit exister que dans les campings de
// démo, et ne laisser partir vers `candidatures` qu'une saisie bornée.

describe('estCampingDemo', () => {
  it('reconnaît les deux campings de démo', () => {
    for (const slug of SLUGS_DEMO) expect(estCampingDemo({ slug })).toBe(true)
  })
  it('refuse un vrai camping, et l’absence de camping', () => {
    expect(estCampingDemo({ slug: 'camping-des-pins' })).toBe(false)
    expect(estCampingDemo({ slug: 'les-flots-bleus-2' })).toBe(false)
    expect(estCampingDemo(null)).toBe(false)
  })
})

describe('preparerDemandeApercu', () => {
  const slug = 'les-flots-bleus'

  it('range un email dans la colonne email', () => {
    const { ligne } = preparerDemandeApercu({ nomCamping: ' Camping des Pins ', contact: ' Gerant@Pins.fr ', slug })
    expect(ligne).toEqual({
      nom: null, email: 'gerant@pins.fr', camping: 'Camping des Pins', emplacements: null,
      message: "Demande d'aperçu (bandeau démo app, les-flots-bleus).",
    })
  })

  it('range un téléphone dans le message, email vide', () => {
    const { ligne } = preparerDemandeApercu({ nomCamping: 'Les Pins', contact: '01 23.45-67 89', slug: 'demo-rives-du-lac' })
    expect(ligne.email).toBeNull()
    expect(ligne.message).toBe("Demande d'aperçu (bandeau démo app, demo-rives-du-lac). Téléphone : 0123456789 (à rappeler).")
    expect(preparerDemandeApercu({ nomCamping: 'Les Pins', contact: '+33 1 23 45 67 89', slug }).ligne.message)
      .toContain('Téléphone : +33123456789 ')
  })

  it('refuse un contact qui n’est ni un email ni un téléphone', () => {
    for (const contact of ['', '   ', 'bonjour', 'a@b', '12345', '0123456789012345678', 'x'.repeat(130) + '@a.fr']) {
      expect(preparerDemandeApercu({ nomCamping: 'Les Pins', contact, slug })).toEqual({ erreur: 'contact' })
    }
  })

  it('refuse un nom de camping vide ou trop long', () => {
    for (const nomCamping of ['', ' a ', 'x'.repeat(121)]) {
      expect(preparerDemandeApercu({ nomCamping, contact: 'a@b.fr', slug })).toEqual({ erreur: 'camping' })
    }
  })

  it('retire balises et caractères de contrôle', () => {
    const { ligne } = preparerDemandeApercu({ nomCamping: '<b>Les\nPins</b>', contact: 'a@b.fr', slug })
    expect(ligne.camping).toBe('b Les Pins /b')
    expect(preparerDemandeApercu({ nomCamping: 'Les Pins', contact: '<a>@b.fr', slug })).toEqual({ erreur: 'contact' })
  })

  it('ne prépare rien hors d’un camping de démo', () => {
    expect(preparerDemandeApercu({ nomCamping: 'Les Pins', contact: 'a@b.fr', slug: 'camping-des-pins' }).ligne).toBeUndefined()
  })
})

describe('mémoire du bandeau', () => {
  beforeEach(() => localStorage.clear())
  it('ne se réaffiche plus une fois fermé ou envoyé', () => {
    expect(bandeauDejaVu()).toBe(false)
    memoriserBandeau('ferme')
    expect(bandeauDejaVu()).toBe(true)
  })
})
