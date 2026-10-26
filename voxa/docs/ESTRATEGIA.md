# VOXA — Plataforma de entrenamiento acelerado en comunicación

> **Promesa:** que cualquier persona mejore de forma medible cómo habla, escucha, se mueve y persuade, en cualquier contexto (personal, profesional, público, digital), en el menor tiempo posible, con práctica guiada por IA y evaluación objetiva por cámara y micrófono.

---

## Índice

1. [Problema y oportunidad](#1-problema-y-oportunidad)
2. [Benchmark de la industria](#2-benchmark-de-la-industria)
3. [Modelos y metodologías de comunicación](#3-modelos-y-metodologías-de-comunicación)
4. [Ciencia del aprendizaje aplicada](#4-ciencia-del-aprendizaje-aplicada)
5. [Lenguaje no verbal: lo que sí y lo que no](#5-lenguaje-no-verbal-lo-que-sí-y-lo-que-no)
6. [Modelo de competencias y niveles](#6-modelo-de-competencias-y-niveles)
7. [Producto: experiencia y canales de aprendizaje](#7-producto-experiencia-y-canales-de-aprendizaje)
8. [Motor de evaluación (cámara + micrófono)](#8-motor-de-evaluación-cámara--micrófono)
9. [Diferenciales competitivos](#9-diferenciales-competitivos)
10. [Arquitectura tecnológica](#10-arquitectura-tecnológica)
11. [Privacidad, ética y regulación](#11-privacidad-ética-y-regulación)
12. [Programa "Sprint 30 días"](#12-programa-sprint-30-días)
13. [Modelo de negocio](#13-modelo-de-negocio)
14. [Roadmap](#14-roadmap)
15. [KPIs](#15-kpis)
16. [Riesgos y mitigaciones](#16-riesgos-y-mitigaciones)

---

## 1. Problema y oportunidad

- La comunicación aparece sistemáticamente entre las habilidades más demandadas por empleadores (informes del World Economic Forum, LinkedIn y encuestas de NACE la sitúan junto a liderazgo, pensamiento analítico y resiliencia).
- El miedo a hablar en público es uno de los temores sociales más comunes; buena parte de las personas lo vive como una barrera de carrera.
- **El problema real no es la falta de contenido** (hay miles de cursos y videos), sino la **falta de práctica deliberada con feedback inmediato y objetivo**. Un curso enseña *qué* hacer; casi nadie te dice *cómo lo hiciste tú* hoy, ni te hace repetir hasta automatizarlo.
- La IA (reconocimiento de voz, visión por computadora, modelos de lenguaje y voz conversacional en tiempo real) permite por primera vez dar **feedback de coach a costo de software**, 24/7, en privado y sin juicio social.
- Hueco de mercado: las herramientas líderes están pensadas primero en inglés. **Español nativo (LatAm + España), con muletillas, ritmos y contextos culturales propios**, está mal servido.

---

## 2. Benchmark de la industria

> Las funcionalidades y precios cambian con frecuencia; esta tabla describe el posicionamiento general de cada jugador, no una auditoría de precios.

### 2.1 Coaches de oratoria con IA

| Plataforma | Qué hace bien | Brecha / oportunidad |
|---|---|---|
| **Yoodli** | Análisis de grabaciones y reuniones (ritmo, muletillas, palabras débiles), roleplays con IA, versión empresarial para ventas/onboarding. | Foco inglés; feedback no verbal limitado; poca ruta de progresión estructurada para principiantes. |
| **Orai** | App móvil, lecciones cortas, análisis de muletillas, energía y claridad. | Contenido genérico; poca simulación de contextos reales. |
| **Poised** | Feedback en vivo y privado durante videollamadas (Zoom/Meet/Teams). | Sólo contexto reunión; no enseña, sólo mide. |
| **Speeko** | Ejercicios de voz, respiración y entrenamiento diario tipo "gimnasio". | Sin video; no aborda conversaciones difíciles ni liderazgo. |
| **Microsoft Speaker Coach** (PowerPoint/Teams) | Integrado en flujo de trabajo; ritmo, muletillas, lectura de diapositivas, lenguaje inclusivo. | Básico; sin currículo ni progresión. |
| **Google Interview Warmup** | Práctica gratuita de entrevistas con transcripción y análisis de términos. | Sólo entrevistas; sin evaluación de voz/cuerpo. |
| **Ummo / LikeSo / Speech** | Contadores de muletillas, ritmo. | Funcionalidad puntual, fácilmente replicable. |

### 2.2 Simulación inmersiva (VR / avatares)

| Plataforma | Qué hace bien | Brecha |
|---|---|---|
| **VirtualSpeech** | Salas VR/escritorio con audiencias virtuales, cursos acreditados, roleplays IA. | Hardware VR crea fricción; experiencia más formal que diaria. |
| **Bodyswaps** | Simulaciones de habilidades blandas en primera persona con reflexión guiada. | Escenarios guionizados, B2B. |
| **Mursion** | Simulaciones con avatares operados por humanos + IA (liderazgo, DEI, servicio). | Caro, agenda; no escala a B2C. |
| **Second Nature / Hyperbound / Quantified** | Roleplay de ventas con IA y scoring contra metodologías. | Vertical ventas; no desarrolla confianza personal. |

### 2.3 Coaching humano y plataformas de desarrollo

| Plataforma | Qué hace bien | Brecha |
|---|---|---|
| **BetterUp / CoachHub / Ezra** | Coaching 1:1 profesional, medición de bienestar y liderazgo. | Caro; sin práctica entre sesiones ni datos objetivos de desempeño comunicativo. |
| **Toastmasters (Pathways)** | Comunidad, práctica frente a público real, roles (evaluador, timer, "ah-counter"). | Lento (reuniones semanales), feedback subjetivo, poco digital. |
| **Dale Carnegie / Duarte / Ted Masterclass** | Metodologías probadas, marca. | Formato curso/taller, poco seguimiento posterior. |

### 2.4 E-learning y contenido

| Plataforma | Qué hace bien | Brecha |
|---|---|---|
| **LinkedIn Learning / Coursera / Udemy / Domestika / Platzi / Crehana** | Volumen de cursos, certificados, LatAm (Platzi, Crehana, Domestika). | Pasivo: ver video ≠ cambiar conducta. Tasas de finalización bajas. |
| **MasterClass** | Producción premium, expertos célebres. | Inspiración, no entrenamiento. |
| **Blinkist / Headway** | Microcontenido. | Sin práctica. |

### 2.5 Referentes de mecánica de producto (fuera de la categoría)

| Referente | Qué copiar |
|---|---|
| **Duolingo** | Rachas, ligas, sesiones de 5–10 min, notificaciones con personalidad, ruta visual de progreso, adaptatividad. |
| **ELSA Speak / Speak** | Feedback fonético instantáneo; conversación con IA por voz como núcleo del producto. |
| **Strava / Whoop** | "Métricas personales" y tendencias; comparar contigo mismo; comunidad. |
| **Gong / Chorus** | Análisis de llamadas reales: ratio habla/escucha, monólogos, preguntas, interrupciones. |
| **Headspace / Calm** | Rutinas guiadas de respiración/ansiedad antes de un evento. |

> **Benchmark ampliado:** el análisis exhaustivo por región (Norteamérica, Europa, Asia y mundo hispanohablante), las necesidades de los usuarios y las 23 mejoras diferenciadoras están en [`BENCHMARK.md`](BENCHMARK.md).

### 2.6 Conclusión del benchmark

Nadie combina en un solo producto, **en español nativo**:

1. **Currículo progresivo** por niveles y contextos (no sólo un medidor).
2. **Evaluación multimodal objetiva** (voz + lenguaje + cuerpo) con explicaciones accionables.
3. **Simulación conversacional con IA** de escenarios reales con personajes que reaccionan.
4. **Trabajo de confianza/ansiedad** basado en evidencia (exposición gradual, reestructuración cognitiva).
5. **Puente al mundo real** (análisis post-reunión, preparación de eventos concretos, coach humano cuando aporta valor).

Ese es el espacio de VOXA.

---

## 3. Modelos y metodologías de comunicación

VOXA no inventa teoría: **operacionaliza** marcos probados como ejercicios y rúbricas medibles.

### 3.1 Fundamentos

| Modelo | Idea clave | Cómo se usa en VOXA |
|---|---|---|
| **Retórica aristotélica** (ethos, pathos, logos) | Credibilidad, emoción, lógica. | Rúbrica de persuasión: ¿te presentaste con credibilidad? ¿hubo historia? ¿hubo datos? |
| **Shannon–Weaver / Schramm** | Emisor, canal, ruido, receptor, retroalimentación. | Diagnóstico de "ruido": muletillas, volumen, jerga, distracciones visuales. |
| **Axiomas de Watzlawick** | "Es imposible no comunicar"; contenido vs relación. | Módulo de conciencia: lo que tu cuerpo dice cuando callas. |
| **Cuatro lados de Schulz von Thun** | Hecho, autorrevelación, relación, apelación. | Reescritura de mensajes difíciles en 4 capas. |
| **Ventana de Johari** | Áreas ciega/oculta. | La grabación + feedback de pares reduce el área ciega. |
| **Análisis transaccional** (Berne) | Estados Padre/Adulto/Niño. | Conversaciones difíciles: detectar y salir de juegos. |

### 3.2 Estructura del mensaje

| Método | Uso |
|---|---|
| **Principio de la Pirámide (Minto)** / **BLUF** | Conclusión primero — reportes a ejecutivos. |
| **SCQA** (Situación–Complicación–Pregunta–Respuesta) | Presentaciones y correos de propuesta. |
| **PREP** (Punto–Razón–Ejemplo–Punto) | Respuestas improvisadas de 60 s. |
| **STAR** (Situación–Tarea–Acción–Resultado) | Entrevistas de trabajo por competencias. |
| **Secuencia motivada de Monroe** | Discursos persuasivos y pitches. |
| **Regla de 3, Story Spine (Pixar), viaje del héroe** | Storytelling. |
| **SUCCESs (Made to Stick, Heath)** | Mensajes memorables: simple, inesperado, concreto, creíble, emocional, historia. |
| **Elevator pitch / Pitch de 3 minutos** | Emprendimiento y networking. |

### 3.3 Relaciones, conflicto y liderazgo

| Método | Uso |
|---|---|
| **Comunicación No Violenta (Rosenberg)**: observación, sentimiento, necesidad, petición | Conflictos y pedidos. |
| **Conversaciones Cruciales** (Patterson et al.) | Diálogo cuando hay riesgo, emociones y opiniones opuestas. |
| **Radical Candor** (Kim Scott) | Feedback a equipos: cuidar personalmente + desafiar directamente. |
| **SBI / SBII** (Center for Creative Leadership) | Feedback: Situación–Comportamiento–Impacto (–Intención). |
| **Escucha activa** (Carl Rogers): parafraseo, validación, preguntas abiertas | Entrenamiento con IA que mide ratio habla/escucha y calidad de preguntas. |
| **Negociación de Harvard** (*Getting to Yes*): intereses, opciones, criterios, MAAN | Negociación. |
| **Empatía táctica** (Chris Voss): etiquetado, espejo, preguntas calibradas | Negociación y ventas. |
| **Estilos sociales (Merrill–Reid) / DISC** | Adaptar el mensaje al interlocutor (usado como heurística, no como diagnóstico de personalidad). |
| **Comunicación intercultural** (Hall: alto/bajo contexto; Erin Meyer: *The Culture Map*) | Equipos regionales y globales. |

### 3.4 Voz y escena

| Método | Uso |
|---|---|
| **Respiración diafragmática, Linklater, técnicas de actores** | Proyección, resonancia, apoyo. |
| **Improvisación** ("Sí, y…") | Espontaneidad y escucha. |
| **Guía TED / Chris Anderson** (una idea central, "regalo" al público) | Charlas. |
| **Toastmasters** (roles de evaluador, "ah-counter", timer) | Gamificación social y práctica en grupo. |

### 3.5 Confianza y ansiedad (base clínica, uso no clínico)

| Método | Uso |
|---|---|
| **TCC para ansiedad social**: identificar pensamientos automáticos, reestructurar, experimentos conductuales | Diario de pensamientos antes/después de cada práctica. |
| **Exposición gradual** (jerarquía de miedos) | "Escalera de confianza": hablar solo → audio → video → avatar → pares → público real. |
| **Autoeficacia (Bandura)**: logros de dominio, modelado vicario, persuasión verbal, estado fisiológico | Victorias pequeñas diseñadas, ver a otros como tú, refuerzo, respiración. |
| **Reevaluación de la ansiedad como activación** ("estoy entusiasmado"; Brooks, 2014) | Rutina pre-evento de 2 min. |
| **Respiración cuadrada / suspiro fisiológico** | Regulación rápida antes de hablar. |

---

## 4. Ciencia del aprendizaje aplicada

El objetivo "en el menor tiempo posible" exige diseño basado en evidencia:

| Principio | Implementación en VOXA |
|---|---|
| **Práctica deliberada** (Ericsson) | Cada sesión ataca **una** sub-habilidad con meta medible ("< 3 muletillas/min"), feedback inmediato y repetición. |
| **Feedback de alta calidad** (Hattie: entre los factores de mayor efecto) | Feedback específico, oportuno, sobre la tarea, con "siguiente paso" concreto. |
| **Video self-modeling / auto-observación** | Replay con marcas de tiempo: "aquí perdiste contacto visual". |
| **Repetición espaciada + práctica de recuperación** | Revisitar habilidades según curva de olvido; quizzes de 30 s. |
| **Microaprendizaje** | Lecciones de 2–5 min + práctica de 1–3 min. |
| **Ciclo experiencial de Kolb** | Experiencia → reflexión → conceptualización → nueva práctica. |
| **Zona de desarrollo próximo / aprendizaje adaptativo** | Dificultad ajustada por un modelo tipo Elo/IRT por habilidad. |
| **Modelo de Fogg (B = MAP) / Tiny Habits** | Sesiones mínimas de 3 min, disparadores contextuales ("tienes una reunión en 30 min, ¿calentamos?"). |
| **Intenciones de implementación / WOOP** | Antes de un evento real: deseo, resultado, obstáculo, plan. |
| **Interleaving** | Mezclar contextos (entrevista, reunión, pitch) para transferir. |
| **70-20-10** | 70% práctica real (misiones en el mundo), 20% social (pares/coach), 10% contenido. |
| **Kirkpatrick (4 niveles)** | Medir reacción, aprendizaje, conducta y resultados (clave para B2B). |
| **Modelo Dreyfus** | Niveles novato → experto con criterios observables. |
| **Gamificación (Octalysis)** | Progreso, logro, social, desbloqueos; evitando la ansiedad de ranking público por defecto. |

**Regla de diseño:** *10% mirar, 90% hacer.* Ningún video sin una práctica asociada.

---

## 5. Lenguaje no verbal: lo que sí y lo que no

Como plataforma seria, VOXA separa evidencia de mito:

| Afirmación popular | Realidad | Decisión de producto |
|---|---|---|
| "El 93% de la comunicación es no verbal" (Mehrabian) | Mal citado: el estudio se refería a mensajes ambiguos sobre sentimientos, no a la comunicación en general. | Nunca usar esa cifra. Enseñar **coherencia** entre palabra, voz y cuerpo. |
| "Posturas de poder suben testosterona" (Cuddy) | Efectos hormonales no replicados; efecto en la sensación subjetiva de poder es pequeño y debatido. | Usar postura abierta por cómo **te perciben** y por comodidad, no como "truco hormonal". |
| "Las microexpresiones revelan mentiras" | Detectar mentiras por el cuerpo tiene bajo desempeño en investigación. | **No** se ofrece "detector de mentiras" ni lectura de mentes. |
| "La IA puede leer tus emociones" | Inferir estados internos desde la cara es científicamente frágil y está **prohibido en contextos laborales y educativos en la UE** (AI Act, art. 5). | VOXA mide **conductas observables** (mirada a cámara, sonrisa, movimiento de cabeza, gesto, volumen, ritmo), nunca "emociones". |

**Lo que sí está bien sustentado y se entrena:**
- Contacto visual adecuado (en video: mirar a la cámara en momentos clave).
- Expresividad facial y sonrisa genuina en saludos y cierres.
- Gestos ilustradores dentro del "marco" (entre cintura y hombros) que acompañan el contenido.
- Postura estable; evitar balanceo y gestos autoadaptadores repetidos (tocarse cara/pelo).
- Prosodia: variación de tono, pausas intencionales, volumen suficiente, ritmo moderado.
- Coherencia multimodal: el contenido, la voz y el cuerpo dicen lo mismo.

---

## 6. Modelo de competencias y niveles

### 6.1 Siete ambientes de comunicación

1. **Intrapersonal** — diálogo interno, confianza, manejo de ansiedad.
2. **Interpersonal 1:1** — conversaciones cotidianas, escucha, empatía, conflicto, citas, familia.
3. **Profesional** — entrevistas, reuniones, reportes a jefatura, feedback, negociación, ventas, atención a clientes.
4. **Grupal / equipos** — facilitación, debate, tomar la palabra, manejar interrupciones.
5. **Público / escénico** — presentaciones, charlas, pitches, brindis, clases.
6. **Digital** — videollamadas, mensajes, correos, LinkedIn, video corto (TikTok/Reels), podcasts.
7. **Liderazgo / organizacional** — visión, cambio, crisis, comunicación ejecutiva, medios.

(+ **Intercultural** como capa transversal.)

### 6.2 Cuatro dimensiones evaluadas

| Dimensión | Subhabilidades medibles |
|---|---|
| **Voz (paraverbal)** | Ritmo (ppm), pausas, volumen, variación de tono, claridad/dicción, muletillas. |
| **Lenguaje (verbal)** | Estructura, claridad, concisión, vocabulario, asertividad (sin atenuadores excesivos), preguntas, storytelling. |
| **Cuerpo (no verbal)** | Mirada, expresión, postura, gestos, encuadre en video. |
| **Relacional / estratégica** | Escucha, empatía, adaptación a la audiencia, manejo de objeciones, persuasión. |

### 6.3 Niveles (inspirado en Dreyfus)

| Nivel | Descriptor | Ejemplo de criterio de salida |
|---|---|---|
| 1. Explorador | Conciencia de hábitos propios. | Completa diagnóstico y 5 sesiones. |
| 2. Practicante | Controla 1–2 hábitos en práctica guiada. | < 4 muletillas/min en 3 sesiones seguidas. |
| 3. Competente | Estructura y entrega sólidas en escenarios conocidos. | Puntaje ≥ 70 en 3 contextos distintos. |
| 4. Hábil | Se adapta en tiempo real a interlocutores difíciles. | Supera roleplays de dificultad alta (objeciones, interrupciones). |
| 5. Referente | Inspira y enseña a otros. | Evalúa pares con precisión; misiones reales verificadas. |

---

## 7. Producto: experiencia y canales de aprendizaje

### 7.1 Flujo principal

```
Diagnóstico (5 min, video) → Perfil de comunicación + objetivo → Ruta personalizada
     ↓
Sesión diaria (7 min): 1 micro-lección → 1–3 prácticas grabadas → feedback → reintento
     ↓
Misión del mundo real ("haz 1 pregunta abierta en tu reunión de hoy") → reflexión
     ↓
Reto semanal (roleplay largo o presentación) → reporte de progreso → ajuste de ruta
```

### 7.2 Canales y formatos

| Canal | Descripción |
|---|---|
| **Micro-lecciones en video** (2–4 min) | Expertos y creadores hispanohablantes; cada una termina en un ejercicio. |
| **Cursos por objetivo** | "Entrevista en 7 días", "Tu primera presentación", "Liderar 1:1s", "Negociar tu sueldo", "Hablar sin miedo". |
| **Gimnasio de voz** | Calentamientos, respiración, trabalenguas, articulación, proyección (con medición en vivo). |
| **Evaluación por cámara y micrófono** | Núcleo del producto: graba, mide, explica, compara contigo mismo. |
| **Roleplay con IA por voz** | Personajes (jefa exigente, cliente molesto, reclutador, inversionista escéptico, pareja, hijo adolescente) con dificultad ajustable y "rebobinar para reintentar". |
| **Audiencia virtual** | Público con avatares que reacciona (atención/distracción) según tu entrega; modo VR opcional (WebXR / Meta Quest). |
| **Improvisación rápida** | "Tema sorpresa, 60 s, estructura PREP." |
| **Preparación de evento real** | Subes tus diapositivas o guion → la IA genera preguntas difíciles probables → ensayas → checklist y rutina de calma antes de salir. |
| **Copiloto de reuniones (opt-in)** | Integración con Zoom/Meet/Teams: reporte privado post-reunión (ratio habla/escucha, interrupciones, monólogos, preguntas). |
| **Escritura** | Correos, mensajes difíciles, posts de LinkedIn: reescritura guiada con CNV/BLUF. |
| **Comunidad y pares** | Salas de práctica por nivel, evaluación entre pares con rúbrica (roles Toastmasters digitales). |
| **Coach humano (marketplace)** | Sesiones 1:1 o en grupo; el coach ve los datos y grabaciones que el usuario comparte. |
| **Podcast / audio en movilidad** | Lecciones de audio con ejercicios "habla en voz alta" para el auto o caminando. |
| **WhatsApp / Telegram bot** | Recordatorios, retos diarios de audio y feedback por nota de voz (canal dominante en LatAm). |
| **B2B: academias corporativas** | Rutas por rol (ventas, líderes, atención), panel de equipo, integración LMS (SCORM/xAPI) y SSO. |

### 7.3 Segmentos y rutas iniciales

| Segmento | Dolor | Ruta estrella |
|---|---|---|
| Estudiantes y recién egresados | Entrevistas, exposiciones. | "Entrevista ganadora" (STAR + presencia en video). |
| Profesionales individuales | Visibilidad, reuniones, ascenso. | "Habla como líder" (BLUF + presencia ejecutiva). |
| Líderes nuevos | Feedback, 1:1, conflicto. | "Conversaciones difíciles" (SBI + CNV + Conversaciones Cruciales). |
| Ventas / atención | Objeciones, cierre, empatía. | "Roleplays de venta" (Voss + SPIN). |
| Emprendedores | Pitch, inversionistas. | "Pitch en 3 minutos" (Monroe + storytelling). |
| Personas con ansiedad social | Miedo, evitación. | "Escalera de confianza" (exposición gradual; **no** sustituye terapia, con derivación responsable). |

---

## 8. Motor de evaluación (cámara + micrófono)

### 8.1 Métricas, cómo se obtienen y rangos iniciales

> Los rangos son **heurísticas de arranque** que deben calibrarse con datos propios por idioma, país y contexto. Lo más valioso es la **línea base personal**: comparar a la persona consigo misma.

| Métrica | Técnica | Rango objetivo inicial |
|---|---|---|
| Ritmo (palabras por minuto) | ASR con timestamps | 120–165 ppm en presentación (conversación natural puede ser mayor). |
| Muletillas / min | Diccionario por país + ASR que conserve disfluencias (p. ej. modo "verbatim") | < 3/min. |
| Pausas | VAD (detección de actividad de voz) | Pausas de 0,5–2 s tras ideas clave; evitar silencios > 4 s no intencionales. |
| Ratio de habla | VAD | 65–85% en presentación; en conversación, ratio habla/escucha cercano a 40–60%. |
| Variación de tono | Estimación de F0 (YIN/pYIN, CREPE, Praat/Parselmouth) en semitonos | Desviación ≥ 2 semitonos (≤ 1,2 suena monótono). |
| Volumen y estabilidad | RMS/LUFS | Suficiente y estable, con énfasis intencional. |
| Claridad / dicción | Confianza del ASR por palabra, alineación forzada | Alta confianza media. |
| Lenguaje atenuado | NLP: "creo que", "un poquito", "perdón", "no sé si…" | Uso moderado; asertividad sin agresividad. |
| Estructura | LLM con rúbrica (PREP/STAR/SCQA) | Presencia de apertura, desarrollo, cierre/llamado a la acción. |
| Contacto visual (a cámara) | Landmarks faciales + pose de cabeza + dirección de mirada (MediaPipe Face Landmarker) | ≥ 60% del tiempo en video. |
| Expresividad / sonrisa | Blendshapes faciales (no "emoción") | Sonrisa en apertura/cierre; expresividad no plana. |
| Estabilidad de cabeza/cuerpo | Pose (MediaPipe Pose) | Movimiento moderado; sin balanceo repetitivo. |
| Gestos | MediaPipe Hands/Pose | Manos visibles y dentro del marco, coherentes con el contenido. |
| Encuadre y luz | Visión clásica | Rostro centrado, ojos en el tercio superior, iluminación frontal. |
| Escucha (roleplay) | Turnos, preguntas abiertas, parafraseo | ≥ 1 pregunta abierta y 1 parafraseo por intercambio difícil. |

### 8.2 Puntaje y feedback

- **Puntaje VOXA (0–100)** = media ponderada por dimensión; los pesos cambian según el contexto (en una entrevista pesa más la estructura; en un brindis, la expresividad).
- **Feedback "1 fortaleza + 1 foco + 1 ejercicio":** nunca una lista de 15 errores. La persona sabe exactamente qué repetir.
- **Replay anotado:** línea de tiempo con marcadores (muletilla, pausa larga, pérdida de mirada, pico de ritmo).
- **Reintento inmediato del mismo fragmento** y comparación lado a lado ("antes / después").
- **Coach IA (LLM)** recibe transcripción + métricas + rúbrica del contexto y devuelve feedback en tono cálido y concreto, con ejemplos reescritos ("Así podrías haberlo dicho:").

### 8.3 Prompt base del coach IA (resumen)

```
Eres un coach de comunicación experto, cálido y directo. Recibes:
- Contexto: {escenario}, objetivo del usuario: {objetivo}, nivel: {nivel}
- Transcripción con marcas de tiempo
- Métricas: {ppm, muletillas/min, pausas, variación de tono, contacto visual, sonrisa...}
- Rúbrica del escenario: {criterios}
Devuelve JSON con: fortaleza (con cita textual), foco_principal (uno solo),
por_que_importa, ejercicio (≤ 2 min), reescritura_ejemplo, puntaje_por_criterio.
Reglas: no inferir emociones ni rasgos de personalidad; hablar de conductas observables;
no diagnosticar; si detectas señales de angustia severa, sugiere recursos profesionales.
```

---

## 9. Diferenciales competitivos

1. **Español nativo y regional.** Muletillas, ritmos y expresiones por país ("o sea", "este", "pues", "en plan", "¿cachai?", "tipo"), voces de avatares con acentos locales, ejemplos culturales propios.
2. **De la medición al hábito.** No sólo medimos: ruta adaptativa, sesiones de 7 min, misiones del mundo real y repetición espaciada.
3. **Evaluación multimodal explicable y ética.** Voz + lenguaje + cuerpo, con conductas observables y explicación de cada puntaje. Sin "lectura de emociones".
4. **Roleplay con personajes que reaccionan** por voz en tiempo real, con "rebobinar y reintentar" el mismo momento (imposible con un coach humano sin incomodidad).
5. **Escalera de confianza** basada en exposición gradual y TCC, para quienes parten desde el miedo.
6. **Modo "evento real".** Preparación específica (tu charla del jueves, tu entrevista del lunes) con preguntas difíciles probables y rutina de calma.
7. **Comparación contigo mismo** (línea base personal) en vez de rankings que desmotivan.
8. **Privacidad primero:** análisis en el dispositivo cuando es posible; video que nunca sale del teléfono salvo que el usuario lo comparta.
9. **Híbrido IA + humano:** la IA hace el 90% de las repeticiones; el coach humano interviene en hitos con datos objetivos.
10. **Puente B2B medible:** paneles de progreso por equipo (agregados y con consentimiento), vinculando práctica con resultados de negocio (tasa de cierre, NPS, desempeño en entrevistas).
11. **Canal WhatsApp:** retos y feedback por nota de voz donde la gente ya está.

---

## 10. Arquitectura tecnológica

```
┌──────────────────────────── CLIENTES ─────────────────────────────┐
│  App móvil (React Native / Expo)   Web (Next.js)   VR (WebXR)     │
│  Captura cámara/mic · análisis en dispositivo (MediaPipe, VAD,    │
│  pitch, ASR on-device opcional) · reproductor con anotaciones     │
└───────────────┬───────────────────────────────┬───────────────────┘
                │ WebRTC (tiempo real)          │ HTTPS / subida
┌───────────────▼──────────────┐  ┌─────────────▼────────────────────┐
│  CAPA CONVERSACIONAL         │  │  API (FastAPI / Node)            │
│  LiveKit / WebRTC            │  │  Auth, usuarios, rutas, sesiones │
│  ASR streaming → LLM → TTS   │  │  Gamificación, pagos, B2B        │
│  Personajes de roleplay      │  └─────────────┬────────────────────┘
└───────────────┬──────────────┘                │
                │                 ┌─────────────▼────────────────────┐
                └────────────────►│  PIPELINE DE ANÁLISIS (workers)  │
                                  │  Cola (Redis/SQS) → ASR batch    │
                                  │  → alineación → prosodia         │
                                  │  → visión → NLP/LLM rúbricas     │
                                  │  → puntaje + feedback            │
                                  └─────────────┬────────────────────┘
                                                │
┌───────────────────────────────────────────────▼───────────────────┐
│  DATOS: PostgreSQL (+pgvector) · almacenamiento de objetos cifrado │
│  (video/audio con expiración) · data warehouse · feature store     │
│  Analítica de producto (PostHog) · motor adaptativo (Elo/IRT)      │
└────────────────────────────────────────────────────────────────────┘
```

### 10.1 Componentes y opciones

| Capa | Opciones (seleccionar por costo, latencia y calidad en español) |
|---|---|
| ASR | Whisper / faster-whisper (auto-alojado), Deepgram, AssemblyAI, Google Speech (Chirp), Azure Speech. Requisito: timestamps por palabra y opción de conservar disfluencias. |
| VAD | Silero VAD, WebRTC VAD. |
| Prosodia | librosa, Praat/Parselmouth, CREPE/pYIN; en navegador, autocorrelación/YIN en Web Audio. |
| Pronunciación | Alineación forzada (Montreal Forced Aligner), Azure Pronunciation Assessment. |
| Visión | MediaPipe (Face Landmarker con blendshapes, Pose, Hands) en dispositivo; OpenFace para investigación. |
| LLM (coach, rúbricas, personajes) | Modelos de frontera (p. ej. Claude) para feedback y roleplay; modelos pequeños para clasificación barata. Salida estructurada (JSON) + evaluaciones automáticas de calidad. |
| Voz conversacional | Pipeline ASR→LLM→TTS en streaming o APIs de voz en tiempo real; orquestación con LiveKit Agents / Pipecat. |
| TTS | ElevenLabs, Azure Neural TTS, Google TTS (acentos regionales). |
| Avatares | Avatares en tiempo real (HeyGen, Tavus, D-ID) o 3D propios (Ready Player Me, Unreal MetaHuman, three.js). |
| Móvil | React Native (Expo) o Flutter; vision-camera + MediaPipe nativo. |
| Backend | FastAPI (Python, encaja con el stack de audio/ML) o NestJS; Celery/RQ para workers; GPU bajo demanda (Modal, RunPod, AWS). |
| Infra | AWS/GCP, Terraform, CI/CD con GitHub Actions, observabilidad (OpenTelemetry, Sentry). |
| Pagos | Stripe, Mercado Pago (LatAm), suscripciones in-app (App Store/Google Play). |
| B2B | SSO (SAML/OIDC), SCORM/xAPI para LMS, API de reportes. |

### 10.2 Modelo de datos (núcleo)

```
users(id, locale, country, goals[], level, baseline_session_id)
skills(id, dimension, name)                       -- p. ej. voz.muletillas
user_skill(user_id, skill_id, rating_elo, last_practiced_at, next_review_at)
scenarios(id, context, rubric_json, persona_json, difficulty)
sessions(id, user_id, scenario_id, started_at, duration_s, media_uri, consent_flags)
metrics(session_id, name, value, unit)            -- ppm, fillers_per_min, gaze_pct...
events(session_id, t_ms, type, payload)           -- marcadores de la línea de tiempo
feedback(session_id, strength, focus, exercise, rewrite, scores_json, model_version)
missions(id, user_id, text, due_at, completed_at, reflection)
orgs / teams / seats                               -- B2B
```

### 10.3 Prototipo incluido en este repositorio

`voxa/prototype/index.html` es un **MVP funcional en el navegador** (sin servidor ni dependencias de compilación) que ya demuestra el núcleo:

- Captura de cámara y micrófono; grabación y replay descargable.
- Transcripción en vivo (Web Speech API, español regional).
- Métricas de voz: ppm, muletillas por minuto, pausas largas, ratio de habla, volumen y variación de tono (semitonos).
- Métricas de lenguaje: atenuadores / baja asertividad.
- Métricas visuales (MediaPipe Face Landmarker): presencia en cuadro, contacto visual aproximado, sonrisa, estabilidad de cabeza.
- Puntaje VOXA ponderado por escenario, feedback "fortaleza / foco / ejercicio", línea de tiempo de voz y prompt listo para un coach IA.
- Todo el análisis ocurre **localmente en el dispositivo**.

**v2 (servidor `voxa/server`):**

- **Coach IA** (`/api/feedback`): fortaleza con cita, un foco, chequeo de estructura según el método, reescritura de la respuesta, ejercicio y rúbrica cualitativa, con salida JSON validada por esquema.
- **Roleplay por voz** (`roleplay.html`, `/api/roleplay`): 6 personajes (reclutadora, jefe, clienta molesta, inversionista, colega, networking), 3 niveles de dificultad, pistas en vivo, **rebobinar y reintentar**, métricas de conversación y evaluación final (`/api/roleplay/evaluate`). Sin IA funciona un entrevistador con preguntas fijas.
- **v3:** biblioteca de 22 escenarios en 6 ambientes (incluida la vida social); detector acústico de sonidos de duda («eh/mmm») que la transcripción borra; **gimnasio de voz** (`gimnasio.html`) con 5 ejercicios medidos en vivo; roleplay personalizado con la oferta de trabajo, el CV o notas reales del usuario; y app instalable que funciona sin conexión (PWA).
- **Mi progreso** (`progreso.html`): línea base, tendencia por dimensión, racha, nervios antes/después, foco recurrente, sprint de 30 días con la tarea del día, escalera de confianza y exportación o borrado de datos.

---

## 11. Privacidad, ética y regulación

- **Consentimiento explícito y granular** (grabar, guardar, compartir con coach, usar para mejorar modelos: cada uno por separado, desactivado por defecto lo último).
- **Procesamiento en el dispositivo** siempre que sea viable; cifrado en tránsito y en reposo; borrado automático de video (p. ej. 30 días) salvo que el usuario lo guarde.
- **Sin inferencia de emociones ni rasgos de personalidad**; métricas = conductas observables. Esto es especialmente relevante bajo el **AI Act de la UE**, que prohíbe sistemas de reconocimiento de emociones en el trabajo y en la educación (con excepciones médicas/seguridad).
- **B2B:** los empleadores ven sólo agregados y progreso de ruta; nunca grabaciones individuales sin consentimiento expreso del colaborador. La plataforma no se usa para evaluaciones de desempeño o selección automatizada (evita clasificación como sistema de alto riesgo).
- **Marcos de protección de datos:** RGPD (UE/España), LGPD (Brasil), Ley 1581 (Colombia), LFPDPPP (México), Ley 25.326 (Argentina), Ley 21.719 (Chile), entre otros; COPPA/edad mínima para menores.
- **Sesgos:** validar métricas por acento, género, edad, tono de piel (detección facial), neurodivergencia y discapacidad (p. ej. contacto visual no debe penalizar a personas autistas si eligen desactivarlo; tartamudez no se trata como "muletilla"). Opciones para desactivar métricas.
- **Bienestar:** VOXA no es terapia; detección de señales de angustia con derivación a recursos profesionales.

---

## 12. Programa "Sprint 30 días"

Diseño para la mejora más rápida posible con ~10–15 min/día:

| Semana | Foco | Métrica principal | Prácticas clave |
|---|---|---|---|
| 0 (día 1) | Diagnóstico | Línea base completa | Presentación de 2 min + conversación con IA. |
| 1 | **Voz y ritmo** | Muletillas/min, ppm, pausas | Pausa en lugar de muletilla; lectura marcada; respiración. |
| 2 | **Estructura** | Puntaje rúbrica PREP/STAR | Improvisaciones de 60 s; mensaje en una frase; BLUF. |
| 3 | **Presencia** | Contacto visual, expresividad, estabilidad | Mirar a la cámara en frases clave; gestos en el marco; sonrisa en apertura/cierre. |
| 4 | **Contexto e interacción** | Puntaje en roleplay de dificultad media/alta | Entrevista, conversación difícil, pitch; escucha activa; manejo de objeciones. |
| Día 30 | Re-evaluación | Delta vs línea base | Misma prueba que el día 1 → reporte "antes/después" compartible. |

Cada día: calentamiento (1 min) → micro-lección (2 min) → práctica + reintento (5 min) → misión real (fuera de la app) → reflexión (30 s).

---

## 13. Modelo de negocio

| Línea | Descripción |
|---|---|
| **Freemium B2C** | Diagnóstico, 3 sesiones/semana, métricas básicas. |
| **Premium B2C** (mensual/anual) | Sesiones ilimitadas, roleplay por voz, rutas completas, replay anotado, modo evento real. |
| **Packs puntuales** | "Entrevista en 7 días", "Pitch para inversionistas", "Charla TEDx". |
| **Marketplace de coaches** | Comisión por sesión; los coaches usan VOXA como herramienta de seguimiento. |
| **B2B por licencia** | Ventas, atención, liderazgo, universidades (empleabilidad), programas de outplacement; panel y reportes Kirkpatrick. |
| **Certificaciones** | Credenciales verificables de nivel (LinkedIn). |

Precio de referencia a validar con experimentos (precios regionales por paridad de poder adquisitivo).

---

## 14. Roadmap

| Fase | Plazo | Entregables |
|---|---|---|
| **0. Prototipo** (este repo) | Semana 0 | Evaluador web local con cámara/mic, métricas y reporte. |
| **1. MVP** | 0–3 meses | App móvil + web; diagnóstico; 3 rutas (entrevista, presentación, confianza); ASR servidor con disfluencias; coach IA con LLM; rachas; analítica. Piloto con 200 usuarios. |
| **2. v1** | 3–6 meses | Roleplay por voz en tiempo real con 10 personajes; replay anotado; motor adaptativo; WhatsApp bot; pagos; primeras 3 empresas piloto. |
| **3. v2** | 6–12 meses | Copiloto de reuniones; audiencia virtual/VR; marketplace de coaches; panel B2B; integración LMS/SSO; certificaciones. |
| **4. Escala** | 12+ meses | Portugués e inglés; modelos propios afinados de muletillas/prosodia por país; API para terceros. |

Equipo mínimo MVP: PM/fundador, 2 full-stack (web/móvil), 1 ML/audio, 1 diseñador UX, 1 experto en comunicación/instruccional (contenido y rúbricas), + coaches contratados para validación.

---

## 15. KPIs

| Tipo | KPI |
|---|---|
| Aprendizaje | Delta del puntaje VOXA a 30 días; % usuarios que mejoran ≥ 15 puntos; reducción de muletillas/min. |
| Conducta (Kirkpatrick 3) | Misiones reales completadas; autoeficacia percibida (escala pre/post). |
| Resultados (Kirkpatrick 4, B2B) | Tasa de conversión en ventas, éxito en entrevistas, NPS clientes, evaluación 360. |
| Producto | Activación (diagnóstico completado), retención D1/D7/D30, sesiones/semana, rachas. |
| Negocio | Conversión free→premium, CAC, LTV, churn, ingresos B2B por asiento. |
| Calidad IA | Concordancia del feedback IA con coaches humanos (validación por muestreo), errores de ASR en español regional, sesgo por grupo. |

---

## 16. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Métricas que no reflejan buena comunicación ("Goodhart") | Mezclar métricas objetivas con rúbricas cualitativas y validación humana; mostrar rangos, no perfección. |
| ASR elimina muletillas ("eh", "em") | Usar ASR en modo verbatim + detector acústico de disfluencias. |
| Ansiedad por ser grabado | Escalera de confianza: empezar con audio, cámara opcional, modo "sin guardar". |
| Sesgo hacia acentos o rasgos físicos | Datos de validación diversos, métricas desactivables, auditorías periódicas. |
| Costo de IA en tiempo real | Análisis en dispositivo, modelos pequeños para tareas simples, caché, límites por plan. |
| Commoditización (cualquiera mide muletillas) | Diferenciar en currículo, español regional, roleplay, comunidad, datos de progreso y B2B. |
| Regulación (IA, datos biométricos) | Privacidad desde el diseño, sin reconocimiento de emociones, DPIA, asesoría legal por país. |
