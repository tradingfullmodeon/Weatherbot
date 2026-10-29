# Arquitectura de VOXA: plataforma operativa al menor costo y con la mayor calidad

Octubre de 2026. Este documento completa [APP_NATIVA.md](APP_NATIVA.md) (qué construir) y [CASO_NEGOCIO.md](CASO_NEGOCIO.md) (cuánto cuesta y cuánto deja). Aquí está **cómo queda armada la plataforma**, **qué hace la IA y qué hacen las reglas en cada función**, **cómo se prueban los modelos y las nubes** y **qué falta para operar**.

## 1. La idea en una frase

**Todo lo que se puede medir con reglas se mide en el teléfono, gratis y sin internet. La IA de VOXA, pagada por nosotros y protegida en nuestro servidor, se usa sólo donde aporta algo que las reglas no pueden dar.** Así la calidad es alta, el costo es bajo y cada gasto se controla.

## 2. Mapa de la plataforma

```
                      ┌───────────────────────── Teléfono / navegador (una sola base de código) ─────────────────────────┐
  App Store ─┐        │  App web VOXA (prototype/)                                                                       │
  Play Store ┼──────▶ │   · voz: ritmo, pausas, «eeh», muletillas, tono, volumen       · cámara: mirada y postura        │
  Web (https)┘        │   · estructura PREP/STAR/BLUF/SBI · escritura · diagnóstico · metas · plan · lecciones · simulacro │
                      │   · transcripción del teléfono (Web Speech o nativa)        · voz del personaje (sistema)        │
                      │  Capacitor (app/): micrófono, cámara, transcripción nativa, notificaciones, compras             │
                      └───────────────┬──────────────────────────────────────────────────────────────────────────────────┘
                                      │ https · JSON · id del dispositivo o token de la cuenta
                      ┌───────────────▼──────────────── Servidor VOXA (server/, un solo servicio) ──────────────────────────┐
                      │  FastAPI  ── reglas antes que IA (guard) ── caché de respuestas ── plan y cupos ── tope mensual    │
                      │     │                                                                         SQLite en disco      │
                      │     └── providers.py ─▶ Claude en: API de Anthropic · Claude Platform on AWS · Bedrock · Vertex · Foundry │
                      │  /api/webhooks/revenuecat ◀── RevenueCat (App Store, Google Play y web)                           │
                      │  /api/admin/usage (gasto) · /api/health (monitoreo) · /api/me (plan de cada persona)               │
                      └────────────────────────────────────────────────────────────────────────────────────────────────────┘
  Opcionales cuando se necesiten: Supabase Auth (cuentas, gratis hasta 50.000 personas activas) · Sentry (errores) · Postgres (varias instancias)
```

## 3. Cada función: qué hacen las reglas y qué hace la IA

Revisé función por función qué se puede **automatizar con reglas** en vez de usar IA. La columna «Puerta» indica cuándo el servidor **no** llama a la IA porque no agregaría nada. En ese caso no cobra ni gasta cupo, y la app muestra el resultado local con una explicación.

| Función | Reglas en el teléfono (US$0) | IA de VOXA (servidor) | Puerta: no se llama a la IA si… | Caché |
|---|---|---|---|---|
| **Diagnóstico** | 100%: voz, estructura, escritura y autoevaluación → Índice VOXA y metas | — | — | — |
| **Ensayo (Evaluar)** | Ritmo, pausas, «eeh», muletillas en contexto, tono, volumen, mirada y postura, estructura por método, variedad del vocabulario, puntaje total | Coach: lo que hiciste bien con cita, un foco, reescritura y rúbrica de contenido | hay menos de **15 palabras** transcritas | Sí |
| **Gimnasio, lecciones, plan, metas, racha, recordatorio** | 100% | — | — | — |
| **Simulacro de entrevista** | 100%: preguntas que repreguntan, puntaje STAR y respuestas modelo (`interview.js`) | — | — | — |
| **Roleplay con personajes** | Ratio de habla, preguntas, muletillas, detección local de crisis | El personaje responde (esfuerzo bajo, historial en caché) | — (una conversación libre no se automatiza bien) | Prefijo en caché |
| **Evaluación del roleplay** | Puntajes por métricas de la conversación | Puntajes con evidencia, mejor momento, momento perdido, técnicas usadas | hay menos de **2 respuestas** de la persona | Sí |
| **Escritura** | BLUF, pedido explícito, disculpas y rodeos, longitud, «¡», legibilidad | Reescritura lista para enviar, asunto, tono y cambios | el texto tiene menos de **8 palabras** | Sí |
| **Evento real** | Plan día a día hasta la fecha, rutina del día, banco de preguntas por tipo de evento | 6 preguntas a la medida del evento | no hay datos del evento (ante quién, mensaje, preocupación o material) | Sí |
| **Transcripción** | Web Speech en el navegador; reconocimiento nativo del teléfono en la app (`app/native-speech.js`) | — | — | — |
| **Voz del personaje** | Voz del sistema (`speechSynthesis`) | — | — | — |
| **Cuidado y crisis** | Detección local de frases de riesgo y líneas de ayuda por país | Además, `safety_note` cuando la IA detecta riesgo | — | — |

