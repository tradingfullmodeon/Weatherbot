// Utilidades compartidas por las páginas de Talkride: diccionarios, métricas de texto,
// historial local de sesiones y acceso a la API del coach IA.

// Muletillas frecuentes en español (incluye variantes regionales).
export const FILLERS = ['eh+', 'em+', 'ehm+', 'mm+', 'este', 'o sea', 'bueno', 'pues', 'como que', 'digamos',
  'tipo', 'básicamente', 'literalmente', 'en plan', 'vale', 'sabes', 'cachai', 'me explico',
  'onda', 'viste', 'osea', 'güey', 'po'];
// Atenuadores que restan asertividad cuando se abusa de ellos.
// Las disculpas sólo cuentan cuando piden perdón por existir («perdón por molestar»), no al disculparse de verdad.
export const HEDGES = ['creo que', 'tal vez', 'quizás', 'quizá', 'un poquito', 'perdón por molestar', 'perdona que te moleste',
  'disculpa que te moleste', 'disculpa la molestia', 'no sé si', 'más o menos', 'de alguna manera', 'supongo', 'solo quería', 'sólo quería',
  'quería saber si', 'quería ver si', 'cuando puedas', 'cuando puedan', 'si no es mucha molestia', 'si no es molestia',
  // «de pronto» como atenuador (Colombia) sólo antes de un condicional: «de pronto se cortó la luz» no cuenta.
  'de pronto podría', 'de pronto podrías', 'de pronto sería', 'de pronto se podría', 'de pronto puedas', 'a lo mejor', 'capaz que'];

const escRe = (s) => s.replace(/[.*?^${}()|[\]\\]/g, '\\$&');
const asPattern = (w) => w.endsWith('+') ? escRe(w.slice(0, -1)) + '+' : escRe(w);
const wordRe = (patterns) => new RegExp(`(^|[^\\p{L}])(${patterns.join('|')})(?=$|[^\\p{L}])`, 'giu');

// Palabras que también son normales («este informe», «este tipo de cliente», «es bueno que», «vale la pena»,
// «viste la película») sólo cuentan como muletilla en contexto de relleno: seguidas de una pausa, al
// inicio de la frase (bueno) o antes de una palabra funcional («este, la idea es…», «este eh…»).
const PAUSE = String.raw`(?:\s*[,.;:…!?]|\s*$)`;
const FUNCTION_WORD = String.raw`\s+(?:el|la|los|las|lo|un|una|unos|unas|yo|tú|me|te|se|le|les|nos|que|no|sí|es|era|hay|vamos|tenemos|quiero|eh+|em+|o sea|pues|bueno|este)(?!\p{L})`;
// Para «este» y «tipo» no cuentan los verbos ni la negación: «Este es el plan», «Este no es el informe».
const FUNCTION_WORD_NOUN = String.raw`\s+(?:el|la|los|las|lo|un|una|unos|unas|yo|tú|me|te|se|le|les|nos|que|vamos|tenemos|quiero|eh+|em+|mm+|o sea|pues|bueno|este|no sé|no sé qué)(?!\p{L})`;
const CONTEXTUAL = {
  // Sonidos de duda alargados: «eh», «eeeh», «ehm», «emm», «mmm».
  'eh+': 'e+h+', 'em+': 'e+m+', 'ehm+': 'e+h+m+', 'mm+': 'm{2,}',
  este: String.raw`este(?=${PAUSE}|${FUNCTION_WORD_NOUN})`,
  // «un tipo que sabe», «ese tipo de cosas»: con determinante delante es sustantivo, no muletilla.
  tipo: String.raw`(?<!(?:un|el|ese|este|qué|que|cualquier)\s)tipo(?=${PAUSE}|${FUNCTION_WORD_NOUN}|\s+(?:muy|mucho|increíble|raro|así|como)(?!\p{L}))`,
  // «pues era necesario» (causal) no cuenta; sí «pues, mira» o «pues nada».
  pues: String.raw`pues(?=${PAUSE}|\s+(?:eh+|em+|mm+|nada|bueno|mira|este|o sea)(?!\p{L}))`,
  onda: String.raw`onda(?=${PAUSE}|${FUNCTION_WORD})`,
  // Al inicio de la frase, o seguido de coma («…y, bueno, …»); «El resultado es bueno.» no cuenta.
  bueno: String.raw`(?<=(?:^|[.!?¡¿]\s*))bueno|bueno(?=\s*[,…])`,
  vale: String.raw`vale(?=\s*[?,.…!]|\s*$)`,
  // «¿sabes?» como muletilla; «¿Ya lo sabes?» es una pregunta real.
  sabes: String.raw`(?<!(?:lo|la|me|te|le|nos|les|se|tú|ya|no|qué|que)\s)sabes(?=\s*[?,]|\s*$)`,
  viste: String.raw`viste(?=\s*[?,]|\s*$)`,
  po: String.raw`po(?=${PAUSE})`,
};
export const FILLER_RE = wordRe(FILLERS.map(w => CONTEXTUAL[w] ?? asPattern(w)));
export const HEDGE_RE = wordRe(HEDGES.map(asPattern));


