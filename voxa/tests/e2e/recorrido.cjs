// Recorrido completo de Talkride como lo haría una persona nueva, en un celular (390 × 844), en modo claro y oscuro.
// Usa el servidor con coach IA simulado (servidor_simulado.py) y micrófono y cámara simulados del navegador.
//
//   python voxa/tests/e2e/servidor_simulado.py 8800 &
//   python voxa/tests/e2e/voz_sintetica.py voz.wav
//   VOXA_FAKE_AUDIO=voz.wav node voxa/tests/e2e/recorrido.cjs http://localhost:8800 carpeta-de-capturas
//
// Falla (código 1) si hay errores de JavaScript, botones demasiado chicos, contenido que se sale de la pantalla
// o algún paso del recorrido no llega a donde debe.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = (process.argv[2] || 'http://localhost:8800').replace(/\/$/, '');
const OUT = process.argv[3] || 'capturas';
fs.mkdirSync(OUT, { recursive: true });

const problems = [];
const steps = [];
const ok = (cond, what) => { steps.push(`${cond ? '✓' : '✗'} ${what}`); if (!cond) problems.push(what); };

// Revisión de UX de cada pantalla: toques de al menos 44 px (WCAG 2.5.5 / Apple HIG), nada fuera de la pantalla,
// imágenes con texto alternativo (alt="" vale para las decorativas, como el logo junto al nombre) y controles con nombre accesible.
async function audit(page, name) {
  const r = await page.evaluate(() => {
    const vis = (el) => { const b = el.getBoundingClientRect(); const s = getComputedStyle(el); return b.width > 0 && b.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
    const small = [...document.querySelectorAll('main button, main a.btn-link, main select, main input:not([type=file]):not([type=checkbox]):not([type=radio]):not([type=range]), .bottom-nav a')]
      .filter(vis).filter(el => el.getBoundingClientRect().height < 44)
      .map(el => `${el.tagName.toLowerCase()}#${el.id || ''} «${(el.textContent || el.value || '').trim().slice(0, 30)}» ${Math.round(el.getBoundingClientRect().height)}px`);
    const unnamed = [...document.querySelectorAll('button, a[href], input:not([type=hidden]), select, textarea')].filter(vis)
      .filter(el => !(el.getAttribute('aria-label') || el.textContent.trim() || el.title || el.placeholder || (el.id && document.querySelector(`label[for="${el.id}"]`)) || el.closest('label')))
      .map(el => `${el.tagName.toLowerCase()}#${el.id}`);
    return { overflow: document.documentElement.scrollWidth - window.innerWidth, small, unnamed, imgs: [...document.images].filter(i => !i.hasAttribute('alt')).length };
  });
  ok(r.overflow <= 1, `${name}: sin desplazamiento horizontal (${r.overflow}px)`);
  ok(r.small.length === 0, `${name}: toques de 44 px o más${r.small.length ? ' → ' + r.small.slice(0, 6).join('; ') : ''}`);
  ok(r.unnamed.length === 0, `${name}: controles con nombre${r.unnamed.length ? ' → ' + r.unnamed.join(', ') : ''}`);
  ok(r.imgs === 0, `${name}: imágenes con texto alternativo`);
}

async function shoot(page, name) {
  for (const scheme of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme: scheme });
    await page.waitForTimeout(150);
    await page.screenshot({ path: path.join(OUT, `${name}-${scheme}.png`), fullPage: true });
  }
  await page.emulateMedia({ colorScheme: 'light' });
}

