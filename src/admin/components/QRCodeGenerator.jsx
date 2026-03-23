import { useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'

export default function QRCodeGenerator({ url, campingNom }) {
  const containerRef = useRef(null)

  function telecharger() {
    const svg = containerRef.current?.querySelector('svg')
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    canvas.width = 400
    canvas.height = 400
    const ctx = canvas.getContext('2d')

    const img = new Image()
    img.onload = () => {
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, 400, 400)
      ctx.drawImage(img, 0, 0, 400, 400)
      const a = document.createElement('a')
      a.download = `qrcode-${campingNom || 'camping'}.png`
      a.href = canvas.toDataURL('image/png')
      a.click()
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 16 }}>
      <div ref={containerRef} style={{
        background: '#fff', padding: 16, borderRadius: 12,
        border: '1px solid rgba(0,0,0,0.07)',
        display: 'inline-flex',
      }}>
        <QRCodeSVG value={url} size={160} bgColor="#ffffff" fgColor="#0d1f0d" level="M" />
      </div>
      <div>
        <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8, wordBreak: 'break-all' }}>
          {url}
        </div>
        <button
          onClick={telecharger}
          style={{
            padding: '10px 18px', borderRadius: 10,
            background: '#639922', color: '#fff',
            fontSize: 14, fontWeight: 600,
          }}
        >
          ⬇️ Télécharger PNG
        </button>
      </div>
    </div>
  )
}
