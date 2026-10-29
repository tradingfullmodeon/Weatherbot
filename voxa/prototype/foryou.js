// «Hecho para ti»: ejercicios armados con tus propios errores (como «Made for You» de Speak), sin IA y sin costo.
// Usa lo que guardan tus últimas prácticas: qué muletillas y atenuadores dijiste y qué métricas salieron más bajas.
import { esc } from './shared.js';
import { LESSON_FOR_METRIC } from './lessons.js';

// Cómo decir con seguridad lo que hoy dices con un atenuador.
const HEDGE_SWAP = {
  'creo que': '«Propongo…» o «Mi recomendación es…»',
  'tal vez': '«Sugiero…»', 'quizás': '«Sugiero…»', 'quizá': '«Sugiero…»', 'a lo mejor': '«Sugiero…»', 'capaz que': '«Sugiero…»',
  'perdón por molestar': '«Gracias por tu tiempo»', 'perdona que te moleste': '«Gracias por tu tiempo»',
  'disculpa que te moleste': '«Gracias por tu tiempo»', 'disculpa la molestia': '«Gracias por tu tiempo»',
  'quería saber si': 'una pregunta directa: «¿Puedes…?»', 'quería ver si': 'una pregunta directa: «¿Puedes…?»',
  'solo quería': 'el pedido directo', 'sólo quería': 'el pedido directo', 'no sé si': 'una pregunta directa: «¿Puedes…?»',
  'un poquito': 'la cifra o el hecho concreto', 'más o menos': 'la cifra o el hecho concreto',
};
// Métrica débil → ejercicio del gimnasio (voz) o lección corta (contenido y presencia).
const GYM_FOR_METRIC = { pitch: 'sirena', volume: 'proyeccion', wpm: 'pausas', pauses: 'pausas', hums: 'pausas', speech: 'sostener' };
const METRIC_NAME = {
  pitch: 'la variación de tono', volume: 'el énfasis con el volumen', wpm: 'el ritmo', pauses: 'los silencios largos',
  hums: 'los «eeh» de duda', speech: 'el tiempo hablando', structure: 'la estructura', length: 'el desarrollo de tus ideas',
  variety: 'la variedad de vocabulario', duration: 'la duración', gaze: 'la mirada a cámara', head: 'la estabilidad de la cabeza',
  face: 'el encuadre', smile: 'la expresión',
};

const sumCounts = (list) => list.reduce((acc, c) => { for (const [k, n] of Object.entries(c || {})) acc[k] = (acc[k] || 0) + n; return acc; }, {});
const top = (counts) => Object.entries(counts).sort((a, b) => b[1] - a[1])[0];

export function madeForYou(sessions, recent = 10) {
  const last = sessions.filter(s => s.type === 'evaluacion').slice(-recent);
  if (!last.length) return [];
  const drills = [];
  const filler = top(sumCounts(last.map(s => s.said?.fillers)));
  if (filler && filler[1] >= 3) drills.push({
    key: 'fillers', title: `Cambia «${filler[0]}» por una pausa`,
    why: `Lo dijiste ${filler[1]} veces en tus últimas prácticas.`,
    how: `Lee en voz alta con pausas marcadas. Cuando sientas venir un «${filler[0]}», cierra la boca y respira: el silencio suena seguro.`,
    href: 'gimnasio.html?ejercicio=pausas', cta: 'Hacer el ejercicio (40 s)',
  });
  const hedge = top(sumCounts(last.map(s => s.said?.hedges)));
  if (hedge && hedge[1] >= 2) drills.push({
    key: 'hedges', title: `Di «${hedge[0]}» con seguridad`,
    why: `Apareció ${hedge[1]} veces: le resta fuerza a lo que propones.`,
    how: `Reemplázalo por ${HEDGE_SWAP[hedge[0]] || 'la frase sin el atenuador'}. Escribe tres frases así y dilas en voz alta.`,
    href: `aprender.html?leccion=${LESSON_FOR_METRIC.hedges}`, cta: 'Lección de 2 minutos',
  });
  // La métrica con el promedio más bajo (sin repetir lo que ya cubren los dos ejercicios anteriores).
  const scores = {};
  for (const s of last.slice(-5)) for (const [k, v] of Object.entries(s.metrics || {})) {
    if (typeof v?.s === 'number' && METRIC_NAME[k] && !drills.some(d => d.key === k)) (scores[k] ||= []).push(v.s);
  }
  const weakest = Object.entries(scores).map(([k, v]) => [k, v.reduce((a, b) => a + b, 0) / v.length]).sort((a, b) => a[1] - b[1])[0];
  if (weakest && weakest[1] < 70) {
    const gym = GYM_FOR_METRIC[weakest[0]];
    drills.push({
      key: weakest[0], title: `Entrena ${METRIC_NAME[weakest[0]]}`,
      why: `Es tu punto más bajo en las últimas prácticas (${Math.round(weakest[1])} de 100).`,
      how: gym ? 'Un ejercicio de voz de menos de un minuto, con medición en vivo.' : 'Una lección corta con un ejemplo y una práctica guiada.',
      href: gym ? `gimnasio.html?ejercicio=${gym}` : `aprender.html?leccion=${LESSON_FOR_METRIC[weakest[0]] || 'prep'}`,
      cta: gym ? 'Hacer el ejercicio' : 'Lección de 2 minutos',
    });
  }
  return drills.slice(0, 3);
}

export function madeForYouHTML(drills) {
  if (!drills.length) return '';
  return `<h2>🎯 Hecho para ti</h2><p class="note">Ejercicios armados con lo que dijiste en tus últimas prácticas.</p>
    <div class="foryou">${drills.map(d => `<div class="fy"><strong>${esc(d.title)}</strong><p class="note">${esc(d.why)}</p><p>${esc(d.how)}</p>
      <a class="btn-link" href="${esc(d.href)}">${esc(d.cta)}</a></div>`).join('')}</div>`;
}
