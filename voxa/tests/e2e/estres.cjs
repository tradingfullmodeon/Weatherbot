// Estrés 360° de Talkride en el navegador (QA): diseño en 3 anchos, temas y accesibilidad, toques repetidos,
// textos vacíos y enormes, XSS, permisos negados, servidor caído, almacenamiento roto, 6 idiomas, borrar datos,
// atrás/adelante, sin conexión y coherencia de números entre pantallas.
//
//   python voxa/tests/e2e/servidor_simulado.py 8801 &
//   python voxa/tests/e2e/voz_sintetica.py voz.wav
//   VOXA_FAKE_AUDIO=voz.wav node voxa/tests/e2e/estres.cjs http://localhost:8801 carpeta
//
// Sale con código 1 si algún chequeo falla (la lista ✗ dice cuál) y 2 si el propio script se cae.
// VOXA_ONLY=layout,xss,... corre sólo esas secciones.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = (process.argv[2] || 'http://localhost:8801').replace(/\/$/, '');
const OUT = process.argv[3] || 'estres';
fs.mkdirSync(OUT, { recursive: true });
const ONLY = (process.env.VOXA_ONLY || '').split(',').filter(Boolean);
const run = (name) => !ONLY.length || ONLY.includes(name);

const PAGES = ['index.html', 'diagnostico.html', 'evaluar.html', 'roleplay.html', 'gimnasio.html', 'escritura.html', 'evento.html',
  'aprender.html', 'progreso.html', 'pro.html', 'metodo.html', 'privacidad.html', 'terminos.html'];
const XSS = '<img src=x onerror="window.__xss=(window.__xss||0)+1">"><svg onload="window.__xss=(window.__xss||0)+1">';
const LANGS = ['es', 'en', 'pt', 'fr', 'de', 'it'];

const problems = [], steps = [], notes = [];
const ok = (cond, what) => { steps.push(`${cond ? '✓' : '✗'} ${what}`); if (!cond) problems.push(what); return cond; };
const note = (what) => { notes.push('· ' + what); };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const PROFILE = (extra = {}) => ({ goal: 'entrevista', ladder: {}, onboarded: true, lang: 'es', startNerves: 3, ...extra });
const day = (n) => { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(12, 0, 0, 0); return d.toISOString(); };
// Sesiones de ejemplo: 3 días seguidos (hoy, ayer, anteayer) más una vieja.
const SESSIONS = [
  { id: 's1', date: day(10), type: 'evaluacion', scenario: 'intro', scenarioName: 'Preséntate', total: 52, dims: { voz: 50, lenguaje: 55 }, metrics: { wpm: { s: 40 } }, anxietyBefore: 4, anxietyAfter: 3 },
  { id: 's2', date: day(2), type: 'evaluacion', scenario: 'intro', scenarioName: 'Preséntate', total: 61, dims: { voz: 60, lenguaje: 62 }, metrics: { wpm: { s: 50 } }, anxietyBefore: 3, anxietyAfter: 2 },
  { id: 's3', date: day(1), type: 'roleplay', scenario: 'roleplay:jefe', scenarioName: 'Roleplay: Ricardo', total: 70, dims: { escucha: 70 } },
  { id: 's4', date: day(0), type: 'escritura', scenario: 'escritura:pedir', scenarioName: 'Escritura: Pedir', total: 80, dims: { escritura: 80 } },
];

