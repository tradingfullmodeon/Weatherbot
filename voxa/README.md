# VOXA — Entrenamiento acelerado en comunicación

Plataforma para mejorar cómo se comunica una persona (confianza, desarrollo profesional, liderazgo, hablar en público, conversaciones difíciles, comunicación digital) con práctica guiada por IA y evaluación objetiva por cámara y micrófono.

> Proyecto independiente de PolyWeather Bot; vive en esta carpeta y no comparte código con el bot.

## Contenido

| Ruta | Qué es |
|---|---|
| [`docs/BENCHMARK.md`](docs/BENCHMARK.md) | Benchmark global (Norteamérica, Europa, Asia, mundo hispanohablante), matriz de funcionalidades, necesidades de los usuarios, quejas recurrentes y 27 mejoras diferenciadoras, con fuentes. |
| [`docs/CALIFICACIONES.md`](docs/CALIFICACIONES.md) | Calificaciones de usuarios de 25 apps de la competencia (App Store, Google Play, G2, Trustpilot), qué hace que una app tenga 4,7 o más y qué la hunde, cómo sale VOXA en esos criterios y plan de acción por brecha. |
| [`docs/PANEL.md`](docs/PANEL.md) | Panel experto simulado (profesora de oratoria, coach ejecutivo, psicóloga, diseñadora de producto, investigador en voz e IA y una usuaria principiante): método, puntajes por ronda y qué se corrigió. |
| [`docs/PLAN_ACCION.md`](docs/PLAN_ACCION.md) | Plan para subir la calificación y llegar a las primeras 30 personas: a quiénes invitar, mensaje de invitación listo, guía de prueba de 7 días, indicadores y reglas de decisión. |
| [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md) | Arquitectura operativa: qué hacen las reglas y qué hace la IA en cada función, pruebas con distintos modelos y nubes, plataformas elegidas con su costo mensual, seguridad y pasos para operar. |
| [`docs/APP_NATIVA.md`](docs/APP_NATIVA.md) | Qué se necesita para tener VOXA en iOS, Android y web con todas las funcionalidades: arquitectura (Capacitor y el servidor actual), componentes, requisitos de tiendas, plan de 8–11 semanas y costos. |
| [`docs/CASO_NEGOCIO.md`](docs/CASO_NEGOCIO.md) | Mini caso de negocio: costo por usuario, precios frente a la competencia, margen, valor de vida, punto de equilibrio y proyección a 18 meses. El modelo reproducible está en `docs/negocio/modelo.py`. |
| [`docs/AUDITORIA.md`](docs/AUDITORIA.md) | Auditoría técnica y pedagógica: hallazgos, cómo se reproducían, correcciones y temas abiertos. |
| [`docs/UX.md`](docs/UX.md) | Revisión de usabilidad: 14 problemas y su solución, principios de diseñadores y comunicadores aplicados, benchmark de UX con las apps mejor valoradas e indicadores antes/después. |
| [`docs/ESTRATEGIA.md`](docs/ESTRATEGIA.md) | Metodologías de comunicación y aprendizaje, lenguaje no verbal basado en evidencia, competencias y niveles, canales, motor de evaluación, arquitectura, privacidad y regulación, sprint de 30 días, modelo de negocio, plan de desarrollo e indicadores. |
| [`prototype/`](prototype/) | Web app instalable (PWA): **Hoy** (`index.html`), **Evaluar** (`evaluar.html`), **Roleplay** (`roleplay.html`), **Gimnasio de voz** (`gimnasio.html`), **Escritura** (`escritura.html`) y **Aprender** (`aprender.html`), **Evento real** (`evento.html`), **Diagnóstico** (`diagnostico.html`) y **Progreso** (`progreso.html`). Escenarios en `scenarios.js`, lecciones en `lessons.js`, eventos en `events.js`, diagnóstico y metas en `goals.js`, análisis de grabaciones en `audiofile.js`, calificaciones en `feedback.js`, recordatorios en `reminder.js`, revisión de textos en `writing.js`, plan de 30 días en `plan.js` y acceso a cámara y micrófono en `devices.js`. |
| [`artifact/`](artifact/) | Versión publicable como página de claude.ai (una sola página, coach IA vía la capacidad `sample`), generada con `build.py`. |
| [`server/`](server/) | API FastAPI: coach IA (`/api/feedback`), roleplay con personajes (`/api/roleplay`, `/api/roleplay/evaluate`) escritura (`/api/writing`) y preguntas para un evento real (`/api/event-questions`). Planes y cupos en `quotas.py`, nubes en `providers.py`, banco de pruebas por modelo en `evals/`, pagos en `/api/webhooks/revenuecat`. También sirve el prototipo. |
| [`app/`](app/) | App para iOS y Android con Capacitor: la misma app web empaquetada (`npm run sync`), proyectos `android/` e `ios/` con permisos de micrófono, cámara, voz y notificaciones, y transcripción nativa del teléfono (`native-speech.js`). |

