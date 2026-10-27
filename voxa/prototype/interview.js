// Simulacro de entrevista sin IA (las dos versiones lo comparten): preguntas fijas por competencias, pero escucha
// lo básico. Repregunta una vez si a una respuesta STAR le falta el resultado, no vuelve a pedir un logro ya
// contado y revisa si el «por qué te interesa» se conecta con el puesto.
import { esc, wordCount, countMatches, FILLER_RE, mean } from './shared.js';
import { checkStructure } from './structure.js';

export const INTERVIEW_PERSONA = {
  id: 'offline', name: 'Simulacro de entrevista', role: 'preguntas fijas por competencias, sin IA',
  scenario: 'Entrevista de trabajo con preguntas fijas.', goal: 'Responder cada pregunta con STAR y resultados concretos.',
  skills: ['STAR', 'resultados medibles'], opening: 'Hola, gracias por tu tiempo. Cuéntame brevemente sobre ti.',
};

const MOTIVE_RE = /(?<!\p{L})(este puesto|el puesto|este rol|el rol|esta empresa|la empresa|el equipo|puedo aportar|aportar|mi experiencia|sé hacer|me especialicé|encaja)(?!\p{L})/iu;
export const INTERVIEW_QUESTIONS = [
  { id: 'motivo', text: 'Gracias. ¿Por qué te interesa este puesto?', expect: MOTIVE_RE,
    model: 'Me interesa porque el puesto combina dos cosas que hago bien: analizar datos y explicarlos simple. En mi práctica armé un tablero de ventas que el equipo usaba cada lunes, y quiero aportar eso aquí, donde las decisiones se toman con datos.', miss: 'Tu respuesta es general: conecta lo que buscas con este puesto o empresa y di qué puedes aportar («Mi experiencia en… me permite aportar…»).' },
  { id: 'logro', text: 'Cuéntame de un logro del que estés orgulloso u orgullosa. ¿Qué hiciste tú, concretamente?', star: true,
    model: 'En mi último trabajo, los pedidos llegaban tarde un 20% de las veces (situación). Mi tarea era bajar ese número en un trimestre (tarea). Revisé cada paso, propuse un control diario y capacité a tres compañeros (acción). En tres meses los atrasos bajaron al 6% (resultado).' },
  { id: 'conflicto', text: 'Háblame de un conflicto con un compañero o compañera y cómo lo resolviste.', star: true,
    model: 'En un proyecto de la universidad, un compañero entregaba tarde y el grupo se molestó (situación). Yo coordinaba y tenía que cumplir la fecha (tarea). Hablé a solas con él, le pregunté qué pasaba y acordamos dividir su parte en entregas semanales (acción). Terminamos un día antes y él siguió en el equipo (resultado).' },
  { id: 'error', text: '¿Cuál es un error que cometiste y qué aprendiste?', star: true,
    model: 'En mi práctica envié un informe con una cifra equivocada (situación). Tenía que corregirlo antes de la reunión con el cliente (tarea). Avisé de inmediato, envié la versión corregida y desde entonces reviso los números con una lista de control (acción). No volvió a pasar y ahora reviso los informes del equipo (resultado).' },
  { id: 'cierre', text: 'Para terminar, ¿tienes alguna pregunta para mí?', expect: /\?|(?<!\p{L})(qué|cómo|cuál|cuándo)(?!\p{L})/iu, miss: 'Lleva preparada una pregunta para el final: muestra interés real.',
    model: '¿Cómo se ve un muy buen primer trimestre en este puesto?' },
];

const starOf = (text) => checkStructure(text, 'STAR');
const hasAchievement = (a) => { const p = checkStructure(a, 'STAR', { minWords: 8 })?.parts || []; return ['Acción', 'Resultado'].every(n => p.find(x => x.part === n)?.ok); };

export const createInterview = () => ({ at: -1, answers: {}, followed: {} });
export const interviewDone = (st) => st.at >= INTERVIEW_QUESTIONS.length;
export const currentQuestion = (st) => INTERVIEW_QUESTIONS[st.at];
export const interviewProgress = (st) => `Pregunta ${Math.min(st.at + 1, INTERVIEW_QUESTIONS.length)} de ${INTERVIEW_QUESTIONS.length}`;

