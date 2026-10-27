import { esc } from './shared.js';

// Micro-lecciones de 2–3 minutos. Cada una termina en una pregunta de repaso (práctica de recuperación)
// y en una práctica concreta: 10% leer, 90% hacer. Se comparten entre el prototipo y la versión publicada.

export const LESSONS = [
  {
    id: 'star', title: 'Responder con STAR', area: 'Entrevistas', minutes: 2,
    why: 'En una entrevista por competencias no evalúan tus adjetivos, sino evidencia: qué hiciste tú y qué cambió gracias a eso.',
    steps: [
      'Situación: el contexto en una o dos frases (dónde, cuándo, qué estaba en juego).',
      'Tarea: cuál era tu responsabilidad concreta.',
      'Acción: lo que hiciste TÚ (usa «yo», no «nosotros»), en dos o tres pasos.',
      'Resultado: qué cambió, idealmente con un número, y qué aprendiste.',
    ],
    bad: '«Soy muy proactiva y siempre busco mejorar los procesos.»',
    good: '«En mi último trabajo los pedidos tardaban 5 días (S). Me pidieron bajar ese tiempo (T). Mapeé el proceso, eliminé dos aprobaciones y automaticé el aviso al cliente (A). Bajamos a 3 días en dos meses (R).»',
    mistakes: ['Quedarse en la Situación y no llegar al Resultado.', 'Hablar en plural y que no se note tu aporte.', 'Resultados sin cifra ni comparación.'],
    quiz: { q: '¿Qué parte de STAR suele faltar en las respuestas débiles?', options: ['La Situación', 'El Resultado medible', 'La Tarea'], answer: 1,
      explain: 'El Resultado es lo que el entrevistador recuerda. Sin él, la historia no demuestra impacto.' },
    practice: { view: 'evaluar', scenario: 'interview', label: 'Responde «Cuéntame de un logro»' },
  },
  {
    id: 'prep', title: 'Improvisar con PREP', area: 'Estructura', minutes: 2,
    why: 'Quedarse en blanco casi nunca es falta de ideas: es falta de una estructura a la que volver. PREP te da un camino en cuatro pasos.',
    steps: ['Punto: tu respuesta en una frase.', 'Razón: por qué piensas eso.', 'Ejemplo: un caso concreto o un dato.', 'Punto: repite tu idea con otras palabras para cerrar.'],
    bad: '«Bueno, depende… hay muchas cosas a considerar, por un lado… y por otro…»',
    good: '«Prefiero el trabajo híbrido (P), porque combina foco y colaboración (R). En mi equipo, los martes presenciales resolvemos en una hora lo que por chat tomaba días (E). Por eso, híbrido es lo que mejor funciona (P).»',
    mistakes: ['Empezar por el contexto en vez de por tu punto.', 'Dar tres razones flojas en lugar de una fuerte.', 'Terminar sin volver al punto.'],
    quiz: { q: 'En PREP, ¿con qué empiezas?', options: ['Con el contexto', 'Con tu punto de vista en una frase', 'Con un ejemplo'], answer: 1,
      explain: 'Decir tu punto primero le da al oyente el «mapa»; el resto lo confirma.' },
    practice: { view: 'evaluar', scenario: 'impro', label: 'Improvisa sobre un tema sorpresa' },
  },
  {
    id: 'bluf', title: 'Lo importante primero (BLUF)', area: 'Profesional', minutes: 2,
    why: 'Jefaturas y clientes deciden con poco tiempo. Si la conclusión llega al final, muchas veces no llega.',
    steps: ['Frase 1: la conclusión o el pedido («Necesito tu aprobación para…»).', 'Frases 2–4: las dos o tres razones o datos clave.', 'Cierre: el siguiente paso con fecha.'],
    bad: '«Como sabes, el trimestre empezó con varios desafíos y el equipo estuvo analizando… (tres párrafos después) …así que necesitaríamos más presupuesto.»',
    good: '«Propongo sumar 10% al presupuesto de soporte este trimestre. Las consultas crecieron 30% y el tiempo de respuesta se duplicó. ¿Lo vemos el jueves?»',
    mistakes: ['Contar la historia completa antes de decir qué necesitas.', 'Pedidos vagos («¿lo podemos ver?»).', 'No proponer un siguiente paso.'],
    quiz: { q: '¿Dónde va el pedido en un mensaje BLUF?', options: ['Al final, después de explicar', 'En la primera frase', 'En una posdata'], answer: 1,
      explain: 'BLUF significa «lo importante al principio». Quien lee sabe de inmediato qué se le pide.' },
    practice: { view: 'evaluar', scenario: 'meeting', label: 'Da una actualización ejecutiva' },
  },
  {
    id: 'pausa', title: 'La pausa en lugar de la muletilla', area: 'Voz', minutes: 2,
    why: 'Las muletillas («este», «o sea», «eeh») aparecen cuando temes al silencio. Para quien escucha, una pausa breve suena a seguridad.',
    steps: [
      'Detecta el momento: justo antes de una idea nueva es cuando más aparecen.',
      'Cierra la boca al terminar cada frase: con los labios cerrados no sale el «eeh».',
      'Respira por la nariz durante esa pausa (1 segundo basta).',
      'Empieza la siguiente frase con la idea, no con un conector de relleno.',
    ],
    bad: '«Entonces, este, lo que queremos, o sea, es mejorar, eeh, los tiempos.»',
    good: '«Queremos mejorar los tiempos. (pausa) Hoy un pedido tarda cinco días.»',
    mistakes: ['Querer eliminar todas las muletillas de golpe: apunta a reducirlas a la mitad.', 'Reemplazarlas por otra muletilla («¿no?», «tipo»).'],
    quiz: { q: '¿Qué técnica física ayuda a evitar el «eeh»?', options: ['Hablar más rápido', 'Cerrar los labios y respirar por la nariz al terminar la frase', 'Mirar al suelo al pensar'], answer: 1,
      explain: 'Con la boca cerrada no puedes vocalizar el relleno, y la respiración te da tiempo para pensar.' },
    practice: { view: 'gimnasio', exercise: 'pausas', label: 'Lectura con pausas en el gimnasio', liteLabel: 'Graba la apertura de una charla con pausas' },
  },
  {
    id: 'voz', title: 'Una voz que mantiene la atención', area: 'Voz', minutes: 3,
    why: 'Una voz plana cansa aunque el contenido sea bueno. La variación de tono, ritmo y volumen le dice al público qué es importante.',
    steps: [
      'Enfatiza una palabra por frase: súbele un poco el volumen o el tono.',
      'Baja el tono al cerrar una afirmación; súbelo en las preguntas reales.',
      'Desacelera en lo importante (datos, conclusiones) y acelera en el contexto.',
      'Respira antes de cada frase para no apagarte al final.',
    ],
    bad: 'Todas las frases con el mismo tono, el mismo volumen y sin pausas.',
    good: '«Este año / crecimos / un TREINTA por ciento.» (pausas y énfasis en el dato)',
    mistakes: ['Terminar las afirmaciones con tono de pregunta: resta seguridad.', 'Gritar para proyectar: proyectar es apoyar con aire, no forzar la garganta.'],
    quiz: { q: 'Para sonar seguro al afirmar algo, al final de la frase el tono…', options: ['sube', 'baja', 'da igual'], answer: 1,
      explain: 'El tono descendente marca certeza; el ascendente suena a duda o a pregunta.' },
    practice: { view: 'gimnasio', exercise: 'sirena', label: 'Sirena de tono en el gimnasio', liteLabel: 'Graba 60 s variando el tono' },
  },
  {
    id: 'presencia', title: 'Presencia en cámara', area: 'Lenguaje corporal', minutes: 3,
    why: 'En video, la cámara es la mirada de tu público. Pequeños ajustes de encuadre, luz y mirada cambian mucho cómo te perciben.',
    steps: [
      'Cámara a la altura de los ojos y una mano de espacio sobre tu cabeza.',
      'Luz de frente (una ventana delante de ti, nunca detrás).',
      'Mira al lente, no a la pantalla, en tres momentos: al saludar, en tu idea clave y al cerrar.',
      'Manos visibles dentro del cuadro, acompañando lo que dices; espalda apoyada y hombros relajados.',
    ],
    bad: 'Cámara desde abajo, contraluz, mirada en la pantalla y manos fuera de cuadro.',
    good: 'Cámara a la altura de los ojos, luz frontal, mirada al lente en las frases clave y gestos que acompañan.',
    mistakes: ['Mirar todo el tiempo tu propia imagen.', 'Leer un guion en pantalla: se nota en los ojos.', 'Gestos repetitivos (tocarse la cara o el pelo).'],
    quiz: { q: 'Para que el público sienta contacto visual en una videollamada, miras…', options: ['su cara en la pantalla', 'el lente de la cámara', 'tus notas'], answer: 1,
      explain: 'Sólo mirando al lente parece que miras a los ojos de quien te ve.' },
    practice: { view: 'evaluar', scenario: 'intro', audience: true, label: 'Preséntate con la audiencia virtual', liteLabel: 'Grábate presentándote en video' },
  },
  {
    id: 'nervios', title: 'Calmar los nervios en 2 minutos', area: 'Confianza', minutes: 2,
    why: 'Los nervios no desaparecen practicando una vez; bajan con exposición gradual. Mientras tanto, puedes regularlos en el momento.',
    steps: [
      'Respira alargando la exhalación: 4 segundos inhalas y 6 exhalas, tres veces.',
      'Nombra lo que sientes como energía: «estoy activado para hacerlo bien». Reinterpretar la activación ayuda más que intentar «calmarse».',
      'Memoriza sólo tu primera frase: los primeros segundos son los más difíciles.',
      'Mira a una cara amable del público (o a la cámara) al empezar.',
    ],
    bad: 'Repetirte «no te pongas nervioso» justo antes de hablar.',
    good: 'Tres respiraciones largas, primera frase lista y «estoy con energía para esto».',
    mistakes: ['Evitar todas las situaciones que asustan: la evitación mantiene el miedo.', 'Esperar a «no tener nervios» para practicar.'],
    quiz: { q: '¿Qué ayuda más justo antes de hablar?', options: ['Decirte «tranquilo»', 'Exhalar más largo de lo que inhalas', 'Tomar un café'], answer: 1,
      explain: 'La exhalación larga activa la respuesta de calma del cuerpo en pocos ciclos.' },
    practice: { view: 'evaluar', scenario: 'passion', label: 'Habla 60 s de algo que te encanta' },
  },
  {
    id: 'sbi', title: 'Dar feedback con SBI', area: 'Liderazgo', minutes: 2,
    why: 'El feedback falla cuando suena a juicio sobre la persona. SBI lo vuelve concreto y conversable.',
    steps: ['Situación: cuándo y dónde («En la reunión del martes con el cliente…»).', 'Comportamiento: lo observable, sin adjetivos («…interrumpiste dos veces su explicación»).', 'Impacto: el efecto en ti, el equipo o el resultado («…y el cliente dejó de dar detalles»).', 'Cierra con una pregunta abierta: «¿Cómo lo viste tú?».'],
    bad: '«Eres muy impulsivo en las reuniones.»',
    good: '«En la reunión del martes interrumpiste dos veces al cliente y dejó de contarnos el problema. ¿Cómo lo viste tú?»',
    mistakes: ['Usar «siempre» o «nunca».', 'Mezclar varios temas en un mismo feedback.', 'No escuchar la respuesta.'],
    quiz: { q: '¿Cuál es un Comportamiento en SBI?', options: ['«Eres desordenado»', '«Entregaste el informe dos días tarde»', '«No te importa el equipo»'], answer: 1,
      explain: 'Un comportamiento se puede observar y verificar; un juicio no.' },
    practice: { view: 'roleplay', persona: 'colega', label: 'Roleplay con Diego, el colega que entrega tarde' },
  },
  {
    id: 'cnv', title: 'Comunicación No Violenta', area: 'Conversaciones difíciles', minutes: 3,
    why: 'En un conflicto, la otra persona se defiende de tus juicios, no de tus necesidades. La CNV separa lo que pasó de cómo te afecta y de lo que pides.',
    steps: ['Observación: el hecho, sin evaluar.', 'Sentimiento: cómo te sientes tú («me siento frustrado»), no lo que el otro «te hace sentir».', 'Necesidad: lo que es importante para ti (descanso, respeto, previsibilidad).', 'Petición: algo concreto, posible y negociable.'],
    bad: '«Nunca me avisas nada, eres un desconsiderado.»',
    good: '«Cuando me enteré el mismo día de la cena (O), me sentí descolocado (S) porque necesito organizar mi semana (N). ¿Podrías avisarme con dos días de anticipación? (P)»',
    mistakes: ['Disfrazar juicios de sentimientos («siento que eres injusto»).', 'Peticiones vagas («que cambies»).'],
    quiz: { q: '¿Cuál es una petición en CNV?', options: ['«Que seas más considerado»', '«¿Me avisas con dos días de anticipación?»', '«Que dejes de hacer eso»'], answer: 1,
      explain: 'La petición es concreta y la otra persona puede responder que sí o proponer otra cosa.' },
    practice: { view: 'evaluar', scenario: 'family', label: 'Practica poner un límite con un familiar' },
  },
  {
    id: 'escucha', title: 'Escucha activa', area: 'Conversaciones difíciles', minutes: 2,
    why: 'La gente se abre cuando se siente entendida. Escuchar bien se nota: en lo que repites, en lo que preguntas y en lo que no interrumpes.',
    steps: [
      'Parafrasea: «O sea que lo que más te preocupa es…».',
      'Nombra la emoción que observas: «Parece que esto te tiene molesto».',
      'Pregunta abierto: «¿Qué sería una buena solución para ti?».',
      'Espera dos segundos antes de responder: muchas veces la otra persona agrega lo más importante.',
    ],
    bad: '«Sí, sí, ya entendí, pero el problema es que…»',
    good: '«Entiendo: es la segunda vez que pasa y eso le hizo perder confianza. ¿Qué necesitaría ver para quedarse tranquila?»',
    mistakes: ['Preparar tu respuesta mientras el otro habla.', 'Pasar directo a la solución sin validar.', 'Preguntas cerradas que se responden con sí o no.'],
    quiz: { q: '¿Qué conviene hacer antes de proponer una solución a alguien molesto?', options: ['Explicar por qué no fue tu culpa', 'Reconocer lo que siente y parafrasear su problema', 'Cambiar de tema'], answer: 1,
      explain: 'Validar primero baja la tensión; con la emoción reconocida, la persona puede escuchar tu propuesta.' },
    practice: { view: 'roleplay', persona: 'cliente', label: 'Roleplay con Patricia, la clienta molesta' },
  },
  {
    id: 'historia', title: 'Contar una historia en 60 segundos', area: 'Público', minutes: 2,
    why: 'Las historias se recuerdan mucho mejor que los datos sueltos. Una estructura simple basta para contar una bien.',
    steps: ['Había una vez… (personaje y lugar en una frase).', 'Todos los días… (la normalidad).', 'Hasta que un día… (el problema o cambio).', 'Por eso… (lo que hicieron) y desde entonces… (el resultado o la lección).'],
    bad: '«Nuestra empresa tiene valores de innovación y excelencia.»',
    good: '«Ana atendía 40 llamadas al día. Todos los días repetía las mismas respuestas. Hasta que un día anotó las diez preguntas más frecuentes y armó una guía. Desde entonces el equipo atiende el doble con menos estrés.»',
    mistakes: ['Demasiados personajes o detalles.', 'Olvidar decir qué cambió.', 'Contar la moraleja al principio.'],
    quiz: { q: '¿Qué parte convierte una anécdota en historia?', options: ['Muchos detalles', 'El cambio («hasta que un día…»)', 'Un final feliz'], answer: 1,
      explain: 'Sin un cambio no hay tensión ni aprendizaje; es sólo una descripción.' },
    practice: { view: 'evaluar', scenario: 'toast', label: 'Haz un brindis con una anécdota' },
  },
  {
    id: 'mitos', title: 'Lenguaje corporal: mitos y evidencia', area: 'Lenguaje corporal', minutes: 3,
    why: 'Mucho de lo que circula sobre lenguaje corporal es mito. Conocer la evidencia te ahorra trucos inútiles y te enfoca en lo que sí funciona.',
    steps: [
      'Mito: «el 93% de la comunicación es no verbal». Ese estudio era sobre mensajes ambiguos de sentimientos, no sobre comunicar en general.',
      'Mito: «las posturas de poder cambian tus hormonas». Ese efecto no se replicó; una postura abierta sí cambia cómo te perciben.',
      'Mito: «se detecta la mentira por los gestos». La investigación muestra que casi nadie lo logra mejor que el azar.',
      'Lo que sí funciona: coherencia entre lo que dices, tu voz y tu cuerpo; mirada en los momentos clave; gestos que acompañan el contenido.',
    ],
    bad: 'Cruzar los brazos «para parecer seguro» mientras tu voz dice otra cosa.',
    good: 'Mensaje claro, voz que enfatiza lo importante y gestos que lo ilustran: todo dice lo mismo.',
    mistakes: ['Ensayar gestos de manual que no son tuyos.', 'Interpretar un gesto aislado como prueba de algo.'],
    quiz: { q: '¿Qué tiene más evidencia a su favor?', options: ['Postura de poder 2 minutos antes', 'Coherencia entre palabras, voz y cuerpo', 'Imitar los gestos del interlocutor'], answer: 1,
      explain: 'La coherencia multimodal es lo que hace creíble un mensaje; los «trucos» aislados tienen poca o ninguna evidencia.' },
    practice: { view: 'evaluar', scenario: 'opening', audience: true, label: 'Apertura de una charla con audiencia virtual', liteLabel: 'Grábate en video con la apertura de una charla' },
  },
];