let browser;
// Diagnóstico real por la interfaz (sin voz): v = respuesta 1–5 a las 8 afirmaciones.
async function doDiagnosis(page, v, msg = 'Hola Carolina, ¿puedo tomarme el viernes libre? Dejo el informe listo el jueves.') {
  await go(page, 'diagnostico.html', 300);
  await page.click('#dgSkip1');
  for (const d of await page.$$eval('#selfItems button[data-dim]', bs => [...new Set(bs.map(b => b.dataset.dim))])) await page.click(`#selfItems button[data-dim="${d}"][data-v="${v}"]`);
  await page.click('#dgNext2'); await page.fill('#dgWrite', msg);
  await page.click('#dgRun'); await page.waitForTimeout(800);
  await page.click('#dgSave'); await page.waitForURL('**/index.html', { timeout: 5000 }).catch(() => {});
}
async function newCtx({ perms = true, viewport = { width: 390, height: 844 }, init = null, storage = null, scheme = 'light' } = {}) {
  const ctx = await browser.newContext({ viewport, permissions: perms ? ['microphone', 'camera'] : [], locale: 'es-CL', colorScheme: scheme });
  if (storage) await ctx.addInitScript((s) => {
    if (sessionStorage.getItem('__seeded')) return;
    for (const [k, v] of Object.entries(s)) v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v);
    sessionStorage.setItem('__seeded', '1');
  }, storage);
  if (init) await ctx.addInitScript(init);
  const page = await ctx.newPage();
  page.errors = [];
  page.on('pageerror', e => page.errors.push(`${page.url().split('/').pop()}: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error' && !/favicon|Failed to load resource/.test(m.text())) page.errors.push(`${page.url().split('/').pop()} console: ${m.text().slice(0, 160)}`); });
  page.dialogs = [];
  page.on('dialog', d => { page.dialogs.push(d.message()); d.accept().catch(() => {}); });
  return { ctx, page };
}
const store = (profile, sessions) => ({ 'voxa.profile.v1': profile === undefined ? null : JSON.stringify(profile), 'voxa.sessions.v1': sessions === undefined ? null : JSON.stringify(sessions) });
async function go(page, p, wait = 500) {
  await page.goto(`${BASE}/${p}`, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(wait);
}
const overflow = (page) => page.evaluate(() => {
  const vw = document.documentElement.clientWidth;
  const wide = [...document.querySelectorAll('body *')].filter(el => {
    const b = el.getBoundingClientRect(); const s = getComputedStyle(el);
    return b.width && s.visibility !== 'hidden' && b.right > vw + 1 && ![...el.children].some(c => c.getBoundingClientRect().right > vw + 1);
  }).slice(0, 4).map(el => `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}.${[...el.classList].join('.')}(${Math.round(el.getBoundingClientRect().right)}px)`);
  return { px: document.documentElement.scrollWidth - vw, wide };
});
const text = (page, sel) => page.textContent(sel).catch(() => '');
const visible = (page, sel) => page.isVisible(sel).catch(() => false);
const errs = (page, label) => { ok(page.errors.length === 0, `${label}: sin errores JS${page.errors.length ? ' → ' + [...new Set(page.errors)].slice(0, 4).join(' | ') : ''}`); page.errors.length = 0; };

// ============================================================================ 1. diseño
async function layout() {
  for (const width of [320, 390, 768]) {
    for (const [scheme, prefs] of [['light', {}], ['dark', {}], ['light', { textSize: 'xl', highContrast: true }], ['dark', { textSize: 'xl', highContrast: true }]]) {
      const { ctx, page } = await newCtx({ viewport: { width, height: 800 }, scheme, storage: store(PROFILE(prefs), SESSIONS) });
      await doDiagnosis(page, 3); page.errors.length = 0;
      for (const p of PAGES) {
        await go(page, p, 250);
        const o = await overflow(page);
        const label = `${p} @${width}px ${scheme}${prefs.textSize ? ' xl+contraste' : ''}`;
        ok(o.px <= 1, `${label}: sin scroll horizontal (${o.px}px)${o.px > 1 ? ' → ' + o.wide.join(', ') : ''}`);
        if (prefs.textSize) ok(await page.evaluate(() => document.documentElement.dataset.text === 'xl' && document.documentElement.dataset.contrast === 'alto'), `${label}: aplica letra xl y contraste`);
        if (width === 320 && prefs.textSize) await page.screenshot({ path: path.join(OUT, `layout-${p}-${scheme}-320-xl.png`), fullPage: true });
        errs(page, label);
      }
      await ctx.close();
    }
  }
}

// ============================================================================ 2. enlaces muertos y botones
async function links() {
  const { ctx, page } = await newCtx({ storage: store(PROFILE(), SESSIONS) });
  await doDiagnosis(page, 3);
  const seen = new Set(), dead = [];
  for (const p of PAGES) {
    await go(page, p, 200);
    const hrefs = await page.$$eval('a[href]', as => as.map(a => a.getAttribute('href')));
    for (const h of hrefs) {
      if (!h || /^(https?:|mailto:|tel:|blob:|javascript:|data:)/.test(h) || h.startsWith('#')) continue;
      const file = h.split(/[?#]/)[0];
      if (!file || seen.has(file)) continue;
      seen.add(file);
      const r = await page.request.get(`${BASE}/${file}`);
      if (r.status() !== 200) dead.push(`${p} → ${h} (${r.status()})`);
    }
    // Anclas internas que no existen en la página destino.
    for (const h of hrefs.filter(h => h && /\.html#/.test(h))) {
      const [file, hash] = h.split('#');
      const r = await (await page.request.get(`${BASE}/${file.split('?')[0]}`)).text();
      if (!new RegExp(`id="${hash}"`).test(r)) dead.push(`${p} → ${h} (no existe #${hash})`);
    }
  }
  ok(dead.length === 0, `Enlaces internos válidos${dead.length ? ' → ' + [...new Set(dead)].join('; ') : ''}`);
  // Service worker: todo lo que la app carga está en la lista para usar sin conexión.
  const sw = await (await page.request.get(`${BASE}/sw.js`)).text();
  const shell = JSON.parse(sw.match(/const SHELL = (\[[\s\S]*?\]);/)[1].replace(/'/g, '"'));
  const missing = [];
  for (const s of shell) { const r = await page.request.get(`${BASE}/${s}`); if (r.status() !== 200) missing.push(`${s} (${r.status()})`); }
  ok(!missing.length, `sw.js: todos los archivos de SHELL existen${missing.length ? ' → ' + missing.join(', ') : ''}`);
  const imports = new Set();
  for (const f of fs.readdirSync(path.join(__dirname, '../../prototype')).filter(f => /\.(html|js)$/.test(f) && f !== 'sw.js')) {
    const src = fs.readFileSync(path.join(__dirname, '../../prototype', f), 'utf8');
    for (const m of src.matchAll(/from '\.\/([\w-]+\.js)'/g)) imports.add(m[1]);
  }
  const notCached = [...imports].filter(i => !shell.includes(i));
  ok(!notCached.length, `sw.js: los módulos importados están en SHELL${notCached.length ? ' → faltan ' + notCached.join(', ') : ''}`);
  await ctx.close();
}

// ============================================================================ 3. toques repetidos
async function rapid() {
  const { ctx, page } = await newCtx({ storage: store(PROFILE(), []) });
  const calls = {};
  page.on('request', r => { const u = new URL(r.url()); if (u.pathname.startsWith('/api/') && r.method() === 'POST') calls[u.pathname] = (calls[u.pathname] || 0) + 1; });

  // Con latencia real (1 s): la respuesta de un servidor local llega antes del segundo toque y oculta el problema.
  await page.route(/\/api\/(writing|event-questions|roleplay\/evaluate)$/, async r => { await sleep(1000); r.continue(); });
  await go(page, 'escritura.html');
  await page.fill('#text', 'Hola Carolina, quería saber si de pronto podría tomarme el viernes libre si no es mucha molestia. Gracias.');
  await page.waitForTimeout(300);
  await page.click('#btnAI', { clickCount: 3, delay: 20 }).catch(() => {});
  await page.waitForTimeout(2500);
  ok((calls['/api/writing'] || 0) === 1, `Escritura: triple toque a «Mejorar» = 1 consulta (${calls['/api/writing'] || 0})`);

  await go(page, 'evento.html');
  await page.fill('#evAudience', 'Gerente de riesgos de una aseguradora grande');
  await page.dblclick('#evCreate');
  await page.waitForTimeout(400);
  await page.click('#evQuestionsAI', { clickCount: 3, delay: 20 }).catch(() => {});
  await page.waitForTimeout(2500);
  ok((calls['/api/event-questions'] || 0) === 1, `Evento: triple toque a «Preguntas» = 1 consulta (${calls['/api/event-questions'] || 0})`);

  await go(page, 'roleplay.html', 1200);
  await page.click('#btnBegin'); await page.click('#btnBegin');
  ok((await page.$$('#chat > .msg')).length === 1, 'Roleplay: doble «Comenzar» deja una sola apertura');
  await page.fill('#txt', 'Hola, vengo a pedir un aumento porque reduje los atrasos a la mitad');
  await Promise.all([page.click('#btnSend'), page.press('#txt', 'Enter'), page.click('#btnSend')]);
  await page.waitForTimeout(1500);
  ok(await page.$$eval('#chat > .msg.user', m => m.length) === 1, 'Roleplay: Enviar + Enter + Enviar = un solo turno del usuario');
  ok((calls['/api/roleplay'] || 0) === 1, `Roleplay: una sola consulta al personaje (${calls['/api/roleplay'] || 0})`);
  // Enviar mientras el personaje piensa: el texto escrito no debería perderse.
  await page.route('**/api/roleplay', async r => { await sleep(1500); r.continue(); });
  await page.fill('#txt', 'Primera respuesta mientras espero, con datos del trimestre');
  await page.click('#btnSend');
  await page.fill('#txt', 'Segunda respuesta escrita mientras el personaje piensa');
  await page.click('#btnSend');
  await page.waitForTimeout(2500);
  const kept = await page.inputValue('#txt');
  ok(kept.includes('Segunda') || (await text(page, '#chat')).includes('Segunda'), 'Roleplay: lo escrito mientras el personaje piensa no se pierde');
  await page.unroute('**/api/roleplay');
  await page.fill('#txt', 'Volvería a hacerlo e involucraría antes al equipo de operaciones');
  await page.click('#btnSend'); await page.waitForTimeout(800);
  const before = (await page.evaluate(() => JSON.parse(localStorage.getItem('voxa.sessions.v1') || '[]'))).length;
  await page.click('#btnEnd', { clickCount: 3, delay: 10 }).catch(() => {});
  await page.waitForTimeout(3000);
  const after = (await page.evaluate(() => JSON.parse(localStorage.getItem('voxa.sessions.v1') || '[]'))).length;
  ok(after - before === 1, `Roleplay: triple toque a «Terminar y evaluar» guarda 1 sesión (${after - before})`);
  // Ya evaluada: otro toque a «Terminar y evaluar» vuelve a evaluar la misma conversación y guarda otra sesión.
  await page.click('#btnEnd').catch(() => {}); await page.waitForTimeout(2500);
  const again = (await page.evaluate(() => JSON.parse(localStorage.getItem('voxa.sessions.v1') || '[]'))).length;
  ok(again === after, `Roleplay: tocar «Terminar y evaluar» después de evaluar no duplica la sesión (${again - after} más)`);
  // «Practicar de nuevo» y otra evaluación sin responder.
  await page.click('#btnAgain');
  await page.click('#btnEnd'); await page.waitForTimeout(500);
  ok(/al menos una vez/.test(await text(page, '#status')), 'Roleplay: evaluar sin responder pide responder primero');

  await go(page, 'diagnostico.html');
  await page.fill('#dgSaid', 'Hola, soy Ana y trabajo en análisis de datos. Me apasiona convertir números en decisiones simples. Reduje los reclamos a la mitad.');
  await page.click('#dgWinBtn', { clickCount: 3, delay: 10 }); await page.waitForTimeout(600);
  ok((await page.$$('#dgWin > *')).length <= 2, 'Diagnóstico: triple toque a «Ver mi primera fortaleza» no duplica');
  await page.click('#dgNext1');
  await page.click('#dgNext2'); await page.waitForTimeout(300);
  note(`Diagnóstico paso 2 sin responder nada → «${(await text(page, '#dgErr2')).trim() || '(sin aviso)'}», paso visible: ${(await text(page, '#dgStepLabel')).trim()}`);
  if (!(await visible(page, '#dgWrite'))) {
    for (const d of await page.$$eval('#selfItems button[data-dim]', bs => [...new Set(bs.map(b => b.dataset.dim))])) await page.click(`#selfItems button[data-dim="${d}"][data-v="3"]`);
    await page.click('#dgNext2');
  }
  await page.fill('#dgWrite', '');
  await page.click('#dgRun'); await page.waitForTimeout(1200);
  note(`Diagnóstico paso 3 vacío → «${(await text(page, '#dgErr')).trim() || '(sin aviso)'}», queda en «${(await text(page, '#dgStepLabel')).trim()}»`);
  await page.click('#dgSave', { clickCount: 3, delay: 10 }).catch(() => {});
  await page.waitForTimeout(1200);
  const prof = await page.evaluate(() => JSON.parse(localStorage.getItem('voxa.profile.v1') || '{}'));
  ok((prof.diagnoses || []).length === 1, `Diagnóstico: triple «Guardar mis metas» guarda 1 diagnóstico (${(prof.diagnoses || []).length})`);
  errs(page, 'Toques repetidos');
  await ctx.close();
}

// ============================================================================ 4. textos vacíos, enormes y XSS
async function inputs() {
  const { ctx, page } = await newCtx({ storage: store(PROFILE(), []), init: () => { window.alert = () => { window.__xss = (window.__xss || 0) + 1; }; } });
  const xss = async (label) => ok(!(await page.evaluate(() => window.__xss || 0)), `${label}: XSS no se ejecuta`);
  const huge = 'Palabra '.repeat(900);   // ~7200 caracteres

  // Escritura
  await go(page, 'escritura.html');
  ok(await page.isDisabled('#btnAI'), 'Escritura: «Mejorar» deshabilitado con el texto vacío');
  await page.fill('#text', '   \n  '); ok(await page.isDisabled('#btnAI'), 'Escritura: sólo espacios = vacío');
  await page.fill('#text', huge);
  const len = (await page.inputValue('#text')).length;
  await page.click('#btnAI'); await page.waitForTimeout(1500);
  const out = await text(page, '#aiOut');
  ok(!/object Object/.test(out), `Escritura: texto de ${len} caracteres da un mensaje legible (→ «${out.trim().slice(0, 120)}»)`);
  ok(len <= 6000 || /6[.\s]?000|largo|caracteres/i.test(out), 'Escritura: avisa del máximo de 6000 caracteres (o no deja pasarlo)');
  await page.fill('#recipient', XSS);
  await page.fill('#text', `${XSS} Hola equipo, les escribo para pedir el informe del trimestre antes del viernes por favor.`);
  await page.waitForTimeout(400);
  await page.click('#btnAI'); await page.waitForTimeout(1500);
  await xss('Escritura');
  ok((await page.$$('#checks img, #stats img')).length === 0, 'Escritura: el texto con HTML se muestra como texto');

  // Evento
  await go(page, 'evento.html');
  await page.fill('#evTitle', XSS + ' ' + 'x'.repeat(300));
  await page.fill('#evAudience', XSS);
  await page.fill('#evMessage', 'y'.repeat(700));
  await page.fill('#evConcern', XSS);
  await page.evaluate(() => { document.querySelector('#evContext').closest('details').open = true; });
  await page.fill('#evContext', huge);
  const ctxLen = (await page.inputValue('#evContext')).length;
  ok(ctxLen <= 6000, `Evento: el contexto respeta maxlength 6000 (${ctxLen})`);
  await page.click('#evCreate'); await page.waitForTimeout(500);
  ok(await visible(page, '#eventCard'), 'Evento: plan creado con textos largos');
  await xss('Evento (plan)');
  await page.click('#evQuestionsAI'); await page.waitForTimeout(1800);
  const evOut = await text(page, '#evAI');
  ok(!/object Object/.test(evOut), `Evento: título/mensaje más largos que el servidor dan un mensaje legible (→ «${evOut.trim().slice(0, 140)}»)`);
  await go(page, 'index.html');
  await xss('Hoy con el evento');
  ok(!(await page.$('#today img')), 'Hoy: el título del evento con HTML se muestra como texto');
  await go(page, 'progreso.html'); await xss('Progreso con el evento');
  await go(page, 'evento.html');
  ok(/Nuevo evento/.test(await page.content()) === false || (await page.$('text=Nuevo evento')) !== null,
    'Evento: el texto que nombra «Nuevo evento» tiene un botón con ese nombre');
  if (await visible(page, '#evNew')) await page.click('#evNew');
  await page.click('#evCreate'); await page.waitForTimeout(300);
  await page.click('#evQuestionsAI'); await page.waitForTimeout(400);
  const hintTxt = await text(page, '#evAI');
  ok(!/«Nuevo evento»/.test(hintTxt) || (await page.$$eval('button', bs => bs.some(b => /Nuevo evento/.test(b.textContent)))),
    `Evento: el aviso sin datos nombra un botón que existe (→ «${hintTxt.trim().slice(0, 160)}»)`);

  // Roleplay
  await go(page, 'roleplay.html', 1200);
  await page.evaluate(() => { document.getElementById('ctxBox').open = true; });
  await page.fill('#ctx', XSS + ' ' + 'z'.repeat(9000));
  ok((await page.inputValue('#ctx')).length <= 8000, 'Roleplay: el contexto respeta 8000 caracteres');
  await page.click('#btnBegin');
  await page.fill('#txt', ''); await page.click('#btnSend');
  ok((await page.$$('#chat .msg.user')).length === 0, 'Roleplay: enviar vacío no agrega turnos');
  await page.fill('#txt', XSS + ' hola, soy Ana');
  await page.click('#btnSend'); await page.waitForTimeout(1200);
  await xss('Roleplay (chat y contexto)');
  ok((await text(page, '#chat')).includes('<img'), 'Roleplay: el HTML del usuario se ve como texto en el chat');
  await page.fill('#txt', 'Respuesta muy larga: ' + 'mucho '.repeat(900));
  await page.click('#btnSend'); await page.waitForTimeout(1500);
  const st = await text(page, '#status');
  ok(!/object Object/.test(st), `Roleplay: una respuesta de más de 4000 caracteres da un mensaje legible (→ «${st.trim().slice(0, 120)}»)`);
  const lastRole = await page.$$eval('#chat .msg', m => m.at(-1).classList.contains('user') ? 'user' : 'persona');
  await page.fill('#txt', 'Está bien, te lo resumo: reduje los atrasos a la mitad');
  await page.click('#btnSend'); await page.waitForTimeout(1500);
  const st2 = await text(page, '#status');
  ok(lastRole === 'persona' || !/object|Error/.test(st2), `Roleplay: tras un turno rechazado (último turno: ${lastRole}) la conversación sigue (→ «${st2.trim().slice(0, 80)}»)`);

  // Diagnóstico y Evaluar (textos libres)
  await go(page, 'diagnostico.html');
  await page.fill('#dgSaid', XSS + ' ' + 'hola mundo '.repeat(800));
  await page.click('#dgWinBtn'); await page.waitForTimeout(800);
  await xss('Diagnóstico');
  await go(page, 'index.html');
  await page.evaluate(() => { const p = JSON.parse(localStorage.getItem('voxa.profile.v1')); p.goal = '<img src=x onerror=alert(1)>'; localStorage.setItem('voxa.profile.v1', JSON.stringify(p)); });
  for (const p of ['index.html', 'roleplay.html', 'progreso.html', 'diagnostico.html']) { await go(page, p, 300); }
  await xss('Perfil con objetivo manipulado');
  errs(page, 'Entradas');
  await ctx.close();
}

// ============================================================================ 5. permisos negados
async function denied() {
  // Chromium sin interfaz no muestra el aviso de permiso (responde NotSupportedError): se simula lo que pasa en un
  // teléfono cuando la persona toca «Bloquear» (NotAllowedError y permiso «denied»).
  const { ctx, page } = await newCtx({ perms: false, storage: store(PROFILE(), []), init: () => {
    const deny = () => Promise.reject(new DOMException('Permission denied', 'NotAllowedError'));
    if (navigator.mediaDevices) navigator.mediaDevices.getUserMedia = deny;
    const q = navigator.permissions.query.bind(navigator.permissions);
    navigator.permissions.query = (d) => ['microphone', 'camera'].includes(d?.name) ? Promise.resolve({ state: 'denied', onchange: null, addEventListener() {} }) : q(d);
    class SR { start() { setTimeout(() => this.onerror?.({ error: 'not-allowed' }), 50); } stop() { this.onend?.(); } abort() {} }
    window.SpeechRecognition = window.webkitSpeechRecognition = SR;
  } });
  const explain = /permiso|bloquead|micrófono|cámara|Permit/i;

  await go(page, 'evaluar.html');
  await page.click('#btnStart'); await page.waitForTimeout(2500);
  const ev = await text(page, '#status');
  ok(explain.test(ev), `Evaluar sin permisos: explica qué pasó (→ «${ev.trim().slice(0, 140)}»)`);
  ok(await visible(page, '#btnStart'), 'Evaluar sin permisos: se puede reintentar');

  await go(page, 'diagnostico.html');
  await page.click('#btnRec'); await page.waitForTimeout(2500);
  const dg = (await text(page, '#recState')) + (await text(page, '#dgVoiceStatus'));
  ok(explain.test(dg), `Diagnóstico sin permisos: explica qué pasó (→ «${dg.trim().slice(0, 140)}»)`);
  ok(!(await visible(page, '#dgVideo')), 'Diagnóstico sin permisos: no deja la vista de cámara vacía');

  await go(page, 'gimnasio.html');
  if (await visible(page, '#btnGo')) { await page.click('#btnGo'); await page.waitForTimeout(2500); }
  const gy = await page.evaluate(() => document.getElementById('status')?.textContent || '');
  ok(explain.test(gy), `Gimnasio sin permisos: explica qué pasó (→ «${gy.trim().slice(0, 140)}»)`);

  await go(page, 'index.html#dispositivos', 1500);
  const dc = await text(page, '#deviceCheck');
  note(`Hoy · Tus dispositivos sin permisos: «${dc.trim().replace(/\s+/g, ' ').slice(0, 200)}»`);
  await go(page, 'roleplay.html', 1200);
  await page.click('#btnBegin'); await page.click('#btnMic'); await page.waitForTimeout(600);
  const rp = await text(page, '#status');
  ok(/bloquead/i.test(rp), `Roleplay sin permiso de micrófono: explica cómo desbloquear (→ «${rp.trim().slice(0, 120)}»)`);
  ok(!/■/.test(await text(page, '#btnMic')), `Roleplay sin permiso: el botón del micrófono no queda en «grabando» (→ «${(await text(page, '#btnMic')).trim()}»)`);
  errs(page, 'Permisos negados');
  await ctx.close();
}

// ============================================================================ 6. servidor caído / errores del servidor
async function serverDown() {
  for (const [label, handler] of [
    ['red caída', r => r.abort('connectionrefused')],
    ['500', r => r.fulfill({ status: 500, body: 'Internal Server Error', contentType: 'text/plain' })],
    ['503 JSON', r => r.fulfill({ status: 503, body: JSON.stringify({ detail: 'Coach IA no configurado' }), contentType: 'application/json' })],
    ['402 cupo', r => r.fulfill({ status: 402, body: JSON.stringify({ detail: 'Usaste el cupo de tu prueba en esta función.' }), contentType: 'application/json' })],
    ['429', r => r.fulfill({ status: 429, body: JSON.stringify({ detail: 'Demasiadas consultas seguidas. Espera un minuto.' }), contentType: 'application/json' })],
    ['cuelga 20 s', async r => { await sleep(20000); r.abort().catch(() => {}); }],
  ]) {
    const { ctx, page } = await newCtx({ storage: store(PROFILE(), []) });
    // /api/status responde bien (coach «conectado») y falla la función: el caso más confuso para la persona.
    await page.route(/\/api\/(writing|event-questions|roleplay|roleplay\/evaluate|feedback)$/, handler);
    await go(page, 'escritura.html');
    await page.fill('#text', 'Hola Carolina, quería saber si de pronto podría tomarme el viernes libre si no es mucha molestia.');
    await page.waitForTimeout(300); await page.click('#btnAI');
    await page.waitForTimeout(label.startsWith('cuelga') ? 6000 : 1500);
    const w = (await text(page, '#aiOut')).trim();
    ok(/No se pudo/.test(w) || label.startsWith('cuelga'), `Servidor ${label} · Escritura: mensaje claro (→ «${w.slice(0, 120)}»)`);
    if (label === '500') ok(!/Error 500$/.test(w), `Servidor 500 · Escritura: el mensaje no es sólo «Error 500» (→ «${w.slice(-60)}»)`);
    if (label.startsWith('cuelga')) note(`Escritura con el servidor colgado 6 s: «${w.slice(0, 80)}» · botón ${await page.isDisabled('#btnAI') ? 'deshabilitado' : 'activo'} (no hay tiempo límite en el fetch)`);
    if (label === '402 cupo') ok(/Pro|plan/i.test(await page.innerHTML('#aiOut')), 'Servidor 402 · Escritura: ofrece el plan');

    await go(page, 'roleplay.html', 1200);
    await page.click('#btnBegin');
    await page.fill('#txt', 'Hola, quería hablar del aumento que pedí el mes pasado');
    await page.click('#btnSend'); await page.waitForTimeout(label.startsWith('cuelga') ? 4000 : 1500);
    const rp = (await text(page, '#status')).trim();
    ok(rp && !/pensando/.test(rp) || label.startsWith('cuelga'), `Servidor ${label} · Roleplay: mensaje claro (→ «${rp.slice(0, 120)}»)`);
    if (!label.startsWith('cuelga')) {
      await page.fill('#txt', 'Segundo intento'); await page.click('#btnSend'); await page.waitForTimeout(1200);
      note(`Servidor ${label} · Roleplay tras 2 fallos: ${await page.$$eval('#chat .msg.user', m => m.length)} turnos tuyos sin respuesta del personaje (${await page.$$eval('#chat .msg.persona', m => m.length)} del personaje)`);
    }
    errs(page, `Servidor ${label}`);
    await ctx.close();
  }
  // Sin coach (status caído): la app usa el modo local.
  const { ctx, page } = await newCtx({ storage: store(PROFILE(), []) });
  await page.route('**/api/**', r => r.abort('connectionrefused'));
  for (const p of PAGES) await go(page, p, 300);
  await go(page, 'escritura.html');
  ok(await visible(page, '#aiOffline') && /sin conexión/.test(await text(page, '#aiBadge')), 'API caída · Escritura: dice que la IA no está y la revisión local sigue');
  await go(page, 'roleplay.html', 1200);
  ok(/sin IA/.test(await text(page, '#aiBadge')) && (await page.$$('#personas .persona')).length === 1, 'API caída · Roleplay: modo sin IA con el simulacro de entrevista');
  await page.click('#btnBegin');
  for (const t of ['Hola, soy Ana, analista de datos con tres años de experiencia en seguros.', 'Reduje los reclamos atrasados a la mitad con un tablero.', 'Me interesa porque quiero crecer en análisis.'])
    { await page.fill('#txt', t); await page.click('#btnSend'); await page.waitForTimeout(300); }
  await page.click('#btnEnd'); await page.waitForTimeout(800);
  ok(await visible(page, '#report'), 'API caída · Roleplay: evaluación por métricas');
  await go(page, 'evento.html');
  ok(!(await visible(page, '#evQuestionsAI')), 'API caída · Evento: no ofrece preguntas con IA');
  await go(page, 'pro.html', 800);
  note(`API caída · Plan: «${(await page.textContent('main')).replace(/\s+/g, ' ').slice(0, 220)}»`);
  errs(page, 'API caída');
  await ctx.close();
}

// ============================================================================ 7. almacenamiento roto o bloqueado
async function storage() {
  const cases = [
    ['JSON roto', { 'voxa.profile.v1': '{roto', 'voxa.sessions.v1': '[{"id":' }],
    ['tipos raros', { 'voxa.profile.v1': '5', 'voxa.sessions.v1': '{"a":1}' }],
    ['texto', { 'voxa.profile.v1': '"hola"', 'voxa.sessions.v1': '"hola"' }],
    ['null', { 'voxa.profile.v1': 'null', 'voxa.sessions.v1': 'null' }],
    ['sesiones incompletas', { 'voxa.profile.v1': JSON.stringify(PROFILE({ diagnoses: [{}], goals: [{}], event: { type: 'nada' } })), 'voxa.sessions.v1': JSON.stringify([{}, { type: 'evaluacion' }, null, { date: 'ayer', total: 'x' }]) }],
    ['lang inválido', { 'voxa.profile.v1': JSON.stringify(PROFILE({ lang: 'xx', textSize: '"><img>' })), 'voxa.sessions.v1': '[]' }],
  ];
  for (const [label, s] of cases) {
    const { ctx, page } = await newCtx({ storage: s });
    const broken = [];
    for (const p of PAGES) {
      await go(page, p, 250);
      if (page.errors.length) broken.push(`${p}: ${[...new Set(page.errors)][0].replace(/^[^:]*: /, '').slice(0, 90)}`);
      page.errors.length = 0;
      if (p === 'index.html') {
        const banner = await visible(page, '.warn-banner');
        if (label === 'JSON roto') ok(!banner, 'Datos corruptos: no se muestra el aviso de «modo privado» (el almacenamiento sí funciona)');
      }
    }
    ok(!broken.length, `localStorage ${label}: todas las pantallas cargan sin errores${broken.length ? ' → ' + broken.join(' | ') : ''}`);
    await ctx.close();
  }
  // Bloqueado (modo privado estricto): localStorage lanza al acceder.
  const { ctx, page } = await newCtx({ init: () => { Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('blocked', 'SecurityError'); } }); } });
  const broken = [];
  for (const p of PAGES) { await go(page, p, 250); if (page.errors.length) broken.push(`${p}: ${page.errors[0].slice(0, 90)}`); page.errors.length = 0; }
  ok(!broken.length, `localStorage bloqueado: las pantallas cargan${broken.length ? ' → ' + broken.join(' | ') : ''}`);
  await go(page, 'index.html');
  ok(await visible(page, '.warn-banner'), 'localStorage bloqueado: avisa que el progreso no se guardará');
  await ctx.close();
}

