// Cuidado de la persona: recursos de ayuda por país y detección local de mensajes de crisis (funciona sin IA).
import { esc } from './shared.js';

// Líneas gratuitas de prevención del suicidio y apoyo emocional (revisar cada año).
export const HELP_LINES = [
  ['Argentina', '135 (CABA y GBA) o (011) 5275-1135 · Centro de Asistencia al Suicida'],
  ['Chile', '*4141 · Línea de Prevención del Suicidio, 24 h'],
  ['Colombia', '106 (Bogotá) o 192 opción 4 (todo el país)'],
  ['España', '024 · Línea de atención a la conducta suicida'],
  ['México', '800 911 2000 · Línea de la Vida'],
  ['Perú', '113 opción 5'],
  ['Estados Unidos', '988 (opción en español)'],
];

export function helpHTML() {
  return `<p><strong>Si estás en peligro ahora, llama a emergencias (911; en España, 112).</strong></p>
    <p>Hablar con alguien ayuda. Estas líneas son gratuitas y confidenciales:</p>
    <ul>${HELP_LINES.map(([c, l]) => `<li><strong>${esc(c)}:</strong> ${esc(l)}</li>`).join('')}</ul>
    <p class="note">VOXA es un entrenamiento de comunicación, no un tratamiento. Si el miedo a hablar te hace evitar el trabajo, los estudios o encuentros importantes, una terapia cognitivo-conductual ayuda mucho; VOXA la complementa.</p>`;
}

// Frases que indican riesgo. Se revisan en el dispositivo: no se envían a ningún lado.
export const CRISIS_RE = /\b(me quiero morir|quiero morirme|no quiero vivir|no quiero seguir viviendo|quitarme la vida|matarme|suicid(arme|io)|hacerme daño|lastimarme|no vale la pena vivir|desaparecer para siempre)\b/iu;
export const isCrisis = (text) => CRISIS_RE.test(text || '');

// Nervios en el máximo en las últimas 3 prácticas: sugerir apoyo profesional, sin alarmar.
export function persistentHighAnxiety(sessions) {
  const last = sessions.filter(s => s.anxietyBefore != null).slice(-3);
  return last.length === 3 && last.every(s => s.anxietyBefore >= 5);
}
