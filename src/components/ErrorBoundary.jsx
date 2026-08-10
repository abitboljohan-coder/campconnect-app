import { Component } from 'react'
import { t } from '../i18n'
import { couleur, espace, graisse, rayon, texte as tailles } from '../design'

// Empêche l'écran blanc : capture toute erreur de rendu et affiche un écran propre.
//
// Les couleurs sont écrites en dur plutôt que lues dans les propriétés
// personnalisées : cet écran doit s'afficher même quand le rendu a échoué
// avant que le thème du camping n'ait été appliqué.
export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div style={{
        minHeight: '100dvh', background: couleur.marqueSombre, color: '#fff',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: `${espace.xl}px 20px`, textAlign: 'center', fontFamily: 'sans-serif',
      }}>
        <div aria-hidden="true" style={{ fontSize: 52, marginBottom: espace.lg }}>🌲</div>
        <h1 style={{ fontSize: 22, fontWeight: graisse.titre, margin: 0 }}>
          {t('erreur.titre')}
        </h1>
        <p style={{
          color: 'rgba(255,255,255,0.72)', marginTop: espace.md,
          fontSize: tailles.moyen, maxWidth: 320, lineHeight: 1.6,
        }}>
          {t('erreur.texte')}
        </p>
        <button
          onClick={() => { window.location.href = '/' }}
          style={{
            marginTop: 28, padding: `${espace.lg}px 28px`, borderRadius: rayon.md, border: 'none',
            background: couleur.marque, color: '#fff',
            fontSize: tailles.moyen, fontWeight: graisse.titre, cursor: 'pointer',
          }}
        >
          {t('erreur.recharger')}
        </button>
      </div>
    )
  }
}
