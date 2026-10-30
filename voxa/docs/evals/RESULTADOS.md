# Prueba real de modelos por función (30 de octubre de 2026)

Corrida en GitHub Actions ([ejecución 40988734927](https://github.com/tradingfullmodeon/Weatherbot/actions/runs/40988734927)) con la clave de pruebas: 9 casos × 3 modelos, 1 repetición, API de Anthropic. Las llamadas pasaron por los mismos endpoints que usa la app.

## Resultados

Cada celda muestra: verificaciones aprobadas / total · segundos por llamada · costo por llamada.

| Función | Opus 5.5 | Sonnet 5.5 | Haiku 5.5 |
|---|---|---|---|
| Coach tras un ensayo | 9/9 · 22,0 s · US$0,0455 | 9/9 · 8,6 s · US$0,0138 | 9/9 · 11,3 s · US$0,0012 |
| Turno de roleplay | 5/5 · 4,6 s · US$0,0046 | 5/5 · 3,2 s · US$0,0020 | 5/5 · 2,5 s · US$0,0001 |
| Evaluación del roleplay | 5/5 · 15,7 s · US$0,0316 | 5/5 · 6,6 s · US$0,0109 | 5/5 · 7,4 s · US$0,0008 |
| Reescritura de correo | 3/4 · 14,7 s · US$0,0273 | 3/4 · 5,9 s · US$0,0093 | 4/4 · 9,4 s · US$0,0007 |
| Preguntas del evento | 3/3 · 19,0 s · US$0,0321 | 3/3 · 12,8 s · US$0,0161 | 3/3 · 13,8 s · US$0,0011 |

**Separación** (puntaje de la respuesta buena menos el de la floja: mide si los puntajes distinguen una buena de una mala):

| | Opus 5.5 | Sonnet 5.5 | Haiku 5.5 |
|---|---|---|---|
| Coach | **46,8** | 34,4 | 40,0 |
| Evaluación del roleplay | **59,5** | 51,0 | 38,2 |

La única verificación que falló fue «más breve» en el correo, con Opus y Sonnet: su reescritura superó las 45 palabras. Es una exigencia de estilo, no un error. No hubo fallas de formato, citas inventadas, datos inventados ni respuestas en otro idioma. Los tres sacaron la nota de seguridad ante el mensaje de crisis.

## Qué significa

1. **Calidad de los puntajes.** Opus es claramente el que mejor separa una práctica buena de una floja, sobre todo en la evaluación del roleplay: 59,5 puntos, frente a 51,0 de Sonnet y 38,2 de Haiku. Es lo que hace creíble a Talkride.
2. **El costo real es la mitad de lo estimado.** Con Opus en todo, una persona que paga (uso medio del caso de negocio) cuesta **unos US$0,84 al mes**, no US$1,58.
3. **Velocidad.** El coach con Opus tarda unos 22 segundos, lo que se siente largo. Sonnet tarda 9 y Haiku 11.
4. **Turnos de roleplay, correos y preguntas del evento.** Los tres modelos aprobaron todo. Haiku es el más rápido en los turnos (2,5 s) y cuesta entre 30 y 45 veces menos.

## Aplicando la regla de decisión (ARQUITECTURA.md §4.3)

Una función pasa a un modelo más económico solo si aprueba las mismas verificaciones y su separación no baja más de 5 puntos frente a Opus.

| Función | ¿Puede pasar a uno más económico? | Por qué |
|---|---|---|
| Coach | **No**, sigue en Opus | Sonnet baja 12,4 puntos de separación y Haiku 6,8 |
| Evaluación del roleplay | **No**, sigue en Opus | Sonnet baja 8,5 y Haiku 21,3 |
| Turno de roleplay | **Sí** (Haiku o Sonnet) | Aprueban todo; esta función no tiene medida de separación. Conviene escuchar algunas conversaciones antes de decidir |
| Reescritura de correo | **Sí** (Haiku) | Haiku aprobó todo, incluso la brevedad |
| Preguntas del evento | **Sí** (Haiku o Sonnet) | Aprueban todo |

**Combinación posible:** Opus en el coach y la evaluación, Haiku en los turnos, los correos y el evento. Cuesta unos **US$0,59 al mes por persona que paga** (30% menos) y deja los turnos de roleplay en 2,5 segundos. La decisión es del responsable del producto. Se aplica sin cambiar código, con las variables `VOXA_MODEL_ROLEPLAY`, `VOXA_MODEL_WRITING` y `VOXA_MODEL_EVENT` en Render.

**Antes de decidir:** se corrió una sola repetición con 9 casos. Conviene repetir con 3 repeticiones (modificando `voxa/server/evals/ejecutar.txt`, unos US$1,5) y leer algunas respuestas del roleplay en el detalle (Artifacts → `voxa-evals`).

---

## Confirmación con 3 repeticiones (30 de octubre de 2026)

[Ejecución 40990247335](https://github.com/tradingfullmodeon/Weatherbot/actions/runs/40990247335): 9 casos × 3 modelos × 3 repeticiones. Ahora sin la caché de respuestas, así que cada repetición llega de verdad al modelo.

| Función | Opus 5.5 | Sonnet 5.5 | Haiku 5.5 |
|---|---|---|---|
| Coach | 27/27 · 20,4 s · US$0,0457 | 27/27 · 8,6 s · US$0,0140 | 27/27 · 11,4 s · US$0,0012 |
| Turno de roleplay | 15/15 · 3,8 s · US$0,0050 | 15/15 · 2,5 s · US$0,0022 | **15/15 · 1,9 s** · US$0,0001 |
| Evaluación del roleplay | 15/15 · 12,7 s · US$0,0303 | 15/15 · 6,5 s · US$0,0112 | 14/15 · 7,5 s · US$0,0007 |
| Correo | 11/12 · 11,3 s · US$0,0259 | 11/12 · 5,4 s · US$0,0089 | 11/12 · 7,2 s · US$0,0008 |
| Preguntas del evento | **9/9** · 16,1 s · US$0,0300 | 8/9 · 11,6 s · US$0,0148 | 7/9 · 11,9 s · US$0,0012 |
| Separación (coach, evaluación) | **44,1 y 55,4** | 32,9 y 48,7 | 41,8 y 37,4 |

**Qué cambió respecto de la primera corrida:**
1. **Se confirma:** Opus es el que mejor separa una práctica buena de una floja. En los **turnos de roleplay**, los tres modelos aprueban todo, y Haiku responde en 1,9 segundos.
2. **No se sostiene:** que Haiku apruebe todo en las **preguntas del evento**. Con más repeticiones dio consejos demasiado largos (2 de 9). Sonnet falló una vez en dar preguntas específicas del caso. Opus siguió perfecto.
3. **Correo:** los tres empatan (11 de 12). La única falla es que la reescritura quedó un poco más larga de lo pedido.
4. Haiku falló una vez en reconocer que se había logrado el objetivo de la conversación. Confirma que la evaluación debe seguir en Opus.

**Recomendación revisada** (la decisión es del responsable del producto):

| Función | Modelo | Por qué |
|---|---|---|
| Coach, evaluación del roleplay y preguntas del evento | **Opus 5.5** | Puntajes más creíbles y el único sin fallas en el evento |
| Turnos de roleplay y correos | **Haiku 5.5** | Misma calidad medida, 2 veces más rápido en el roleplay y entre 30 y 50 veces más económico |

**Costo por persona que paga:**
- Con esa combinación: **unos US$0,61 al mes**.
- Con Opus en todo: unos US$0,85 al mes.

Ahorra un 28% y el roleplay se siente más fluido.

**Para aplicarla:** en Render → servicio voxa → Environment, agregar:
- `VOXA_MODEL_ROLEPLAY=claude-haiku-5-5`
- `VOXA_MODEL_WRITING=claude-haiku-5-5`
