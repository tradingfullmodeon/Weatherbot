// Personajes a la medida de la meta y memoria entre sesiones: cada personaje recuerda en qué quedaste la última vez.
// Todo se guarda en el perfil local; al personaje sólo llega el «siguiente paso» de la sesión anterior.
import { esc } from './shared.js';

// Personajes más útiles para cada meta del perfil (los demás quedan en «Ver todos»).
export const GOAL_PERSONAS = {
  entrevista: ['reclutadora', 'finanzas', 'jefe', 'networking'],
  liderazgo: ['colaborador', 'malanoticia', 'jefe', 'colega'],
  ventas: ['cliente', 'inversionista', 'networking', 'finanzas'],
  presentaciones: ['inversionista', 'finanzas', 'jefe', 'networking'],
  conversaciones: ['jefe', 'colega', 'cliente', 'malanoticia'],
  confianza: ['networking', 'reclutadora', 'colega', 'jefe'],
};
export const SHOWN_FIRST = 4;

export function orderPersonas(personas, goal) {
  const pref = GOAL_PERSONAS[goal] || [];
  const rank = (p) => (pref.includes(p.id) ? pref.indexOf(p.id) : pref.length + personas.indexOf(p));
  return [...personas].sort((a, b) => rank(a) - rank(b));
}

export function rememberRoleplay(profile, personaId, { next, total }, now = new Date()) {
  profile.roleplayMemory = { ...(profile.roleplayMemory || {}), [personaId]: { date: now.toISOString(), next: String(next || '').slice(0, 300), total } };
  return profile;
}

const ago = (days) => (days === 0 ? 'hoy' : days === 1 ? 'ayer' : `hace ${days} días`);

// Nota para la persona y contexto para el personaje; nada si pasaron más de 60 días.
export function memoryNote(profile, persona, now = new Date()) {
  const m = profile.roleplayMemory?.[persona.id];
  if (!m?.next) return null;
  const days = Math.floor((now - new Date(m.date)) / 864e5);
  if (days > 60) return null;
  return {
    html: `<div class="note memory">La última vez con ${esc(persona.name)} (${ago(days)}) sacaste ${m.total}. Tu siguiente paso era: <strong>${esc(m.next)}</strong></div>`,
    context: `Nota de la práctica anterior con este personaje (${ago(days)}): el usuario debía trabajar en «${m.next}». Dale la oportunidad de demostrarlo y reconócelo si lo logra.`,
  };
}
