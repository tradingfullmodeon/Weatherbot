# Qué se necesita para tener VOXA como app (iOS, Android y web) con todas las funcionalidades

Octubre de 2026.

> **Estado:** la base ya está construida en [`app/`](../app/): proyectos Android e iOS de Capacitor con permisos, empaquetado de la web apuntando al servidor (`npm run sync`), transcripción nativa y, en el servidor, cuentas con JWT y webhook de pagos. La arquitectura completa y los costos por plataforma están en [ARQUITECTURA.md](ARQUITECTURA.md).

## 1. Por qué hace falta una app instalable

Hoy existen dos versiones:

| | Link de claude.ai (publicada) | Versión completa (PWA + servidor) |
|---|---|---|
| Cámara y micrófono en vivo | ✗ (graba con la app del celular y sube el archivo) | ✅ |
| Transcripción automática | ✗ (la persona escribe lo que dijo) | ✅ con el reconocimiento de voz del navegador (Chrome/Edge; procesa en servidores del navegador) |
| Roleplay por voz | ✗ (por texto) | ✅ tocar para hablar |
| Lenguaje corporal | 4 fotogramas revisados por IA | ✅ en vivo (MediaPipe) |
| Gimnasio de voz y audiencia virtual | ✗ | ✅ |
| Coach IA | Demo: usa la cuenta de Claude de quien la abre | ✅ **IA de VOXA incluida**: nuestra clave en el servidor, con cupos por plan y tope de gasto mensual |
| Cuentas y sincronización | ✗ (todo en el navegador) | ✗ (todo en el navegador) |
| Notificaciones | ✗ (calendario) | ✗ (calendario o .ics) |
| Pagos | ✗ | ✗ |
| Tiendas (App Store / Google Play) | ✗ | ✗ |

Las dos brechas que más bajan la calificación son la **transcripción automática** y el **roleplay por voz** (A6 y A2 en [PANEL.md](PANEL.md)). Ninguna se puede resolver dentro de claude.ai. Por eso el siguiente paso es una app instalable.

## 2. Arquitectura recomendada: una sola base de código

```
                 ┌────────────────────────────── App (una base de código) ─────────────────────────────┐
                 │  prototype/*.js (módulos ya compartidos: análisis de audio, estructura, metas,      │
                 │  simulacro, ayuda, escritura, eventos)  +  pantallas HTML/CSS actuales              │
                 │                                                                                    │
 iOS / Android ──┤  Capacitor (envoltorio nativo)        Web (PWA instalable)                         │
                 │  · micrófono y cámara nativos         · mismo código, sin tienda                   │
                 │  · reconocimiento de voz del sistema  · reconocimiento de voz del navegador        │
                 │  · notificaciones locales y push      · notificaciones web                         │
                 │  · compras dentro de la app           · pago con tarjeta (web)                     │
                 └──────────────┬─────────────────────────────────────────────────────────────────────┘
                                │ HTTPS (token de sesión)
                 ┌──────────────▼──────────────── Servidor VOXA (FastAPI, ya existe) ─────────────────┐
                 │ /api/feedback · /api/roleplay · /api/roleplay/evaluate · /api/writing · /api/event │
                 │ + nuevos: /auth · /sync · /transcribe · /entitlements                              │
                 │ Claude (clave sólo en el servidor, modelo por uso, medición de gasto por uso)      │
                 │ Postgres (cuentas, prácticas, metas)  ·  sin guardar audio por defecto             │
                 └────────────────────────────────────────────────────────────────────────────────────┘
```

**Por qué Capacitor** y no reescribir en nativo (Swift/Kotlin) o en React Native:
- VOXA ya está hecha con módulos JavaScript sin dependencias, probados (46 pruebas) y compartidos entre las dos versiones. Capacitor los envuelve tal cual.
- Una sola base de código para iOS, Android y web. Se estima un 60–70% menos de trabajo que dos apps nativas.
- El análisis acústico ya corre en el dispositivo y es rápido: 5 minutos de audio se analizan en unos 5 segundos.
- Si una pantalla necesita más rendimiento (por ejemplo, la audiencia virtual), se puede hacer nativa después.

## 3. Lo que hay que construir

### 3.1 En la app

