// Diagnóstico inicial y metas. Estado inicial (autoevaluación + prueba real) → perfil por dimensión →
// metas específicas y desafiantes con plazo y compromiso (Locke y Latham), que avanzan solas con cada
// práctica → re-diagnóstico para comparar. Lo usa la versión publicada (artifact/app.js).
import { esc, colorFor, mean, localDay } from './shared.js';

export const DIMENSIONS = [
  { id: 'estructura', name: 'Estructura y claridad', icon: '🧭' },
  { id: 'voz', name: 'Voz', icon: '🎙' },
  { id: 'fluidez', name: 'Fluidez', icon: '🌊' },
  { id: 'presencia', name: 'Presencia y lenguaje corporal', icon: '🧍' },
  { id: 'escucha', name: 'Escucha', icon: '👂' },
  { id: 'asertividad', name: 'Asertividad', icon: '🗣' },
  { id: 'confianza', name: 'Confianza', icon: '💪' },
  { id: 'escritura', name: 'Escritura', icon: '✍️' },
];

// Afirmaciones de autoevaluación (1 = nada de acuerdo … 5 = totalmente de acuerdo). «reverse» invierte la escala.
export const SELF_ITEMS = [
  { dim: 'estructura', text: 'Cuando hablo voy al punto y la gente entiende mi idea principal.' },
  { dim: 'voz', text: 'Mi voz suena segura y con energía: varío el tono y hago pausas.' },
  { dim: 'fluidez', text: 'Hablo con fluidez, sin muchas muletillas ni silencios incómodos.' },
  { dim: 'presencia', text: 'Frente a otros o en video, mi postura y mi mirada transmiten seguridad.' },
  { dim: 'escucha', text: 'Escucho sin interrumpir y hago preguntas para entender bien.' },
  { dim: 'asertividad', text: 'Pido lo que necesito y pongo límites sin agresividad ni rodeos.' },
  { dim: 'confianza', text: 'Me pongo muy nervioso o nerviosa antes de hablar frente a otros.', reverse: true },
  { dim: 'escritura', text: 'Mis correos y mensajes son claros y la gente responde lo que necesito.' },
];

export const LEVELS = [[85, 'Referente'], [70, 'Hábil'], [55, 'Competente'], [40, 'Practicante'], [0, 'Explorador']];
export const levelOf = (score) => LEVELS.find(([min]) => score >= min)[1];
// De 10 a 100: nadie empieza en «0» en algo; el punto de partida más bajo es «por trabajar».
const selfScore = (item, v) => Math.round(10 + ((item.reverse ? 6 - v : v) - 1) / 4 * 90);

// Mediciones de la prueba real a partir de las métricas del ensayo (items con key y s 0–100) y del texto.
// Con una muestra corta (menos de 30 s de voz o de 25 palabras) la medición es poco confiable: se limita
// el puntaje para no dar una validación falsa («Voz 97» con 20 segundos).
export const SHORT_SAMPLE_CAP = 75;
export function measuredFrom({ speechItems = [], writingScore = null, writingAssertiveness = null, presenceScores = null, seconds = null, words = null } = {}) {
  const s = (k) => speechItems.find(i => i.key === k)?.s;
  const avg = (...xs) => { const v = xs.filter(x => x != null); return v.length ? Math.round(mean(v)) : null; };
  const cap = (v, short) => v == null ? null : short ? Math.min(v, SHORT_SAMPLE_CAP) : v;
  const shortAudio = seconds != null && seconds < 30, shortText = words != null && words < 25;
  return {
    estructura: cap(avg(s('structure'), s('length'), s('variety')), shortText),
    voz: cap(avg(s('pitch'), s('volume')), shortAudio),
    fluidez: cap(avg(s('hums'), s('pauses'), s('fillers')), shortAudio),
    // La asertividad del mensaje escrito (pedido directo, sin «perdón por molestar») pesa tanto como el habla.
    asertividad: cap(avg(s('hedges'), writingAssertiveness), shortText && writingAssertiveness == null),
    presencia: presenceScores ? avg(...Object.values(presenceScores)) : null,
    escritura: writingScore,
    escucha: null, confianza: null,
  };
}

