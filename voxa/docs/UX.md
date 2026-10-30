# Talkride — Revisión de experiencia de usuario (UX)

> Auditoría de usabilidad del prototipo, principios de diseño y de comunicación aplicados, y comparación con los patrones de las apps de práctica y hábito mejor valoradas. Octubre de 2026.

---

## 1. Cómo se hizo la revisión

1. **Evaluación heurística** con las 10 heurísticas de usabilidad de Jakob Nielsen (Nielsen Norman Group).
2. **Auditoría móvil automatizada** a 390 px de ancho (iPhone típico) con Playwright: desbordes horizontales, objetivos táctiles menores a 44 px y capturas de cada pantalla.
3. **Contraste de color** calculado según WCAG 2.2 para todos los pares de colores, en modo claro y oscuro.
4. **Recorrido completo de una persona nueva**: bienvenida → primera práctica → reporte → coach IA → inicio → escritura → progreso, sin errores de consola.
5. **Benchmark de patrones** de las apps mejor valoradas de la categoría (sección 4).

---

## 2. Problemas encontrados y solución

| # | Problema (antes) | Heurística / principio | Solución (ahora) |
|---|---|---|---|
| 1 | Se entraba directo a un formulario con 4 controles antes de hacer nada. | Ley de Hick; "No me hagas pensar" (Krug) | Nueva pantalla **Hoy**: en la primera visita, una bienvenida de 3 preguntas y nada más; después, **una sola acción principal**: «Hacer la práctica de hoy». |
| 2 | Grabar requería tres botones en secuencia (Activar → Comenzar → Terminar), con botones deshabilitados sin explicación. | Visibilidad del estado; prevención de errores | **Un solo botón «Empezar»**: pide permisos, hace una cuenta regresiva 3-2-1 y **termina solo** al acabar el tiempo. «Terminar ahora» aparece únicamente mientras grabas. |
| 3 | Jerga: «ppm», «atenuadores», «CV 0,91», «PREP» sin explicar. | Coincidencia con el mundo real | Lenguaje simple: «palabras/min», «frases que restan seguridad», «énfasis con el volumen: adecuado». Cada método se explica en una frase (p. ej. STAR = Situación, Tarea, Acción, Resultado). |
| 4 | La consigna quedaba fuera de la vista mientras grababas. | Reconocer antes que recordar | La consigna se **superpone al video** durante la grabación; a 10 s del final cambia a «ve cerrando con tu idea principal». |
| 5 | En el móvil la navegación ocupaba dos líneas arriba, lejos del pulgar. | Diseño para el pulgar; convención de plataforma | **Barra inferior fija** con 5 destinos e iconos con etiqueta, como en Duolingo, Headspace o Strava. En escritorio queda arriba. |
| 6 | El reporte mostraba 12 métricas al mismo nivel que el consejo. | Estética minimalista; divulgación progresiva | El reporte empieza con el puntaje, la **comparación con tu intento anterior** y **3 tarjetas: lo que hiciste bien, tu único foco y un ejercicio de 2 minutos**, más el botón «Repetir aplicando el foco». Métricas, línea de tiempo, video y transcripción quedan en secciones desplegables. |
| 7 | Para indicar los nervios había que usar un deslizador fino y difícil de tocar. | Objetivos táctiles; esfuerzo mínimo | **5 botones con emoji** y etiqueta (😌 → 😰), de un toque. |
| 8 | En el roleplay había que *mantener pulsado* para hablar. | WCAG 2.5.1 (gestos de puntero) | **Tocar para hablar / tocar para enviar**, con `aria-pressed`. |
| 9 | La variante de español se elegía en cada página. | Consistencia; memoria del sistema | Se elige una vez (bienvenida o Ajustes) y se aplica a todas las secciones. Si no se elige, se usa la del navegador. |
| 10 | Pestañas de 34 px de alto y un deslizador por debajo del mínimo táctil; texto blanco sobre el botón primario en modo oscuro con contraste ≈ 3:1. | WCAG 2.2 (2.5.8, 1.4.3); Apple HIG y Material | Todos los controles miden **≥ 44 px**; foco visible con borde de 3 px; respeto de `prefers-reduced-motion`; texto oscuro sobre el botón primario en modo oscuro (6,2:1). |
| 11 | Los errores de permiso mostraban el mensaje técnico del navegador. | Ayudar a reconocer y recuperarse de errores | Mensaje accionable: «Sin permiso no podemos escucharte. Actívalo en el candado de la barra de direcciones y vuelve a pulsar Empezar». |
| 12 | El tiempo y el volumen se veían como dos barras idénticas. | Visibilidad y correspondencia | Barras con etiqueta («Tiempo · quedan 42 s», «Volumen de tu voz») y colores distintos. |
| 13 | La escritura marcaba como «muy corto» un pedido breve y claro de 21 palabras. | Coherencia con el propio mensaje (la brevedad es buena) | Mínimos ajustados por tipo de texto: un pedido claro de 15 palabras ya es correcto. |
| 14 | El plan de 30 días era texto sin acción. | Reducir la distancia entre la intención y la acción (Fogg) | Cada tarea del plan **enlaza directo** a su práctica (situación, personaje o ejercicio ya elegidos). |