| Componente | Para qué | Cómo |
|---|---|---|
| Envoltorio Capacitor (iOS + Android) | Publicar en las tiendas | `@capacitor/core`, proyectos Xcode y Android Studio |
| Micrófono y cámara | Evaluación y roleplay en vivo | `getUserMedia` dentro de la vista web (iOS 14.3+), con permisos nativos |
| Transcripción | Medir ritmo, muletillas y estructura sin escribir | 1) Reconocimiento del sistema: iOS Speech y Android SpeechRecognizer, en el dispositivo y gratis (plugin de reconocimiento de voz). 2) Servidor `/transcribe` como respaldo o para mayor precisión. |
| Voz del personaje y «Escuchar cómo sonaría» | Roleplay hablado, imitación del modelo | Voz del sistema (gratis); voces neuronales como opción premium |
| Recordatorios | Hábito (A4) | Notificaciones **locales**, programadas en el teléfono y sin servidor (`@capacitor/local-notifications`) |
| Push | Recordar el evento real o la racha en riesgo | `@capacitor/push-notifications` con APNs y FCM |
| Pedir reseña en el momento justo | Calificación en las tiendas (A10) | API nativa de reseñas (`in-app-review`) tras la 3.ª práctica y una mejora |
| Compras dentro de la app | Suscripción | RevenueCat (una integración para App Store, Google Play y web; informes de conversión) |
| Sincronización | Cambiar de teléfono sin perder el progreso | Reemplazar `localStorage` por IndexedDB local más `/sync` al servidor. La capa `loadSessions` / `saveSession` ya está centralizada en `shared.js`. |
| Modo sin conexión | Practicar en el metro | Ya existe (service worker); el análisis local funciona sin red |

### 3.2 En el servidor (sobre el FastAPI actual)

| Componente | Para qué | Notas |
|---|---|---|
| Cuentas | Sincronizar y pagar | Correo con enlace mágico, Google y **Sign in with Apple** (obligatorio en iOS si se ofrecen otros inicios de sesión sociales) |
| Base de datos | Prácticas, metas, diagnósticos | Postgres gestionado; se guardan métricas y textos, no el audio |
| `/transcribe` | Transcripción de respaldo | Proveedor intercambiable (ver costos en [CASO_NEGOCIO.md](CASO_NEGOCIO.md)); el audio se borra tras transcribir |
| Cupos por plan | Controlar el gasto en IA | Contador por usuario y mes, con límite gratis (p. ej., 3 consejos del coach por semana) |
| Modelo por uso | Calidad y costo | Ya está: `VOXA_MODEL_<USO>` y gasto medido por uso en `/api/status` |
| Límites y seguridad | Evitar abuso | Ya hay límite por IP; falta límite por cuenta y token firmado |
| Observabilidad | Errores y rendimiento | Sentry (errores) y analítica respetuosa de la privacidad |
| Borrado de cuenta dentro de la app | Exigido por Apple y Google | Endpoint `/account/delete` más el botón «Borrar todos mis datos», que ya existe |

### 3.3 Requisitos de tiendas y privacidad

- **Textos de permiso** (iOS: `NSMicrophoneUsageDescription`, `NSCameraUsageDescription`, `NSSpeechRecognitionUsageDescription`), explicando para qué se usa cada permiso.
- **Etiquetas de privacidad** de App Store y el formulario de seguridad de datos de Google Play. VOXA declara:
  - El audio y el video se analizan en el dispositivo.
  - El texto se envía al coach IA solo cuando la persona lo pide.
  - No se venden datos.
- **Suscripciones:** precio, período y renovación claros antes de pagar, y cancelación sencilla. La queja número 1 de la categoría son los cobros (ver [CALIFICACIONES.md](CALIFICACIONES.md)).
- **No es una app de salud:** el modo calma y las líneas de ayuda acompañan, no diagnostican. Se mantiene el aviso de que VOXA no reemplaza una terapia.
- **Protección de datos:** política de privacidad y términos en español, cumplimiento de las leyes de cada país donde se distribuya (por ejemplo, el RGPD en España) y acuerdo de tratamiento de datos para clientes empresa.

## 3.4 La IA, incluida y controlada (ya implementado en el servidor)

```
Teléfono / navegador ──(texto, métricas; nunca la clave)──► Servidor VOXA ──► Claude (API de Anthropic)
                                                              │
                                    cupos por plan · tope de gasto del mes · medición por uso
```

- **La clave de Anthropic vive sólo en el servidor** (variable de entorno). La app nunca la ve, así que nadie la puede copiar desde el teléfono.
- **Planes** (`server/quotas.py`):

  | Plan | Cupo de IA |
  |---|---|
  | `gratis` | Sin IA en el servidor (el análisis local sigue completo) |
  | `prueba` | 7 días: 15 consejos, unos 10 roleplays, 6 evaluaciones, 6 correos y 2 eventos |
  | `pro` | Uso justo mensual: 60 consejos, unos 50 roleplays, 30 evaluaciones, 30 correos y 10 eventos |

  Al superar el cupo, la app muestra un mensaje claro y nunca se corta a mitad de una práctica.