// Perfil: combina cómo te ves (40%) con lo medido (60%) cuando hay medición; si no, sólo la autoevaluación.
export function computeProfile(selfAnswers, measured = {}) {
  const self = {}, profile = {};
  for (const item of SELF_ITEMS) if (selfAnswers[item.dim] != null) self[item.dim] = selfScore(item, selfAnswers[item.dim]);
  for (const d of DIMENSIONS) {
    const m = measured[d.id], v = self[d.id];
    if (m == null && v == null) continue;
    profile[d.id] = m == null ? v : v == null ? m : Math.round(0.6 * m + 0.4 * v);
  }
  const vals = Object.values(profile), total = vals.length ? Math.round(mean(vals)) : 0;
  // Con empate, lo medido pesa más que lo autoevaluado: una fortaleza se afirma con evidencia, y una prioridad
  // medida es más segura que una supuesta.
  const isMeasured = (d) => measured[d] != null ? 1 : 0;
  const ranked = Object.entries(profile).sort((a, b) => b[1] - a[1] || isMeasured(b[0]) - isMeasured(a[0]));
  const rankedLow = Object.entries(profile).sort((a, b) => a[1] - b[1] || isMeasured(b[0]) - isMeasured(a[0]));
  // Ventana de Johari: diferencias grandes entre cómo te ves y cómo te medimos.
  const gaps = DIMENSIONS.filter(d => self[d.id] != null && measured[d.id] != null && Math.abs(self[d.id] - measured[d.id]) >= 25)
    .map(d => ({ dim: d.id, self: self[d.id], measured: measured[d.id], kind: self[d.id] > measured[d.id] ? 'sobre' : 'sub' }));
  const priorities = rankedLow.slice(0, 3).map(r => r[0]);
  // «Lo haces mejor de lo que crees» no se dice de algo que igual es prioridad: sería contradictorio.
  return { self, measured, profile, total, level: levelOf(total), strengths: ranked.slice(0, 2).map(r => r[0]), priorities,
    gaps: gaps.filter(g => g.kind === 'sobre' || !priorities.includes(g.dim)) };
}

// ---------------------------------------------------------------- metas
// Cada meta es específica (qué y cuánto), con evidencia automática (las prácticas que la cumplen) y una
// práctica siguiente. Para habilidades complejas se plantea como meta de aprendizaje: repetir con un criterio.
export const GOAL_TEMPLATES = {
  estructura: { title: 'Responder con estructura', detail: '3 días con un ensayo de 75 puntos o más', check: { type: 'score', min: 75 }, count: 3,
    next: { view: 'ensayar', scenario: 'interview' }, lesson: 'star' },
  voz: { title: 'Una voz que mantiene la atención', detail: '3 días con una grabación de tono variado (rango ideal)', check: { type: 'metric', key: 'pitch', min: 90 }, count: 3,
    next: { view: 'ensayar', scenario: 'opening', mode: 'audio' }, lesson: 'voz' },
  fluidez: { title: 'Menos «eeh» y muletillas', detail: '3 días con una grabación de menos de 2 «eeh» por minuto', check: { type: 'metric', key: 'hums', min: 85 }, count: 3,
    next: { view: 'ensayar', scenario: 'passion', mode: 'audio' }, lesson: 'pausa' },
  presencia: { title: 'Presencia en cámara', detail: '2 días con un análisis de lenguaje corporal de 70 o más en mirada', check: { type: 'presence', key: 'mirada', min: 70 }, count: 2,
    next: { view: 'ensayar', scenario: 'intro', mode: 'audio' }, lesson: 'presencia' },
  escucha: { title: 'Escuchar mejor', detail: '3 días con un roleplay de 75 o más en escucha', check: { type: 'roleplay', keys: ['escucha', 'preguntas'], min: 75 }, count: 3,
    next: { view: 'roleplay', persona: 'cliente' }, lesson: 'escucha' },
  asertividad: { title: 'Hablar con seguridad', detail: '3 días con un ensayo (30 palabras o más) casi sin frases que restan seguridad', check: { type: 'metric', key: 'hedges', min: 90 }, count: 3,
    next: { view: 'ensayar', scenario: 'say-no' }, lesson: 'bluf' },
  // Exposición, no calma: cuenta practicar aunque haya nervios (esperar a «no tener nervios» mantiene el miedo).
  confianza: { title: 'Practicar aunque haya nervios', detail: '3 días practicando aunque empieces con nervios de 3/5 o más', check: { type: 'exposure', min: 3 }, count: 3,
    next: { view: 'ensayar', scenario: 'passion' }, lesson: 'nervios' },
  escritura: { title: 'Escribir claro', detail: '3 días con un texto de 85 o más en la revisión', check: { type: 'writing', min: 85 }, count: 3,
    next: { view: 'escritura', kind: 'pedido' }, lesson: 'bluf' },
};

