// Plan de la persona (gratis, prueba de 7 días o Pro): textos honestos sobre qué incluye y qué queda.
import { esc } from './shared.js';

export const AI_FEATURES = [
  ['feedback', 'consejos del coach'],
  ['roleplay', 'turnos de roleplay con personajes'],
  ['evaluate', 'evaluaciones de roleplay'],
  ['writing', 'correos mejorados'],
  ['event', 'preparaciones de evento'],
];
// Lo que nunca se cobra: todo lo que se calcula en el teléfono.
export const ALWAYS_FREE = [
  'Diagnóstico inicial, Índice VOXA y metas',
  'Análisis de tu voz: ritmo, pausas, «eeh», muletillas, tono y volumen',
  'Mirada y postura con la cámara',
  'Estructura de tus respuestas (PREP, STAR, BLUF, SBI) y revisión de escritura',
  'Simulacro de entrevista, gimnasio de voz, lecciones y plan de evento',
];
export const PRO_INCLUDES = [
  'Coach IA después de cada práctica: lo que hiciste bien, un foco y cómo sonaría mejor',
  'Roleplay con 9 personajes que reaccionan a cómo hablas, y evaluación con citas',
  'Correos reescritos listos para enviar',
  'Preguntas difíciles a la medida de tu evento real',
];
// El cobro sin sorpresas es lo que más pesa en las calificaciones de la categoría (ver PLAN_ACCION.md).
export const BILLING_TERMS = [
  'Te avisamos en el teléfono 3 días antes de cada renovación.',
  'Cancelas en un toque desde las suscripciones de tu tienda, sin llamadas ni formularios.',
  'Si no te sirvió, pide el reembolso en los primeros 14 días: en Android lo devolvemos nosotros; en iPhone se pide a Apple (reportaproblem.apple.com) y te ayudamos.',
  'Lo gratis sigue gratis aunque canceles.',
];
// Dónde se cancela una suscripción, según la tienda.
export const MANAGE_SUBSCRIPTION = {
  ios: 'https://apps.apple.com/account/subscriptions',
  android: 'https://play.google.com/store/account/subscriptions',
};

export function daysLeft(until, now = Date.now()) {
  return until ? Math.max(0, Math.ceil((until * 1000 - now) / 86400e3)) : null;
}

const fmtDate = (until) => new Date(until * 1000).toLocaleDateString('es', { day: 'numeric', month: 'long' });

// Una línea para «Hoy»: dónde estás y qué te queda.
export function planLine(me, now = Date.now()) {
  if (!me) return '';
  if (me.plan === 'prueba') {
    const d = daysLeft(me.until, now);
    return `Prueba del coach IA: ${d === 1 ? 'te queda 1 día' : `te quedan ${d} días`} · ${me.remaining.feedback} consejos disponibles`;
  }
  if (me.plan === 'pro') return me.until ? `Plan Pro activo hasta el ${fmtDate(me.until)}` : 'Plan Pro activo';
  return 'Plan gratis: todo el análisis de tu práctica. El coach IA es parte del plan Pro';
}

export function remainingHTML(me) {
  if (!me || me.plan === 'gratis') return '';
  return `<ul class="plan-left">${AI_FEATURES.map(([k, label]) => `<li><strong>${me.remaining[k] ?? 0}</strong> ${esc(label)}</li>`).join('')}</ul>`;
}

// Al agotarse el cupo, el mensaje del servidor más un camino claro (nunca un error mudo).
export function upgradeHTML(err) {
  return err && err.status === 402 ? ' <a href="pro.html">Ver el plan Pro</a>' : '';
}