**Resultado:** de 11 funciones, 6 no usan IA. De las 5 que sí la usan, 4 la llaman sólo con material suficiente; el roleplay la necesita en cada turno, con esfuerzo bajo y el historial en caché. La misma consulta se paga una vez: doble toque, reintento o volver atrás se responde desde la caché durante 7 días, sin gastar cupo.

## 4. Pruebas con distintos modelos y nubes

### 4.1 Lo que se puede elegir

- **Nube** (`VOXA_PROVIDER`), con el mismo código y los mismos prompts:
  - `anthropic` (API de Anthropic, por defecto);
  - `aws` (Claude Platform on AWS);
  - `bedrock` (Amazon Bedrock);
  - `vertex` (Google Cloud);
  - `foundry` (Microsoft Foundry).

  Cambiar de nube es cambiar variables de entorno. Sirve para usar créditos de una nube, facturar por AWS o Google, o tener un respaldo.
- **Modelo por función:** `VOXA_MODEL_FEEDBACK`, `VOXA_MODEL_ROLEPLAY`, `VOXA_MODEL_EVALUATE`, `VOXA_MODEL_WRITING` y `VOXA_MODEL_EVENT`. Si no se definen, todas usan `VOXA_MODEL`, que hoy es Opus 5.5, el de mayor calidad.

`server/providers.py` resuelve las diferencias entre plataformas:
- **Nombre del modelo:** Bedrock exige el prefijo `anthropic.`.
- **Respaldo ante rechazos de seguridad** (`fallbacks`): sólo existe en la API de Anthropic y en Claude Platform on AWS, y no está disponible para Haiku. En el resto se omite y el rechazo se informa con un mensaje claro.

Revisando esto encontré y corregí un error: si se elegía Haiku para una función, el servidor le enviaba ese respaldo y la llamada habría fallado.

### 4.2 El banco de pruebas (`server/evals/`)

Pasa por los **mismos endpoints que usan las personas**, así que mide lo que la app hará en producción. Tiene 9 casos con verificaciones automáticas:

| Función | Casos | Qué verifica |
|---|---|---|
| Coach | Respuesta STAR fuerte, respuesta floja, mensaje de crisis | La cita está en lo que dijo la persona; la rúbrica es alta para la fuerte y baja para la floja; detecta que falta el resultado; escribe en español; incluye la nota de seguridad cuando hay riesgo |
| Roleplay | Turno de entrevista, mensaje de crisis | Turno de 60 palabras o menos; en español; pista breve; no termina antes de tiempo; sale del personaje y cierra ante una crisis |
| Evaluación | Conversación buena y conversación defensiva | Citas textuales; objetivo logrado o no logrado; empatía baja en la defensiva |
| Escritura | Correo con rodeos y disculpas | Asunto; más breve; sin «perdón»; no inventa fechas ni cifras |
| Evento | Entrevista en una aseguradora | 6 preguntas; al menos 3 específicas del caso; consejos breves |

También mide la **separación**: cuántos puntos más saca la respuesta buena que la floja. Si un modelo da 80 a las dos, sus puntajes no sirven aunque el texto suene bien.

