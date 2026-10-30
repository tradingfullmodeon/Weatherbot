// Cuidado de la persona: recursos de ayuda por país y detección local de mensajes de crisis (funciona sin IA).
import { esc } from './shared.js';

// Líneas gratuitas de prevención del suicidio y apoyo emocional, con la emergencia de cada país (revisar cada año).
export const HELP_LINES = [
  ['Argentina', '135 (CABA y GBA) o (011) 5275-1135 · Centro de Asistencia al Suicida', '911 · SAME 107'],
  ['Chile', '*4141 · Línea de Prevención del Suicidio, 24 h', '131 ambulancia · 133 policía'],
  ['Colombia', '192 opción 4 (todo el país) · 106 en Bogotá', '123'],
  ['España', '024 · Línea de atención a la conducta suicida', '112'],
  ['México', '800 911 2000 · Línea de la Vida', '911'],
  ['Perú', '113 opción 5', '106 SAMU · 105 policía'],
  ['Uruguay', '0800 0767 o *0767 · Línea Vida', '911'],
  ['Estados Unidos', '988 (marca 2 para español)', '911'],
];

export function helpHTML() {
  return `<p><strong>Si estás en peligro ahora, llama a la emergencia de tu país</strong> (al final de cada línea).</p>
    <p>Hablar con alguien ayuda. Estas líneas son gratuitas y confidenciales:</p>
    <ul>${HELP_LINES.map(([c, l, e]) => `<li><strong>${esc(c)}:</strong> ${esc(l)} · <span class="note">emergencias: ${esc(e)}</span></li>`).join('')}</ul>
    <p class="note">Si tu país no está, busca la línea de prevención de tu país o acude a la guardia de un hospital.</p>
    <p class="note">Talkride es un entrenamiento de comunicación, no un tratamiento. Si el miedo a hablar te hace evitar el trabajo, los estudios o encuentros importantes, una terapia cognitivo-conductual ayuda mucho; Talkride la complementa.</p>`;
}

// Frases que indican riesgo. Se revisan en el dispositivo: no se envían a ningún lado.
export const CRISIS_RE = /(?<!\p{L})(me quiero morir|quiero morirme|me quiero matar|quiero matarme|matarme|no quiero vivir|no quiero seguir viviendo|quitarme la vida|suicid(arme|io)|hacerme daño|lastimarme|(me corto|cortarme) (los brazos|las muñecas|las venas|la piel)|no vale la pena vivir|mejor no estar|quiero desaparecer|desaparecer para siempre|no aguanto más vivir)(?!\p{L})/iu;
export const isCrisis = (text) => CRISIS_RE.test(text || '');

// Apoyo profesional para el miedo a hablar (no es una crisis: va aparte de las líneas de prevención).
export function professionalHTML() {
  return `<p>Si el miedo a hablar te hace evitar el trabajo, los estudios o encuentros importantes, una <strong>terapia cognitivo-conductual (TCC)</strong> con exposición gradual es el tratamiento con más evidencia. Talkride la complementa.</p>
    <ul><li>Consulta por TCC en tu cobertura de salud (obra social, EPS, ISAPRE, prepaga o seguro).</li>
    <li>Muchas facultades de psicología tienen servicios de atención gratuitos o de bajo costo.</li>
    <li>Las asociaciones de terapia cognitiva de tu país publican directorios de profesionales.</li></ul>`;
}

// Nervios en el máximo en las últimas 3 prácticas: sugerir apoyo profesional, sin alarmar.
export function persistentHighAnxiety(sessions) {
  const last = sessions.filter(s => s.anxietyBefore != null).slice(-3);
  return last.length === 3 && last.every(s => s.anxietyBefore >= 5);
}
