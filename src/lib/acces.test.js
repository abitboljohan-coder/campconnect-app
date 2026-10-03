import { describe, it, expect } from 'vitest'
import { estJoignable, estAccesLibre, cleDuLien, messageAcces, estRefusDePreuve } from './acces'

const CLE = 'c0ffee00c0ffee00c0ffee00c0ffee00'

describe('cleDuLien', () => {
  it('lit la clé du QR dans le lien web et dans le lien de l’app', () => {
    expect(cleDuLien(`https://app.campconnect.fr/join/les-pins?k=${CLE}`)).toBe(CLE)
    expect(cleDuLien(`campconnect://join/les-pins?k=${CLE}`)).toBe(CLE)
    expect(cleDuLien(`?utm=x&k=${CLE.toUpperCase()}#haut`)).toBe(CLE)
  })

  // Un ancien QR (sans clé) ou un lien bricolé ne doit rien ouvrir : sans clé
  // lisible, l'écran passe au GPS et au code.
  it('ne rend rien sans clé valable', () => {
    expect(cleDuLien('https://app.campconnect.fr/join/les-pins')).toBeNull()
    expect(cleDuLien('https://app.campconnect.fr/join/les-pins?k=1234')).toBeNull()
    expect(cleDuLien(`?k=${CLE}zz`)).toBeNull()
    expect(cleDuLien(null)).toBeNull()
  })
})

describe('messageAcces', () => {
  it('donne un message clair pour chaque refus du serveur', () => {
    expect(messageAcces('code_faux')).toBe('onb.code_erreur')
    expect(messageAcces('trop_essais')).toBe('onb.code_trop')
    expect(messageAcces('qr_perime')).toBe('onb.qr_perime')
    expect(messageAcces('verification_expiree')).toBe('onb.verif_expiree')
    expect(messageAcces('reseau')).toBe('onb.err_generique')
    expect(messageAcces(undefined)).toBe('onb.err_generique')
  })

  it('distingue les refus de preuve, qui renvoient à la vérification', () => {
    expect(estRefusDePreuve('verification_expiree')).toBe(true)
    expect(estRefusDePreuve('qr_perime')).toBe(true)
    expect(estRefusDePreuve('pseudo_obligatoire')).toBe(false)
    expect(estRefusDePreuve('toString')).toBe(false)
  })
})

// Un camping sans accès libre et sans centre GPS ne peut dire oui à personne :
// le contrôle de présence n'a rien à comparer, il échoue, et l'écran retombe
// sur un code du jour qu'un camping non configuré n'affiche nulle part. La
// règle ci-dessous est ce qui évite d'envoyer un vacancier devant cette porte.

describe('estAccesLibre', () => {
  it("n'ouvre que sur le booléen vrai", () => {
    expect(estAccesLibre({ carte_config: { acces_libre: true } })).toBe(true)
    // carte_config est du jsonb : une valeur mal écrite ne doit pas ouvrir un
    // camping réel, dont la vérification de présence est la seule protection.
    expect(estAccesLibre({ carte_config: { acces_libre: 'true' } })).toBe(false)
    expect(estAccesLibre({ carte_config: { acces_libre: 1 } })).toBe(false)
    expect(estAccesLibre({ carte_config: {} })).toBe(false)
    expect(estAccesLibre(null)).toBe(false)
  })
})

describe('estJoignable', () => {
  it('accepte un camping en accès libre, même sans centre', () => {
    expect(estJoignable({ carte_config: { acces_libre: true } })).toBe(true)
  })

  it('accepte un camping calibré, même sans accès libre', () => {
    expect(estJoignable({ carte_config: { center: { lat: 43.6, lng: 3.9 } } })).toBe(true)
  })

  it('refuse un camping sans accès libre ni centre', () => {
    expect(estJoignable({ carte_config: {} })).toBe(false)
    expect(estJoignable({ carte_config: null })).toBe(false)
    expect(estJoignable({})).toBe(false)
    expect(estJoignable(null)).toBe(false)
  })

  it('refuse un centre incomplet plutôt que de calculer sur undefined', () => {
    expect(estJoignable({ carte_config: { center: { lat: 43.6 } } })).toBe(false)
    expect(estJoignable({ carte_config: { center: {} } })).toBe(false)
  })

  it("ne prend pas une chaîne « true » pour un accès libre", () => {
    // carte_config est du jsonb : une valeur mal écrite ne doit pas ouvrir
    // un camping que personne n'a configuré.
    expect(estJoignable({ carte_config: { acces_libre: 'true' } })).toBe(false)
  })
})