// caps.presence = false cuando esta versión no puede medir el lenguaje corporal (sin IA con imágenes ni cámara):
// no se sugiere ni se propone como práctica del día una meta imposible de cumplir.
export const goalAvailable = (g, caps = {}) => (GOAL_TEMPLATES[g.dim]?.check || g.check)?.type !== 'presence' || caps.presence !== false;
export function suggestGoals(result, caps = {}) {
  const all = result.priorities.filter(d => GOAL_TEMPLATES[d]).map(d => ({ dim: d, ...GOAL_TEMPLATES[d] }));
  const ok = all.filter(g => goalAvailable(g, caps));
  // Si se descartó alguna, se completa con la siguiente dimensión más baja que sí se pueda medir.
  const extra = Object.entries(result.profile).sort((a, b) => a[1] - b[1]).map(([d]) => d)
    .filter(d => GOAL_TEMPLATES[d] && !all.some(g => g.dim === d) && goalAvailable({ dim: d }, caps)).map(d => ({ dim: d, ...GOAL_TEMPLATES[d] }));
  return [...ok, ...extra].slice(0, 3);
}

export function createGoal(dim, { days = 30, why = '' } = {}, today = new Date()) {
  const t = GOAL_TEMPLATES[dim];
  const due = new Date(today); due.setDate(due.getDate() + days);
  return { id: `${dim}-${today.getTime().toString(36)}`, dim, title: t.title, detail: t.detail, check: t.check, count: t.count,
    next: t.next, lesson: t.lesson, why, start: today.toISOString(), due: localDay(due) };
}

const TEXT_METRICS = ['hedges', 'fillers', 'length', 'variety'], MIN_WORDS = 30;
const PRESENCE_METRIC = { mirada: 'gaze', encuadre: 'face', postura: 'head' };

// ¿Esta sesión cuenta como evidencia de la meta?
export function sessionMeets(goal, s) {
  const c = goal.check;
  switch (c.type) {
    case 'score': return (s.type === 'ensayo' || s.type === 'evaluacion') && s.total >= c.min && (s.mode === 'audio' || (s.words ?? MIN_WORDS) >= MIN_WORDS);
    // Las métricas de texto necesitan texto real: «Hola soy Ana» no tiene atenuadores, pero no demuestra nada.
    case 'metric': return (s.type === 'ensayo' || s.type === 'evaluacion') && (s.metrics?.[c.key]?.s ?? -1) >= c.min
      && (!TEXT_METRICS.includes(c.key) || (s.words ?? MIN_WORDS) >= MIN_WORDS);
    // Publicada: análisis de fotogramas por IA (presence.mirada). Completa: MediaPipe en vivo (metrics.gaze).
    case 'presence': return (s.presence?.[c.key] ?? s.metrics?.[PRESENCE_METRIC[c.key]]?.s ?? -1) >= c.min;
    case 'roleplay': return s.type === 'roleplay' && c.keys.some(k => (s.dims?.[k] ?? -1) >= c.min);
    case 'anxiety': return s.anxietyBefore != null && s.anxietyBefore <= c.max;
    // Cuenta sólo una práctica de verdad (no basta con marcar los nervios): audio, roleplay o 30+ palabras.
    case 'exposure': return s.anxietyBefore != null && s.anxietyBefore >= c.min && (s.mode === 'audio' || s.type === 'roleplay' || (s.words ?? MIN_WORDS) >= MIN_WORDS);
    case 'writing': return s.type === 'escritura' && !s.ai && s.total >= c.min;   // el texto que escribió la IA no cuenta
    default: return false;
  }
}