export const $ = (id) => document.getElementById(id);
export const countMatches = (t, re) => (t.match(re) || []).length;
// Qué muletillas o atenuadores dijo, y cuántas veces ({«o sea»: 3}); «eeeh» y «eh» cuentan como lo mismo.
export function phraseCounts(t, re) {
  const out = {};
  for (const m of String(t || '').matchAll(re)) {
    const k = m[2].toLowerCase().replace(/^e+h+$/, 'eh').replace(/^e+m+$/, 'em').replace(/^m{2,}$/, 'mm');
    out[k] = (out[k] || 0) + 1;
  }
  return out;
}
export const wordCount = (t) => (t.trim().match(/\p{L}+/gu) || []).length;
export const mean = (a) => a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0;
export const std = (a) => { const m = mean(a); return Math.sqrt(mean(a.map(x => (x - m) ** 2))); };
export const esc = (s) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// Bajo 50 se usa el color de acento, no rojo: un primer puntaje bajo no debe leerse como «fracaso».
export const colorFor = (s) => s >= 75 ? 'var(--good)' : s >= 50 ? 'var(--mid)' : 'var(--accent)';

// ---------------------------------------------------------------- audio
// Autocorrelación normalizada; suficiente para F0 de voz hablada (70–400 Hz, o más con maxHz).
// Una señal periódica correlaciona casi igual en su período y en sus múltiplos: se toma el primer
// máximo local cercano al mejor para no confundir la nota con su octava grave.
export function detectPitch(x, sr, maxHz = 400) {
  const minLag = Math.floor(sr / maxHz), maxLag = Math.floor(sr / 70);
  const r = new Float32Array(maxLag + 2);
  let best = -1;
  for (let lag = minLag; lag <= maxLag + 1; lag++) {
    let c = 0, e1 = 0, e2 = 0;
    for (let i = 0; i + lag < x.length; i++) { c += x[i] * x[i + lag]; e1 += x[i] * x[i]; e2 += x[i + lag] * x[i + lag]; }
    r[lag] = c / Math.sqrt(e1 * e2 + 1e-12);
    if (lag <= maxLag && r[lag] > best) best = r[lag];
  }
  if (best <= 0.8) return 0;
  for (let lag = minLag + 1; lag <= maxLag; lag++) {
    if (r[lag] >= 0.95 * best && r[lag] >= r[lag - 1] && r[lag] >= r[lag + 1]) return sr / lag;
  }
  return 0;
}

export const rmsOf = (x) => { let s = 0; for (let i = 0; i < x.length; i++) s += x[i] * x[i]; return Math.sqrt(s / x.length); };

