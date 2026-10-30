// Sprint de 30 días: una dimensión por semana (práctica deliberada). Cada tarea enlaza a la práctica
// concreta para que «la práctica de hoy» sea un solo toque desde Inicio.
import { loadSessions, localDay } from './shared.js';
import { levelOfScenario, levelInfo } from './levels.js';
import { SCENARIOS } from './scenarios.js';

const t = (text, href) => ({ text, href });

export const SPRINT = [
  { week: 'Semana 1 · Voz y ritmo', tasks: [
    t('Preséntate en 60 segundos y fíjate en tu ritmo.', 'evaluar.html?escenario=intro'),
    t('Gimnasio: lectura con pausas; después repite tu presentación.', 'gimnasio.html?ejercicio=pausas'),
    t('Reto: 60 s sin muletillas. Cambia cada «este» u «o sea» por una pausa.', 'evaluar.html?escenario=passion'),
    t('Gimnasio: sirena de tono, para sonar menos monótono.', 'gimnasio.html?ejercicio=sirena'),
    t('Actualización ejecutiva: conclusión primero.', 'evaluar.html?escenario=meeting'),
    t('Improvisación con tema sorpresa.', 'evaluar.html?escenario=impro'),
    t('Gimnasio: trabalenguas niveles 1 a 3.', 'gimnasio.html?ejercicio=trabalenguas'),
  ] },
  { week: 'Semana 2 · Estructura', tasks: [
    t('Improvisación con PREP: punto, razón, ejemplo, punto.', 'evaluar.html?escenario=impro'),
    t('Entrevista STAR: «Cuéntame de un logro».', 'evaluar.html?escenario=interview'),
    t('Elevator pitch de 30 segundos.', 'evaluar.html?escenario=elevator'),
    t('Escritura: convierte un correo largo en uno de 5 líneas.', 'escritura.html'),
    t('Roleplay con la reclutadora (dificultad media).', 'roleplay.html?personaje=reclutadora'),
    t('Pitch de proyecto con historia inicial.', 'evaluar.html?escenario=pitch'),
    t('Pide un aumento con evidencia.', 'evaluar.html?escenario=raise'),
  ] },
  { week: 'Semana 3 · Presencia', tasks: [
    t('Mira a la cámara en la apertura, la idea clave y el cierre.', 'evaluar.html?escenario=intro'),
    t('Brindis con la audiencia virtual activada.', 'evaluar.html?escenario=toast&audiencia=1'),
    t('Apertura de una charla con la audiencia virtual.', 'evaluar.html?escenario=opening&audiencia=1'),
    t('Gimnasio: escalera de volumen (proyección).', 'gimnasio.html?ejercicio=proyeccion'),
    t('Video corto para redes: gancho en 3 segundos.', 'evaluar.html?escenario=reel'),
    t('Reconoce el logro de alguien (calidez y precisión).', 'evaluar.html?escenario=recognition'),
    t('Repite tu escenario favorito buscando 80 puntos o más.', 'evaluar.html'),
  ] },
  { week: 'Semana 4 · Contexto e interacción', tasks: [
    t('Roleplay: clienta molesta (escucha activa).', 'roleplay.html?personaje=cliente'),
    t('Roleplay: colega (feedback SBI).', 'roleplay.html?personaje=colega'),
    t('Roleplay: jefe (pedido concreto).', 'roleplay.html?personaje=jefe'),
    t('Escritura: di que no por escrito, con amabilidad.', 'escritura.html?tipo=no'),
    t('Roleplay: inversionista en dificultad alta.', 'roleplay.html?personaje=inversionista'),
    t('Misión real: usa una técnica en una conversación de verdad y anótalo.', 'progreso.html'),
    t('Re-evaluación final: el mismo escenario de tu primer día.', 'evaluar.html?escenario=intro'),
  ] },
];

const dayKey = (iso) => localDay(new Date(iso));

// Día del sprint (0–27): cuántos días distintos ya practicaste antes de hoy (si faltas un día, retomas donde
// quedaste en vez de saltarte tareas). null si aún no hay sesiones.
export function sprintDay(sessions = loadSessions()) {
  if (!sessions.length) return null;
  const today = localDay();
  return new Set(sessions.map(s => dayKey(s.date)).filter(d => d < today)).size;
}

// level: nivel actual (levels.js). Si la tarea del plan está más de un nivel por encima, se cambia por una situación del
// nivel siguiente al tuyo: el desafío justo (exposición gradual) en lugar de uno que frustra.
export function todayTask(sessions = loadSessions(), level = null) {
  const day = sprintDay(sessions);
  if (day === null) return { day: 0, week: 'Día 0 · Diagnóstico', text: 'Preséntate en 60 segundos: será tu punto de partida.', href: 'evaluar.html?escenario=intro' };
  if (day >= 28) return { day, week: 'Sprint completado', text: 'Repite tu primer escenario y compara cuánto mejoraste.', href: 'evaluar.html?escenario=intro' };
  const w = SPRINT[Math.floor(day / 7)];
  return { day: day + 1, week: w.week, ...fitToLevel(w.tasks[day % 7], level, day) };
}

function fitToLevel(task, level, day) {
  const id = new URLSearchParams(task.href.split('?')[1] || '').get('escenario');
  if (!level || !id || levelOfScenario(id) <= level.n + 1) return task;
  const target = levelInfo(level.n + 1);
  const alt = target.scenarios[day % target.scenarios.length];
  const name = (x) => SCENARIOS.find(sc => sc.id === x)?.name || x;
  return { text: `Desafío a tu medida (nivel ${target.n}): ${name(alt)}. «${name(id)}» llega más adelante en tu ruta.`, href: `evaluar.html?escenario=${alt}` };
}

// Racha con día de descanso (como el protector de racha de Duolingo): un día suelto sin práctica cada 7 no la corta.
// rested: los días que se usaron como descanso, del más reciente al más antiguo.
export function streakInfo(sessions = loadSessions(), today = new Date()) {
  const days = new Set(sessions.map(s => dayKey(s.date)));
  const d = new Date(today);
  if (!days.has(localDay(d))) d.setDate(d.getDate() - 1);   // la racha sigue viva si practicaste ayer
  let n = 0, sinceRest = Infinity;
  const rested = [];
  for (let guard = 0; guard < 3660; guard++) {
    if (days.has(localDay(d))) { n++; sinceRest++; }
    else {
      const before = new Date(d); before.setDate(before.getDate() - 1);
      // Descanso válido: un solo día, con práctica el día anterior y al menos 6 días practicados desde el último descanso.
      if (sinceRest >= 6 && days.has(localDay(before))) { rested.push(localDay(d)); sinceRest = 0; }
      else break;
    }
    d.setDate(d.getDate() - 1);
  }
  return { days: n, rested };
}
export const streak = (sessions = loadSessions(), today = new Date()) => streakInfo(sessions, today).days;

export const practicedToday = (sessions = loadSessions()) => sessions.some(s => dayKey(s.date) === dayKey(new Date().toISOString()));
