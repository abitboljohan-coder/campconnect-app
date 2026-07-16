import { Component } from 'react'

// Empêche l'écran blanc : capture toute erreur de rendu et affiche un écran propre.
export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div style={{
        minHeight: '100dvh', background: '#0d1f0d', color: '#fff',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '24px 20px', textAlign: 'center', fontFamily: 'sans-serif',
      }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>🌲</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Oups, une erreur est survenue</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: 12, fontSize: 15, maxWidth: 320, lineHeight: 1.6 }}>
          Rechargez l'application. Si le problème persiste, contactez la réception.
        </p>
        <button
          onClick={() => { window.location.href = '/' }}
          style={{
            marginTop: 28, padding: '14px 28px', borderRadius: 12, border: 'none',
            background: '#639922', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
          }}
        >
          Recharger
        </button>
      </div>
    )
  }
}