// Sonidos de duda ("eehh", "mmm"): tramos sonoros largos con tono casi plano y volumen estable.
// En el habla normal las vocales duran ~50–200 ms y el tono se mueve; una duda sostenida dura
// 400 ms o más con F0 plana. Es una estimación acústica: complementa al reconocimiento de voz,
// que suele borrar estas disfluencias. samples: [{t (s), rms, pitch (Hz, 0 = sordo)}].
export function findFilledPauses(samples, { minDur = 0.4, maxDur = 2.5, maxGap = 0.08, maxDrift = 1, maxStep = 0.5 } = {}) {
  const zones = [];
  let run = null;
  const close = () => {
    if (!run) return;
    const dur = run.end - run.start;
    const cv = std(run.rms) / (mean(run.rms) || 1);
    if (dur >= minDur && dur <= maxDur && cv < 0.35) zones.push([run.start, run.end]);
    run = null;
  };
  for (const s of samples) {
    if (!(s.pitch > 0)) { if (run && s.t - run.end > maxGap) close(); continue; }
    const st = 12 * Math.log2(s.pitch);
    if (run && (s.t - run.end > maxGap || Math.abs(st - run.last) > maxStep || Math.abs(st - run.first) > maxDrift)) close();
    if (!run) run = { start: s.t, end: s.t, first: st, last: st, rms: [] };
    run.end = s.t; run.last = st; run.rms.push(s.rms);
  }
  close();
  // Un «eeh» va entre palabras: tiene una pausa justo antes o justo después. Una vocal alargada con
  // énfasis va pegada a la palabra siguiente, así que sin esa pausa no se cuenta.
  const sorted = samples.map(x => x.rms).sort((a, b) => a - b);
  const thr = Math.max(0.006, (sorted[Math.floor(sorted.length * 0.1)] || 0) * 1.3 + 0.004);
  const silentSpan = (from, dir) => {
    let i = samples.findIndex(x => x.t >= from); if (i < 0) i = samples.length - 1;
    if (dir < 0) while (i > 0 && samples[i].t > from) i--; else while (i < samples.length - 1 && samples[i].t < from) i++;
    // Se tolera un par de cuadros con voz entre la zona y el silencio.
    let k = i, skipped = 0;
    while (k >= 0 && k < samples.length && samples[k].rms > thr && skipped < 2) { k += dir; skipped++; }
    const startT = samples[k]?.t;
    while (k >= 0 && k < samples.length && samples[k].rms <= thr) k += dir;
    const endT = samples[Math.min(Math.max(k - dir, 0), samples.length - 1)]?.t;
    return startT == null || endT == null ? 0 : Math.abs(endT - startT);
  };
  const found = zones.filter(([a, b]) => silentSpan(a, -1) >= 0.06 || silentSpan(b, 1) >= 0.06);
  // Si casi todo suena «plano y alargado» (lectura silabeada o cantada), la estimación no es confiable: no se reporta.
  const dt = samples.length > 1 ? (samples[samples.length - 1].t - samples[0].t) / (samples.length - 1) : 0;
  const voicedTime = samples.filter(x => x.pitch > 0).length * dt;
  return found.reduce((s, [a, b]) => s + b - a, 0) > 0.3 * voicedTime ? [] : found;
}

export function highlight(text) {
  return esc(text).replace(FILLER_RE, '$1<mark class="filler">$2</mark>').replace(HEDGE_RE, '$1<mark class="hedge">$2</mark>');
}

// ---------------------------------------------------------------- navegación
// Escritorio: barra superior con todas las secciones. Móvil: barra inferior fija con 5 destinos
// (zona del pulgar, como en las apps de hábito mejor valoradas) e iconos con etiqueta.
const ICONS = {
  home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  rec: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3" fill="currentColor"/>',
  chat: '<path d="M4 5h16v11H8l-4 4z"/>',
  wave: '<path d="M3 12h2M7 8v8M11 5v14M15 8v8M19 10v4M21 12h0"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  pen: '<path d="M4 20l4-1 11-11-3-3L5 16z"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 21V5"/>',
  cam: '<rect x="2" y="6" width="14" height="12" rx="2"/><path d="M16 10l6-3v10l-6-3"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
  clock: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 2h6"/>',
  heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
  goal: '<path d="M4 18c4 0 5-9 10-9"/><circle cx="18" cy="9" r="3" fill="currentColor"/>',
  person: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
};
const PAGES = [
  ['index.html', 'Hoy', 'home', true], ['evaluar.html', 'Evaluar', 'rec', true], ['roleplay.html', 'Roleplay', 'chat', true],
  ['gimnasio.html', 'Gimnasio', 'wave', true], ['escritura.html', 'Escritura', 'pen', false], ['aprender.html', 'Aprender', 'book', false], ['progreso.html', 'Progreso', 'chart', true],
];
export const icon = (k) => `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[k]}</svg>`;
export const STORAGE_WARNING = 'Este navegador no permite guardar datos (modo privado o cookies bloqueadas): tu progreso se perderá al cerrar la página. Ábrela en una ventana normal para conservarlo.';

