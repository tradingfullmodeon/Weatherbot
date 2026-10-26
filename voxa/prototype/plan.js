// Sprint de 30 días: una dimensión por semana (práctica deliberada). Cada tarea enlaza a la práctica
// concreta para que «la práctica de hoy» sea un solo toque desde Inicio.
import { loadSessions } from './shared.js';

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

const dayKey = (iso) => iso.slice(0, 10);

// Día del sprint (0–27) contado desde la primera sesión, o null si aún no hay sesiones.
export function sprintDay(sessions = loadSessions()) {
  if (!sessions.length) return null;
  const first = [...sessions].sort((a, b) => a.date.localeCompare(b.date))[0];
  return Math.floor((new Date(dayKey(new Date().toISOString())) - new Date(dayKey(first.date))) / 864e5);
}

export function todayTask(sessions = loadSessions()) {
  const day = sprintDay(sessions);
  if (day === null) return { day: 0, week: 'Día 0 · Diagnóstico', text: 'Preséntate en 60 segundos: será tu punto de partida.', href: 'evaluar.html?escenario=intro' };
  if (day >= 28) return { day, week: 'Sprint completado', text: 'Repite tu primer escenario y compara cuánto mejoraste.', href: 'evaluar.html?escenario=intro' };
  const w = SPRINT[Math.floor(day / 7)];
  return { day: day + 1, week: w.week, ...w.tasks[day % 7] };
}

export function streak(sessions = loadSessions()) {
  const days = new Set(sessions.map(s => dayKey(s.date)));
  let n = 0; const d = new Date();
  if (!days.has(dayKey(d.toISOString()))) d.setDate(d.getDate() - 1);   // la racha sigue viva si practicaste ayer
  while (days.has(dayKey(d.toISOString()))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

export const practicedToday = (sessions = loadSessions()) => sessions.some(s => dayKey(s.date) === dayKey(new Date().toISOString()));