```bash
cd voxa/server
export ANTHROPIC_API_KEY=...
python -m evals.run --out ../docs/evals/RESULTADOS.md                    # Opus, Sonnet y Haiku
python -m evals.run --provider bedrock --models claude-opus-5-5         # la misma prueba en otra nube
python -m evals.run --repeat 3 --out ../docs/evals/RESULTADOS.md        # 3 repeticiones para ver estabilidad
```

Una corrida completa (9 casos × 3 modelos) cuesta menos de US$1. El resultado es una tabla con verificaciones aprobadas, segundos y costo por llamada en cada función, y un `.json` con todas las respuestas para leerlas.

**Estado honesto:** en este entorno no hay clave de ninguna nube, así que **el banco se verificó en modo simulado** (`--simulate`, incluido en las pruebas automáticas), **no con modelos reales**. No hay resultados inventados. Los números de calidad por modelo salen en el primer minuto en que se corra con la clave de VOXA.

### 4.3 Qué esperar, y cómo decidir

Costo por llamada con los tokens del caso de negocio (`docs/negocio/modelo.py`), a precios de la API de Anthropic:

| Función | Opus 5.5 | Sonnet 5.5 | Haiku 5.5 | Qué pesa más en la decisión |
|---|---|---|---|---|
| Coach tras un ensayo | US$0,057 | US$0,029 | US$0,0014 | Calibración de la rúbrica y citas exactas |
| Turno de roleplay | US$0,014 | US$0,007 | US$0,0004 | Velocidad y naturalidad (se repite muchas veces) |
| Evaluación del roleplay | US$0,064 | US$0,032 | US$0,0016 | Separación entre conversación buena y floja |
| Reescritura de correo | US$0,045 | US$0,022 | US$0,0011 | No inventar datos y conservar la voz |
| Preguntas del evento | US$0,044 | US$0,022 | US$0,0011 | Especificidad |

Regla de decisión propuesta:
1. Correr el banco con los tres modelos.
2. Una función puede pasar a un modelo más económico **sólo si aprueba las mismas verificaciones y su separación no baja más de 5 puntos** frente a Opus.
3. Volver a medir con 50 grabaciones reales calificadas por profesores (la calibración del plan de acción).

La decisión de cambiar es tuya. Hoy todo usa el modelo de mayor calidad.

## 5. Plataformas elegidas y costo mensual

| Pieza | Plataforma | Por qué | Costo |
|---|---|---|---|
| App iOS y Android | **Capacitor 8** sobre la misma app web (`app/`, proyectos `android/` e `ios/` ya generados) | Una sola base de código; la app web ya hace todo el análisis | US$0 (cuenta Apple US$99/año; Google Play US$25 una vez) |
| Web | El mismo servidor, o GitHub Pages | Un link https con micrófono y cámara en vivo | US$0 |
| Servidor e IA | **Render Starter** (`render.yaml`) o **Fly.io** (`fly.toml`) | Un solo servicio Docker con disco; Fly se apaga sin tráfico | Render US$7 + US$0,25 por GB de disco; Fly ~US$4 (512 MB + 1 GB) |
| IA | Claude (Opus 5.5 por defecto), con la nube que convenga | Calidad en español, salida JSON garantizada, respaldo ante rechazos | Por uso: ~US$1,6 por persona que paga al mes (caso de negocio), con tope mensual |
| Datos | SQLite en el disco del servidor | Planes, cupos, gasto y caché: un archivo, cero servicios extra | US$0 |
| Pagos | **RevenueCat** (App Store, Google Play y web) → `/api/webhooks/revenuecat` | Un solo webhook para todas las tiendas; recupera compras | Gratis hasta US$2.500 de ingresos mensuales; después, 1% |
| Cuentas (opcional) | **Supabase Auth** → token verificado en el servidor (`VOXA_JWT_SECRET` o `VOXA_JWKS_URL`) | Sincronizar entre dispositivos y pagar en la web | Gratis hasta 50.000 personas activas al mes |
| Transcripción | El teléfono (Web Speech y plugin nativo) | Gratis y privada | US$0 |
| Monitoreo | `/api/health` + Sentry (opcional) | Avisos de caída y errores | US$0 en el plan gratis |
| Pruebas y publicación | GitHub Actions (`voxa-ci.yml`) | Servidor, motor, transcripción nativa, banco de modelos simulado y versión publicable | US$0 |