// Tamaño de letra y alto contraste elegidos en Ajustes (se aplican en todas las pantallas).
export function applyDisplayPrefs(p = loadProfile()) {
  const root = document.documentElement;
  if (p.textSize && p.textSize !== 'normal') root.dataset.text = p.textSize; else delete root.dataset.text;
  if (p.highContrast) root.dataset.contrast = 'alto'; else delete root.dataset.contrast;
}

export function fillIcons(root) {
  root.querySelectorAll('[data-icon]:not([data-icon-done])').forEach(el => { el.insertAdjacentHTML('afterbegin', icon(el.dataset.icon)); el.dataset.iconDone = ''; });
}

export function renderNav() {
  applyDisplayPrefs();
  const here = location.pathname.split('/').pop() || 'index.html';
  const top = document.createElement('nav');
  top.className = 'tabs'; top.setAttribute('aria-label', 'Secciones');
  top.innerHTML = PAGES.map(([href, label]) => `<a href="${href}" ${href === here ? 'class="on" aria-current="page"' : ''}>${label}</a>`).join('');
  document.querySelector('header').appendChild(top);
  if (!storageWorks()) document.querySelector('header').insertAdjacentHTML('beforeend', `<p class="warn-banner" role="status">${STORAGE_WARNING}</p>`);
  const bottom = document.createElement('nav');
  bottom.className = 'bottom-nav'; bottom.setAttribute('aria-label', 'Secciones');
  bottom.innerHTML = PAGES.filter(p => p[3]).map(([href, label, ic]) =>
    `<a href="${href}" ${href === here ? 'class="on" aria-current="page"' : ''}>${icon(ic)}<span>${label}</span></a>`).join('');
  document.body.appendChild(bottom);
  // Íconos propios en vez de emojis (que cambian según el teléfono): <strong data-icon="cam">Evaluar</strong>.
  fillIcons(document);
  // App instalable y disponible sin conexión (sólo en http/https; el registro puede fallar sin consecuencias).
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
}

export const LOCALES = [
  ['es-419', 'Latinoamérica'], ['es-AR', 'Argentina'], ['es-CL', 'Chile'], ['es-CO', 'Colombia'],
  ['es-MX', 'México'], ['es-PE', 'Perú'], ['es-ES', 'España'], ['es-US', 'Estados Unidos'],
];
// Variante de español del perfil o, si no hay, la del navegador.
export function userLocale(profile = loadProfile()) {
  if (profile.locale) return profile.locale;
  const nav = (navigator.language || '').toLowerCase();
  return LOCALES.find(([id]) => id.toLowerCase() === nav)?.[0] || 'es-419';
}

// ---------------------------------------------------------------- historial local
// Se guarda sólo en este navegador. Es una comodidad del prototipo, no almacenamiento fiable.
const KEY = 'voxa.sessions.v1';
const PROFILE_KEY = 'voxa.profile.v1';
// Si el navegador bloquea el almacenamiento (modo privado, cookies bloqueadas), se guarda en memoria durante
// la visita para que el progreso no desaparezca de golpe; storageWorks() permite avisarlo.
const memory = {};
let storageOk = true;
function read(key, fallback) {
  if (key in memory) return JSON.parse(memory[key]);
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { storageOk = false; return fallback; }
}
function write(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); delete memory[key]; return true; }
  catch { storageOk = false; memory[key] = JSON.stringify(value); return false; }
}
export const storageWorks = () => { try { localStorage.setItem('voxa.t', '1'); localStorage.removeItem('voxa.t'); } catch { storageOk = false; } return storageOk; };
export function clearAll() { for (const k of [KEY, PROFILE_KEY]) { delete memory[k]; try { localStorage.removeItem(k); } catch {} } }
// «Calma ganada»: cuánto bajan los nervios al terminar (positivo = bajan). Sin signos dobles.
export const calmText = (drop) => Math.abs(drop) < 0.05 ? '0' : Math.abs(drop).toFixed(1);
// Día local «AAAA-MM-DD» (no UTC: a las 21 h en América ya sería mañana en UTC).
export const localDay = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const loadSessions = () => read(KEY, []);
export function saveSession(session) {
  const all = loadSessions();
  const i = all.findIndex(s => s.id === session.id);
  i >= 0 ? (all[i] = session) : all.push(session);
  return write(KEY, all.slice(-300));
}
export const loadProfile = () => read(PROFILE_KEY, { goal: '', ladder: {}, locale: '', onboarded: false });
export const saveProfile = (p) => write(PROFILE_KEY, p);