// Lección sugerida para la métrica que más falla (ver Progreso → foco recurrente).
export const LESSON_FOR_METRIC = {
  fillers: 'pausa', hums: 'pausa', pauses: 'prep', wpm: 'voz', pitch: 'voz', volume: 'voz', speech: 'prep',
  hedges: 'bluf', length: 'star', gaze: 'presencia', face: 'presencia', smile: 'presencia', head: 'presencia', duration: 'bluf', variety: 'prep', structure: 'prep',
};

// ---------------------------------------------------------------- interfaz compartida
// Lista agrupada por área, con ✓ en las lecciones completadas.
export function lessonListHTML(done = {}) {
  const areas = [...new Set(LESSONS.map(l => l.area))];
  return areas.map(a => `<h3>${esc(a)}</h3><div class="lesson-list">${LESSONS.filter(l => l.area === a).map(l =>
    `<button class="lesson-item" data-lesson="${l.id}"><span>${done[l.id] ? '✅' : '📘'}</span><span><strong>${esc(l.title)}</strong><small>${l.minutes} min</small></span></button>`).join('')}</div>`).join('');
}

// De dónde viene cada método (autoridad visible: los usuarios confían más en técnicas con autor y evidencia).
export const LESSON_SOURCES = {
  star: 'Método STAR de la entrevista por competencias, popularizado por Development Dimensions International (DDI).',
  prep: 'PREP (punto, razón, ejemplo, punto): estructura clásica de la oratoria improvisada.',
  bluf: 'BLUF, norma de redacción del Ejército de EE. UU., y el principio de la pirámide de Barbara Minto (McKinsey).',
  pausa: 'El rol de «contador de muletillas» (Ah-Counter) de las reuniones de Toastmasters.',
  voz: 'Entrenamiento vocal de Kristin Linklater («Freeing the Natural Voice», 1976) y la práctica de actores y locutores.',
  presencia: 'Guías de presencia en video de la práctica profesional; lo que no tiene evidencia se trata en «Lenguaje corporal: mitos y evidencia».',
  nervios: 'Reinterpretar la activación como entusiasmo (Alison Wood Brooks, Harvard, 2014) y respiración con exhalación larga (Balban et al., Stanford, 2023).',
  sbi: 'Modelo SBI (situación, conducta, impacto) del Center for Creative Leadership.',
  cnv: 'Comunicación No Violenta de Marshall Rosenberg.',
  escucha: 'Escucha activa de Carl Rogers y Richard Farson («Active Listening», 1957).',
  historia: 'La «espina de la historia» (Story Spine) de Kenn Adams, usada en improvisación y por guionistas.',
  mitos: 'Mehrabian (1971): la regla 7-38-55 sólo vale para sentimientos expresados con señales contradictorias; las «posturas de poder» no se replicaron en sus efectos hormonales (Ranehill et al., 2015).',
};

