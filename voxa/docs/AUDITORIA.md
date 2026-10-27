# Auditoría de la plataforma (octubre de 2026)

Revisión completa de las dos versiones de VOXA: la publicada en claude.ai y la completa (PWA). Se recorrieron todas las vistas a 390 px de ancho, se forzaron casos límite (silencio, tono puro, grabaciones de un segundo, almacenamiento bloqueado, zona horaria de América por la noche, doble toque) y se revisaron los prompts de IA y la API.

**Resultado:** 2 hallazgos críticos, 7 importantes y 20 menores. Todos los críticos e importantes quedaron corregidos y cubiertos por pruebas automáticas. Lo que sigue abierto figura al final.

## Críticos (P0)

| # | Hallazgo | Cómo se reproducía | Corrección |
|---|---|---|---|
| 1 | Una grabación muda o sin voz recibía un puntaje aprobatorio | 60 s de silencio daban **67, «Nivel Competente»** y «Silencios limpios». En el diagnóstico, «Fluidez» salía medida en 100. | Con menos de 4 s de voz no se puntúa y se avisa «No detectamos voz suficiente». El silencio que dura hasta el final se cuenta como pausa larga. Sin tono medible, el ítem se omite (antes valía 50). La versión completa suma la métrica de duración. |
| 2 | Las metas se podían cumplir sin practicar | Analizar 3 veces el mismo audio cumplía la meta de 30 días en un minuto. «Hola soy Ana y ya» ×3 cumplía «Hablar con seguridad». | Volver a analizar lo mismo actualiza la práctica en vez de sumar otra. Cada meta cuenta como máximo un día. Las metas de lenguaje exigen al menos 30 palabras. |

## Importantes (P1)

| # | Hallazgo | Corrección |
|---|---|---|
| 3 | Fechas en UTC: en América, de noche, la racha se cortaba, «hoy» no contaba y un evento de mañana decía «es hoy» | Día local en racha, plan, metas, eventos y formularios (`localDay` en `shared.js`) |
| 4 | El coach IA podía analizar con otra consigna (el tema de improvisación se volvía a sortear al cambiar de vista) | El reporte guarda su escenario y su consigna; no se sortea un tema nuevo con un reporte abierto |
| 5 | Escritura: tres textos se guardaban como uno, una letra mantenía la racha y el texto de la IA contaba para la meta | Un borrador nuevo por tipo, al vaciar o al adoptar la versión de la IA; largo mínimo; el texto de la IA no cuenta para metas |
| 6 | Con el almacenamiento bloqueado, el progreso desaparecía en silencio | Respaldo en memoria durante la visita y aviso visible |
| 7 | La estructura no se medía: «palabra» ×200 sacaba 100/100 | Nueva métrica de variedad de vocabulario (índice de Guiraud); el desarrollo del contenido depende de ella. El relleno repetido baja a «Practicante». |
| 8 | Los personajes del roleplay no tenían regla de seguridad | Si la persona cuenta angustia, riesgo o abuso real, el personaje sale de su papel, sugiere apoyo y termina (`safety_note`), en las dos versiones y en el servidor |
| 9 | Pedir disculpas de verdad se castigaba como «inseguridad» | Sólo cuentan «perdón por molestar» y similares; la disculpa real no resta, y en Escritura no se penaliza dos veces |

## Menores (P2) corregidos

- **Roleplay:**
  - «Terminar y evaluar» con doble toque guardaba dos sesiones.
  - En entrevistas ya no se exige que la persona haga preguntas, y se espera que hable más.
  - La conversación con IA ya no envía dos turnos seguidos del usuario.
- **Evento real:**
  - Las prácticas de dificultad alta abren en dificultad alta.
  - El ejercicio del gimnasio abre un ensayo equivalente, con aviso, en el link publicado.
- **Plan y metas:**
  - El plan de 28 días avanza con los días practicados (antes, si faltabas, se saltaban tareas, incluida la re-evaluación final).
  - Una tarea por escrito ya no abre en modo grabación.
  - Las metas dicen «Falta 1 día» o «Último día», en lugar de «Faltan 1 días» o 31 días en una meta de 30.