## Usarla ahora

**Versión web publicada (claude.ai):** https://claude.ai/artifact/Q8vtmWQ5KWWXHWFnwzBNXr

Incluye el **diagnóstico inicial con metas**, Hoy, Ensayar (respuesta escrita o grabación hecha con la cámara o la grabadora del celular), análisis de **lenguaje corporal** desde tu video (4 fotogramas revisados por IA), Roleplay con 9 personajes, Escritura, Aprender (12 lecciones), **Evento real** (plan hasta la fecha y preguntas difíciles personalizadas con IA) y Progreso. El coach IA usa la cuenta de Claude de quien la abre (claude.ai pide permiso la primera vez), sin servidor ni API key. Las páginas de claude.ai no permiten usar la cámara ni el micrófono en vivo, así que la evaluación en vivo, la audiencia virtual y el gimnasio de voz están en la versión completa (abajo). El link es privado hasta que se comparte desde el menú «Compartir» de la página.

**Cámara y micrófono en el link de claude.ai:** las páginas de claude.ai no pueden usar la cámara ni el micrófono *en vivo*. En «Ensayar → Subir una grabación», los botones «Grabarme en video» y «Grabar sólo mi voz» abren directamente la cámara o la grabadora del celular (atributo `capture`). Al terminar, la grabación vuelve a la página y se analiza en el navegador. En el computador abren el selector de archivos.

**Versión completa con cámara y micrófono en vivo (GitHub Pages).** El flujo `.github/workflows/voxa-pages.yml` publica `voxa/prototype` en https://tradingfullmodeon.github.io/Weatherbot/. Para activarla una sola vez:
1. Integra estos cambios en `main` (por ejemplo, con un pull request de la rama `claude/kind-ptolemy-5yibyk`).
2. En GitHub: Settings → Pages → Source: «GitHub Actions».
3. Ejecuta el flujo (Actions → «Publicar VOXA en GitHub Pages» → Run workflow) o haz cualquier cambio en `voxa/prototype`.

Como Pages no ejecuta el servidor, el coach IA no está disponible ahí (todo lo demás sí). Para el coach IA en vivo, ejecuta el servidor (abajo) o usa el link de claude.ai.

**Acceso a cámara y micrófono (`prototype/devices.js`):**
- Pide los permisos al pulsar «Empezar» y nunca antes.
- Si la cámara no está disponible (no existe, está ocupada o se bloqueó sólo la cámara), sigue en **modo sólo voz**. Ese modo también se puede elegir a propósito.
- Explica cada error en lenguaje simple (permiso bloqueado, otra app usando la cámara, página sin https, navegador de WhatsApp o Instagram) con los pasos para desbloquear en Chrome, Safari, Firefox, Android e iPhone.
- En «Hoy» incluye **«Probar cámara y micrófono»**, con vista previa, medidor de voz y estado de cada permiso.