// ---------------------------------------------------------------- API del coach IA
// En la web la API está en el mismo dominio; la app instalable define VOXA_API_BASE con la dirección del servidor.
const API_BASE = globalThis.VOXA_API_BASE || '';
// La IA sólo se pide cuando aporta algo que las reglas locales no dan (mismos mínimos que el servidor).
export const AI_MIN_WORDS = { feedback: 15, writing: 8, event: 6, evaluateTurns: 2 };
let statusPromise = null;
export function aiStatus() {
  statusPromise ??= fetch(API_BASE + 'api/status').then(r => r.ok ? r.json() : { ai: false }).catch(() => ({ ai: false }));
  return statusPromise;
}
// Identificador anónimo del dispositivo: el servidor lo usa para los cupos del plan (hasta que haya cuentas).
export function deviceId() {
  try {
    let id = localStorage.getItem('voxa.device');
    if (!id) { id = 'd' + crypto.getRandomValues(new Uint32Array(4)).join('').slice(0, 30); localStorage.setItem('voxa.device', id); }
    return id;
  } catch { return ''; }
}
async function api(method, path, body) {
  const r = await fetch(API_BASE + path, { method, headers: { 'Content-Type': 'application/json', 'X-VOXA-User': deviceId() }, body: body && JSON.stringify(body) });
  if (!r.ok) {
    let detail = `Error ${r.status}`;
    try { detail = (await r.json()).detail || detail; } catch {}
    throw Object.assign(new Error(detail), { status: r.status });   // 402 = cupo del plan agotado
  }
  return r.json();
}
export const postJSON = (path, body) => api('POST', path, body);

// Mientras el coach IA trabaja (10–25 s), mensajes que cuentan qué está haciendo: la espera se siente más corta.
// Devuelve una función para detenerlos.
export const WAIT_STEPS = {
  feedback: ['Leyendo tu práctica…', 'Buscando tu mejor frase…', 'Revisando la estructura de tu respuesta…', 'Eligiendo un solo foco para mejorar…', 'Escribiendo cómo podría sonar…'],
  evaluate: ['Releyendo la conversación…', 'Buscando tu mejor momento…', 'Revisando cómo manejaste las objeciones…', 'Preparando tu siguiente paso…'],
  writing: ['Leyendo tu texto…', 'Poniendo lo importante primero…', 'Quitando rodeos y disculpas…', 'Revisando el tono…'],
  event: ['Pensando en quién estará frente a ti…', 'Buscando las preguntas más difíciles…', 'Preparando cómo responder cada una…'],
};
export function waitMessages(el, steps, every = 3500) {
  let i = 0;
  const show = () => { el.innerHTML = `<p class="note wait" role="status"><span class="spinner" aria-hidden="true"></span>${esc(steps[Math.min(i++, steps.length - 1)])}</p>`; };
  show();
  const t = setInterval(show, every);
  return () => clearInterval(t);
}
// Plan y cupos de esta persona; syncMe confirma una compra recién hecha sin esperar al aviso de la tienda.
export const getMe = () => api('GET', 'api/me');
export const syncMe = () => api('POST', 'api/me/sync', {});

export const GOALS = [
  ['confianza', 'Ganar confianza y perder el miedo'],
  ['entrevista', 'Preparar entrevistas de trabajo'],
  ['liderazgo', 'Comunicar como líder'],
  ['ventas', 'Vender y negociar mejor'],
  ['presentaciones', 'Presentar en público'],
  ['conversaciones', 'Manejar conversaciones difíciles'],
];
