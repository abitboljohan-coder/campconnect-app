import { describe, it, expect, vi } from 'vitest'

// accesCamping importe le client Supabase : on le remplace, seul le calcul
// de l'heure est testé ici.
vi.mock('../../supabase', () => ({ supabase: {} }))

const { lienRejoindre } = await import('./liens')
const { msAvantNouveauCode } = await import('./accesCamping')

describe('lienRejoindre', () => {
  it("donne l'adresse publique sans clé", () => {
    expect(lienRejoindre('les-pins')).toBe('https://app.campconnect.fr/join/les-pins')
  })

  // Le QR code porte la clé secrète du camping : c'est elle, jugée par le
  // serveur, qui vaut preuve de présence.
  it('ajoute la clé du QR code quand elle est connue', () => {
    expect(lienRejoindre('les-pins', 'c0ffee00c0ffee00c0ffee00c0ffee00'))
      .toBe('https://app.campconnect.fr/join/les-pins?k=c0ffee00c0ffee00c0ffee00c0ffee00')
  })
})

describe('msAvantNouveauCode', () => {
  it("compte jusqu'au début de l'heure suivante", () => {
    expect(msAvantNouveauCode(Date.UTC(2026, 9, 3, 10, 58))).toBe(2 * 60_000)
    expect(msAvantNouveauCode(Date.UTC(2026, 9, 3, 11, 0))).toBe(3_600_000)
  })
})