// Registra la respuesta y devuelve lo siguiente que dice el entrevistador (o null si terminó).
// userTexts: todo lo que la persona dijo hasta ahora (para no volver a pedir un logro ya contado).
export function interviewNext(st, text, userTexts = []) {
  const q = INTERVIEW_QUESTIONS[st.at];
  if (q) st.answers[q.id] = ((st.answers[q.id] || '') + ' ' + text).trim();
  if (q?.star && !st.followed[q.id] && !starOf(st.answers[q.id])?.parts.find(p => p.part === 'Resultado')?.ok) {
    st.followed[q.id] = true;
    return '¿Y cuál fue el resultado? Si puedes, dilo con un número o un cambio concreto.';
  }
  let next = INTERVIEW_QUESTIONS[++st.at], prefix = '';
  if (next?.id === 'logro' && userTexts.some(hasAchievement)) {
    prefix = 'Ya me contaste un logro con resultado, gracias. '; next = INTERVIEW_QUESTIONS[++st.at];
  }
  return next ? prefix + next.text : null;
}

export function interviewHint(text, q) {
  if (q?.expect && !q.expect.test(text)) return q.miss;
  if (q?.star) {
    const st = starOf(text);
    if (!st) return 'Desarrolla más tu respuesta: cuenta la situación, qué hiciste tú y qué resultado lograste.';
    const miss = st.parts.filter(p => !p.ok);
    return miss.length ? `Falta: ${miss.map(p => p.part).join(', ')}. ${miss[0].tip}` : 'Respuesta STAR completa. Así se responde.';
  }
  if (wordCount(text) < 25 && !/\d/.test(text)) return 'Desarrolla más: da un ejemplo concreto (Situación y Acción).';
  if (!/\d/.test(text)) return 'Añade un resultado medible: un número, porcentaje o plazo.';
  if (countMatches(text, FILLER_RE) > 2) return 'Cambia las muletillas por una pausa breve.';
  return 'Buen desarrollo. Cierra cada respuesta con el resultado.';
}

// Puntaje del simulacro: la estructura STAR pesa la mitad; sin terminar no supera 70.
export function interviewScore(st, base) {
  const stars = INTERVIEW_QUESTIONS.filter(q => q.star && st.answers[q.id]).map(q => starOf(st.answers[q.id])?.score ?? 0);
  const scores = { ...base, ...(stars.length ? { estructura_star: Math.round(mean(stars)) } : {}) };
  let total = Math.round(stars.length ? 0.5 * scores.estructura_star + 0.5 * mean(Object.values(base)) : mean(Object.values(base)));
  if (!interviewDone(st)) total = Math.min(total, 70);
  return { scores, total };
}

export function interviewReportHTML(st) {
  const rows = INTERVIEW_QUESTIONS.filter(q => st.answers[q.id]).map(q => {
    const a = st.answers[q.id];
    const miss = q.star ? (starOf(a)?.parts.filter(p => !p.ok).map(p => p.part) || ['respuesta muy corta']) : q.expect && !q.expect.test(a) ? [q.miss] : [];
    // Respuesta modelo para comparar e imitar (como las apps líderes de entrevistas).
    const model = miss.length && q.model ? `<details><summary>Así podría sonar</summary><blockquote>${esc(q.model)}</blockquote></details>` : '';
    return `<li><strong>${esc(q.text.replace(/^Gracias\. /, ''))}</strong><br>${!miss.length ? '✓ Completa' : q.star ? `Faltó: ${esc(miss.join(', '))}` : esc(miss[0])}${model}</li>`;
  });
  const counts = {};
  INTERVIEW_QUESTIONS.filter(q => q.star && st.answers[q.id]).forEach(q => (starOf(st.answers[q.id])?.parts || []).filter(p => !p.ok).forEach(p => { counts[p.part] = (counts[p.part] || 0) + 1; }));
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const tip = top ? starOf('x '.repeat(20) + '.').parts.find(p => p.part === top)?.tip : null;
  return `<h3>Respuesta por respuesta</h3><ul>${rows.join('') || '<li>Responde al menos una pregunta.</li>'}</ul>
    <div class="fb"><div><h3>Siguiente paso</h3>${interviewDone(st) ? '' : 'Termina el simulacro: el puntaje se limita a 70 hasta responder todas las preguntas. '}${tip ? `Lo que más te faltó fue «${esc(top)}». ${esc(tip)}` : 'Tus respuestas tienen la estructura STAR. Prueba ahora con una pregunta nueva o en voz alta.'}</div></div>`;
}

// Una cita de la evaluación con IA se muestra sólo si la persona de verdad la dijo.
const normTxt = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\p{L}\p{N} ]/gu, ' ').replace(/\s+/g, ' ').trim();
export const quoteSaid = (quote, userTexts) => !!quote && normTxt(userTexts.join(' ')).includes(normTxt(quote));
