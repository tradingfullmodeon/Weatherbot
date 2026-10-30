// Genera todos los íconos y pantallas de inicio de Talkride a partir de icono.svg y marca.svg (la fuente única del logo).
// Usa el Chromium y Playwright que ya trae el entorno de desarrollo:  node voxa/docs/marca/generar.cjs
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const HERE = __dirname;
const VOXA = path.resolve(HERE, '../..');
const RES = path.join(VOXA, 'app/android/app/src/main/res');
const IOS = path.join(VOXA, 'app/ios/App/App/Assets.xcassets');
const BG = 'linear-gradient(135deg, #4f46e5, #7c3aed)';
const svg = (f) => 'data:image/svg+xml;base64,' + fs.readFileSync(path.join(HERE, f)).toString('base64');
const ICON = svg('icono.svg'), MARK = svg('marca.svg');

// Cada pieza: [archivo, ancho, alto, html]. «mark(p)» = la marca ocupando p del lado corto, sobre el fondo de la marca.
const mark = (p, bg = BG, extra = '') => `<div style="width:100%;height:100%;background:${bg};display:flex;flex-direction:column;align-items:center;justify-content:center">
  <img src="${MARK}" style="width:${p * 100}vmin;height:${p * 100}vmin">${extra}</div>`;
const rounded = `<img src="${ICON}" style="width:100%;height:100%">`;
const round = `<div style="width:100%;height:100%;border-radius:50%;overflow:hidden">${mark(0.92)}</div>`;
const word = (size) => `<div style="color:#fff;font:800 ${size}vmin system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;letter-spacing:-.02em;margin-top:-2vmin">talkride</div>`;

const jobs = [
  ['prototype/icon-192.png', 192, 192, rounded],
  ['prototype/icon-512.png', 512, 512, rounded],
  ['prototype/icon-maskable-512.png', 512, 512, mark(0.72)],
  ['prototype/apple-touch-icon.png', 180, 180, mark(0.86)],
  [`${IOS}/AppIcon.appiconset/AppIcon-512@2x.png`, 1024, 1024, mark(0.86)],   // iOS redondea solo: va opaco y a sangre
  ['docs/marca/tienda-icono-512.png', 512, 512, mark(0.86)],                  // Google Play también redondea
  ['docs/marca/tienda-portada-1024x500.png', 1024, 500, mark(0.5, BG, word(13))],
];
for (const [dir, px] of [['mdpi', 48], ['hdpi', 72], ['xhdpi', 96], ['xxhdpi', 144], ['xxxhdpi', 192]]) {
  jobs.push([`${RES}/mipmap-${dir}/ic_launcher.png`, px, px, rounded]);
  jobs.push([`${RES}/mipmap-${dir}/ic_launcher_round.png`, px, px, round]);
  // Ícono adaptable: 108 dp de lienzo, sólo los 66 dp del centro se ven siempre; la marca va dentro de esa zona.
  jobs.push([`${RES}/mipmap-${dir}/ic_launcher_foreground.png`, px * 2.25, px * 2.25, mark(0.7, 'transparent')]);
}
for (const f of fs.readdirSync(RES).filter(d => d.startsWith('drawable'))) {
  const file = path.join(RES, f, 'splash.png');
  if (!fs.existsSync(file)) continue;
  const b = fs.readFileSync(file);
  jobs.push([file, b.readUInt32BE(16), b.readUInt32BE(20), mark(0.28, BG, word(7))]);
}
for (const f of ['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png'])
  jobs.push([`${IOS}/Splash.imageset/${f}`, 2732, 2732, mark(0.2, BG, word(5))]);

(async () => {
  const browser = await chromium.launch();
  for (const [file, w, h, html] of jobs) {
    const page = await browser.newPage({ viewport: { width: Math.round(w), height: Math.round(h) } });
    await page.setContent(`<html><body style="margin:0;width:100vw;height:100vh;overflow:hidden">${html}</body></html>`);
    await page.evaluate(() => Promise.all([...document.images].map(i => i.decode())));
    const out = path.isAbsolute(file) ? file : path.join(VOXA, file);
    await page.screenshot({ path: out, omitBackground: html === rounded || html === round || html.includes('transparent;') });
    await page.close();
    console.log(path.relative(VOXA, out), `${Math.round(w)}×${Math.round(h)}`);
  }
  await browser.close();
})();
