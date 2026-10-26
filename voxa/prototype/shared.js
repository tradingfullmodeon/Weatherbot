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

export function highlight(text) {
  return esc(text).replace(FILLER_RE, '$1<mark class="filler">$2</mark>').replace(HEDGE_RE, '$1<mark class="hedge">$2</mark>');
}

// ---------------------------------------------------------------- navegación
const PAGES = [
  ['index.html', 'Evaluar'], ['roleplay.html', 'Roleplay IA'], ['progreso.html', 'Mi progreso'],
];
export function renderNav() {
  const here = location.pathname.split('/').pop() || 'index.html';
  const nav = document.createElement('nav');
  nav.className = 'tabs';
  nav.innerHTML = PAGES.map(([href, label]) => `<a href="${href}" class="${href === here ? 'on' : ''}">${label}</a>`).join('');
  document.querySelector('header').appendChild(nav);
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
