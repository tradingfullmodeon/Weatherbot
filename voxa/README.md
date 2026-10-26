# VOXA — Entrenamiento acelerado en comunicación

Plataforma para mejorar cómo se comunica una persona (confianza, desarrollo profesional, liderazgo, hablar en público, conversaciones difíciles, comunicación digital) con práctica guiada por IA y evaluación objetiva por cámara y micrófono.

> Proyecto independiente de PolyWeather Bot; vive en esta carpeta y no comparte código con el bot.

## Contenido

| Ruta | Qué es |
|---|---|
| [`docs/BENCHMARK.md`](docs/BENCHMARK.md) | Benchmark global (Norteamérica, Europa, Asia, mundo hispanohablante), matriz de funcionalidades, necesidades de los usuarios, quejas recurrentes y 20 mejoras diferenciadoras, con fuentes. |
| [`docs/ESTRATEGIA.md`](docs/ESTRATEGIA.md) | Metodologías de comunicación y aprendizaje, lenguaje no verbal basado en evidencia, competencias y niveles, canales, motor de evaluación, arquitectura, privacidad y regulación, sprint de 30 días, modelo de negocio, plan de desarrollo e indicadores. |
| [`prototype/`](prototype/) | Web app: **Evaluar** (`index.html`), **Roleplay IA** (`roleplay.html`) y **Mi progreso** (`progreso.html`). |
| [`server/`](server/) | API FastAPI: coach IA (`/api/feedback`), roleplay con personajes (`/api/roleplay`, `/api/roleplay/evaluate`). También sirve el prototipo. |

## Ejecutar

```bash
cd voxa/server
pip install -r requirements.txt
export ANTHROPIC_API_KEY=...        # opcional: sin credenciales todo funciona en modo sin IA
uvicorn app:app --port 8000
# abrir http://localhost:8000 en Chrome o Edge
```

Sólo el prototipo, sin servidor: `cd voxa/prototype && python3 -m http.server 8000`. El evaluador, el progreso y el roleplay en modo sin IA funcionan igual.

El modelo se configura con `VOXA_MODEL` (por defecto `claude-opus-5-5`). Las llamadas usan salida JSON con esquema estricto y `fallbacks: "default"` ante rechazos del modelo.

Pruebas del servidor (con un cliente de Anthropic simulado, sin consumir la API): `cd voxa/server && python3 -m pytest -q`.

## Qué incluye

**Evaluar.** Graba con cámara y micrófono y mide localmente:
- **Voz:** ritmo, muletillas regionales, tiempo hablando, silencios largos, variación de tono, volumen.
- **Lenguaje:** atenuadores y desarrollo del contenido.
- **Presencia:** encuadre, mirada a cámara, sonrisa y estabilidad (MediaPipe).

Entrega un puntaje ponderado por escenario, una fortaleza, un foco y un ejercicio, una línea de tiempo, el replay y el **coach IA** (estructura según el método y reescritura de tu respuesta). También registra tus nervios antes y después.

**Roleplay IA.** Conversaciones por voz (o texto) con 6 personajes con objetivo: reclutadora, jefe, clienta molesta, inversionista, colega y networking. Tiene 3 niveles de dificultad, pistas del coach en vivo, la opción de **rebobinar tu última respuesta y reintentar**, y mide tiempo de habla, preguntas y muletillas. Al final hay una evaluación de escucha, empatía, claridad, asertividad, manejo de objeciones y logro del objetivo.

**Mi progreso.** Línea base, tendencia, racha, "calma ganada", foco recurrente, sprint de 30 días con la tarea del día, escalera de confianza de 9 peldaños y exportación o borrado de datos.

**Privacidad.** El audio y el video se analizan en el navegador. Al coach IA sólo se envían la transcripción y las métricas, y sólo cuando lo pides. El historial queda en tu navegador. VOXA mide conductas observables y nunca infiere emociones.

## Limitaciones conocidas

- La transcripción usa la Web Speech API (mejor en Chrome/Edge) y suele omitir "eh/em".
- Los rangos objetivo son heurísticas iniciales a calibrar con datos reales.
- Si el CDN de MediaPipe no carga, sólo se evalúan voz y lenguaje.
- El historial vive en el `localStorage` del navegador (prototipo): no se sincroniza entre dispositivos.
- La voz de los personajes usa la síntesis del navegador; la calidad depende de las voces en español instaladas.
