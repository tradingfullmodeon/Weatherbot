// Utilidades compartidas por las páginas de VOXA: diccionarios, métricas de texto,
// historial local de sesiones y acceso a la API del coach IA.

// Muletillas frecuentes en español (incluye variantes regionales).
export const FILLERS = ['eh+', 'em+', 'ehm+', 'mm+', 'este', 'o sea', 'bueno', 'pues', 'como que', 'digamos',
  'tipo', 'básicamente', 'literalmente', 'en plan', 'vale', 'sabes', 'cachai', 'me explico',
  'onda', 'viste', 'osea', 'güey', 'po'];
// Atenuadores que restan asertividad cuando se abusa de ellos.
export const HEDGES = ['creo que', 'tal vez', 'quizás', 'quizá', 'un poco', 'un poquito', 'perdón',
  'no sé si', 'más o menos', 'de alguna manera', 'supongo', 'disculpa', 'solo quería', 'sólo quería'];

const escRe = (s) => s.replace(/[.*?^${}()|[\]\\]/g, '\\$&');
const wordRe = (list) => new RegExp(`(^|[^\\p{L}])(${list.map(w => w.endsWith('+') ? escRe(w.slice(0, -1)) + '+' : escRe(w)).join('|')})(?=$|[^\\p{L}])`, 'giu');
export const FILLER_RE = wordRe(FILLERS);
export const HEDGE_RE = wordRe(HEDGES);

export const $ = (id) => document.getElementById(id);
export const countMatches = (t, re) => (t.match(re) || []).length;
export const wordCount = (t) => (t.trim().match(/\p{L}+/gu) || []).length;
export const mean = (a) => a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0;
export const std = (a) => { const m = mean(a); return Math.sqrt(mean(a.map(x => (x - m) ** 2))); };
export const esc = (s) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const colorFor = (s) => s >= 75 ? 'var(--good)' : s >= 50 ? 'var(--mid)' : 'var(--bad)';

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
  return zones;
}

export function highlight(text) {
  return esc(text).replace(FILLER_RE, '$1<mark class="filler">$2</mark>').replace(HEDGE_RE, '$1<mark class="hedge">$2</mark>');
}

// ---------------------------------------------------------------- navegación
const PAGES = [
  ['index.html', 'Evaluar'], ['roleplay.html', 'Roleplay IA'], ['gimnasio.html', 'Gimnasio de voz'], ['progreso.html', 'Mi progreso'],
];
export function renderNav() {
  const here = location.pathname.split('/').pop() || 'index.html';
  const nav = document.createElement('nav');
  nav.className = 'tabs';
  nav.innerHTML = PAGES.map(([href, label]) => `<a href="${href}" class="${href === here ? 'on' : ''}">${label}</a>`).join('');
  document.querySelector('header').appendChild(nav);
  // App instalable y disponible sin conexión (sólo en http/https; el registro puede fallar sin consecuencias).
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
}

// ---------------------------------------------------------------- historial local
// Se guarda sólo en este navegador. Es una comodidad del prototipo, no almacenamiento fiable.
const KEY = 'voxa.sessions.v1';
const PROFILE_KEY = 'voxa.profile.v1';
function read(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function write(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
}
export const loadSessions = () => read(KEY, []);
export function saveSession(session) {
  const all = loadSessions();
  const i = all.findIndex(s => s.id === session.id);
  i >= 0 ? (all[i] = session) : all.push(session);
  return write(KEY, all.slice(-300));
}
export const loadProfile = () => read(PROFILE_KEY, { goal: '', ladder: {} });
export const saveProfile = (p) => write(PROFILE_KEY, p);

// ---------------------------------------------------------------- API del coach IA
let statusPromise = null;
export function aiStatus() {
  statusPromise ??= fetch('api/status').then(r => r.ok ? r.json() : { ai: false }).catch(() => ({ ai: false }));
  return statusPromise;
}
export async function postJSON(path, body) {
  const r = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) {
    let detail = `Error ${r.status}`;
    try { detail = (await r.json()).detail || detail; } catch {}
    throw new Error(detail);
  }
  return r.json();
}

export const GOALS = [
  ['confianza', 'Ganar confianza y perder el miedo'],
  ['entrevista', 'Preparar entrevistas de trabajo'],
  ['liderazgo', 'Comunicar como líder'],
  ['ventas', 'Vender y negociar mejor'],
  ['presentaciones', 'Presentar en público'],
  ['conversaciones', 'Manejar conversaciones difíciles'],
];