Para regenerarla tras cambiar el prototipo: `python3 voxa/artifact/build.py` (combina `prototype/shared.js`, `prototype/scenarios.js`, `prototype/lessons.js`, `prototype/writing.js`, `prototype/events.js`, `prototype/goals.js`, `prototype/voxa.css` y `server/personas.py` con `artifact/app.js` en `artifact/dist/voxa.html`).

## Publicar la versión completa con la IA de VOXA (un solo servicio)

La IA la pone VOXA: la clave de Anthropic vive sólo en el servidor y cada persona tiene cupos según su plan (`server/quotas.py`: gratis sin IA, prueba de 7 días y Pro con uso justo), más un tope de gasto mensual (`VOXA_MONTHLY_BUDGET_USD`).

Para publicarla en Render:
1. New → Blueprint → este repositorio (usa `voxa/render.yaml` y `voxa/Dockerfile`).
2. Carga `ANTHROPIC_API_KEY` en el panel.

Alternativa más económica: Fly.io con `voxa/fly.toml` (los pasos están al inicio del archivo).

Se obtiene un link https con micrófono y cámara en vivo, coach IA incluido y app instalable desde el navegador.
- `/api/me` muestra el plan y los cupos que le quedan a cada persona.
- `/api/admin/usage`, con `Authorization: Bearer <VOXA_ADMIN_TOKEN>`, muestra el gasto del mes y el costo por llamada.

| Variable | Para qué |
|---|---|
| `VOXA_PROVIDER` | Nube de la IA: `anthropic` (por defecto), `aws`, `bedrock`, `vertex` o `foundry` (ver `server/providers.py`) |
| `VOXA_MODEL`, `VOXA_MODEL_<FUNCIÓN>` | Modelo general y por función (`FEEDBACK`, `ROLEPLAY`, `EVALUATE`, `WRITING`, `EVENT`) |
| `VOXA_DEFAULT_PLAN`, `VOXA_MONTHLY_BUDGET_USD`, `VOXA_RATE_LIMIT` | Plan inicial, tope de gasto del mes y consultas por minuto por IP |
| `VOXA_ADMIN_TOKEN` | Acceso a `/api/admin/usage` |
| `VOXA_REVENUECAT_AUTH` | Secreto del webhook de pagos |
| `VOXA_JWT_SECRET` o `VOXA_JWKS_URL` (+ `VOXA_JWT_AUD`) | Cuentas verificadas (Supabase Auth u otro emisor); sin ellas se usa el id del dispositivo |
| `VOXA_CORS_ORIGINS` | Orígenes que pueden llamar a la API (por defecto, la app instalable) |

App instalable: `cd voxa/app && npm install && VOXA_API_BASE=https://tu-servidor/ npm run android` (o `npm run ios` en una Mac).

## Ejecutar la versión completa

```bash
cd voxa/server
pip install -r requirements.txt
export ANTHROPIC_API_KEY=...        # opcional: sin credenciales todo funciona en modo sin IA
uvicorn app:app --port 8000
# abrir http://localhost:8000 en Chrome o Edge
```

Sólo el prototipo, sin servidor: `cd voxa/prototype && python3 -m http.server 8000`. Todo funciona igual menos el coach IA (el roleplay usa un entrevistador con preguntas fijas y la escritura sólo hace la revisión instantánea).

El modelo se configura con `VOXA_MODEL` (por defecto `claude-opus-5-5`) y se puede elegir por uso con `VOXA_MODEL_FEEDBACK`, `VOXA_MODEL_ROLEPLAY`, `VOXA_MODEL_EVALUATE`, `VOXA_MODEL_WRITING` y `VOXA_MODEL_EVENT`. `/api/admin/usage` muestra los tokens y el costo estimado por uso. Las llamadas usan salida JSON con esquema estricto y, donde la plataforma y el modelo lo admiten, `fallbacks: "default"` ante rechazos del modelo.

Comparar modelos y nubes en cada función: `cd voxa/server && python -m evals.run --out ../docs/evals/RESULTADOS.md` (necesita la clave; cuesta menos de US$1; ver [ARQUITECTURA.md](docs/ARQUITECTURA.md) §4).

