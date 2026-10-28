# Plan de acción: subir la calificación y llegar a las primeras personas

Octubre de 2026.
- **Objetivo:** llegar a **4,5 ★ o más** con personas reales. El panel experto simulado ya subió de **3,5 ★** (ronda 1) a **4,0 ★** (ronda 2) con esta versión.
- **Base:** el [benchmark de calificaciones](CALIFICACIONES.md), la [auditoría](AUDITORIA.md) y el [panel experto](PANEL.md).

## 1. Dónde estamos y adónde vamos

| Indicador | Panel R1 | Panel R2 (hoy) | Meta de la beta (30 días) | Meta de lanzamiento |
|---|---|---|---|---|
| Estrellas (1–5) | 3,5 | **4,0** | 4,3 | ≥ 4,6, el nivel de Orai y Praktika |
| NPS | −67 | **0** | ≥ 20 | ≥ 40 |
| Criterio más bajo | A6 medición (2,3) | A6 medición (2,9) | 3,5 | 4,0 |
| Retención al día 7 | — | ≥ 25% | ≥ 35% |
| Prácticas por persona en la primera semana | — | ≥ 4 | ≥ 5 |

Los panelistas coincidieron en tres causas que bajan la nota:
1. **Puntajes poco creíbles.** Daba 91 en una entrevista sin responder lo preguntado, «Voz 97» con 20 segundos de audio y comparaba un texto con un audio.
2. **Un roleplay sin IA que no escuchaba.**
3. **Falta de cuidado con los principiantes nerviosos.** Les mostraba números en rojo, la meta premiaba «empezar calmado» y no había recursos de ayuda.

Las tres ya se corrigieron en esta versión (ver [PANEL.md](PANEL.md)). Lo que más pesa ahora es la **transcripción automática** y el **roleplay por voz** (A6 y A2), que necesitan la app instalable.

## 2. Plan por fases

### Fase 0: lista para compartir (hecha en esta versión)

| Acción | Qué ataca | Estado |
|---|---|---|
| Puntajes honestos: misma situación y formato al comparar; «puntaje parcial» sin texto; tope en muestras cortas | Credibilidad (A6, Q2) | ✅ |
| Estructura por método (PREP, STAR, BLUF, SBI) con la parte que falta y cómo agregarla | Feedback accionable (A1) | ✅ |
| Simulacro de entrevista que repregunta, no repite y puntúa STAR | Roleplay sin IA (A2) | ✅ |
| Rúbrica anclada y objetivo con 40% de peso en el roleplay con IA | Roleplay con IA (A2) | ✅ |
| Modo calma, meta de exposición, líneas de ayuda y detección local de crisis | Cuidado (A10) | ✅ |
| Metas factibles, plazo de 1 semana y plan del evento que se marca solo | Plan personal (A3) | ✅ |
| Detector de «eeh» con pausa, techo de tono 600 Hz y menos falsas muletillas | Medición (A6) | ✅ |
| Semana visible, racha en el reporte y calificación desde la 3.ª práctica | Hábito (A4, A10) | ✅ |
| 3 personajes para líderes (feedback, comité, mala noticia) | Valor profesional y B2B | ✅ |

### Fase 1: beta cerrada con las primeras 30 personas (semanas 1 a 4)

**A quiénes invitar primero.** Son las personas con un motivo concreto y una fecha cercana, porque son las que más practican y más feedback dan.

| Grupo | Por qué | Cuántas | Dónde encontrarlas |
|---|---|---|---|
| Personas con una entrevista en las próximas 2 semanas | Tienen urgencia y usan el modo Evento real | 10 | Contactos de recién titulados, centros de carreras de universidades, grupos de LinkedIn de empleo |
| Líderes nuevos (primer equipo a cargo) | Necesitan feedback SBI y conversaciones difíciles, y abren la puerta B2B | 8 | Colegas, programas de liderazgo, RR. HH. de empresas conocidas |
| Personas con miedo a hablar en público | Ponen a prueba el cuidado y la escalera de confianza | 6 | Clubes de Toastmasters, cursos de oratoria |
| Profesores o coaches de comunicación | Validan el método y el puntaje (autoridad, A7) | 6 | Docentes de oratoria y de comunicación, coaches certificados |