- **Reporte:**
  - Si todo está en rango, ya no muestra un «único foco» contradictorio.
  - Avisa cuando el texto escrito es parcial, en vez de calcular un ritmo falso.
  - Sin texto, el coach IA no puede inventar citas ni reescrituras.
- **Diagnóstico:**
  - Escala de acuerdo coherente (de «Nada de acuerdo» a «Totalmente»).
  - En empates gana lo medido.
  - Las dimensiones sin prueba se marcan «según cómo te ves».
  - El respaldo del iPhone pide un toque antes de reproducir.
  - Existe también en la versión completa, con grabación en vivo y transcripción.
- **Datos:**
  - «Borrar todos mis datos» borra también el diagnóstico, las metas, las lecciones y el evento, incluido el material pegado.
  - «Calma ganada» ya no muestra signos dobles.
- **Accesibilidad:** el anillo de foco del teclado quedaba en el botón equivocado.
- **Contenido:** las lecciones del link publicado ya no prometen el gimnasio ni la audiencia virtual.
- **Servidor:**
  - La transcripción y el material del usuario van delimitados como datos, no como instrucciones.
  - Hay límites de tamaño en las entradas.
  - Una respuesta vacía del modelo ya no produce un error 500.

## Abiertos

| Tema | Por qué sigue abierto | Plan |
|---|---|---|
| Transcripción en el link publicado | claude.ai no permite el reconocimiento de voz del navegador en sus páginas | El reporte explica qué falta; a mediano plazo, transcripción en el servidor para la app instalable ([plan](CALIFICACIONES.md#4-plan-de-acción-por-brecha)) |
| Escucha y Confianza sólo se autoevalúan en el diagnóstico | Medirlas exige roleplay y nervios registrados antes del diagnóstico | Usar el último roleplay y los nervios declarados cuando existan |
| Puntaje total distinto entre versiones | La completa pondera por escenario e incluye presencia; la publicada no tiene presencia en vivo | Unificar al calibrar los rangos con profesores |
| Si se revoca el permiso de IA a mitad de un roleplay, se cambia al entrevistador sin IA conservando la charla anterior | Caso raro | Reiniciar la conversación con un aviso |
| Rangos de las métricas | Son heurísticas iniciales | Calibración con 50 grabaciones puntuadas por profesores de oratoria |

## Verificación

- 37 pruebas del motor y del contenido, y 18 de la API, todas pasan.
- En el navegador se probaron:
  - el diagnóstico completo en las dos versiones;
  - el respaldo del iPhone (.MOV);
  - silencio, misma grabación repetida y relleno repetido;
  - borradores de escritura;
  - calificación;
  - racha y eventos en la zona horaria de México a las 20 h.

## Revisión de eficiencia y consistencia (octubre de 2026)

| Tema | Hallazgo | Cambio |
|---|---|---|
| Costo de IA | Sin medición: no se sabía cuánto costaba cada uso | `/api/status` acumula tokens y costo estimado por uso (coach, roleplay, evaluación, escritura, evento). Es la base del costo por usuario |
| Respuestas cortadas | `max_tokens` de 1.500–4.000 con razonamiento activo podía cortar la respuesta, y cada corte es un reintento pagado | Techos de 4.000 (roleplay) y 16.000 (resto). El techo no se cobra; sólo se cobra lo generado |
| Caché | Cada turno del roleplay reenviaba todo el historial al precio completo | Caché del prefijo de la conversación: las lecturas de caché cuestan un 5% de la entrada normal en Opus 5.5 |
| Modelo por uso | Un solo modelo para todo | `VOXA_MODEL_<USO>` permite elegir el modelo por uso sin tocar código. La elección queda como decisión de calidad, con su costo en [CASO_NEGOCIO.md](CASO_NEGOCIO.md) |
| Duplicación | El simulacro sin IA y el puntaje de voz estaban duplicados (y desalineados) entre las dos versiones | `interview.js` y `audiofile.js` compartidos. La evaluación en vivo usa el mismo motor (incluida la estructura por método). Una corrección se aplica en las dos versiones a la vez |
| Gasto gratuito | — | El link de claude.ai usa la cuenta de Claude de quien la abre: costo de IA 0 para VOXA |
| Pruebas | 44 pruebas del motor y 18 de la API | **47 del motor y 20 de la API**, más recorridos en el navegador de ambas versiones |