// Página de la versión completa que abre la práctica siguiente de una meta.
export function goalHref(goal) {
  const n = goal.next;
  if (n.view === 'roleplay') return `roleplay.html${n.persona ? `?personaje=${n.persona}` : ''}`;
  if (n.view === 'escritura') return `escritura.html${n.kind ? `?tipo=${n.kind}` : ''}`;
  return `evaluar.html${n.scenario ? `?escenario=${n.scenario}` : ''}`;
}

// Práctica del día guiada por las metas: rota entre las metas activas (sin cumplir y con plazo vigente).
export function goalOfTheDay(goals, sessions, today = new Date(), caps = {}) {
  const active = (goals || []).filter(g => { const p = goalProgress(g, sessions, today); return !p.done && !p.expired && goalAvailable(g, caps); });
  if (!active.length) return null;
  const g = active[Math.floor(today.getTime() / 864e5) % active.length], p = goalProgress(g, sessions, today);
  return { goal: g, text: `${g.title} · ${p.hits}/${g.count} días`, detail: g.detail };
}

export function goalProgress(goal, sessions, today = new Date()) {
  // Cuenta como mucho una práctica por día: la meta pide constancia, no repetir el mismo intento.
  const hits = new Set(sessions.filter(s => s.date >= goal.start && sessionMeets(goal, s)).map(s => localDay(new Date(s.date)))).size;
  const done = hits >= goal.count;
  const daysLeft = Math.floor((new Date(goal.due + 'T23:59:59') - today) / 864e5);
  return { hits: Math.min(hits, goal.count), done, ratio: Math.min(1, hits / goal.count), daysLeft, expired: !done && daysLeft < 0 };
}

// ---------------------------------------------------------------- interfaz compartida
const dimName = (id) => DIMENSIONS.find(d => d.id === id)?.name || id;

export function selfAssessmentHTML(answers = {}) {
  // Escala de acuerdo (no de frecuencia): 1 = nada de acuerdo … 5 = totalmente de acuerdo.
  const labels = ['Nada de acuerdo', 'Poco', 'En parte', 'Bastante', 'Totalmente'];
  return SELF_ITEMS.map((it, i) => `<div class="self-item"><p><strong>${i + 1}.</strong> ${esc(it.text)}</p>
    <div class="scale5" role="group" aria-label="${esc(it.text)}">${labels.map((l, k) =>
      `<button type="button" data-dim="${it.dim}" data-v="${k + 1}" aria-pressed="${answers[it.dim] === k + 1}">${k + 1}<small>${l}</small></button>`).join('')}</div></div>`).join('');
}