### Resultado medible

| Indicador | Antes | Ahora |
|---|---|---|
| Toques hasta empezar a grabar (persona nueva) | 2 botones + leer 4 controles sin guía | **4 toques guiados** (objetivo, nervios, «Empezar mi primera práctica», «Empezar»). Duolingo, referente de la categoría, llega a la primera lección en unos 4 clics. |
| Toques hasta grabar (persona que vuelve) | 2 + elegir manualmente | **2 toques** desde Hoy (la práctica del día ya viene elegida). |
| Controles pequeños en móvil | 4–8 por página bajo 40 px | **0** en todas las páginas auditadas. |
| Desborde horizontal a 390 px | 0 | 0 |
| Pares de color bajo 4,5:1 | 1 (botón primario en modo oscuro) | **0**: el mínimo es 4,6:1 (texto del encabezado degradado). |

---

## 3. Principios aplicados

### 3.1 Diseñadores y referentes de diseño

| Referente | Principio | Dónde se aplica en Talkride |
|---|---|---|
| **Jakob Nielsen** (Nielsen Norman Group) | 10 heurísticas de usabilidad. | Toda la auditoría de la sección 2. |
| **Don Norman** (*The Design of Everyday Things*) | Señales claras de qué se puede hacer, feedback inmediato y correspondencia natural. | Cuenta regresiva, barra de tiempo, estado «Grabando», audiencia que reacciona en vivo y botones que muestran su estado (`aria-pressed`). |
| **Dieter Rams** ("menos, pero mejor") | Quitar todo lo que no ayuda a la tarea principal. | Un foco por reporte, detalle desplegable y la bienvenida a solas en la primera visita. |
| **Steve Krug** (*No me hagas pensar*) | Cada pantalla debe ser obvia. | «Hoy» responde de inmediato «¿qué hago ahora?». |
| **Luke Wroblewski** (*Mobile First*) y las guías de interfaz de Apple y Material | Diseñar primero para el móvil, objetivos táctiles amplios y navegación al alcance del pulgar. | Barra inferior, controles de 44 px como mínimo y auditoría a 390 px. |
| **WCAG 2.2** (W3C) | Contraste, tamaño de objetivo, gestos alternativos, foco visible. | Sección 2, problemas 8 y 10. |
| **BJ Fogg** (*Tiny Habits*, modelo B = MAP) | Una conducta ocurre cuando hay motivación, capacidad y un disparador. | La práctica del día es pequeña (unos 7 min), el disparador es un botón y el plan enlaza directo a la acción. |

### 3.2 Comunicadores y psicología del aprendizaje (aplicado a los textos de la interfaz)

| Referente | Idea | Cómo se refleja en los textos |
|---|---|---|
| **Nancy Duarte** (*Resonate*) | La audiencia es la protagonista; el orador es el guía. | Los textos hablan de *ti* y de *tu* objetivo («Practica la conversación antes de tenerla»). Talkride guía y la persona protagoniza. |
| **Chris Anderson** (TED) | Una charla transmite una sola idea. | «Tu único foco»: el reporte nunca da una lista de errores. |
| **Carmine Gallo** | La regla de tres hace los mensajes memorables. | Tres tarjetas: lo que hiciste bien → tu foco → tu ejercicio. |
| **Garr Reynolds** (*Presentation Zen*) | Simplicidad y contención. | Detalle técnico oculto por defecto; un mensaje por pantalla. |
| **Carol Dweck** (mentalidad de crecimiento) | El progreso se atribuye al esfuerzo y la práctica, no al talento. | «Este es tu punto de partida», «el progreso no es lineal», comparación sólo con tu intento anterior y nunca con otras personas. |
| **Daniel Kahneman** (regla del pico y el final) | Recordamos una experiencia por su momento más intenso y por su final. | El reporte empieza por lo que hiciste bien y termina con una acción concreta y una pregunta de cómo te sientes (calma ganada). |
| **Dale Carnegie** | Habla en términos de lo que le interesa al otro. | El «por qué» de cada consejo explica el efecto en *tu audiencia* («el público puede perder ideas clave»). |

---

## 4. Benchmark de UX con las plataformas mejor valoradas

> No fue posible verificar las calificaciones actuales de App Store o Google Play en fuente primaria. La única cifra encontrada (Orai, 4,6 con unas 3.700 reseñas en la App Store de EE. UU.) proviene de una comparativa de terceros, así que se cita como **no verificada**. Las conclusiones se basan en patrones de diseño documentados en análisis de UX y reseñas.

