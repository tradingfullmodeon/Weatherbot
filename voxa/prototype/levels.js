// Niveles de Talkride: una ruta de cinco peldaños que ordena toda la app. Cada nivel dice qué situaciones practicar,
// con qué dificultad en el roleplay y qué lecciones conviene ver. Subir de nivel exige las dos cosas:
// el Índice Talkride del último diagnóstico (lo que eres hoy) y prácticas sólidas del nivel actual (lo que demostraste),
// para que nadie suba sólo por cómo se ve ni se quede abajo por un mal día.
import { esc } from './shared.js';

export const LEVEL_PATH = [
  { n: 1, name: 'Explorador', min: 0, focus: 'Hablar sin bloquearte: soltar la voz y perder el miedo a grabarte.',
    scenarios: ['passion', 'intro', 'new-group', 'voicenote'], difficulty: 1, lessons: ['nervios', 'pausa'] },
  { n: 2, name: 'Practicante', min: 40, focus: 'Ordenar lo que dices: una idea, una razón y un ejemplo, incluso improvisando.',
    scenarios: ['impro', 'say-no', 'elevator', 'toast', 'recognition', 'apology'], difficulty: 1, lessons: ['prep', 'historia', 'voz'] },
  { n: 3, name: 'Competente', min: 55, focus: 'Comunicar en el trabajo: entrevistas con evidencia y mensajes que van al punto.',
    scenarios: ['interview', 'weakness', 'meeting', 'raise', 'reel', 'family'], difficulty: 2, lessons: ['star', 'bluf', 'presencia'] },
  { n: 4, name: 'Hábil', min: 70, focus: 'Liderar conversaciones difíciles: dar feedback, anunciar cambios y responder bajo presión.',
    scenarios: ['feedback', 'change', 'qa', 'opening'], difficulty: 3, lessons: ['sbi', 'cnv', 'escucha'] },
  { n: 5, name: 'Referente', min: 85, focus: 'Inspirar y persuadir: charlas, pitches y discursos que la gente recuerda.',
    scenarios: ['pitch', 'wedding'], difficulty: 3, lessons: ['mitos'] },
];
export const SOLID = 70;            // puntaje de una práctica que cuenta para subir
export const NEEDED = 3;            // prácticas sólidas del nivel actual para subir

export const levelInfo = (n) => LEVEL_PATH[Math.max(1, Math.min(5, n)) - 1];
export const levelOfScenario = (id) => LEVEL_PATH.find(l => l.scenarios.includes(id))?.n ?? 2;
// Nivel que se demuestra con una sesión: la situación evaluada o la dificultad del roleplay.
export function levelOfSession(s) {
  if (s.type === 'roleplay') return s.difficulty >= 3 ? 4 : s.difficulty === 2 ? 3 : 1;
  if (s.type === 'evaluacion' && s.scenario) return levelOfScenario(s.scenario);
  return null;
}
const byIndex = (total) => Number.isFinite(total) ? [...LEVEL_PATH].reverse().find(l => total >= l.min).n : 1;

// Nivel actual y qué falta para el siguiente. Sin diagnóstico se empieza en Explorador.
export function currentLevel(profile = {}, sessions = []) {
  const diag = Array.isArray(profile.diagnoses) ? profile.diagnoses.at(-1) : null;
  const indexLevel = diag ? byIndex(diag.total) : 1;
  // Prácticas sólidas por nivel (las de un nivel más alto cuentan también para los de abajo).
  const solid = (n) => sessions.filter(s => Number(s.total) >= SOLID && (levelOfSession(s) ?? 0) >= n).length;
  // El nivel por práctica sube de a uno: para pasar del nivel n hay que demostrar NEEDED prácticas sólidas en n.
  let practiceLevel = 1;
  while (practiceLevel < 5 && solid(practiceLevel) >= NEEDED) practiceLevel++;
  const n = Math.min(indexLevel, practiceLevel);
  const next = n < 5 ? levelInfo(n + 1) : null;
  return {
    n, ...levelInfo(n), next,
    index: diag?.total ?? null, indexOk: next ? (diag?.total ?? 0) >= next.min : true,
    solid: solid(n), solidOk: solid(n) >= NEEDED,
    // Si la práctica ya alcanza pero el Índice no, toca rehacer el diagnóstico (se mide cada 4 semanas).
    needsRediagnosis: !!next && solid(n) >= NEEDED && (diag?.total ?? 0) < next.min,
    indexLevel,   // hasta dónde llega el Índice; el nivel sube hasta ahí confirmándolo con prácticas
  };
}

// Dificultad sugerida del roleplay y situaciones del nivel.
export const suggestedDifficulty = (lvl) => lvl.difficulty;
export const isChallenge = (scenarioId, lvl) => levelOfScenario(scenarioId) > lvl.n;

// Tarjeta «Tu nivel» (Hoy y Progreso): peldaños, foco y las dos condiciones para subir.
export function levelCardHTML(lvl, { compact = false } = {}) {
  const steps = LEVEL_PATH.map(l => `<li class="${l.n < lvl.n ? 'done' : l.n === lvl.n ? 'now' : ''}" ${l.n === lvl.n ? 'aria-current="step"' : ''}>
    <span class="lv-n">${l.n}</span><span class="lv-name">${esc(l.name)}</span></li>`).join('');
  const req = lvl.next ? `<ul class="lv-req">
      <li class="${lvl.indexOk ? 'ok' : ''}">Índice Talkride ${lvl.next.min} o más <small>(${lvl.index == null ? 'haz tu diagnóstico' : `tienes ${lvl.index}`})</small></li>
      <li class="${lvl.solidOk ? 'ok' : ''}">${NEEDED} prácticas con ${SOLID}+ de tu nivel <small>(llevas ${Math.min(lvl.solid, NEEDED)} de ${NEEDED})</small></li>
    </ul>${lvl.indexLevel > lvl.n ? `<p class="note">Tu Índice ya te ubica en el rango ${esc(levelInfo(lvl.indexLevel).name)}: cada nivel hasta ahí se confirma con ${NEEDED} prácticas sólidas.</p>` : ''}${lvl.needsRediagnosis ? '<p class="note">Ya demostraste el nivel en práctica: <a href="diagnostico.html">rehaz tu diagnóstico</a> para subir.</p>' : ''}`
    : '<p class="note">Llegaste a la cima de la ruta. Mantén el nivel con una práctica difícil por semana.</p>';
  return `<ol class="lv-path" aria-label="Ruta de niveles">${steps}</ol>
    <p class="lv-focus"><strong>Nivel ${lvl.n} · ${esc(lvl.name)}.</strong> ${esc(lvl.focus)}</p>
    ${compact ? '' : `<p class="lv-subtitle">${lvl.next ? `Para subir a ${esc(lvl.next.name)}` : 'Ruta completa'}</p>`}${req}`;
}
