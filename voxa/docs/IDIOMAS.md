# Idiomas de práctica

La app guía en español. Lo que la persona dice, escribe y escucha va en el idioma que elija en Ajustes, o en la bienvenida: el reconocimiento de voz, el análisis de muletillas y atenuadores, la revisión de estructura y de escritura, las citas y reescrituras del coach IA y los personajes del roleplay.

## Qué idiomas y por qué

| Idioma | Por qué | Reconocimiento de voz |
|---|---|---|
| **Español (Latinoamérica)** | Mercado principal de Talkride | Usa el país del dispositivo si es de la región (es-CL, es-AR, es-CO, es-MX…). Si no, usa es-MX |
| **English** | El idioma más estudiado del mundo: primero en 154 países según el [Duolingo Language Report 2025](https://blog.duolingo.com/2024-duolingo-language-report/). Entrevistas y reuniones en inglés son la necesidad número uno de los profesionales latinoamericanos. Speeko, que sólo funciona en inglés, tiene como mercados principales EE. UU., India y Filipinas ([Adapty](https://adapty.io/paywall-library/speeko/)) | La región del dispositivo (en-US, en-GB, en-IN…) o, si no, en-US |
| **Português (Brasil)** | El mercado más grande de Latinoamérica | Siempre pt-BR |
| **Français, Deutsch, Italiano** | Están en el top 7 de idiomas más estudiados del mundo ([resumen del informe](https://duolingoguides.com/duolingo-language-report/)) y son mercados de formación profesional con poder de pago | fr-FR, de-DE, it-IT, o la región del dispositivo |

**Japonés, coreano, chino e hindi** también están entre los diez idiomas más estudiados, pero quedan para una segunda etapa por dos razones:

- **Las reglas de análisis no les sirven:** se basan en palabras separadas por espacios y en muletillas propias de cada idioma, y el japonés y el chino no separan las palabras con espacios.
- **Lo que más piden esos usuarios es practicar en inglés,** y eso ya está cubierto.

## Español: una sola opción, Latinoamérica

Antes había ocho variantes, entre ellas «Estados Unidos» y «España». Ahora hay una sola: **Español (Latinoamérica)**.

- **El reconocimiento sigue preciso:** usa en silencio el país del dispositivo cuando es de la región, así que reconoce bien los modismos locales.
- **Problema corregido:** la opción anterior por defecto, «es-419», no la aceptan todos los motores de reconocimiento de voz. Ahora, fuera de la región, se usa es-MX, la variante con más soporte.
- **Nadie pierde nada:** los perfiles que tenían guardada una variante (es-CL, es-US…) quedan automáticamente en español.

## Qué cambia en cada idioma

- **Muletillas y atenuadores propios.** Por ejemplo «um» y «you know», «tipo» y «né», «euh» y «du coup», «äh» y «halt», «ehm» y «cioè». Las palabras que también tienen un uso normal sólo cuentan junto a una pausa: «I like coffee» no cuenta, «it was, like, fine» sí.
- **Estructura (PREP, STAR, BLUF, SBI) con marcadores del idioma,** y consejos con ejemplos en ese idioma («I had to…», «Eu tinha que…»).
- **Escritura:** detecta el pedido, el plazo, las disculpas y los saludos vacíos, y mide la legibilidad con el índice propio de cada idioma:

| Idioma | Índice de legibilidad |
|---|---|
| Español | Fernández Huerta |
| Inglés | Flesch |
| Portugués | Flesch adaptado |
| Francés | Kandel y Moles |
| Alemán | Amstad |
| Italiano | Flesch-Vacca |

- **Coach IA:** explica en español, y cita, reescribe y propone frases en el idioma de práctica.
- **Roleplay:** el personaje habla el idioma de práctica, con la voz del teléfono en ese idioma.

## Pendiente

- **Interfaz traducida.** Hoy la interfaz está en español. Traducirla al inglés y al portugués requiere revisar con hablantes nativos las lecciones, las situaciones y los personajes. Se recomienda hacerlo cuando se abra la venta fuera de Latinoamérica.
- **Validar las listas de muletillas con hablantes nativos.** Se puede usar el mismo kit de calibración de profesores (`docs/calibracion/`).
- **Simulador de entrevista sin IA.** Cuando no hay coach IA, sus preguntas siguen en español.