(async () => {
  // Voz sintética (sílabas, pausas y cambios de tono) para que el análisis tenga algo que medir: voz_sintetica.py.
  const audio = process.env.VOXA_FAKE_AUDIO;
  const browser = await chromium.launch({ args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream',
    ...(audio ? [`--use-file-for-fake-audio-capture=${path.resolve(audio)}`] : [])] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, permissions: ['microphone', 'camera'], locale: 'es-CL' });
  const page = await ctx.newPage();
  const jsErrors = [];
  page.on('pageerror', e => jsErrors.push(`${page.url().split('/').pop()}: ${e.message}`));
  page.on('dialog', d => d.accept());
  const go = async (p) => { await page.goto(`${BASE}/${p}`); await page.waitForLoadState('networkidle'); await page.waitForTimeout(400); };

  // 1. Primera vez: bienvenida.
  await go('index.html');
  ok(await page.isVisible('#welcome'), 'Hoy (primera vez): se ve la bienvenida');
  await shoot(page, '01-bienvenida'); await audit(page, 'Bienvenida');

  // 2. Diagnóstico por pasos, con la presentación escrita.
  await go('diagnostico.html');
  await page.fill('#dgSaid', 'Hola, soy Ana y trabajo en análisis de datos en una aseguradora. Me apasiona convertir números en decisiones simples para los equipos. El año pasado reduje los reclamos atrasados a la mitad con un tablero nuevo. Quiero que cada dato cuente una historia que la gente recuerde.');
  await page.click('#dgWinBtn'); await page.waitForTimeout(500);
  ok((await page.textContent('#dgWin')).includes('primera fortaleza'), 'Diagnóstico: primera fortaleza al terminar de hablar');
  await shoot(page, '02-diagnostico-voz'); await audit(page, 'Diagnóstico · voz');
  await page.click('#dgNext1');
  for (const d of await page.$$eval('#selfItems button[data-dim]', bs => [...new Set(bs.map(b => b.dataset.dim))])) await page.click(`#selfItems button[data-dim="${d}"][data-v="3"]`);
  await shoot(page, '03-diagnostico-autoevaluacion'); await audit(page, 'Diagnóstico · autoevaluación');
  await page.click('#dgNext2');
  await page.fill('#dgWrite', 'Hola Carolina, perdón por molestar, quería saber si de pronto podría tomarme el viernes libre. Gracias.');
  await page.click('#dgRun'); await page.waitForTimeout(1200);
  ok(await page.isVisible('#dgOut'), 'Diagnóstico: perfil y metas');
  await shoot(page, '04-diagnostico-resultado'); await audit(page, 'Diagnóstico · resultado');
  await page.click('#dgSave'); await page.waitForURL('**/index.html');

  // 3. Hoy, ya con diagnóstico.
  await go('index.html');
  ok(await page.isVisible('#today'), 'Hoy: práctica del día');
  ok(await page.isVisible('#tPlan'), 'Hoy: línea del plan (prueba del coach IA)');
  await shoot(page, '05-hoy'); await audit(page, 'Hoy');

  // 4. Evaluar con cámara y micrófono simulados.
  await go('evaluar.html');
  await shoot(page, '06-evaluar'); await audit(page, 'Evaluar');
  await page.click('#btnStart');
  await page.waitForTimeout(9000);
  if (await page.isVisible('#btnStop')) await page.click('#btnStop');
  await page.waitForTimeout(2500);
  ok(await page.isVisible('#report'), 'Evaluar: reporte al terminar');
  await shoot(page, '07-evaluar-reporte'); await audit(page, 'Evaluar · reporte');

  // 5. Roleplay con el coach IA (simulado).
  await go('roleplay.html');
  await shoot(page, '08-roleplay'); await audit(page, 'Roleplay');
  const persona = await page.$('#personas .persona[data-id="reclutadora"]') || await page.$('#personas .persona');
  await persona.click(); await page.waitForTimeout(300);
  await page.click('#btnBegin'); await page.waitForTimeout(600);
  for (const t of ['Me interesa porque llevo tres años analizando datos y quiero aplicarlo a decisiones de negocio.',
    'En mi último trabajo reduje los reclamos atrasados a la mitad con un tablero de prioridades.',
    'Volvería a hacerlo, pero involucraría antes al equipo de operaciones.']) {
    const before = (await page.$$('#chat > *')).length;
    await page.fill('#txt', t); await page.click('#btnSend');
    // Con IA real, cada turno tarda unos segundos: se espera la respuesta del personaje (hasta 60 s).
    await page.waitForFunction((n) => document.querySelectorAll('#chat > *').length >= n + 2, before, { timeout: 60000 }).catch(() => {});
  }
  ok((await page.$$('#chat > *')).length >= 6, 'Roleplay: el personaje responde cada turno');
  await shoot(page, '09-roleplay-conversacion'); await audit(page, 'Roleplay · conversación');
  await page.click('#btnEnd');
  await page.waitForFunction(() => /Siguiente paso/.test(document.getElementById('evalOut')?.textContent || ''), null, { timeout: 90000 }).catch(() => {});
  ok(await page.isVisible('#report'), 'Roleplay: evaluación al terminar');
  await shoot(page, '10-roleplay-evaluacion');

  // 6. Escritura con el coach IA.
  await go('escritura.html');
  await page.fill('#text', 'Hola Carolina, perdón por molestar, quería saber si de pronto podría tomarme el viernes libre si no es mucha molestia. Gracias y perdón.');
  await page.waitForTimeout(500);
  await shoot(page, '11-escritura'); await audit(page, 'Escritura');
  if (await page.isVisible('#btnAI')) {
    await page.click('#btnAI');
    await page.waitForFunction(() => /Versión mejorada|No se pudo/.test(document.getElementById('aiOut').textContent), null, { timeout: 90000 }).catch(() => {});
  }
  ok((await page.textContent('#aiOut')).includes('Versión mejorada'), 'Escritura: el coach reescribe el correo');
  await shoot(page, '12-escritura-coach');

  // 7. Evento real con preguntas a la medida.
  await go('evento.html');
  await page.selectOption('#evType', { index: 0 });
  const d = new Date(Date.now() + 9 * 864e5).toISOString().slice(0, 10);
  await page.fill('#evDate', d);
  await page.fill('#evTitle', 'Entrevista para analista de datos');
  await page.fill('#evAudience', 'Gerente de riesgos de una aseguradora');
  await page.fill('#evConcern', 'No tengo experiencia en seguros');
  await page.click('#evCreate'); await page.waitForTimeout(500);
  ok(await page.isVisible('#eventCard'), 'Evento: plan día a día');
  if (await page.isVisible('#evQuestionsAI')) {
    await page.click('#evQuestionsAI');
    await page.waitForFunction(() => /Preguntas para tu caso|No se pudieron/.test(document.getElementById('evAI').textContent), null, { timeout: 90000 }).catch(() => {});
  }
  ok((await page.$$('#evAI details')).length >= 3, 'Evento: preguntas a la medida');
  await shoot(page, '13-evento'); await audit(page, 'Evento');

  // 8. Lo nuevo: memoria del personaje, personajes según la meta, letra grande, compartir y «Hecho para ti».
  await go('roleplay.html');
  ok((await page.$$('#personas .persona:not(.hidden)')).length === 4, 'Roleplay: 4 personajes según tu meta');
  ok(await page.isVisible('#morePersonas'), 'Roleplay: «Ver los 9 personajes»');
  await page.click('#personas .persona[data-id="reclutadora"]').catch(() => {});
  ok((await page.textContent('#brief')).includes('La última vez'), 'Roleplay: el personaje recuerda tu siguiente paso');
  await go('index.html');
  await page.selectOption('#sText', 'lg');
  ok(await page.evaluate(() => document.documentElement.dataset.text) === 'lg', 'Ajustes: letra grande aplicada');
  await go('progreso.html');
  ok(await page.evaluate(() => document.documentElement.dataset.text) === 'lg', 'Ajustes: la letra grande sigue en otras pantallas');
  ok(await page.isVisible('#btnShare'), 'Progreso: compartir mi avance');
  await go('index.html'); await page.selectOption('#sText', 'normal');
  steps.push(`· Hecho para ti en Hoy: ${await page.isVisible('#forYouCard') ? 'visible' : 'sin ejercicios (las métricas salieron bien)'}`);

  // 9. El resto de las pantallas.
  for (const [p, name] of [['gimnasio.html', '14-gimnasio'], ['aprender.html', '15-aprender'], ['progreso.html', '16-progreso'], ['pro.html', '17-plan'], ['privacidad.html', '18-privacidad']]) {
    await go(p); await shoot(page, name); await audit(page, name.slice(3));
  }

  ok(jsErrors.length === 0, 'Sin errores de JavaScript' + (jsErrors.length ? ' → ' + jsErrors.join(' | ') : ''));
  await browser.close();
  console.log(steps.join('\n'));
  console.log(`\n${problems.length ? `✗ ${problems.length} problemas` : '✓ Todo el recorrido pasó'} · capturas en ${OUT}`);
  process.exit(problems.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