// lite: versión sin gimnasio ni audiencia virtual (la publicada), con la etiqueta alternativa de la práctica.
export function lessonHTML(l, done = false, lite = false) {
  return `<article class="lesson" data-id="${l.id}">
    <div class="note">${esc(l.area)} · ${l.minutes} min de lectura</div>
    <h2 style="font-size:1.3rem;margin:4px 0 8px">${esc(l.title)}</h2>
    <p class="lead">${esc(l.why)}</p>
    <h3>Cómo hacerlo</h3>
    <ol>${l.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>
    ${LESSON_SOURCES[l.id] ? `<p class="note">📚 Base: ${esc(LESSON_SOURCES[l.id])}</p>` : ''}
    <div class="fb">
      <div><h3 style="color:var(--bad)">✗ Así no</h3>${esc(l.bad)}</div>
      <div><h3 style="color:var(--good)">✓ Así sí</h3>${esc(l.good)}</div>
    </div>
    <h3>Errores comunes</h3>
    <ul>${l.mistakes.map(m => `<li>${esc(m)}</li>`).join('')}</ul>
    <h3>Repaso rápido</h3>
    <p><strong>${esc(l.quiz.q)}</strong></p>
    <div class="quiz" role="group" aria-label="Opciones">${l.quiz.options.map((o, i) => `<button type="button" data-opt="${i}">${esc(o)}</button>`).join('')}</div>
    <p class="note quiz-out" aria-live="polite">${done ? '✅ Ya completaste esta lección.' : ''}</p>
    <div class="btns"><button type="button" class="cta" data-practice="${l.id}">▶ Practicar ahora: ${esc(lite && l.practice.liteLabel || l.practice.label)}</button><button type="button" data-back>Volver a las lecciones</button></div>
  </article>`;
}

// Responde al repaso: marca la opción, explica y avisa cuando se acierta (onCorrect).
export function bindQuiz(container, onCorrect) {
  container.addEventListener('click', (e) => {
    const b = e.target.closest('.quiz button'); if (!b) return;
    const art = b.closest('.lesson'), l = LESSONS.find(x => x.id === art.dataset.id), i = +b.dataset.opt;
    art.querySelectorAll('.quiz button').forEach(x => x.classList.remove('right', 'wrong'));
    b.classList.add(i === l.quiz.answer ? 'right' : 'wrong');
    art.querySelector('.quiz-out').textContent = (i === l.quiz.answer ? '✅ ¡Correcto! ' : '✗ No exactamente. ') + l.quiz.explain;
    if (i === l.quiz.answer) onCorrect(l);
  });
}