**Cómo compartir.**
1. En la página, abre «Compartir» y da acceso de **Colaborador**. Con Colaborador la persona puede calificar y su calificación llega a tu panel; con solo lectura, la calificación se queda en su navegador.
2. Envía el mensaje de la sección 4 con el link.
3. Pide una semana de uso con una meta concreta: diagnóstico el día 1, 4 prácticas y una calificación al final.
4. Haz una llamada de 15 minutos con 5 de ellas (una de cada grupo), mientras usan la app. Es lo que más enseña.

**Qué medimos cada semana.**
- Calificaciones y NPS: desde «Progreso → Calificaciones de tus usuarios», o pidiéndome que lea las calificaciones.
- Comentarios de «¿Qué falta?».
- Cuántas personas hicieron el diagnóstico y cuántas practicaron 3 días o más.

**Regla de decisión.** Cada viernes se corrige el problema más repetido de la semana. Si el NPS de la semana 2 es menor que 0, se pausan las invitaciones nuevas hasta corregirlo.

### Fase 2 (potenciada): la app instalable más lo que el benchmark muestra que más valora la gente (semanas 3 a 11)

El orden sigue el impacto en el valor percibido (barrido regional en [BENCHMARK.md](BENCHMARK.md) §5.2), el costo (ver [CASO_NEGOCIO.md](CASO_NEGOCIO.md)) y la regla «no agregar por agregar»: cada punto responde a una queja o a una mecánica que explica la nota de una app líder.

| Prioridad | Acción | Por qué (evidencia) | Indicador | Estado |
|---|---|---|---|---|
| P0 | **App instalable** (Capacitor: iOS, Android y web) con micrófono y cámara en vivo ([APP_NATIVA.md](APP_NATIVA.md)) | Las 4 brechas principales la necesitan | En tiendas en 8–11 semanas | Diseño listo |
| P0 | **Transcripción automática**: en el dispositivo y gratis, con respaldo en el servidor a US$0,003/min | Todas las líderes la tienen; es lo peor evaluado (A6 2,9) | ≥ 80% de las grabaciones con texto | Pendiente (app) |
| P0 | **Roleplay por voz** (tocar para hablar y voz del personaje) | Speak, Praktika, Babbel Speak | ≥ 50% de los roleplays por voz | Ya existe en la versión completa; falta en la app |
| P0 | **Plan gratis sin IA en el servidor, prueba de 7 días y precio medio** | Con IA gratis el margen es negativo (−86%) | Margen ≥ 35% | Definido en el caso de negocio |
| P1 | **Índice VOXA** único que se vuelve a medir | Wellspoken Index, banda IELTS de Stimuler | Re-diagnóstico ≥ 40% al mes | ✅ Hecho |
| P1 | **Modelos para imitar**: respuestas modelo y «Escuchar cómo sonaría» | BoldVoice, Cake, Mockee | Uso ≥ 30% de los reportes | ✅ Hecho |
| P1 | **Técnicas por personaje** en la evaluación con IA, con citas verificadas | Pedido del panel; Yoodli (rúbricas) | — | ✅ Hecho |
| P1 | **Cierre de la práctica** con avance de meta y «Mañana: …» | Duolingo: una racha de 7 días hace 2,4 veces más probable volver | Retención al día 7 ≥ 25% | ✅ Hecho, con aviso diario como notificación del teléfono en la app |
| P1 | **Coach conectado al evento real** (empresa, audiencia, mensaje, preocupación) | Mockee, apps coreanas (preguntas desde el CV y la oferta) | — | ✅ Hecho |
| P1 | **Calibración con profesores** (50 grabaciones) y un pequeño **estudio de eficacia** antes y después | Liulishuo lo usa como prueba; A7 3,6 | Correlación ≥ 0,6; mejora del índice ≥ 10 puntos en 4 semanas | Pendiente (beta) |
| P1 | **Diagnóstico paginado** con primera victoria en 60 s | Panel (diseño) | ≥ 80% lo termina | Pendiente |
| P2 | **Ejercicios generados desde tus errores** (IA) | Speak «Made for You», Preply | Uso semanal ≥ 25% | Pendiente |
| P2 | **Modo equipos (B2B)**: código de grupo, material de la empresa, resultados agregados con consentimiento | 75% de la contribución proyectada; Yoodli, Speeko y ELSA venden asientos | 2–3 pilotos en el mes 6 | Pendiente |
| P2 | **Recuperar la racha** y retos con amigos | Duolingo recuperó más de 15 M de rachas con una campaña | — | Pendiente |
| P2 | **Voseo y modismos por país** | A9 3,5 | — | Pendiente |
| No hacer | Copiloto «invisible» durante entrevistas reales | Final Round AI: riesgo ético y de reputación (Trustpilot 2,8) | — | Descartado |

