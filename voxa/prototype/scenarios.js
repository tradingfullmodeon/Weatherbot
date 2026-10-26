// Biblioteca de escenarios del evaluador, agrupados por ambiente de comunicación.
// Cada uno define consigna, método sugerido, duración y pesos por dimensión del puntaje.

export const IMPRO_TOPICS = [
  '¿Qué cambiarías de tu ciudad?', 'Un error que te enseñó algo', 'Defiende tu comida favorita',
  'Si tuvieras un día libre extra a la semana', 'La mejor decisión que has tomado',
  'Convence al público de leer más', '¿Trabajo remoto o presencial?', 'Un viaje que te cambió',
  'La habilidad que todos deberían aprender', 'Qué harías con un año sabático',
];

const W = {
  balanced: { voz: .35, lenguaje: .3, presencia: .35 },
  content: { voz: .3, lenguaje: .45, presencia: .25 },
  delivery: { voz: .4, lenguaje: .25, presencia: .35 },
  warm: { voz: .35, lenguaje: .25, presencia: .4 },
};

export const SCENARIOS = [
  // Confianza: baja exigencia, para los primeros peldaños de la escalera.
  { id: 'passion', group: 'Confianza', name: 'Habla de algo que te encanta', seconds: 60, method: 'Libre',
    prompt: 'Elige un hobby, una serie o un lugar que te encante y cuéntalo como si se lo recomendaras a un amigo.', weights: W.warm },
  { id: 'intro', group: 'Confianza', name: 'Preséntate en 60 segundos', seconds: 60, method: 'PREP',
    prompt: 'Quién eres, qué haces y qué te apasiona. Cierra con una frase memorable.', weights: W.balanced },
  { id: 'impro', group: 'Confianza', name: 'Improvisación: tema sorpresa', seconds: 60, method: 'PREP',
    prompt: null, weights: { voz: .4, lenguaje: .3, presencia: .3 } },
  { id: 'say-no', group: 'Confianza', name: 'Decir «no» con firmeza y amabilidad', seconds: 45, method: 'Asertividad (DESC)',
    prompt: 'Alguien te pide un favor que no puedes asumir. Agradece, di que no con claridad, explica en una frase y ofrece una alternativa si la hay.', weights: W.content },

  // Profesional
  { id: 'interview', group: 'Profesional', name: 'Entrevista: «Cuéntame de un logro»', seconds: 120, method: 'STAR',
    prompt: 'Responde con el método STAR: Situación, Tarea, Acción y Resultado (con un número si puedes).', weights: { voz: .3, lenguaje: .4, presencia: .3 } },
  { id: 'weakness', group: 'Profesional', name: 'Entrevista: «¿Cuál es tu mayor debilidad?»', seconds: 90, method: 'Honestidad + plan',
    prompt: 'Nombra una debilidad real (no un halago disfrazado), da un ejemplo y explica qué estás haciendo para mejorarla.', weights: W.content },
  { id: 'meeting', group: 'Profesional', name: 'Actualización ejecutiva (BLUF)', seconds: 90, method: 'BLUF / Pirámide de Minto',
    prompt: 'Da el estado de un proyecto a tu jefatura: conclusión primero, luego 3 puntos clave y un pedido concreto.', weights: W.content },
  { id: 'raise', group: 'Profesional', name: 'Pedir un aumento o un ascenso', seconds: 90, method: 'BLUF + evidencia',
    prompt: 'Di qué pides en la primera frase, respáldalo con 2 o 3 logros medibles y cierra proponiendo un siguiente paso con fecha.', weights: W.content },
  { id: 'pitch', group: 'Profesional', name: 'Pitch de proyecto (2 min)', seconds: 120, method: 'Monroe / SCQA',
    prompt: 'Problema, solución, por qué ahora, por qué tú y qué pides. Usa una historia breve al inicio.', weights: { voz: .35, lenguaje: .35, presencia: .3 } },
  { id: 'elevator', group: 'Profesional', name: 'Elevator pitch de networking (30 s)', seconds: 30, method: 'Gancho + valor + pregunta',
    prompt: 'Qué problema resuelves y para quién, un dato o ejemplo, y termina con una pregunta que abra la conversación.', weights: W.balanced },

  // Liderazgo
  { id: 'feedback', group: 'Liderazgo', name: 'Feedback difícil a un colega', seconds: 90, method: 'SBI + CNV',
    prompt: 'Usa SBI: Situación, Comportamiento observable, Impacto; termina con una pregunta abierta.', weights: W.content },
  { id: 'change', group: 'Liderazgo', name: 'Anunciar un cambio al equipo', seconds: 120, method: 'Qué–Por qué–Qué significa para ti',
    prompt: 'Comunica un cambio (de proceso, estructura o prioridades): qué cambia, por qué, qué significa para cada persona y cómo vas a apoyarlas.', weights: W.content },
  { id: 'recognition', group: 'Liderazgo', name: 'Reconocer el logro de alguien', seconds: 45, method: 'Específico + impacto',
    prompt: 'Felicita a alguien de tu equipo: qué hizo exactamente, qué impacto tuvo y por qué importa.', weights: W.warm },

  // Público
  { id: 'opening', group: 'Público', name: 'Apertura de una charla (90 s)', seconds: 90, method: 'Gancho + promesa + mapa',
    prompt: 'Empieza con una pregunta, un dato o una historia; promete qué se llevará el público y anticipa los 3 puntos de tu charla.', weights: W.delivery },
  { id: 'qa', group: 'Público', name: 'Responder una pregunta difícil del público', seconds: 60, method: 'Agradecer–Reformular–Responder–Puente',
    prompt: 'Alguien cuestiona tu propuesta en público. Agradece, reformula la pregunta, responde con un dato y vuelve a tu mensaje clave.', weights: W.content },

  // Social
  { id: 'toast', group: 'Social', name: 'Brindis en una celebración', seconds: 60, method: 'Anécdota + valor + brindis',
    prompt: 'Brinda por alguien: una anécdota breve que lo retrate, una cualidad que admiras y una frase final para levantar la copa.', weights: W.warm },
  { id: 'wedding', group: 'Social', name: 'Discurso de boda o de padrino', seconds: 120, method: 'Historia (Story Spine)',
    prompt: 'Cuenta cómo conociste a la pareja o a uno de ellos, un momento que los define, un deseo para el futuro y un brindis.', weights: W.warm },
  { id: 'new-group', group: 'Social', name: 'Presentarte en un grupo nuevo', seconds: 45, method: 'Quién–Qué–Gancho',
    prompt: 'Llegas a un curso, club o equipo nuevo. Di tu nombre, algo de ti relacionado con el grupo y un detalle curioso para que te recuerden.', weights: W.warm },
  { id: 'apology', group: 'Social', name: 'Pedir disculpas de verdad', seconds: 60, method: 'Reconocer–Impacto–Reparar',
    prompt: 'Reconoce lo que hiciste sin justificarte, nombra el impacto en la otra persona, di qué harás distinto y pregunta cómo puedes reparar.', weights: W.content },
  { id: 'family', group: 'Social', name: 'Poner un límite con un familiar', seconds: 60, method: 'CNV',
    prompt: 'Observación sin juicio, cómo te sientes, qué necesitas y una petición concreta. Mantén un tono cálido y firme.', weights: W.content },

  // Digital
  { id: 'reel', group: 'Digital', name: 'Video corto para redes (45 s)', seconds: 45, method: 'Gancho en 3 s + 1 idea + llamado',
    prompt: 'Abre con un gancho en los primeros 3 segundos, explica una sola idea útil con un ejemplo y termina con un llamado a la acción.', weights: W.delivery },
  { id: 'voicenote', group: 'Digital', name: 'Mensaje de voz profesional (30 s)', seconds: 30, method: 'BLUF',
    prompt: 'Deja un audio a un cliente o colega: el motivo en la primera frase, el detalle mínimo y qué necesitas que haga y cuándo.', weights: W.content },
];

export const GROUPS = [...new Set(SCENARIOS.map(s => s.group))];
