// v2 renderer: full video, plate (no text), and isolated text layers with alpha
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const FPS = 30, DUR = 44;
const OUT = require('path').join(__dirname,'..','v2');
fs.mkdirSync(OUT + '/textes', { recursive: true });

const WARP = [[0, 8, 0, 8], [8, 11.5, 8, 10.5], [11.5, 14.5, 10.5, 13], [14.5, 18, 13, 15.5], [18, 21.5, 15.5, 18], [21.5, 24, 18, 20],
  [24, 26.5, 20, 22], [26.5, 29.5, 22, 24], [29.5, 32.5, 24, 26], [32.5, 35.5, 26, 28], [35.5, 44, 28, 36.5]];
const inv = t => { for (const [a, b, c, d] of WARP) if (t < d) return a + (t - c) * (b - a) / (d - c); return 44; };

// text groups: name, selectors, old-time range
const GROUPS = [
  ['01_accroche_1', ['#s1a'], 0.2, 2.3],
  ['02_accroche_2', ['#s1b'], 2.1, 4.0],
  ['03_promesse', ['#s2prom'], 5.7, 7.6],
  ['04_surtitre_vacanciers', ['#s3eye'], 8.0, 20.1],
  ['05_texte_qr_code', ['#cap0'], 8.0, 10.6],
  ['06_carte_qr_code', ['#qr'], 8.2, 10.6],
  ['07_texte_groupes', ['#cap1'], 10.5, 13.1],
  ['08_texte_messagerie', ['#cap2'], 13.0, 15.6],
  ['09_texte_agenda', ['#cap3'], 15.5, 18.1],
  ['10_texte_carte', ['#cap4'], 18.0, 20.1],
  ['11_surtitre_gerant', ['#s4eye'], 20.4, 28.0],
  ['12_titre_gerant', ['#s4t'], 20.4, 21.9],
  ['13_texte_animations', ['#cap5'], 22.0, 24.1],
  ['14_vignette_animations', ['#chip0'], 22.3, 24.05],
  ['15_texte_signalements', ['#cap6'], 24.0, 26.1],
  ['16_vignette_signalements', ['#chip1'], 24.3, 26.05],
  ['17_texte_personnalisation', ['#cap7'], 26.0, 28.1],
  ['18_vignette_personnalisation', ['#chip2'], 26.3, 28.05],
  ['19_etiquettes_gerant', ['#tags'], 26.5, 28.1],
  ['20_fin_decouvrez', ['#s5h'], 29.95, 36.5],
  ['21_fin_bouton_demo', ['#s5cta'], 30.7, 36.5],
  ['22_fin_email', ['#s5mail'], 31.25, 36.5],
];

function ff(args) { return spawn('ffmpeg', ['-y', '-v', 'error', ...args], { stdio: ['pipe', 'inherit', 'inherit'] }); }
async function pipeFrames(page, proc, t0, t1, opts) {
  const n = Math.round((t1 - t0) * FPS);
  for (let f = 0; f < n; f++) {
    const T = t0 + f / FPS;
    await page.evaluate(T => window.render(T), T);
    const buf = await page.screenshot(opts);
    if (!proc.stdin.write(buf)) await new Promise(r => proc.stdin.once('drain', r));
  }
  proc.stdin.end(); await new Promise(r => proc.on('close', r));
}

(async () => {
  const what = process.argv[2] || 'all';
  const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on('pageerror', e => console.log('ERR:', e.message));
  await page.goto('file://' + path.join(__dirname, 'index.html'));
  await page.evaluate(() => { window.USE_WARP = true; return window.ready; });
  const h264 = out => ['-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'slow', '-crf', '15', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out];
  if (what === 'full' || what === 'all') {
    await page.evaluate(() => window.setLayer('all'));
    await pipeFrames(page, ff(h264(OUT + '/full_silent.mp4')), 0, DUR, { type: 'jpeg', quality: 96 });
    console.log('full done');
  }
  if (what === 'plate' || what === 'all') {
    await page.evaluate(() => window.setLayer('plate'));
    await pipeFrames(page, ff(h264(OUT + '/plate.mp4')), 0, DUR, { type: 'jpeg', quality: 96 });
    console.log('plate done');
  }
  if (what === 'text' || what === 'all') {
    const meta = [];
    for (const [name, sels, a, b] of GROUPS) {
      const t0 = Math.floor(inv(a) * FPS) / FPS, t1 = Math.min(DUR, Math.ceil(inv(b) * FPS) / FPS);
      await page.evaluate(s => window.setLayer('iso', s), sels);
      const out = `${OUT}/textes/${name}.mov`;
      await pipeFrames(page, ff(['-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-', '-c:v', 'prores_ks', '-profile:v', '4444', '-pix_fmt', 'yuva444p10le', '-qscale:v', '11', '-vendor', 'apl0', out]), t0, t1, { type: 'png', omitBackground: true });
      meta.push({ name, start: t0, end: t1 });
      console.log(name, t0.toFixed(2), t1.toFixed(2));
    }
    fs.writeFileSync(OUT + '/textes.json', JSON.stringify(meta, null, 1));
  }
  await browser.close();
})();