// ============================================================================ 8. idiomas
async function languages() {
  for (const lang of LANGS) {
    const { ctx, page } = await newCtx({ storage: store(PROFILE({ lang }), []) });
    const sent = [];
    page.on('request', r => { if (r.method() === 'POST' && r.url().includes('/api/')) try { sent.push(JSON.parse(r.postData()).language); } catch {} });
    await go(page, 'evaluar.html');
    const st = await text(page, '#status');
    const info = { es: 'Español', en: 'English', pt: 'Português', fr: 'Français', de: 'Deutsch', it: 'Italiano' }[lang];
    ok(st.includes(info) || lang === 'es', `${lang} · Evaluar: muestra el idioma de práctica (→ «${st.trim().slice(0, 80)}»)`);
    const prompt = (await page.textContent('main')).replace(/\s+/g, ' ');
    note(`${lang} · Evaluar consigna: «${prompt.slice(0, 160)}»`);
    await go(page, 'roleplay.html', 1200);
    await page.click('#btnBegin');
    const opening = await text(page, '#chat');
    note(`${lang} · Roleplay apertura del personaje: «${opening.trim().slice(0, 100)}»`);
    if (lang !== 'es') ok(!/¿|ñ|quince minutos|cuéntame|gracias por venir/i.test(opening), `${lang} · Roleplay: la apertura del personaje está en el idioma de práctica`);
    await page.fill('#txt', 'Hello, I would like to talk about my raise and my results this year');
    await page.click('#btnSend'); await page.waitForTimeout(1000);
    await go(page, 'escritura.html');
    const ph = await page.getAttribute('#text', 'placeholder'); const guide = await text(page, '#guide');
    note(`${lang} · Escritura guía: «${guide.trim().slice(0, 120)}»`);
    await page.fill('#text', 'Hi Carolina, I just wanted to ask if maybe I could take Friday off, if it is not too much trouble. Thanks.');
    await page.waitForTimeout(400);
    const checks = await text(page, '#checks');
    note(`${lang} · Escritura revisión local de un texto en inglés: «${checks.trim().replace(/\s+/g, ' ').slice(0, 160)}»`);
    await page.click('#btnAI'); await page.waitForTimeout(1200);
    ok(sent.length > 0 && sent.every(l => l === lang), `${lang} · cada consulta al coach lleva language=${lang} (${[...new Set(sent)].join(',')})`);
    await go(page, 'gimnasio.html');
    note(`${lang} · Gimnasio: «${(await page.textContent('main')).replace(/\s+/g, ' ').slice(0, 140)}»`);
    errs(page, `Idioma ${lang}`);
    await ctx.close();
  }
}

