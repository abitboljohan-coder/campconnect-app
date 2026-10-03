const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

(async () => {
  const mode = process.argv[2] || 'preview';
  const browser = await chromium.launch({ args: ['--allow-file-access-from-files', '--disable-web-security'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on('console', m => console.log('PAGE:', m.text()));
  page.on('pageerror', e => console.log('ERR:', e.message));
  await page.goto('file://' + path.join(__dirname, 'index.html'));
  await page.evaluate(() => window.ready);
  if (mode === 'preview') {
    const times = process.argv.slice(3).map(Number);
    fs.mkdirSync('/home/claude/cc/prev', { recursive: true });
    for (const t of times) {
      await page.evaluate(t => window.seek(t), t);
      await page.screenshot({ path: `/home/claude/cc/prev/f_${t.toFixed(2)}.png` });
    }
  } else {
    const FPS = 30, DUR = Number(process.argv[3] || 36), out = process.argv[4] || '/home/claude/cc/video_silent.mp4';
    const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '15', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
    const total = Math.round(FPS * DUR);
    const t0 = Date.now();
    for (let f = 0; f < total; f++) {
      const t = f / FPS;
      await page.evaluate(t => window.seek(t), t);
      const buf = await page.screenshot({ type: 'jpeg', quality: 96 });
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      if (f % 90 === 0) console.log(`frame ${f}/${total} ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    }
    ff.stdin.end();
    await new Promise(r => ff.on('close', r));
  }
  await browser.close();
})();