**Fijo para operar la beta y el lanzamiento: ~US$15–20 al mes** (servidor y cuenta de Apple prorrateada), más la IA por uso con techo. Comparado con el escenario «solo» del caso de negocio (US$150 al mes, que incluía herramientas y margen), la infraestructura es una parte menor.

**Cuándo crecer:**

| Etapa | Personas activas | Qué cambia | Fijo aproximado |
|---|---|---|---|
| Beta y lanzamiento | hasta ~5.000 | Una instancia con SQLite (una instancia con disco atiende esto sin problema) | US$15–20 |
| Crecimiento | 5.000–50.000 | Instancia más grande; cuentas con Supabase | US$40–80 |
| Escala | más de 50.000 | Varias instancias; los cupos y la caché pasan a Postgres (misma interfaz que `quotas.py`) | US$150 o más; la IA domina el costo |

## 6. Seguridad y privacidad

- **Credenciales:**
  - la clave de la IA vive sólo en el servidor;
  - el gasto se ve sólo con `VOXA_ADMIN_TOKEN` (`/api/admin/usage`), y `/api/status` ya no lo expone;
  - el webhook de pagos exige su propio secreto.
- **Orígenes permitidos (CORS):** sólo la app instalable (`capacitor://localhost`, `https://localhost`) y los dominios que se agreguen en `VOXA_CORS_ORIGINS`.
- **Datos de la persona:**
  - audio y video nunca salen del teléfono; al servidor sólo llega el texto de lo que la persona pide comentar;
  - lo que escribe la persona va delimitado como material, nunca como instrucciones;
  - los tamaños están limitados;
  - hay límite de consultas por IP y cupo por plan.

## 7. Qué quedó listo en esta revisión

**Servidor**
- **Elección de nube:** `providers.py`, con 5 nubes, y el respaldo ante rechazos sólo donde existe.
- **Reglas antes que IA:** la IA no se llama en 4 casos sin material suficiente.
- **Caché de respuestas idénticas.**
- **Base de datos:** conexiones que se cierran siempre, WAL para leer mientras otro hilo escribe, y el esquema se crea una sola vez.
- **Limitador por IP:** ya no acumula IPs viejas en memoria.
- **Endpoints nuevos:**
  - `/api/health`;
  - `/api/admin/usage`, protegido;
  - `/api/status`, mínimo;
  - webhook de RevenueCat;
  - cuentas con JWT, opcionales;
  - CORS para la app.

**App**
- `API_BASE` para que la app instalable hable con el servidor.
- Las mismas puertas del servidor en la app, para no hacer llamadas inútiles.
- Base de Capacitor (`app/`):
  - proyectos Android e iOS con los permisos de micrófono, cámara, voz y notificaciones;
  - script `npm run sync` que empaqueta la web apuntando al servidor;
  - transcripción nativa con la misma forma que la Web Speech API, para que ninguna página cambie.

**Despliegue:** `render.yaml` actualizado y `fly.toml` como alternativa más económica.

**Pruebas:**
- servidor: 32 (antes 21), que cubren las nubes, las puertas, la caché, los pagos, las cuentas, CORS y el banco de modelos;
- motor: 50 (antes 47), que suman la transcripción nativa.

### Segunda ronda: el ciclo de suscripción y hábito, de punta a punta

- **«Tu plan» (`pro.html`)** muestra:
  - el plan y cuánto coach IA queda en cada función;
  - qué es gratis para siempre y qué incluye Pro;
  - el cobro sin sorpresas.

  También permite comprar y restaurar compras en la app, o abrir el link de pago en la web (`VOXA_CHECKOUT_URL`).
- **«Hoy»** muestra la línea del plan («Prueba del coach IA: te quedan 5 días · 12 consejos»), que lleva a «Tu plan».
- **Cupo agotado:** cuando el servidor responde 402, la app ofrece «Ver el plan Pro» en el ensayo, el roleplay, la escritura y el evento, en vez de un error mudo.
- **Compras nativas** (`app/native-purchases.js`, RevenueCat):
  - la persona se identifica con el mismo id que usa el servidor;
  - el plan anual aparece primero;
  - cancelar la compra no se trata como error.

  Después de comprar, `/api/me/sync` confirma el plan con la API de RevenueCat (`VOXA_REVENUECAT_SECRET`) sin esperar al webhook.