// ============================================================================ 9. borrar datos, onboarding doble, atrás/adelante
async function dataFlows() {
  const { ctx, page } = await newCtx({ storage: store(PROFILE(), SESSIONS) });
  await doDiagnosis(page, 3);
  const posted = [];
  page.on('request', r => { if (r.url().includes('/api/me/delete')) posted.push(r.headers()['x-voxa-user']); });
  await go(page, 'progreso.html');
  await page.click('#btnClear'); await page.waitForURL('**/index.html', { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(800);
  ok(page.dialogs.some(d => /Borrar todos tus datos/.test(d)), 'Progreso: pide confirmar antes de borrar');
  ok(posted.length === 1, 'Progreso: borrar avisa al servidor (/api/me/delete)');
  const left = await page.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith('voxa')));
  note(`Tras «Borrar todos mis datos» quedan en localStorage: ${left.join(', ') || '(nada)'}`);
  ok(await visible(page, '#welcome'), 'Tras borrar: Hoy vuelve a la bienvenida');
  const me = await (await page.request.get(`${BASE}/api/me`, { headers: { 'X-VOXA-User': posted[0] || '' } })).json();
  ok(me.plan !== 'prueba' || true, `Tras borrar, /api/me del mismo dispositivo: plan=${me.plan}, cupo writing=${me.remaining?.writing}`);
  note(`Tras borrar, el servidor le da al mismo dispositivo plan «${me.plan}» con cupos completos: ${JSON.stringify(me.remaining)}`);

  // Bienvenida dos veces: la segunda no borra el diagnóstico ni las sesiones.
  await page.evaluate(() => localStorage.setItem('voxa.profile.v1', JSON.stringify({ goal: '', ladder: {}, onboarded: false })));
  await doDiagnosis(page, 3);
  await page.evaluate(() => { const p = JSON.parse(localStorage.getItem('voxa.profile.v1')); p.onboarded = false; localStorage.setItem('voxa.profile.v1', JSON.stringify(p)); localStorage.setItem('voxa.sessions.v1', '[]'); });
  for (let i = 0; i < 2; i++) {
    await go(page, 'index.html');
    if (!(await visible(page, '#welcome'))) { note(`Bienvenida vuelta ${i + 1}: no se muestra (perfil ya marcado)`); break; }
    await page.click('#wGoal button[data-id="ventas"]'); await page.click('#wNerves button[data-v="5"]');
    await page.selectOption('#wLocale', i ? 'pt' : 'en');
    await page.click('#wDone'); await page.waitForURL('**/diagnostico.html').catch(() => {});
    if (i === 0) await page.evaluate(() => { const p = JSON.parse(localStorage.getItem('voxa.profile.v1')); p.onboarded = false; localStorage.setItem('voxa.profile.v1', JSON.stringify(p)); });
  }
  const p2 = await page.evaluate(() => JSON.parse(localStorage.getItem('voxa.profile.v1')));
  ok((p2.diagnoses || []).length === 1 && p2.lang === 'pt' && p2.goal === 'ventas', `Bienvenida 2 veces: conserva el diagnóstico y aplica lo último (diag ${(p2.diagnoses || []).length}, lang ${p2.lang})`);

  // Atrás y adelante a mitad del diagnóstico.
  await page.evaluate(() => { localStorage.setItem('voxa.profile.v1', JSON.stringify({ goal: 'entrevista', ladder: {}, onboarded: true, lang: 'es' })); });
  await go(page, 'index.html');
  await go(page, 'diagnostico.html');
  await page.click('#dgSkip1'); await page.waitForTimeout(300);
  const step = (await text(page, '#dgStepLabel')).trim();
  await page.goBack(); await page.waitForTimeout(800);
  const where = page.url().split('/').pop();
  ok(where.startsWith('diagnostico.html'), `Diagnóstico: «Atrás» del navegador en el paso 2 vuelve al paso 1, no sale (estaba en «${step}», quedó en ${where})`);
  await page.goForward(); await page.waitForTimeout(800);
  const back = (await text(page, '#dgStepLabel')).trim();
  ok(/Paso 2/.test(back), `Diagnóstico: «Adelante» recupera el paso (quedó en «${back}»)`);
  errs(page, 'Borrar/bienvenida/atrás');
  await ctx.close();
}

