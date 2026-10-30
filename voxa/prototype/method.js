// Método RIDE de Talkride: la forma en que la app entrena, en cuatro pasos que se repiten en cada práctica.
// Une lo que la investigación muestra que funciona (práctica deliberada, feedback con un solo foco, metas
// específicas con plan, exposición gradual y práctica espaciada). Detalle y fuentes: docs/METODO.md.
import { esc } from './shared.js';

export const METHOD = [
  { letter: 'R', name: 'Reconoce', line: 'Mide dónde estás, sin adivinar.',
    how: 'El diagnóstico y cada práctica miden tu voz, tu estructura y tu presencia en cámara, y las comparan con cómo te ves tú.',
    why: 'Saber dónde estás frente a la meta es la primera pregunta de todo feedback que funciona.' },
  { letter: 'I', name: 'Intención', line: 'Una meta, un mensaje, una estructura.',
    how: 'Eliges una meta con plazo y, antes de hablar, la idea que quieres dejar y el método que la ordena: PREP, STAR, BLUF o SBI.',
    why: 'Las metas específicas, con un «cuándo» y un «cómo», se cumplen mucho más que un «haré lo posible».' },
  { letter: 'D', name: 'Dilo', line: 'En voz alta y ante alguien, aunque sea simulado.',
    how: 'Practicas hablando de verdad: a la cámara, con un público virtual o con personajes que reaccionan a cómo hablas, subiendo la dificultad de a poco.',
    why: 'La habilidad se gana haciendo, y los nervios bajan con la exposición repetida y gradual.' },
  { letter: 'E', name: 'Evalúa y repite', line: 'Un solo foco, y otra vez.',
    how: 'Recibes lo que hiciste bien, un único foco de mejora con un ejercicio de 2 minutos, y repites enseguida. Mañana, otra vez.',
    why: 'El feedback concreto con un próximo paso mejora el desempeño; repetir en días distintos fija lo aprendido.' },
];

export const METHOD_PROMISE = '7 minutos al día · un foco a la vez · tu avance medido';

// Versión corta para Hoy y la bienvenida.
export function methodStripHTML() {
  return `<ol class="ride-steps" aria-label="Método RIDE">${METHOD.map(s =>
    `<li><span class="ride-l" aria-hidden="true">${s.letter}</span><span><strong>${esc(s.name)}</strong><small>${esc(s.line)}</small></span></li>`).join('')}</ol>`;
}

// Versión completa para la página del método.
export function methodFullHTML() {
  return METHOD.map(s => `<section class="card full ride-step">
    <h2><span class="ride-l" aria-hidden="true">${s.letter}</span>${esc(s.name)}</h2>
    <p class="lead">${esc(s.line)}</p>
    <p><strong>En Talkride:</strong> ${esc(s.how)}</p>
    <p class="note"><strong>Por qué funciona:</strong> ${esc(s.why)}</p>
  </section>`).join('');
}
