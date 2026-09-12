import { describe, it, expect } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import Icone from '../design/Icone'
import { NOMS_ICONES } from '../design/icones'
import AdminLayout from './AdminLayout'

// La barre du bas de l'administration portait neuf icônes sans libellé : sur
// un écran de 390 pt, 43 pt par cible, sous le minimum de 44 pt d'Apple. La
// règle vérifiée ici est celle-là — le nombre d'entrées, pas leur apparence.

// Le rendu doit être celui du client : la largeur est lue par
// useSyncExternalStore, dont l'instantané serveur suppose toujours un écran
// large. Un rendu SSR ne verrait donc jamais la barre du bas.
const rendre = (largeur) => {
  window.matchMedia = (requete) => ({
    matches: largeur < 768 && requete.includes('max-width'),
    addEventListener() {}, removeEventListener() {},
  })
  const hote = document.createElement('div')
  document.body.appendChild(hote)
  const racine = createRoot(hote)
  act(() => {
    racine.render(
      <MemoryRouter initialEntries={['/admin/overview']}>
        <AdminLayout gerant={{ email: 'g@ex.fr' }} camping={{ nom: 'Les Flots Bleus' }} onLogout={() => {}} />
      </MemoryRouter>
    )
  })
  const html = hote.innerHTML
  act(() => racine.unmount())
  hote.remove()
  return html
}

describe('navigation de l’administration', () => {
  it('ne met que cinq cibles dans la barre du bas', () => {
    const m = rendre(390)
    const barre = m.match(/<nav[^>]*data-barre="bas"[\s\S]*?<\/nav>/)?.[0]
    expect(barre).toBeTruthy()
    const cibles = (barre.match(/<a |<button /g) || []).length
    expect(cibles).toBe(5)
  })

  it('donne un libellé lisible à chaque cible', () => {
    const barre = rendre(390).match(/<nav[^>]*data-barre="bas"[\s\S]*?<\/nav>/)?.[0]
    for (const mot of ['Accueil', 'Animations', 'Signalements', 'Modération', 'Réglages']) {
      expect(barre).toContain(mot)
    }
  })

  it('range les neuf écrans en deux groupes sur écran large', () => {
    const m = rendre(1200)
    expect(m).toContain('Au quotidien')
    expect(m).toContain('Configuration')
    // Le menu latéral, lui, les montre tous.
    for (const mot of ['Carte', 'Apparence', 'Infos pratiques', 'Statistiques', 'Paramètres']) {
      expect(m).toContain(mot)
    }
  })
})

describe('Icone', () => {
  it('suit la couleur du texte et ne s’annonce pas', () => {
    const m = renderToStaticMarkup(<Icone nom="accueil" />)
    expect(m).toContain('stroke="currentColor"')
    expect(m).toContain('aria-hidden="true"')
  })

  it('ne rend rien plutôt qu’un carré vide pour un nom inconnu', () => {
    expect(renderToStaticMarkup(<Icone nom="inexistante" />)).toBe('')
  })

  it('partage la même grille pour tous les tracés', () => {
    for (const nom of NOMS_ICONES) {
      expect(renderToStaticMarkup(<Icone nom={nom} />)).toContain('viewBox="0 0 24 24"')
    }
  })
})