### Fase 3: lanzamiento (semanas 8 a 12)

- **Lanzar en tiendas solo cuando la beta dé 4,3 ★ o más y NPS 20 o más.** Una mala calificación inicial cuesta meses revertirla.
- **Pedir la reseña en el momento justo:** después de la 3.ª práctica y de una mejora real. Con la API oficial de reseñas dentro de la app, Babbel ganó 0,11 ★ y 64% más de reseñas.
- **Responder cada reseña en menos de 48 h.** BoldVoice y Speeko lo hacen, y lo citan en las reseñas.
- **Cobro honesto (implementado en «Tu plan», `pro.html`).** Es la queja número 1 de la categoría:
  - aviso en el teléfono 3 días antes de cada renovación (notificación local programada con la fecha del plan);
  - cancelación en un toque, con enlace directo a las suscripciones de la tienda;
  - reembolso en 14 días: en Android lo hace VOXA; en iPhone se pide a Apple, que es quien cobra, y VOXA ayuda;
  - el diagnóstico, el ensayo, el análisis de voz y las lecciones siempre gratis.

## 3. Cómo seguir midiendo sin usuarios reales: el panel experto

Mientras llegan las calificaciones reales, el [panel experto simulado](PANEL.md) se repite después de cada cambio importante, con los mismos perfiles y criterios para comparar entre rondas:

1. Profesora de oratoria.
2. Coach ejecutivo y reclutador.
3. Psicóloga de ansiedad social.
4. Directora de diseño de producto.
5. Investigador en voz e IA.
6. Usuaria principiante.

No reemplaza a las personas reales: sirve para no salir a la beta con errores evidentes.

## 4. Mensaje de invitación (listo para enviar)

> **Asunto: ¿Me ayudas a probar VOXA? (10 minutos al día, una semana)**
>
> ¡Hola, [nombre]! Estoy creando VOXA, un entrenador gratuito en español para comunicarte con más seguridad: entrevistas, presentaciones, conversaciones difíciles y correos.
>
> Te invito a probarlo una semana:
> 1. Abre el link y haz el diagnóstico inicial (8 min): te dice tu nivel en 8 áreas y te propone metas.
> 2. Practica 4 días, unos 7 minutos cada vez. Si tienes una entrevista o una charla con fecha, usa «Evento real».
> 3. Al final, califícalo en «Progreso → Califica VOXA» y cuéntame qué te faltó.
>
> Link: https://claude.ai/artifact/Q8vtmWQ5KWWXHWFnwzBNXr (se abre con una cuenta de Claude).
>
> No tienes que crear una cuenta en VOXA. Tus grabaciones se analizan en tu navegador y no se suben a ningún lado. ¡Gracias!

Versión corta para WhatsApp:

> ¡Hola! Estoy probando VOXA, un coach gratis para hablar con más seguridad (entrevistas, presentaciones, conversaciones difíciles). ¿Lo pruebas una semana y me dices qué te parece? Haz el diagnóstico de 8 min y después 4 prácticas cortas: https://claude.ai/artifact/Q8vtmWQ5KWWXHWFnwzBNXr

## 5. Guía para las personas que prueban

| Día | Qué hacer | Qué observar |
|---|---|---|
| 1 | Bienvenida, diagnóstico y elegir metas | ¿Se entendió el resultado? ¿Las metas te sirven? |
| 2 | La práctica de Hoy, grabándote con el celular | ¿El foco y el ejercicio fueron útiles? |
| 3 | Simulacro de entrevista o roleplay | ¿Te sentiste escuchado o escuchada? |
| 4 | Escritura: mejora un correo real | ¿Lo enviarías? |
| 5–7 | Repite tu situación más importante y mira Progreso | ¿Ves que mejoras? |
| 7 | **Califica VOXA** y escribe qué falta | — |
