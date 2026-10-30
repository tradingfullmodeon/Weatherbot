// Capturas para la App Store (1290 × 2796, iPhone 6,7") y Google Play (1080 × 1920) con el título y el marco de la marca.
// Primero se sacan las pantallas reales con el recorrido de punta a punta en modo tienda:
//   VOXA_STORE=pantallas VOXA_FAKE_AUDIO=voz.wav node voxa/tests/e2e/recorrido.cjs http://localhost:8800 capturas
//   node voxa/docs/marca/capturas_tienda.cjs pantallas      → voxa/docs/marca/tienda/{ios,android}/*.png
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SRC = path.resolve(process.argv[2] || 'pantallas');
const OUT = path.join(__dirname, 'tienda');
// En el orden en que se muestran en la tienda: la promesa primero, después las funciones que la cumplen.
const SHOTS = [
  ['05-hoy', 'Practica la conversación antes de tenerla'],
  ['09-roleplay-conversacion', 'Ensaya con personajes que reaccionan a cómo hablas'],
  ['07-evaluar-reporte', 'Un consejo concreto después de cada práctica'],
  ['10-roleplay-evaluacion', 'Sabes qué hiciste bien y qué cambiar'],
  ['13-evento', 'Llega preparado a tu entrevista, charla o reunión'],
  ['14-gimnasio', 'Calienta tu voz en un minuto'],
  ['16-progreso', 'Mira cómo avanzas, semana a semana'],
];
const SIZES = { ios: [1290, 2796, 0.8], android: [1080, 1920, 0.62] };

const page = (img, title, W, H, k) => `<html><body style="margin:0;width:${W}px;height:${H}px;overflow:hidden;
  background:linear-gradient(160deg,#0b6e66,#084c47);font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif">
  <div style="padding:${H * 0.055}px ${W * 0.08}px 0;text-align:center;color:#fff">
    <svg width="${W * 0.16}" height="${W * 0.03}" viewBox="0 0 160 30" style="display:block;margin:0 auto ${H * 0.02}px">
      <path d="M6 24C50 24 70 8 128 8" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".55"/>
      <circle cx="146" cy="8" r="8" fill="#f5a524"/></svg>
    <div style="font-weight:800;font-size:${W * 0.072}px;line-height:1.12;letter-spacing:-.01em">${title}</div>
  </div>
  <img src="data:image/png;base64,${img}" style="position:absolute;left:${(W * (1 - k)) / 2}px;top:${H * 0.255}px;width:${W * k}px;
    border-radius:${W * 0.06}px;border:${W * 0.012}px solid #0d2b29;box-shadow:0 ${W * 0.03}px ${W * 0.08}px rgba(0,0,0,.35)">
</body></html>`;

(async () => {
  const browser = await chromium.launch();
  for (const [store, [W, H, k]] of Object.entries(SIZES)) {
    fs.mkdirSync(path.join(OUT, store), { recursive: true });
    const p = await browser.newPage({ viewport: { width: W, height: H } });
    let n = 0;
    for (const [file, title] of SHOTS) {
      const src = path.join(SRC, `${file}.png`);
      if (!fs.existsSync(src)) { console.log('falta', src); continue; }
      await p.setContent(page(fs.readFileSync(src).toString('base64'), title, W, H, k));
      await p.evaluate(() => Promise.all([...document.images].map(i => i.decode())));
      const out = path.join(OUT, store, `${String(++n).padStart(2, '0')}-${file.slice(3)}.png`);
      await p.screenshot({ path: out });
      console.log(path.relative(process.cwd(), out));
    }
    await p.close();
  }
  await browser.close();
})();
