// Capture chaque écran de la démo, pour comparer avant et après une migration.
// Sans référence, « je crois que ça n'a pas bougé » n'est pas une vérification.
import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'

const DOSSIER = process.argv[2] || '/tmp/ecrans'
const PORT = process.argv[3] || 5300
const ECRANS = ['accueil', 'groupes', 'agenda', 'infos', 'profil', 'chat', 'admin', 'onboarding']

mkdirSync(DOSSIER, { recursive: true })
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const p = await b.newPage({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, locale: 'fr-FR' })
const erreurs = []
p.on('pageerror', e => erreurs.push(String(e).slice(0, 120)))

for (const e of ECRANS) {
  await p.goto(`http://localhost:${PORT}/demo.html?s=${e}`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(1100)
  await p.screenshot({ path: `${DOSSIER}/${e}.png`, fullPage: true })
}
console.log(erreurs.length ? `erreurs page : ${erreurs.join(' | ')}` : 'aucune erreur de page')
await b.close()
