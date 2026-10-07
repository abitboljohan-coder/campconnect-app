// Capture de la démo de l'app, image par image, à 30 i/s.
//
// Usage : node nuit/capture.js <plan.json>
//
// Chaque plan d'écran (« shot ») ouvre demo.html?s=<écran> dans un téléphone
// émulé (390×844, deviceScaleFactor 3), puis joue une suite d'actions réelles
// (appui, appui long, saisie, défilement, attente). Le temps de la page est
// piloté : horloge JavaScript (page.clock) et animations CSS
// (document.getAnimations) avancent exactement de 1/30 s entre deux captures.
// Le résultat ne dépend donc pas de la vitesse de la machine.
//
// Effets de caméra (sans durée propre : l'action suivante s'enchaîne aussitôt) :
//   { "zoom": <cible>, "echelle": 1.6, "duree": 2 }   la caméra s'approche et surligne
//   { "loupe": <cible>, "duree": 2, "marge": 6 }       le détail sort de l'écran, agrandi
//   { "notif": { "titre": "…", "texte": "…" }, "duree": 2.6 }  notification push
// Une cible peut aussi être un rectangle : { "rect": [x, y, largeur, hauteur] } (px CSS),
// et "parent": n vise le n-ième conteneur de l'élément trouvé (toute la carte).
// { "effacer": true } vide le champ touché juste avant.
// Un plan peut demander "dialogues": "accepter" (valide les confirmations natives).
// Un plan peut demander "geo": "loin" (le vacancier n'est pas au camping : la
// vérification GPS échoue et l'entrée demande le code de l'heure).
//
// Sorties : <work>/clips/<n>/0001.jpg… et <work>/capture.json (nombre
// d'images, appuis et effets de chaque plan, que le moteur dessine par-dessus
// l'écran : l'interface capturée n'est jamais retouchée).
const path = require('path');
const { chromium } = require(path.join(__dirname, '..', 'app', 'node_modules', 'playwright'));
const fs = require('fs');

const FPS = 30;
const VW = 390, VH = 844;
const LOCALES = { fr: 'fr-FR', en: 'en-GB', es: 'es-ES', nl: 'nl-NL' };
// Centre du camping de démo (src/demo/mockSupabase.js) : la vérification GPS
// de l'onboarding passe.
const GEO = { latitude: 44.2010, longitude: 6.3013, accuracy: 15 };
// Ailleurs (Lyon) : pour montrer qu'on n'entre pas sans être au camping.
const GEO_LOIN = { latitude: 45.7640, longitude: 4.8357, accuracy: 15 };

function chromiumPath() {
  const p = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
  return fs.existsSync(p) ? p : undefined; // sinon : le Chromium de Playwright
}

const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