- **Avisos en el teléfono** (`app/native-reminder.js`):
  - el recordatorio diario de práctica, a la hora elegida;
  - el aviso 3 días antes de cada renovación, que se reprograma al abrir la app.
- **Textos de cobro exactos:** el reembolso en iPhone lo hace Apple, no VOXA, y la página lo dice.
- **Pruebas:**
  - servidor: 33;
  - motor y app: 57, que suman el plan, las compras y los avisos.

### Tercera ronda: probar en el teléfono y una mejor primera impresión

- **APK de Android compilado en GitHub en cada cambio** (`.github/workflows/voxa-android.yml`): se descarga desde Actions y se instala en cualquier Android para probar micrófono, cámara, transcripción nativa y avisos. No hace falta Android Studio. La primera compilación salió bien al primer intento (7 MB).
- **Diagnóstico paginado:** 4 pantallas con barra de avance, y la voz primero. Al terminar de hablar, la persona ve **su primera fortaleza medida y un solo paso para entrenar**; si nada sale bien todavía, el mensaje celebra que se animó, nunca abre con un número rojo. Después vienen la autoevaluación (8 toques), el mensaje escrito y el perfil con metas.
- **Si la grabación no tiene voz útil** (ruido o micrófono equivocado) y la persona escribió lo que dijo, se mide el texto en vez de perder la prueba.
- **Corrección de accesibilidad:** la clase `visually-hidden` se usaba pero no existía en los estilos, y dejaba visible un selector de archivo nativo.

## 8. Pasos para tener la plataforma operativa

| # | Paso | Quién | Tiempo |
|---|---|---|---|
| 1 | Crear la cuenta de la API de Anthropic (o elegir otra nube), generar la clave y fijar un límite de gasto en la consola | Tú | 15 min |
| 2 | Publicar el servidor: Render (Blueprint con `render.yaml` de la raíz; ver [TIENDAS.md](TIENDAS.md) §1) o Fly (`fly.toml`). Cargar `ANTHROPIC_API_KEY` | Tú, con la guía del README | 20 min |
| 3 | Correr el banco de modelos con la clave (`python -m evals.run`) y decidir el modelo por función | Juntos | 15 min, menos de US$1 |
| 4 | Invitar a la beta con el link propio (la prueba de 7 días se activa sola) | Tú | — |
| 5 | Cuentas de desarrollador: Apple (US$99/año) y Google Play (US$25) | Tú | 1–2 días de aprobación |
| 6 | App instalable: descargar el APK de prueba desde GitHub Actions e instalarlo en un Android (con `VOXA_API_BASE` definida como variable del repositorio para usar el coach IA). iOS necesita una Mac o un compilador en la nube con la cuenta de Apple. Probar micrófono, cámara y transcripción en teléfonos reales | Tú (Android, 10 min); desarrollo (iOS) | 10 min Android; 1 semana iOS |
| 7 | Pagos: crear en RevenueCat el derecho `pro` y una oferta con los paquetes mensual y anual; conectar las tiendas; webhook a `/api/webhooks/revenuecat` con `VOXA_REVENUECAT_AUTH`; cargar `VOXA_REVENUECAT_SECRET` en el servidor y las claves públicas al empaquetar la app. El código de la app y del servidor ya está | Tú, en los paneles | 1–2 días |
| 8 | (Opcional) Cuentas con Supabase Auth y `VOXA_JWT_SECRET` o `VOXA_JWKS_URL` | Desarrollo | 3–5 días |
| 9 | Publicar en las tiendas con 4,3 ★ o más en la beta | Tú | 1–2 semanas de revisión |

**Lo que no pude verificar aquí:**
- Compilar las apps: este entorno no tiene el SDK de Android ni una Mac.
- Llamar a modelos reales: no hay clave.
- La documentación de RevenueCat: su sitio no estaba permitido en la red de esta sesión. Los nombres de eventos del webhook (`INITIAL_PURCHASE`, `RENEWAL`, `EXPIRATION`…) siguen su formato conocido; conviene confirmarlos con el evento de prueba del panel de RevenueCat.
