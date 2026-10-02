import { useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { couleur as jetons } from '../../design'
import { isNative } from '../../native'
import { esc } from '../../utils/esc'
import { MESSAGE_ORDINATEUR } from '../lib/liens'
import { toast } from '../../toast'

// 1200 px : net une fois imprimé en A5 ou A4 (400 px devenaient flous).
const TAILLE_EXPORT = 1200
const PHRASE_AFFICHE = 'Scannez pour rejoindre les vacanciers du camping'

export default function QRCodeGenerator({ url, campingNom }) {
  const containerRef = useRef(null)

  function svgDuQr() {
    return containerRef.current?.querySelector('svg')
  }

  function telecharger() {
    const svg = svgDuQr()
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    canvas.width = TAILLE_EXPORT
    canvas.height = TAILLE_EXPORT
    const ctx = canvas.getContext('2d')

    const img = new Image()
    img.onload = () => {
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, TAILLE_EXPORT, TAILLE_EXPORT)
      ctx.drawImage(img, 0, 0, TAILLE_EXPORT, TAILLE_EXPORT)
      const a = document.createElement('a')
      a.download = `qrcode-${campingNom || 'camping'}.png`
      a.href = canvas.toDataURL('image/png')
      a.click()
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  }

  // Affiche A4 à poser à la réception : nom du camping, QR et une phrase.
  // Le nom est saisi par le gérant : échappé avant d'entrer dans le HTML.
  function imprimerAffiche() {
    const svg = svgDuQr()
    if (!svg) return
    const fenetre = window.open('', '_blank')
    if (!fenetre) { toast('Autorisez les fenêtres pop-up pour imprimer l’affiche.', 'erreur'); return }
    const qr = new XMLSerializer().serializeToString(svg)
    fenetre.document.write(`<!doctype html><html lang="fr"><head><meta charset="utf-8">
<title>Affiche QR — ${esc(campingNom || 'Camping')}</title>
<style>
  @page { size: A4; margin: 18mm; }
  body { font-family: system-ui, -apple-system, sans-serif; color: #0d1f0d; text-align: center; margin: 0; }
  h1 { font-size: 34pt; margin: 10mm 0 6mm; }
  p.phrase { font-size: 20pt; margin: 0 0 12mm; }
  .qr svg { width: 120mm; height: 120mm; }
  p.lien { font-size: 12pt; color: #555; margin-top: 8mm; word-break: break-all; }
</style></head><body>
<h1>${esc(campingNom || 'Camping')}</h1>
<p class="phrase">${esc(PHRASE_AFFICHE)}</p>
<div class="qr">${qr}</div>
<p class="lien">${esc(url)}</p>
</body></html>`)
    fenetre.document.close()
    fenetre.focus()
    fenetre.print()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 16 }}>
      <div ref={containerRef} style={{
        background: '#fff', padding: 16, borderRadius: 12,
        border: '1px solid rgba(0,0,0,0.07)',
        display: 'inline-flex',
      }}>
        {/* marginSize 4 : la « zone de silence » blanche qu'exigent les
            lecteurs de QR. Sans elle, le code imprimé sur un fond coloré se
            lisait mal. */}
        <QRCodeSVG value={url} size={160} marginSize={4} bgColor="#ffffff" fgColor="#0d1f0d" level="M" />
      </div>
      <div style={{ minWidth: 0, maxWidth: '100%' }}>
        <div style={{ fontSize: 13, color: jetons.texteDoux, marginBottom: 8, wordBreak: 'break-all' }}>
          {url}
        </div>
        {isNative ? (
          <p style={{ fontSize: 14, color: jetons.texteMoyen, margin: 0 }}>{MESSAGE_ORDINATEUR}</p>
        ) : (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={imprimerAffiche} style={bouton(true)}>
              🖨️ Imprimer l’affiche
            </button>
            <button onClick={telecharger} style={bouton(false)}>
              ⬇️ Télécharger l’image
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const bouton = (principal) => ({
  minHeight: 44, padding: '10px 18px', borderRadius: 10,
  background: principal ? jetons.marque : jetons.surfaceDouce,
  color: principal ? '#fff' : jetons.texteMoyen,
  fontSize: 14, fontWeight: 600,
})