| App | Patrón destacado (por qué la valoran) | Qué adoptó Talkride | Qué evitamos |
|---|---|---|---|
| **Duolingo** | *Compromiso gradual*: primero la lección y después la cuenta. Pregunta el objetivo y la motivación antes de empezar. Unos 4 clics hasta la primera lección. Racha y ruta visual. | Bienvenida de 3 preguntas **sin cuenta**, primera práctica en 4 toques, racha y plan diario. | La culpa o la presión con la racha (mascota que "culpa"): Talkride celebra sin castigar. |
| **Headspace** | Bienvenida empática y breve (unas 3 preguntas sobre la intención), pantallas fáciles de saltar, tono calmado. Su métrica clave es la retención en la segunda semana. | Tono cálido, preguntas por intención (objetivo, nervios), registro de nervios antes y después, y respiración en los consejos. | Secuencias largas de introducción (en un análisis citado, el 38% abandonaba durante la bienvenida). |
| **Speak** | Hablar en voz alta desde la primera sesión, feedback inmediato, conversación libre como espacio de práctica y métrica de fluidez. | El núcleo es hablar (evaluar y roleplay por voz), con feedback inmediato y nivel de comunicación. | Puntuar como correcto lo que estuvo mal (crítica frecuente a Speak): Talkride muestra métricas explicables y marca lo estimado como estimado. |
| **ELSA Speak / BoldVoice** | Feedback muy específico (a nivel de sonido) y ejercicios breves. | Gimnasio de voz con métricas concretas (segundos, semitonos, dB) y mejores marcas. | Problemas de acceso y de reembolsos señalados en reseñas: Talkride no exige cuenta. |
| **Orai** (4,6 no verificado) | Práctica corta y puntuada desde el móvil. | Puntaje de 0 a 100 en cada práctica y prácticas de 30 s a 2 min. | Feedback sólo de audio: Talkride suma presencia visual y contexto. |
| **Strava / Whoop** | Comparación contigo mismo, tendencias y mejores marcas personales. | Punto de partida, mejores marcas, tendencia por dimensión y calma ganada. | Rankings públicos que desmotivan a quien empieza. |
| **Yoodli** | Análisis de grabaciones y roleplay. | Roleplay con personajes y pistas en vivo. | Web solamente y sin app instalable: Talkride es una app web instalable y funciona sin conexión. |

### Lo que Talkride hace distinto en experiencia

1. **Sin cuenta y sin muro de pago** para empezar: el valor llega antes que el registro.
2. **Un solo foco por práctica**, cuando la mayoría de los coaches muestran todas las métricas al mismo nivel.
3. **Audiencia virtual** que reacciona en vivo a cómo hablas (silencios, monotonía, muletillas, mirada), con un motivo explícito («Tu voz suena monótona: varía el tono para recuperarlos»).
4. **Registro emocional ligero** (nervios antes y después) que convierte la práctica en evidencia de calma ganada.
5. **Plan diario accionable**: cada tarea abre la práctica exacta.

---

## 5. Segunda revisión: simplicidad con autoridad (octubre de 2026)

**Cómo se hizo:**
- Recorrido automatizado de punta a punta (`tests/e2e/recorrido.cjs`), con coach IA simulado y voz sintética en el micrófono. Cubre 18 pantallas en modo claro y oscuro, a 390 px.
- Revisión de cada captura con criterio de diseñador:
  - una sola acción principal por pantalla;
  - jerarquía clara;
  - contraste;
  - consistencia de títulos y botones;
  - y «autoridad»: que la app se vea seria y confiable, sin ruido.

**Qué se encontró y qué se cambió:**

| # | Problema | Principio | Cambio |
|---|---|---|---|
| 1 | En «Hoy», los enlaces dentro del recuadro morado eran **invisibles**: contraste de 1,0:1 en modo claro y 2,1:1 en oscuro | WCAG 1.4.3 (mínimo 4,5:1) | Blancos y subrayados: **5,7–6,3:1** |
| 2 | Evaluar mostraba un recuadro negro de cámara antes de empezar y, al terminar, la cámara y el reloj quedaban congelados sobre el reporte | Una sola cosa a la vez; estado visible del sistema (Nielsen 1) | La cámara aparece sólo mientras practicas; antes y después, la pantalla es de la consigna y del reporte |
| 3 | Roleplay mostraba 9 personajes grandes y el botón «Comenzar» quedaba dos pantallas más abajo | Ley de Hick (menos opciones, decisión más rápida); revelación progresiva | Los **4 personajes que más sirven para tu meta** y «Ver los 9 personajes». El botón queda a la vista |
| 4 | El gimnasio pedía «Activar micrófono» y después «Empezar» | Mínimo de pasos; un toque por intención | **Un solo botón** «Empezar»: la primera vez pide el micrófono y arranca. «Terminar» aparece sólo mientras grabas |
| 5 | Títulos con tres estilos: «Talkride · Roleplay con IA», «Evaluar», «Prepara un evento real» | Consistencia y estándares (Nielsen 4) | Títulos cortos, iguales al menú: Roleplay, Gimnasio de voz, Evento real, Mi progreso, Tu plan |
| 6 | Sin tamaño de letra ajustable ni alto contraste (pendiente de la primera revisión) | Accesibilidad; usuarios mayores o con baja visión | **Ajustes → Tamaño de la letra** (normal, grande, muy grande) y **Alto contraste** (texto secundario a 16,5:1 y bordes marcados), en todas las pantallas |

