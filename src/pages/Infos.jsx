import { useState } from 'react'

const DEFAULT_INFOS = [
  { id: 'piscine',    emoji: '🏊', titre: 'Piscine',          contenu: 'Ouverte 9h – 20h\nSurveillée 10h – 19h' },
  { id: 'snack',      emoji: '🍺', titre: 'Bar / Snack',       contenu: 'Ouvert 10h – 23h\nPetit-déjeuner 8h – 10h30' },
  { id: 'reception',  emoji: '🏠', titre: 'Réception',         contenu: 'Lun – Ven : 8h – 19h\nSam – Dim : 8h – 20h' },
  { id: 'wifi',       emoji: '📶', titre: 'Wi-Fi',             contenu: 'Réseau : CampConnect\nCode : CAMPING2026' },
  { id: 'laverie',    emoji: '👕', titre: 'Laverie',           contenu: 'Ouverte 7h – 22h\nMachines disponibles en libre-service' },
  { id: 'poubelles',  emoji: '♻️', titre: 'Tri & Poubelles',  contenu: 'Zone tri au bloc sanitaire A\nEnlèvement : chaque matin à 8h' },
  { id: 'animaux',    emoji: '🐾', titre: 'Animaux',           contenu: 'Acceptés en laisse\nZone détente chiens : allée B' },
  { id: 'urgences',   emoji: '🚨', titre: 'Urgences',          contenu: 'Réception : 04 XX XX XX XX\nSAMU : 15 · Police : 17 · Pompiers : 18' },
]

export default function Infos({ camping }) {
  const couleur = camping?.couleur_principale || '#639922'
  const infos = (camping?.infos && camping.infos.length > 0) ? camping.infos : DEFAULT_INFOS
  const [open, setOpen] = useState(null)

  return (
    <div style={{ padding: '16px 16px 24px', maxWidth: 520, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: couleur, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>
          Livret d'accueil
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0d1f0d', margin: 0, lineHeight: 1.2 }}>
          Infos utiles
        </h1>
        <p style={{ fontSize: 13, color: '#6b7280', margin: '6px 0 0' }}>
          Tout ce qu'il faut savoir sur {camping?.nom || 'le camping'}
        </p>
      </div>

      {/* Cartes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {infos.map(info => (
          <button
            key={info.id}
            onClick={() => setOpen(open === info.id ? null : info.id)}
            style={{
              background: '#fff',
              border: `1.5px solid ${open === info.id ? couleur : '#e5e7eb'}`,
              borderRadius: 16,
              padding: '14px 16px',
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
              transition: 'border-color 0.15s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 42, height: 42,
                  background: open === info.id ? couleur + '18' : '#f5f2eb',
                  borderRadius: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20,
                  flexShrink: 0,
                }}>
                  {info.emoji}
                </div>
                <span style={{ fontWeight: 700, fontSize: 15, color: '#0d1f0d' }}>
                  {info.titre}
                </span>
              </div>
              <span style={{
                fontSize: 18,
                color: '#9ca3af',
                transform: open === info.id ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s',
                display: 'inline-block',
              }}>
                ›
              </span>
            </div>

            {open === info.id && (
              <div style={{
                marginTop: 12,
                paddingTop: 12,
                borderTop: '1px solid #f0f0f0',
                fontSize: 14,
                color: '#374151',
                lineHeight: 1.7,
                whiteSpace: 'pre-line',
              }}>
                {info.contenu}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Contact réception */}
      <div style={{
        marginTop: 24,
        background: '#0d1f0d',
        borderRadius: 16,
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
      }}>
        <div style={{ fontSize: 28 }}>📞</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#97C459' }}>Une question ?</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
            Passez à la réception ou signalez un problème à l'équipe.
          </div>
        </div>
      </div>
    </div>
  )
}