async function captureShot(browser, plan, shot, idx, outDir) {
  const lang = shot.langue || plan.langue || 'fr';
  const ctx = await browser.newContext({
    viewport: { width: VW, height: VH }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
    locale: LOCALES[lang] || 'fr-FR', timezoneId: 'Europe/Paris', colorScheme: 'light',
    geolocation: shot.geo === 'loin' ? GEO_LOIN : GEO, permissions: ['geolocation'],
  });
  // Heure de la démo : l'après-midi du jour de la vidéo (les groupes de 18 h 30
  // sont à venir, l'agenda montre « ce soir »).
  const t0 = new Date(`${plan.date}T${plan.heure || '16:40'}:00+02:00`).getTime();
  await ctx.clock.install({ time: t0 });
  await ctx.addInitScript(l => { try { localStorage.setItem('langue', l); } catch (e) { /* rien */ } }, lang);
  const page = await ctx.newPage();
  const erreurs = [];
  page.on('pageerror', e => erreurs.push(e.message));
  // Les confirmations natives (window.confirm) ne se voient pas à l'image :
  // "dialogues": "accepter" les valide, pour montrer le résultat du geste.
  page.on('dialog', d => (shot.dialogues === 'accepter' ? d.accept() : d.dismiss()).catch(() => {}));
  const cdp = await ctx.newCDPSession(page);

  const qs = new URLSearchParams({ s: shot.ecran, ...(shot.params || {}) });
  await page.goto(`${plan.base}/demo.html?${qs}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(900);
  // On fige l'horloge : désormais, le temps n'avance qu'image par image.
  await page.clock.pauseAt(t0 + 60_000);
  await page.waitForTimeout(300);

  const dir = path.join(outDir, String(idx + 1));
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const total = Math.round(shot.duree * FPS);
  let f = 0;
  const appuis = [], effets = [];

  async function tick(n = 1) {
    for (let i = 0; i < n; i++) {
      if (f >= total) throw new Error(`plan ${idx + 1} (${shot.ecran}) : les actions dépassent ${shot.duree} s`);
      const dt = Math.round((f + 1) * 1000 / FPS) - Math.round(f * 1000 / FPS);
      await page.clock.runFor(dt);
      await page.evaluate(dt => {
        for (const a of document.getAnimations()) {
          if (a.__cc === undefined) a.__cc = a.currentTime || 0;
          a.pause();
          a.__cc += dt;
          a.currentTime = a.__cc;
        }
      }, dt);
      f++;
      await page.screenshot({ path: path.join(dir, String(f).padStart(4, '0') + '.jpg'), type: 'jpeg', quality: 90, caret: 'initial' });
    }
  }
  const secondes = s => Math.max(1, Math.round(s * FPS));

  async function texteI18n(cle, vars) {
    return page.evaluate(async ([k, v]) => (await import('/src/i18n.js')).t(k, v), [cle, vars || null]);
  }
  async function cible(c, boite) {
    if (c.rect) {
      const [x, y, width, height] = c.rect;
      return boite ? { x, y, width, height } : { x: x + width / 2, y: y + height / 2 };
    }
    let loc;
    if (c.css) loc = page.locator(c.css);
    else if (c.label) loc = page.getByLabel(c.label, { exact: !!c.exact });
    else if (c.placeholder) loc = page.getByPlaceholder(c.placeholder);
    else if (c.tplaceholder) loc = page.getByPlaceholder(await texteI18n(c.tplaceholder, c.vars));
    else if (c.t) loc = page.getByText(await texteI18n(c.t, c.vars), { exact: !!c.exact });
    else if (c.tlabel) loc = page.getByLabel(await texteI18n(c.tlabel, c.vars), { exact: !!c.exact });
    else if (c.text) loc = page.getByText(c.text, { exact: !!c.exact });
    else throw new Error('cible inconnue : ' + JSON.stringify(c));
    loc = loc.nth(c.nth || 0);
    // parent : n : le conteneur de l'élément (une carte entière plutôt que son titre)
    for (let i = 0; i < (c.parent || 0); i++) loc = loc.locator('xpath=..');
    await loc.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {
      throw new Error(`plan ${idx + 1} (${shot.ecran}) : élément introuvable ${JSON.stringify(c)}`);
    });
    const b = await loc.boundingBox();
    if (boite) {
      // limitée à l'écran visible
      const x0 = Math.max(0, b.x), y0 = Math.max(0, b.y);
      const x1 = Math.min(VW, b.x + b.width), y1 = Math.min(VH, b.y + b.height);
      if (x1 - x0 < 4 || y1 - y0 < 4) throw new Error(`plan ${idx + 1} (${shot.ecran}) : élément hors écran ${JSON.stringify(c)}`);
      return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
    }
    const x = b.x + (c.fx ?? 0.5) * b.width, y = b.y + (c.fy ?? 0.5) * b.height;
    if (x < 0 || y < 0 || x > VW || y > VH) throw new Error(`plan ${idx + 1} : élément hors écran ${JSON.stringify(c)}`);
    return { x, y };
  }
  async function scroller() {
    // Le plus grand conteneur qui défile, sinon la page elle-même.
    // Une feuille ouverte (role=dialog) passe avant la page qu'elle recouvre.
    await page.evaluate(() => {
      const dialogs = document.querySelectorAll('[role=dialog]');
      const racine = dialogs.length ? dialogs[dialogs.length - 1] : document;
      let best = document.scrollingElement, gain = dialogs.length ? 0 : best.scrollHeight - best.clientHeight;
      for (const el of racine.querySelectorAll('*')) {
        const st = getComputedStyle(el).overflowY;
        if ((st === 'auto' || st === 'scroll') && el.scrollHeight - el.clientHeight > gain && el.clientHeight > 200) {
          best = el; gain = el.scrollHeight - el.clientHeight;
        }
      }
      window.__ccScroller = best;
    });
  }

  for (const st of shot.actions || []) {
    if (st.attendre != null) {
      await tick(secondes(st.attendre));
    } else if (st.appui) {
      const p = await cible(st.appui);
      // Le doigt se pose 0,2 s avant l'appui (dessiné par le moteur).
      appuis.push({ f: f + 1, x: p.x, y: p.y, duree: 0.35 });
      await tick(6);
      // "clic": false : le doigt se pose, la vidéo coupe avant l'effet (utile
      // quand la démo, sans serveur, ne sait pas montrer la suite fidèlement).
      if (st.clic !== false) {
        await page.touchscreen.tap(p.x, p.y);
        await page.waitForTimeout(80);
      }
      await tick(secondes(st.puis ?? 0.6));
    } else if (st.appuiLong) {
      const p = await cible(st.appuiLong);
      const tenue = st.tenue ?? 0.7;
      appuis.push({ f: f + 1, x: p.x, y: p.y, duree: tenue + 0.2, long: true });
      await tick(6);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: p.x, y: p.y }] });
      await tick(secondes(tenue));
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await page.waitForTimeout(80);
      await tick(secondes(st.puis ?? 0.5));
    } else if (st.saisir != null) {
      // Le champ doit avoir été touché avant (appui) : on tape lettre à lettre.
      for (const ch of [...st.saisir]) {
        await page.keyboard.insertText(ch);
        await page.waitForTimeout(15);
        await tick(st.cadence ?? 2);
      }
      await tick(secondes(st.puis ?? 0.3));
    } else if (st.defiler != null) {
      await scroller();
      const n = secondes(st.duree ?? 1.2);
      const depart = await page.evaluate(() => window.__ccScroller.scrollTop);
      for (let i = 1; i <= n; i++) {
        const y = depart + st.defiler * ease(i / n);
        await page.evaluate(y => { window.__ccScroller.scrollTop = y; }, y);
        await tick(1);
      }
      await tick(secondes(st.puis ?? 0.3));
    } else if (st.zoom || st.loupe) {
      const b = await cible(st.zoom || st.loupe, true);
      effets.push({ type: st.zoom ? 'zoom' : 'loupe', f: f + 1, duree: st.duree ?? 2,
        box: { x: b.x, y: b.y, w: b.width, h: b.height },
        ...(st.echelle != null ? { echelle: st.echelle } : {}), ...(st.marge != null ? { marge: st.marge } : {}),
        ...(st.surligner === false ? { surligner: false } : {}) });
    } else if (st.notif) {
      effets.push({ type: 'notif', f: f + 1, duree: st.duree ?? 2.6, titre: st.notif.titre, texte: st.notif.texte });
    } else if (st.effacer) {
      // vide le champ touché juste avant (un profil prérempli, par exemple)
      await page.keyboard.press('Control+A');
      await page.keyboard.press('Backspace');
      await tick(1);
    } else if (st.clavierFerme) {
      await page.evaluate(() => document.activeElement && document.activeElement.blur());
    } else {
      throw new Error('action inconnue : ' + JSON.stringify(st));
    }
  }
  if (f < total) await tick(total - f);
  await ctx.close();
  if (erreurs.length) console.log(`  plan ${idx + 1} : erreurs de la page :`, erreurs.slice(0, 3).join(' | '));
  for (const e of effets) if (e.f > total) throw new Error(`plan ${idx + 1} (${shot.ecran}) : effet ${e.type} après la fin du plan`);
  return { images: f, appuis, effets, ecran: shot.ecran, erreurs };
}

(async () => {
  const planPath = process.argv[2];
  if (!planPath) { console.error('Usage : node nuit/capture.js <plan.json>'); process.exit(2); }
  const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
  const outDir = path.join(path.dirname(planPath), 'clips');
  fs.mkdirSync(outDir, { recursive: true });
  // --lang : les champs date et heure suivent la langue du navigateur, pas la page.
  const browser = await chromium.launch({ executablePath: chromiumPath(), args: [`--lang=${LOCALES[plan.langue] || 'fr-FR'}`, '--disable-background-networking', '--disable-component-update'],
    env: { ...process.env, LANG: `${(LOCALES[plan.langue] || 'fr-FR').replace('-', '_')}.UTF-8`, LANGUAGE: plan.langue || 'fr' } });
  const res = [];
  try {
    for (let i = 0; i < plan.shots.length; i++) {
      const t = Date.now();
      res.push(await captureShot(browser, plan, plan.shots[i], i, outDir));
      console.log(`  plan ${i + 1}/${plan.shots.length} « ${plan.shots[i].ecran} » : ${res[i].images} images en ${((Date.now() - t) / 1000).toFixed(0)} s`);
    }
  } finally {
    await browser.close();
  }
  fs.writeFileSync(path.join(path.dirname(planPath), 'capture.json'), JSON.stringify({ fps: FPS, largeur: VW, hauteur: VH, shots: res }, null, 1));
})().catch(e => { console.error('ÉCHEC capture :', e.message); process.exit(1); });
