// Rendu de la vidéo de nuit : nuit/film.html piloté image par image.
//
// Usage : node nuit/render.cjs <work>/plan.json [--apercu t1,t2,…]
// Lit plan.json (thème du jour, écrit par nuit/plan.py) et capture.json
// (écrit par nuit/capture.cjs), puis écrit dans <work> :
//   film.json    les paramètres passés au moteur (pour relire un rendu)
//   audio.json   les repères de la musique pour scripts/music2.py
//   muet.mp4     la vidéo sans le son (H.264, prête pour le web)
//   vignette.png l'image de couverture
// Échoue (code 3) si un texte déborde : « contrôle qualité » de mise en page.
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { chromium } = require(path.join(__dirname, '..', 'app', 'node_modules', 'playwright'));

const FPS = 30;
const HOOK = 4.0;   // accroche : 2 mesures à 120 BPM
const FIN = 5.0;    // fin : logo, slogan, bouton, e-mail
const FORMATS = { '9x16': [1080, 1920], '1x1': [1080, 1080], '16x9': [1920, 1080] };

function chromiumPath() {
  const p = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
  return fs.existsSync(p) ? p : undefined;
}

(async () => {
  const planPath = path.resolve(process.argv[2] || '');
  const work = path.dirname(planPath);
  const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
  const cap = JSON.parse(fs.readFileSync(path.join(work, 'capture.json'), 'utf8'));
  const [W, H] = FORMATS[plan.format] || FORMATS['9x16'];

  // Montage : accroche, plans bout à bout, fin.
  let t = HOOK;
  const shots = plan.shots.map((s, i) => {
    const c = cap.shots[i];
    const a = t, b = t + c.images / FPS;
    t = b;
    return { a, b, images: c.images, appuis: c.appuis, cote: s.cote, titre: s.titre, sous: s.sous,
      dir: 'file://' + path.join(work, 'clips', String(i + 1)) };
  });
  const finDebut = t, dur = finDebut + FIN;
  const FILM = { W, H, format: plan.format, fps: FPS, langue: plan.langue, hook: plan.accroche, textes: plan.textes,
    hookFin: HOOK, finDebut, dur, shots, capture: { largeur: cap.largeur, hauteur: cap.hauteur } };
  fs.writeFileSync(path.join(work, 'film.json'), JSON.stringify(FILM, null, 1));

  // Repères son : montées et impacts sur la révélation et sur la fin,
  // whoosh à chaque coupe, « pop » à chaque appui du doigt.
  const pops = [];
  plan.accroche.forEach((_, i) => pops.push([0.3 + i * 0.16, 1200 + 150 * i]));
  shots.forEach(s => s.appuis.forEach(a => pops.push([s.a + (a.f - 1) / FPS + 0.2, a.long ? 1100 : 1500])));
  pops.push([finDebut + 1.15, 1300], [finDebut + 1.55, 1500]);
  const audio = {
    dur, out: path.join(work, 'audio'), intro: HOOK,
    sections: [[0, 'intro'], [HOOK, 'main'], [finDebut, 'outro']],
    fx: [[HOOK, 'riser', 1.8, 0.35], [HOOK, 'impact', 0, 0.5], [finDebut, 'riser', 1.6, 0.3], [finDebut, 'impact', 0, 0.45]],
    fade: dur - 1.6,
    cuts: [...shots.slice(1).map(s => s.a), finDebut],
    pops, impacts_sfx: [[HOOK, 0.35], [finDebut, 0.3]],
  };
  fs.writeFileSync(path.join(work, 'audio.json'), JSON.stringify(audio, null, 1));

  const browser = await chromium.launch({ executablePath: chromiumPath(), args: ['--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  const erreurs = [];
  page.on('pageerror', e => erreurs.push(e.message));
  await page.addInitScript(f => { window.FILM = f; }, FILM);
  await page.goto('file://' + path.join(__dirname, 'film.html'));
  await page.evaluate(() => window.ready);
  const pb = await page.evaluate(() => window.verifier());
  if (erreurs.length || pb.length) {
    console.error('ÉCHEC mise en page :\n  ' + [...erreurs, ...pb].join('\n  '));
    await browser.close();
    process.exit(3);
  }

  // --apercu 1.5,6,18 : quelques images fixes (work/apercu_<t>.png), sans vidéo.
  const ia = process.argv.indexOf('--apercu');
  if (ia > 0) {
    for (const t of process.argv[ia + 1].split(',').map(Number)) {
      await page.evaluate(t => window.seek(t), t);
      await page.screenshot({ path: path.join(work, `apercu_${t}.png`) });
    }
    await browser.close();
    return;
  }

  // Vignette : le premier plan, légende entière, doigt absent.
  await page.evaluate(t => window.seek(t), shots[0].a + 1.6);
  await page.screenshot({ path: path.join(work, 'vignette.png') });

  const out = path.join(work, 'muet.mp4');
  // Débit plafonné : la vidéo finale doit rester sous 8 Mo (web, LinkedIn).
  const ff = spawn(process.env.FFMPEG || 'ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-maxrate', '2600k', '-bufsize', '5200k', '-g', '60',
    '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const total = Math.round(dur * FPS), t0 = Date.now();
  for (let f = 0; f < total; f++) {
    await page.evaluate(t => window.seek(t), f / FPS);
    const buf = await page.screenshot({ type: 'jpeg', quality: 93 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (f % 150 === 0) console.log(`  image ${f}/${total} (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
  }
  ff.stdin.end();
  const code = await new Promise(r => ff.on('close', r));
  await browser.close();
  if (code !== 0) { console.error('ÉCHEC encodage ffmpeg'); process.exit(1); }
  console.log(`  rendu ${W}×${H}, ${dur.toFixed(1)} s, en ${((Date.now() - t0) / 1000).toFixed(0)} s`);
})().catch(e => { console.error('ÉCHEC rendu :', e.message); process.exit(1); });