- **Tope de gasto total** con `VOXA_MONTHLY_BUDGET_USD`. Si se alcanza, el coach se pausa con un aviso y el análisis local sigue funcionando. Conviene fijar además un límite de gasto en la consola de Anthropic.
- **Quién es quién:** hoy, un identificador anónimo del dispositivo (`X-VOXA-User`). Con cuentas, el id de la cuenta. Los pagos (RevenueCat o la web) llaman a `set_plan` al confirmar una compra o una baja.
- **`/api/me`** le dice a la app el plan y los cupos que quedan, y **`/api/admin/usage`** (con `VOXA_ADMIN_TOKEN`) muestra el gasto del mes y por uso.
- **Pagos:** `/api/webhooks/revenuecat` traduce compras, renovaciones y vencimientos a `set_plan`.
- **Lenguaje corporal en la app:** se mide en vivo en el teléfono (MediaPipe), sin costo de IA. El análisis de fotogramas con IA queda sólo para videos subidos.

## 4. Plan de trabajo y costo de construcción

**Paso 0 (1 día): publicar ya la versión completa con nuestra IA en la web.**
- Qué incluye: el servidor más la app en un solo servicio, con `voxa/Dockerfile` y `render.yaml` en la raíz del repositorio.
- Qué se obtiene: un link https con micrófono y cámara en vivo, coach IA incluido y app instalable desde el navegador (PWA). Todo, menos las tiendas y los pagos.
- Costo: unos US$7–25 al mes de servidor, más la IA que se use, con tope.

Pasos:
1. Crear la cuenta de API en la consola de Anthropic, cargar crédito, fijar un límite de gasto y crear una clave.
2. En Render: New → Blueprint → este repositorio, y pegar la clave en `ANTHROPIC_API_KEY`.
3. Abrir el link https e invitar a la beta. Cada persona recibe automáticamente la prueba de 7 días.


| Etapa | Qué se entrega | Duración estimada (1 desarrollador full-stack) |
|---|---|---|
| 1. Envoltorio y permisos | VOXA instalable en iOS y Android, micrófono y cámara en vivo, recordatorios locales | 2 semanas |
| 2. Transcripción y roleplay por voz | Transcripción en el dispositivo más respaldo `/transcribe`; roleplay hablado con voz del sistema | 2–3 semanas |
| 3. Cuentas, sincronización y borrado | Inicio de sesión, `/sync`, borrado de cuenta | 2 semanas |
| 4. Pagos y cupos | RevenueCat, planes, cupos de IA, pantalla de suscripción honesta | 1–2 semanas |
| 5. Publicación | Fichas de tienda, capturas, privacidad, beta con TestFlight y prueba interna de Google Play | 1–2 semanas |
| **Total** | **App en tiendas con todas las funciones** | **8–11 semanas** |

**Costos fijos de publicar:**
- Apple Developer: US$99 por año.
- Google Play: US$25 por única vez.
- Dominio y correo: unos US$30 por año.
- Servidor y base de datos al inicio: unos US$30–80 por mes (detalle en [CASO_NEGOCIO.md](CASO_NEGOCIO.md)).

**Lo que ya está hecho y se reutiliza:**
- Todo el análisis (voz, estructura, muletillas, escritura).
- Diagnóstico y metas, simulacro, eventos, lecciones y ayuda.
- La API del coach con esquemas estrictos, la medición de gasto y las 66 pruebas automáticas.

## 5. Decisiones que conviene tomar antes de empezar

1. **Mercado inicial.** Se recomienda empezar por un país de Latinoamérica más España. Define precios, cumplimiento legal y modismos.
2. **Modelo de IA por uso.** Hoy todo usa Claude Opus 5.5, la máxima calidad. El servidor permite usar otro modelo por uso (por ejemplo, uno más económico para los turnos del roleplay) sin cambiar código. El impacto en el costo está en [CASO_NEGOCIO.md](CASO_NEGOCIO.md). Es una decisión de calidad contra costo que conviene medir con el panel antes de cambiar.
3. **Transcripción.** Puede ser en el dispositivo (gratis, más privada, un poco menos precisa) o en el servidor (precisa, con costo por minuto). Se recomienda empezar en el dispositivo, con el servidor solo como respaldo.
