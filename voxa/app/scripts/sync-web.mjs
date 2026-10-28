// Copia la app web (../prototype) a www/ para empaquetarla con Capacitor, y le dice dónde está el servidor de VOXA.
// Uso: VOXA_API_BASE=https://voxa.onrender.com/ npm run sync
import { cpSync, readdirSync, readFileSync, rmSync, writeFileSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, '..', '..', 'prototype');
const www = join(here, '..', 'www');
let base = process.env.VOXA_API_BASE || '';
if (!/^https:\/\//.test(base)) {
  console.error('Falta VOXA_API_BASE con la dirección https del servidor (por ejemplo https://voxa.onrender.com/).');
  process.exit(1);
}
if (!base.endsWith('/')) base += '/';

rmSync(www, { recursive: true, force: true });
cpSync(src, www, { recursive: true });
const NATIVE = ['native-speech.js', 'native-purchases.js', 'native-reminder.js'];
for (const f of NATIVE) copyFileSync(join(here, '..', f), join(www, f));
// Claves PÚBLICAS de RevenueCat por plataforma (las que empiezan con appl_ y goog_; se pueden incluir en la app).
const rcKeys = { ios: process.env.VOXA_RC_IOS_KEY || '', android: process.env.VOXA_RC_ANDROID_KEY || '' };
if (!rcKeys.ios && !rcKeys.android) console.warn('Sin VOXA_RC_IOS_KEY ni VOXA_RC_ANDROID_KEY: la app se empaqueta sin compras.');
// Antes de los módulos de la página: dirección de la API, claves de compras y puentes nativos del teléfono.
const inject = `<script>window.VOXA_API_BASE=${JSON.stringify(base)};window.VOXA_RC_KEYS=${JSON.stringify(rcKeys)};</script>` +
  NATIVE.map((f) => `<script src="${f}"></script>`).join('');
let pages = 0;
for (const f of readdirSync(www).filter((f) => f.endsWith('.html'))) {
  const p = join(www, f);
  writeFileSync(p, readFileSync(p, 'utf8').replace(/<meta charset="utf-8">/i, (m) => m + inject));
  pages++;
}
console.log(`www/ listo: ${pages} páginas apuntando a ${base}`);