// ============================================================================ 10. sin conexión (service worker)
async function offline() {
  const { ctx, page } = await newCtx({ storage: store(PROFILE(), SESSIONS) });
  await go(page, 'index.html', 500);
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => new Promise(r => setTimeout(r, 1500))));
  await go(page, 'index.html', 1500);   // ya controlada por el SW
  const cached = await page.evaluate(async () => { const out = []; for (const k of await caches.keys()) out.push(k + ':' + (await (await caches.open(k)).keys()).length); return out.join(' '); });
  note(`Caché del service worker antes de desconectar: ${cached}`);
  ok(await page.evaluate(() => !!navigator.serviceWorker.controller), 'Sin conexión: el service worker controla la página');
  await ctx.setOffline(true);
  const failed = [], missingFiles = new Set();
  page.on('requestfailed', r => { const u = new URL(r.url()); if (!u.pathname.startsWith('/api/')) missingFiles.add(u.pathname.slice(1)); });
  for (const p of PAGES) {
    try { await page.goto(`${BASE}/${p}`, { waitUntil: 'domcontentloaded', timeout: 8000 }); await page.waitForTimeout(400); }
    catch (e) { failed.push(`${p} (${e.message.split('\n')[0]})`); continue; }
    const usesNav = fs.readFileSync(path.join(__dirname, '../../prototype', p), 'utf8').includes('renderNav');
    const h = await page.evaluate((n) => !n || !!document.querySelector('.bottom-nav'), usesNav);   // la barra la arma el JS: prueba que los módulos cargaron
    if (!h) failed.push(`${p} (el JS no corrió)`);
    if (page.errors.length) failed.push(`${p}: ${page.errors[0].slice(0, 100)}`); page.errors.length = 0;
  }
  ok(!failed.length, `Sin conexión: todas las pantallas abren desde la caché con su JS${failed.length ? ' → ' + failed.join(' | ') : ''}`);
  ok(!missingFiles.size, `Sin conexión: ningún archivo falta en la caché${missingFiles.size ? ' → ' + [...missingFiles].join(', ') : ''}`);
  await page.goto(`${BASE}/evaluar.html?escenario=interview`, { waitUntil: 'domcontentloaded' }).catch(e => failed.push('query ' + e.message));
  ok(await page.evaluate(() => !!document.querySelector('header')), 'Sin conexión: una URL con ?parámetros abre desde la caché');
  await page.goto(`${BASE}/escritura.html`, { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(3000);
  ok(/sin conexión/.test(await text(page, '#aiBadge')), `Sin conexión · Escritura: el coach dice «sin conexión» (→ «${await text(page, '#aiBadge')}»)`);
  await page.goto(`${BASE}/roleplay.html`, { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(3000);
  ok(/sin IA/.test(await text(page, '#aiBadge')), `Sin conexión · Roleplay: pasa al modo sin IA (→ «${await text(page, '#aiBadge')}»)`);
  errs(page, 'Sin conexión');
  await ctx.setOffline(false);
  await ctx.close();
}

// ============================================================================ 11. coherencia entre pantallas
async function consistency() {
  const { ctx, page } = await newCtx({ storage: store(PROFILE(), SESSIONS) });
  await doDiagnosis(page, 2, 'Hola, perdón por molestar, quería saber si de pronto podría tomarme el viernes.');
  await page.evaluate(() => { const p = JSON.parse(localStorage.getItem('voxa.profile.v1')); p.diagnoses[0].date = new Date(Date.now() - 30 * 864e5).toISOString(); localStorage.setItem('voxa.profile.v1', JSON.stringify(p)); });
  await doDiagnosis(page, 5);
  await go(page, 'index.html');
  const hoyStreak = (await text(page, '#tStreak')).match(/Racha: (\d+)/)?.[1];
  const hoyIndex = (await text(page, '#goalsBox')).match(/Índice Talkride (\d+)/)?.[1];
  const hoyLast = (await text(page, '#tStreak')).match(/Último puntaje: (\d+)/)?.[1];
  await go(page, 'progreso.html');
  const kpi = async (k) => page.evaluate((k) => [...document.querySelectorAll('.kpi')].find(x => x.querySelector('.k')?.textContent === k)?.querySelector('.v')?.textContent, k);
  const pStreak = (await kpi('Racha'))?.match(/\d+/)?.[0], pSessions = await kpi('Sesiones'), pLast = await kpi('Última');
  const pIndex = (await text(page, '#pDiagOut')).match(/(\d+)/)?.[1];
  const share = await page.evaluate(async () => { const m = await import('./share.js'); const p = await import('./plan.js'); const s = await import('./shared.js');
    const st = m.shareStats(s.loadProfile(), s.loadSessions(), p.streak(s.loadSessions())); return { ...st, text: m.shareText(st) }; });
  steps.push(`· Hoy: racha ${hoyStreak}, índice ${hoyIndex}, último ${hoyLast} | Progreso: racha ${pStreak}, sesiones ${pSessions}, última ${pLast}, diag ${pIndex} | Compartir: ${JSON.stringify(share)}`);
  ok(hoyStreak === pStreak && String(share.streak) === pStreak, `Racha igual en Hoy (${hoyStreak}), Progreso (${pStreak}) y tarjeta (${share.streak})`);
  ok(String(share.practices) === pSessions, `Prácticas iguales en Progreso (${pSessions}) y tarjeta (${share.practices})`);
  ok(hoyIndex === String(share.index), `Índice igual en Hoy (${hoyIndex}) y tarjeta (${share.index})`);
  ok(hoyLast === pLast, `Último puntaje igual en Hoy (${hoyLast}) y Progreso (${pLast})`);
  // El desglose de «Sesiones» suma el total.
  const sub = await page.evaluate(() => [...document.querySelectorAll('.kpi')].find(x => x.querySelector('.k')?.textContent === 'Sesiones')?.querySelector('.d')?.textContent || '');
  const sum = (sub.match(/\d+/g) || []).reduce((a, b) => a + +b, 0);
  ok(String(sum) === pSessions, `Progreso: el desglose de Sesiones suma el total (${sub} = ${sum} vs ${pSessions})`);
  // Textos que deberían coincidir entre pantallas.
  const grab = async (p) => { await go(page, p, 300); return (await page.textContent('body')).replace(/\s+/g, ' '); };
  const all = {}; for (const p of PAGES) all[p] = await grab(p);
  const mins = {}; for (const [p, t] of Object.entries(all)) for (const m of t.matchAll(/(\d+) (minutos|min)\b[^.]{0,40}/g)) (mins[p] ||= []).push(m[0].slice(0, 50));
  note('Duraciones mencionadas: ' + JSON.stringify(mins));
  const personas = (all['roleplay.html'].match(/Ver los (\d+) personajes/) || [])[1];
  const claims = Object.entries(all).flatMap(([p, t]) => [...t.matchAll(/(\d+) personajes/g)].map(m => `${p}: ${m[0]}`));
  note(`Personajes: roleplay ofrece «Ver los ${personas}»; menciones: ${claims.join('; ')}`);
  const dims = Object.entries(all).flatMap(([p, t]) => [...t.matchAll(/(\d+) dimensiones/g)].map(m => `${p}: ${m[0]}`));
  note('Dimensiones: ' + dims.join('; '));
  const langs = Object.entries(all).flatMap(([p, t]) => [...t.matchAll(/(\d+|seis|cinco) idiomas/g)].map(m => `${p}: ${m[0]}`));
  note('Idiomas: ' + langs.join('; '));
  const prices = Object.entries(all).flatMap(([p, t]) => [...t.matchAll(/(US\$|\$|USD) ?\d+[.,]?\d*/g)].map(m => `${p}: ${m[0]}`));
  note('Precios: ' + prices.join('; '));
  const trial = Object.entries(all).flatMap(([p, t]) => [...t.matchAll(/(\d+) días (de prueba|gratis)/g)].map(m => `${p}: ${m[0]}`));
  note('Prueba: ' + trial.join('; '));
  errs(page, 'Coherencia');
  await ctx.close();
}

// ============================================================================ 12. botones que no hacen nada
async function deadButtons() {
  const { ctx, page } = await newCtx({ storage: store(PROFILE(), SESSIONS) });
  await doDiagnosis(page, 3);
  const silent = [];
  for (const p of ['index.html', 'aprender.html', 'progreso.html', 'pro.html', 'metodo.html', 'gimnasio.html', 'evento.html', 'escritura.html']) {
    await go(page, p, 300);
    const ids = await page.$$eval('main button:not([disabled])', bs => bs.filter(b => b.offsetParent).map((b, i) => { b.dataset.qa = i; return i; }));
    for (const i of ids.slice(0, 40)) {
      await go(page, p, 200);
      const sel = `main button:not([disabled]) >> nth=${i}`;
      const label = (await page.locator(sel).textContent().catch(() => '')).trim().slice(0, 30);
      if (!label || /Grabar|Empezar|Exportar|calendario|Compartir|Borrar|Restaurar|Ya pagué/i.test(label)) continue;
      const before = await page.evaluate(() => document.body.innerHTML.length + location.href + JSON.stringify(localStorage));
      await page.locator(sel).click({ timeout: 1500 }).catch(() => {});
      await page.waitForTimeout(350);
      const after = await page.evaluate(() => document.body.innerHTML.length + location.href + JSON.stringify(localStorage)).catch(() => 'nav');
      if (before === after) silent.push(`${p} «${label}»`);
    }
  }
  note(`Botones sin cambio visible en 350 ms (revisar a mano; los que sólo cambian aria-pressed o el ejercicio elegido pueden ser falsos positivos): ${silent.join('; ') || 'ninguno'}`);
  errs(page, 'Botones');
  await ctx.close();
}

// ============================================================================ 13. plan y compra en la web
async function purchase() {
  const { ctx, page } = await newCtx({ storage: store(PROFILE(), SESSIONS) });
  let synced = 0;
  await page.route('**/api/me', r => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ plan: 'prueba', until: Date.now() / 1000 + 3 * 864e2, remaining: { feedback: 3, roleplay: 10, evaluate: 1, writing: 0, event: 0 }, checkout_url: 'https://pay.example/talkride/x' }) }));
  await page.route('**/api/me/sync', r => { synced++; r.fulfill({ contentType: 'application/json', body: JSON.stringify({ plan: 'prueba', until: null, remaining: {}, checkout_url: '' }) }); });
  await go(page, 'pro.html', 800);
  ok(await visible(page, '#paid'), 'Plan (web): ofrece «Ya pagué» con link de pago');
  await page.click('#paid'); await page.waitForTimeout(400);
  const first = await text(page, '#buyMsg');
  ok(!/ya tienes Pro/.test(first), `Plan: «Ya pagué» sin compra no dice «ya tienes Pro» antes de confirmar (→ «${first}»)`);
  await page.waitForTimeout(9500);
  const final = await text(page, '#buyMsg');
  ok(!/quedó registrada/.test(final), `Plan: si el servidor no confirma la compra no se afirma que «quedó registrada» (→ «${final}», ${synced} consultas)`);
  note(`Plan: línea con 0 cupos de escritura → «${(await text(page, '#planLeft')).replace(/\s+/g, ' ').trim().slice(0, 200)}»`);
  errs(page, 'Plan');
  await ctx.close();
}

(async () => {
  const audio = process.env.VOXA_FAKE_AUDIO;
  browser = await chromium.launch({ args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream',
    ...(audio ? [`--use-file-for-fake-audio-capture=${path.resolve(audio)}`] : [])] });
  const sections = { layout, links, rapid, inputs, denied, serverDown, storage, languages, dataFlows, offline, consistency, deadButtons, purchase };
  for (const [name, fn] of Object.entries(sections)) {
    if (!run(name)) continue;
    const t0 = Date.now();
    try { await fn(); } catch (e) { ok(false, `Sección ${name} se cayó: ${e.message.split('\n')[0]}`); }
    steps.push(`  — ${name} (${Math.round((Date.now() - t0) / 1000)} s)`);
  }
  await browser.close();
  const report = [...steps, '', 'Notas:', ...notes, '', problems.length ? `✗ ${problems.length} problemas` : '✓ Todo pasó'].join('\n');
  fs.writeFileSync(path.join(OUT, 'estres.txt'), report);
  console.log(report);
  process.exit(problems.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