// Gráfico de radar con el perfil (y, opcional, un perfil anterior para comparar).
export function drawRadar(canvas, profile, previous = null) {
  const ctx = canvas.getContext('2d'), W = canvas.width, H = canvas.height, cx = W / 2, cy = H / 2, R = Math.min(W, H) / 2 - 58;
  const css = getComputedStyle(document.documentElement);
  const dims = DIMENSIONS.filter(d => profile[d.id] != null);
  if (dims.length < 3) return;
  ctx.clearRect(0, 0, W, H);
  const pt = (i, v) => { const a = -Math.PI / 2 + i * 2 * Math.PI / dims.length; return [cx + Math.cos(a) * R * v / 100, cy + Math.sin(a) * R * v / 100]; };
  ctx.strokeStyle = css.getPropertyValue('--line'); ctx.lineWidth = 1;
  for (const lvl of [25, 50, 75, 100]) { ctx.beginPath(); dims.forEach((_, i) => { const [x, y] = pt(i, lvl); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.closePath(); ctx.stroke(); }
  ctx.fillStyle = css.getPropertyValue('--muted'); ctx.font = '13px system-ui'; ctx.textAlign = 'center';
  dims.forEach((d, i) => { const [x, y] = pt(i, 122); ctx.fillText(`${d.icon} ${d.name.split(' ')[0]}`, x, y + 4); });
  const shape = (p, color, alpha) => {
    ctx.beginPath(); dims.forEach((d, i) => { const [x, y] = pt(i, p[d.id] ?? 0); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.closePath();
    ctx.globalAlpha = alpha; ctx.fillStyle = color; ctx.fill(); ctx.globalAlpha = 1; ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
  };
  if (previous) shape(previous, css.getPropertyValue('--muted'), 0.12);
  shape(profile, css.getPropertyValue('--accent'), 0.25);
}

export function diagnosisHTML(r, previous = null) {
  const src = (d) => r.measured[d] == null ? ' <small class="note">(según cómo te ves)</small>' : '';
  const rows = DIMENSIONS.filter(d => r.profile[d.id] != null).map(d => {
    const v = r.profile[d.id], prev = previous?.profile?.[d.id];
    const delta = prev != null ? v - prev : null;
    return `<tr><td>${d.icon} ${esc(d.name)}</td><td class="num">${r.self[d.id] ?? '–'}</td><td class="num">${r.measured[d.id] ?? '–'}</td>
      <td><span class="pill" style="color:${colorFor(v)}">${v}</span>${delta != null ? ` <small style="color:${delta >= 0 ? 'var(--good)' : 'var(--bad)'}">${delta >= 0 ? '+' : ''}${delta}</small>` : ''}</td></tr>`;
  }).join('');
  const gaps = r.gaps.map(g => g.kind === 'sobre'
    ? `<li>En <strong>${esc(dimName(g.dim))}</strong> te ves mejor (${g.self}) de lo que medimos (${g.measured}): es un punto ciego que vale la pena practicar.</li>`
    : `<li>En <strong>${esc(dimName(g.dim))}</strong> eres más exigente contigo (${g.self}) de lo que medimos (${g.measured}): lo haces mejor de lo que crees.</li>`).join('');
  return `
    <div class="score-big"><div class="ring" style="border:8px solid ${colorFor(r.total)}">${r.total}</div>
      <div><div style="font-size:1.15rem;font-weight:700">Índice Talkride ${r.total} · nivel ${esc(r.level)}</div>
      <div class="lead">${previous ? `Antes: ${previous.total} (nivel ${esc(previous.level)}). ${r.total - previous.total >= 0 ? '+' : ''}${r.total - previous.total} puntos.` : 'Este es tu punto de partida.'}</div>
      <div class="note">Tu índice de comunicación de 0 a 100: combina cómo te ves (40%) con lo que medimos en tus pruebas (60%). Vuelve a medirlo cada 4 semanas.</div></div></div>
    <canvas id="radar" width="520" height="420" aria-label="Perfil de comunicación por dimensión" style="width:100%;max-width:520px;height:auto;margin:8px auto;display:block"></canvas>
    <div class="fb">
      <div><h3 style="color:var(--good)">Tus fortalezas</h3><ul>${r.strengths.map(d => `<li>${esc(dimName(d))}${src(d)}</li>`).join('')}</ul></div>
      <div><h3 style="color:var(--mid)">Tus prioridades</h3><ul>${r.priorities.map(d => `<li>${esc(dimName(d))}${src(d)}</li>`).join('')}</ul></div>
    </div>
    ${gaps ? `<h3>Cómo te ves y cómo te medimos</h3><ul>${gaps}</ul>` : ''}
    <details><summary>Ver el detalle por dimensión</summary>
      <div class="table-wrap"><table><thead><tr><th>Dimensión</th><th>Cómo te ves</th><th>Medido</th><th>Perfil</th></tr></thead><tbody>${rows}</tbody></table></div>
      <p class="note">«–» significa que esa dimensión todavía no se midió en una prueba: haz la prueba de voz o de escritura para completarla.</p>
    </details>`;
}

// Línea corta del Índice Talkride para Hoy: valor actual y cambio desde el primer diagnóstico.
export function indexLine(diagnoses) {
  const first = diagnoses?.[0], last = diagnoses?.at(-1);
  if (!last) return '';
  const d = diagnoses.length > 1 ? last.total - first.total : null;
  return `Índice Talkride <strong>${last.total}</strong> · nivel ${esc(last.level)}${d != null ? ` · <span style="color:${d >= 0 ? 'var(--good)' : 'var(--bad)'}">${d >= 0 ? '+' : ''}${d} desde tu primer diagnóstico</span>` : ''} · ${new Date(last.date).toLocaleDateString('es')}`;
}

export function goalPickerHTML(suggestions) {
  return `<h3>Elige tus metas (hasta 3)</h3>
    <p class="note">Las metas específicas y desafiantes, con plazo y una razón personal, se cumplen más que un «haré lo posible».</p>
    ${suggestions.map((g, i) => `<label class="goal-pick"><input type="checkbox" data-goal="${g.dim}" ${i < 2 ? 'checked' : ''}>
      <span><strong>${esc(g.title)}</strong><small>${esc(g.detail)}</small></span></label>`).join('')}
    <div class="row" style="margin-top:10px">
      <div><label for="goalDays">Plazo</label><select id="goalDays"><option value="7">1 semana</option><option value="14">2 semanas</option><option value="30" selected>30 días</option><option value="60">60 días</option></select></div>
      <div><label for="goalWhy">¿Por qué te importa? (opcional)</label><input id="goalWhy" class="field" placeholder="Ej.: quiero conseguir el ascenso este año"></div>
    </div>`;
}

export function goalsHTML(goals, sessions, today = new Date()) {
  if (!goals?.length) return '<p class="note">Todavía no tienes metas. Haz tu diagnóstico para recibir metas a tu medida.</p>';
  return goals.map(g => {
    const p = goalProgress(g, sessions, today);
    const left = Math.max(0, p.daysLeft);
    const state = p.done ? '✅ ¡Cumplida!' : p.expired ? '⏰ Se venció el plazo: puedes renovarla' : left === 0 ? 'Último día' : `Falta${left === 1 ? '' : 'n'} ${left} ${left === 1 ? 'día' : 'días'}`;
    return `<div class="goal"><div class="goal-head"><strong>${esc(g.title)}</strong><span class="note">${state}</span></div>
      <div class="note">${esc(g.detail)}${g.why ? ` · Para: ${esc(g.why)}` : ''}</div>
      <div class="bar" style="margin-top:6px"><div style="width:${Math.round(p.ratio * 100)}%;background:${p.done ? 'var(--good)' : 'var(--accent)'}"></div></div>
      <div class="goal-foot"><span class="note">${p.hits} de ${g.count}</span>${p.done ? '' : `<button type="button" data-goal-next="${g.id}">▶ Practicar</button>`}</div></div>`;
  }).join('');
}

// Primera victoria del diagnóstico (en cuanto termina la prueba de voz): lo mejor medido y un solo próximo paso.
// Si nada sale bien todavía, la victoria es haberse animado: nunca se abre con un número rojo.
export function firstWin(items) {
  if (!items?.length) return null;
  const sorted = [...items].sort((a, b) => b.s - a.s);
  const best = sorted[0], worst = sorted.at(-1);
  return {
    strength: best.s >= 60 ? { label: best.label, display: best.display, target: best.target } : null,
    next: worst !== best && worst.s < 70 ? { label: worst.label, display: worst.display, target: worst.target } : null,
  };
}

export function firstWinHTML(win) {
  if (!win) return '';
  const head = win.strength
    ? `<p class="lead"><strong>Tu primera fortaleza: ${esc(win.strength.label)}.</strong> Obtuviste ${esc(win.strength.display)}; lo recomendado es ${esc(win.strength.target)}.</p>`
    : '<p class="lead"><strong>Ya diste el paso más difícil: hablar frente al micrófono.</strong> Desde aquí todo se puede entrenar.</p>';
  const next = win.next
    ? `<p>Lo primero que vamos a entrenar: <strong>${esc(win.next.label)}</strong>. Hoy: ${esc(win.next.display)}; la meta: ${esc(win.next.target)}.</p>`
    : '';
  return `<div class="win-box">${head}${next}<p class="note">Sigue con 2 pasos cortos para ver tu perfil completo y tus metas.</p></div>`;
}