Pruebas:
- Servidor, con un cliente de Anthropic simulado y sin consumir la API: `cd voxa/server && python3 -m pytest -q`.
- Motor de análisis y contenido (muletillas en contexto, tono, «eeeh», escritura, legibilidad, integridad de escenarios, lecciones y plan): `cd voxa && npm test`.

El flujo `.github/workflows/voxa-ci.yml` corre ambas en cada cambio y verifica que `artifact/dist/voxa.html` esté regenerado.

## Qué incluye

**Diagnóstico y metas.** Tras la bienvenida, un diagnóstico de unos 8 minutos: 8 afirmaciones sobre cómo te ves, una prueba de voz de 60 s y una prueba escrita. Entrega tu nivel, un radar en 8 dimensiones, fortalezas, prioridades y puntos ciegos (dónde te ves distinto de lo que medimos). De ahí eliges hasta 3 metas con plazo, que avanzan solas con cada práctica que cumple su criterio. A las 4 semanas, Hoy propone repetir el diagnóstico, y Progreso compara el primero con el último. Está en las dos versiones (`prototype/goals.js`, `prototype/diagnostico.html`). La práctica del día de Hoy rota entre tus metas activas.

**Hoy.** La primera vez, una bienvenida de 3 preguntas (objetivo, nervios y variante de español), sin crear cuenta, que lleva al diagnóstico. Después, tus metas con su avance, la práctica del día del plan de 30 días a un toque, tu racha, accesos rápidos, un consejo del día y los ajustes.

**Evaluar.** Elige entre 22 escenarios en 6 ambientes (Confianza, Profesional, Liderazgo, Público, Social, Digital); se puede enlazar uno directo con `evaluar.html?escenario=toast` (y `&audiencia=1`). Un solo botón «Empezar» pide permisos, hace una cuenta regresiva, muestra la consigna sobre el video y termina solo al acabar el tiempo. La **audiencia virtual** opcional reacciona en vivo a cómo hablas. Mide localmente:
- **Voz:** ritmo, muletillas regionales, **sonidos de duda «eh/mmm» detectados en el audio** (los que la transcripción borra), tiempo hablando, silencios largos, variación de tono, volumen.
- **Lenguaje:** atenuadores y desarrollo del contenido.
- **Presencia:** encuadre, mirada a cámara, sonrisa y estabilidad (MediaPipe).

El reporte empieza con el puntaje, la comparación con tu intento anterior y tres tarjetas (lo que hiciste bien, tu único foco y un ejercicio de 2 minutos), más «Repetir aplicando el foco». Métricas, línea de tiempo, video y transcripción quedan en secciones desplegables. El **coach IA** analiza la estructura según el método y reescribe tu respuesta. También registra tus nervios antes y después.

**Roleplay.** Conversaciones por voz («tocar para hablar») o por texto con 9 personajes con objetivo: reclutadora, jefe, clienta molesta, inversionista, colega, networking y, para quienes lideran, un colaborador que entrega tarde (feedback SBI), una gerenta de finanzas escéptica (comité de presupuesto) y una persona del equipo que recibe una mala noticia. Tiene 3 niveles de dificultad, pistas del coach en vivo, la opción de **rebobinar tu última respuesta y reintentar**, y mide tiempo de habla, preguntas y muletillas. Puedes pegar la oferta de trabajo, tu CV o notas de la reunión para que el personaje base sus preguntas en tu situación real. Al final hay una evaluación de escucha, empatía, claridad, asertividad, manejo de objeciones y logro del objetivo.

**Escritura.** Seis tipos de texto (pedir algo, decir que no, feedback, disculpa, mensaje breve y LinkedIn). La revisión instantánea en el dispositivo comprueba si hay un pedido explícito y al inicio, un plazo, el largo de las frases, la legibilidad (Fernández Huerta), frases que restan seguridad, disculpas innecesarias y mayúsculas. Con el servidor conectado, la IA entrega una versión lista para enviar y un asunto sugerido.