**Autoridad sin rigidez** (lo que se mantiene a propósito):
- **Color:** un solo color de acción, el índigo; verde, ámbar y rojo sólo para resultados. Con la persona en modo calma, los puntajes bajos se muestran en neutro.
- **Botones:** uno principal por pantalla, grande (52 px) y con verbo («Hacer la práctica de hoy», «Empezar», «Comenzar conversación»). Los secundarios van con borde, y los terciarios como enlace.
- **Evidencia visible:** cada puntaje dice qué se midió y cuál es la meta («142 palabras/min; recomendado 120–165»). Así se gana autoridad: mostrando el método, no con adornos.
- **Tono:** se tutea y se celebra lo logrado primero, con un solo foco de mejora. Es la práctica de los mejores profesores de oratoria y del feedback SBI.

**Resultado del recorrido:**
- 18 pantallas en claro y oscuro;
- 0 errores de JavaScript;
- 0 controles bajo 44 px;
- 0 desbordes horizontales;
- 0 controles sin nombre accesible;
- todos los flujos con IA funcionando de punta a punta.

El recorrido encontró además un error real, que ya está corregido: en Roleplay, el perfil se leía antes de declararse y la página no cargaba los personajes.

## 6. Pendientes recomendados

- **Pruebas con personas reales** (5 usuarios por segmento, siguiendo la regla de Nielsen): tiempo hasta la primera práctica, comprensión del reporte y recuerdo del foco 24 h después.
- **Recordatorios:** ✅ en la app, notificación diaria a la hora elegida; en la web, calendario.
- **Lector de pantalla**: revisar con VoiceOver/TalkBack el flujo de grabación (cuenta regresiva y avisos `aria-live`).
- **Modo de alto contraste y tamaño de texto:** ✅ hecho (§5).
- **Analítica de embudo** (bienvenida → primera práctica → día 2 → día 7) para medir la retención en la segunda semana, como Headspace.

---

## Fuentes

- Appcues / ReallyGoodUX — bienvenida de Duolingo: https://goodux.appcues.com/blog/duolingo-user-onboarding
- UX Planet — análisis de UX de Duolingo: https://uxplanet.org/duolingo-ux-analysis-9631ff3f4eb1
- Appcues — las 10 mejores experiencias de bienvenida: https://www.appcues.com/blog/the-10-best-user-onboarding-experiences
- Appcues — bienvenida de Headspace: https://goodux.appcues.com/blog/headspaces-mindful-onboarding-sequence
- Raw Studio — cómo diseña Headspace: https://raw.studio/blog/how-headspace-designs-for-mindfulness/
- Tear Them Down — personalización en Headspace: https://tearthemdown.substack.com/p/headspace
- Waldo — bienvenida simple en móvil: https://www.waldo.com/blog/simple-is-better-mobile-user-onboarding
- ScreensDesign — Speak: https://screensdesign.com/showcase/speak-learn-spanish-french
- Headway — reseña de Speak: https://makeheadway.com/blog/speak-app-review/
- Android Authority — Speak: https://www.androidauthority.com/speak-language-learning-3623764/
- AI Tools Bakery — comparativa de coaches de oratoria (calificación de Orai, no verificada): https://aitoolsbakery.com/?p=19100
- Capterra — ELSA Speak: https://www.capterra.co.uk/reviews/1022863/elsa-speak
- Newsweek — mejor app de idiomas 2026 (lectores): https://newsweek.com/readerschoice/best-language-learning-app-2026
- DAISY — WCAG 2.2, 2.5.8 tamaño mínimo de objetivo: https://kb.daisy.org/publishing/docs/wcag/target-size-minimum.html
- BOIA — tamaño de objetivo en WCAG 2.2: https://www.boia.org/blog/understanding-target-size-under-wcag-2.2-and-how-it-affects-people-with-disabilities
- Deque — regla axe de tamaño de objetivo: https://dequeuniversity.com/rules/axe/4.8/target-size
