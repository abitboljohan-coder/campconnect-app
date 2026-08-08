import { chromium } from 'playwright-core'
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
// iPad Air 11" : 820x1180 portrait, 1180x820 paysage (points)
const formats = [
  ['iPad portrait', 820, 1180],
  ['iPad paysage', 1180, 820],
  ['iPhone 14 Pro', 393, 852],
]
const ecrans = ['accueil', 'groupes', 'agenda', 'infos', 'chat']
for (const [nom, w, h] of formats) {
  const p = await b.newPage({ viewport:{width:w,height:h} })
  const soucis = []
  for (const s of ecrans) {
    await p.goto(`http://localhost:5200/demo.html?s=${s}`, { waitUntil:'networkidle' })
    await p.waitForTimeout(700)
    const m = await p.evaluate(() => {
      const de = document.documentElement
      const debordement = de.scrollWidth > de.clientWidth + 1
      // largeur du contenu principal : une app mobile etiree plein ecran sur
      // iPad donne des lignes de texte demesurees
      const main = document.querySelector('main') || document.querySelector('#root > div')
      const larg = main ? main.getBoundingClientRect().width : 0
      const cartes = [...document.querySelectorAll('div')].filter(d => {
        const r = d.getBoundingClientRect()
        return r.width > innerWidth * 0.9 && r.height > 60 && getComputedStyle(d).background !== 'none'
      }).length
      return { debordement, largeurPrincipale: Math.round(larg), largeurEcran: innerWidth, blocsPleineLargeur: cartes }
    })
    if (m.debordement) soucis.push(`${s}: débordement horizontal`)
    if (m.largeurPrincipale > 900) soucis.push(`${s}: contenu étiré sur ${m.largeurPrincipale}px`)
  }
  console.log(`${nom.padEnd(15)} ${w}×${h} → ${soucis.length ? soucis.join(' | ') : 'aucun débordement'}`)
  await p.goto('http://localhost:5200/demo.html?s=accueil', { waitUntil:'networkidle' })
  await p.waitForTimeout(700)
  await p.screenshot({ path:`/tmp/ipad_${nom.replace(/\W/g,'_')}.png` })
  await p.close()
}
await b.close()