**Evento real.** Cargas tu entrevista, charla, reunión, conversación difícil, pitch o brindis con su fecha. VOXA arma un plan de práctica repartido hasta la víspera (si es mañana, un plan intensivo de 3 prácticas hoy), con preguntas difíciles probables según el tipo de evento y, con IA, otras personalizadas según tu audiencia, tu mensaje y lo que te preocupa. Incluye una rutina para la noche anterior, una hora antes y diez minutos antes, y notas para después. Mientras el evento está próximo, Hoy muestra su cuenta regresiva y la práctica del día.

**Aprender.** 12 micro-lecciones de 2–3 minutos con ejemplo «así no / así sí», errores comunes, una pregunta de repaso y un botón «Practicar ahora» que abre el ejercicio exacto. El reporte de cada evaluación enlaza la lección de tu foco, y Hoy sugiere la siguiente lección pendiente.

**Gimnasio de voz.** Cinco calentamientos medidos en vivo con mejores marcas:
- **Sostén la vocal:** segundos y estabilidad del tono.
- **Sirena:** rango en semitonos.
- **Escalera de volumen:** rango dinámico en dB, en el orden suave → proyectado.
- **Trabalenguas:** precisión y velocidad, en 5 niveles.
- **Lectura con pausas:** pausas logradas frente a las marcadas.

Desactiva la ganancia automática y la supresión de ruido del navegador para medir niveles reales, por eso conviene usar auriculares.

**Mi progreso.** Línea base, tendencia, racha, "calma ganada", foco recurrente, sprint de 30 días con la tarea del día, escalera de confianza de 9 peldaños y exportación o borrado de todos tus datos.

**Feedback por método.** Además de voz y lenguaje, cada ensayo revisa la estructura del método de la situación (PREP, STAR, BLUF o SBI): qué partes están, cuál falta y cómo agregarla. El **simulacro de entrevista** sin IA repregunta el resultado cuando falta y da un reporte respuesta por respuesta.

**Cuidado.** Modo calma sin números (automático en las primeras prácticas de quien dice que le cuesta mucho), meta de exposición «practicar aunque haya nervios», «💙 ¿Te sientes muy mal?» con líneas de ayuda y emergencias por país, detección de frases de crisis en el dispositivo y «Buscar un profesional».

**Califica VOXA.** Tras 3 prácticas, Hoy pide una calificación (estrellas de 1 a 5, como en las tiendas, más NPS, qué sirve y qué falta), como mucho una vez al mes. En el link de claude.ai, quien es dueño ve el tablero con el promedio, la distribución y el NPS. Para que otras personas califiquen, compártelo con permiso de **Colaborador**.

**Recordatorio diario.** En Hoy eliges la hora y lo agregas a Google Calendar (o como archivo .ics en la versión completa).

**Privacidad.** El audio y el video se analizan en el navegador. La excepción en la versión completa es la transcripción en vivo: usa el reconocimiento de voz del navegador, que en Chrome y Edge procesa el audio en los servidores de Google o Microsoft (se avisa en la bienvenida). Al coach IA sólo se envían la transcripción y las métricas, y sólo cuando lo pides. La excepción es el análisis de lenguaje corporal del link de claude.ai: si lo pides, envía 4 fotogramas de tu video a Claude. El historial queda en tu navegador. VOXA mide conductas observables y nunca infiere emociones.

## Limitaciones conocidas

- La transcripción usa la Web Speech API (mejor en Chrome/Edge) y suele omitir "eh/em".
- Los rangos objetivo son heurísticas iniciales a calibrar con datos reales.
- Si el CDN de MediaPipe no carga, sólo se evalúan voz y lenguaje.
- El detector de «eh/mmm» es una estimación acústica (tramos sonoros largos de tono plano): una vocal alargada a propósito puede contarse.
- El historial vive en el `localStorage` del navegador (prototipo): no se sincroniza entre dispositivos.
- La voz de los personajes usa la síntesis del navegador; la calidad depende de las voces en español instaladas.
