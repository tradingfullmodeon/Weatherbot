# Puesta en marcha: servidor, pagos y tiendas, paso a paso

Octubre de 2026. Esta guía es para hacer en los paneles lo que el código ya espera. Los nombres exactos importan: si cambias uno, cámbialo también en la variable que se indica.

| Paso | Dónde | Tiempo | Estado |
|---|---|---|---|
| 1 | Render (servidor con la IA) | 20 min | Dio «Access denied»: ver §1 |
| 2 | RevenueCat (suscripciones) | 30 min | Proyecto «VOXA» creado (paso 1 de 6) |
| 3 | Google Play (Android) | 1–2 días con la verificación | Pendiente |
| 4 | App Store (iPhone) | 1–3 días con la verificación | Pendiente |
| 5 | Datos legales en privacidad y términos | 10 min | Pendiente: faltan nombre, país y correo |

## 1. Render: el servidor con la IA de VOXA

**Por qué aparece «Access denied — You don't have access to srv-…».** Render muestra ese mensaje cuando el servicio existe en otro espacio de trabajo, se creó con otra cuenta (por ejemplo, entrando una vez con GitHub y otra con Google) o fue borrado. Para salir de dudas:
1. Arriba a la izquierda, abre el selector **«My Workspace»** y revisa si hay otro espacio de trabajo con el servicio.
2. Si no aparece en ningún lado, créalo de nuevo (unos 5 minutos).

**Crear el servicio (Blueprint):**
1. Abre https://dashboard.render.com/blueprints y elige **New Blueprint Instance**.
2. Conecta GitHub si te lo pide y elige el repositorio **Weatherbot**.
3. **Branch:** `claude/kind-ptolemy-5yibyk`, mientras VOXA no esté en `main`. El archivo `render.yaml` ya está en la raíz del repositorio.
4. Render pide los valores marcados como secretos. Completa estos:

   | Variable | Qué poner |
   |---|---|
   | `ANTHROPIC_API_KEY` | La clave **de producción** de console.anthropic.com |
   | `VOXA_REVENUECAT_AUTH` | Una frase larga inventada por ti, por ejemplo de 32 letras y números. La misma va en el webhook de RevenueCat (§2.6) |
   | `VOXA_REVENUECAT_SECRET` | La clave secreta de RevenueCat (§2.5) |
   | `VOXA_CHECKOUT_URL` | Déjalo vacío por ahora |

   `VOXA_ADMIN_TOKEN` se genera solo.
5. Acepta el plan **Starter (US$7 al mes)**: el plan gratis no admite el disco donde se guardan los planes y los cupos.
6. Cuando termine, copia la dirección del servicio (por ejemplo `https://voxa.onrender.com`). Ábrela y luego `…/api/health`: debe decir `{"ok":true}`.

**Después:**
- En GitHub, Settings → Secrets and variables → Actions → **Variables**, crea `VOXA_API_BASE` con esa dirección terminada en `/`. Así el APK de prueba usa el coach IA.
- Si quieres que yo revise el servicio publicado, agrega su dominio en las redes permitidas de este entorno.

Cada cambio que yo suba a la rama se publica solo.

## 2. RevenueCat: suscripciones en iPhone y Android

El código de la app y del servidor ya está listo. Estos nombres son los que espera:

| Qué | Valor exacto | Dónde se usa en el código |
|---|---|---|
| Derecho (Entitlement) | `pro` | `VOXA_RC_ENTITLEMENT` en el servidor, `native-purchases.js` en la app |
| Oferta (Offering) | `default`, marcada como **Current** | La app muestra los paquetes de la oferta actual |
| Paquetes | `$rc_annual` (Anual) y `$rc_monthly` (Mensual) | La app muestra el anual primero |
| App User ID | El id anónimo del dispositivo que genera VOXA | Igual en la app y en el servidor; no hay que configurarlo |

**Probar ya, sin Google Play ni App Store: la Test Store de RevenueCat.** Cada proyecto de RevenueCat trae una tienda de prueba que imita a una real, sin cobros ([guía de RevenueCat](https://www.revenuecat.com/docs/test-and-launch/sandbox/test-store)). Es lo que pide el correo «Create your first product»:
1. En RevenueCat, **Apps → Test Store**: créala y copia su clave, que empieza con `test_`.
2. En **Product catalog**, crea en la Test Store dos productos, mensual y anual, con los precios de abajo. Asígnalos al derecho `pro` y ponlos en la oferta `default` como paquetes Mensual y Anual.
3. En GitHub, Settings → Secrets and variables → Actions → **Variables**, crea `VOXA_RC_TEST_KEY` con esa clave.
4. El siguiente APK de prueba trae las compras activadas. En «Tu plan» verás los dos planes, y al «comprar» se abre la compra simulada de RevenueCat.

El paquete para la tienda **se niega a compilar con una clave `test_`**: nunca se publica por error.

**Productos en cada tienda** (créalos primero en la tienda y luego impórtalos en RevenueCat):

| Tienda | Producto | Precio sugerido (caso de negocio) |
|---|---|---|
| Google Play | Suscripción `voxa_pro` con dos planes base: `mensual` y `anual` (RevenueCat los ve como `voxa_pro:mensual` y `voxa_pro:anual`) | LatAm US$6,99/mes y US$44,99/año; EE. UU. y España US$12,99/mes y US$69,99/año |
| App Store | Grupo de suscripciones «VOXA Pro» con `voxa_pro_mensual` y `voxa_pro_anual` | Lo mismo, con los precios por país de Apple |

**No crees una prueba gratis en la tienda:** la prueba de 7 días ya la da el servidor, sin pedir tarjeta. Si se suman las dos, la persona tendría dos pruebas y un primer cobro confuso.

**Los 6 pasos del panel de RevenueCat** (la lista «Let's get you ready»):

1. **Apps** (menú de abajo a la izquierda) → agrega **Play Store**, con el paquete `app.voxa.coach`, y **App Store**, con el bundle ID `app.voxa.coach`. Cada una pide conectar su tienda: para Google, una cuenta de servicio con acceso a Play Console; para Apple, la clave de compras dentro de la app (In-App Purchase Key) de App Store Connect. El asistente de RevenueCat lo explica en cada caso.
2. **Product catalog → Entitlements →** crea `pro`.
3. **Product catalog → Products →** importa los productos de cada tienda y asígnalos al derecho `pro`.
4. **Product catalog → Offerings →** crea `default` con los paquetes Anual y Mensual de cada tienda, y márcala como **Current**.
5. **API keys:**
   - Las claves públicas `goog_…` y `appl_…` van en GitHub, en Settings → Secrets and variables → Actions → Variables: `VOXA_RC_ANDROID_KEY`, y `VOXA_RC_IOS_KEY` cuando haya versión de iPhone.
   - Crea también una **secret key** para el servidor y pégala en Render como `VOXA_REVENUECAT_SECRET`.
   - Si quieres que yo revise la configuración, crea otra de **solo lectura** y guárdala en este entorno como `REVENUECAT_API_KEY`.
6. **Integrations → Webhooks →** URL `https://TU-SERVICIO.onrender.com/api/webhooks/revenuecat`. En **Authorization header** pon el mismo valor que `VOXA_REVENUECAT_AUTH`. Envía el **evento de prueba**: debe responder 200.

Las tarjetas «Install SDK» y «Create your first paywall» se pueden marcar como hechas: el SDK ya está integrado en `app/native-purchases.js` y la pantalla de compra es la nuestra (`pro.html`), que cumple las reglas de Apple. Por eso no hace falta el editor de paywalls de RevenueCat.

## 3. Google Play (Android)

1. **Cuenta:** https://play.google.com/console (US$25, una sola vez). Las cuentas personales nuevas deben hacer una **prueba cerrada con 12 personas durante 14 días** antes de publicar. La beta de 30 personas del plan de acción sirve para eso.
2. **Crear la app:** nombre «VOXA: habla con seguridad», idioma español (Latinoamérica), app gratuita con compras.
3. **Clave de subida** (una vez, en tu computadora; guárdala con su contraseña en un lugar seguro):
   - Instala un JDK gratis (por ejemplo Temurin) o usa el de Android Studio.
   - Ejecuta: `keytool -genkeypair -v -keystore voxa-upload.jks -alias voxa -keyalg RSA -keysize 2048 -validity 10000`
   - En Windows, cópiala en base64 con PowerShell: `[Convert]::ToBase64String([IO.File]::ReadAllBytes("voxa-upload.jks")) | Set-Clipboard`
   - En GitHub, Settings → Secrets and variables → Actions → **Secrets**, crea:
     - `VOXA_KEYSTORE_BASE64`: lo que copiaste;
     - `VOXA_KEYSTORE_PASSWORD`;
     - `VOXA_KEY_ALIAS`: `voxa`;
     - `VOXA_KEY_PASSWORD`.
   - Activa **Play App Signing**: Google guarda la clave final, y si pierdes la de subida, se puede reemplazar.
4. **Compilar para la tienda:** Actions → «VOXA Android para Google Play» → Run workflow. Descarga `voxa-android-play` (el `.aab`) y súbelo a **Prueba interna**. Las compras reales sólo funcionan con la app instalada desde Play: para probarlas sin pagar, agrega tu correo en **Configuración → Pruebas de licencias**.
5. **Seguridad de los datos** (formulario obligatorio). Respuestas según cómo funciona VOXA:

   | Pregunta | Respuesta |
   |---|---|
   | ¿Recopila o comparte datos? | Recopila; no comparte. Anthropic y RevenueCat actúan como proveedores de servicio |
   | Audio | No se recopila: se analiza en el teléfono |
   | Fotos y videos | No se recopila: se analiza en el teléfono |
   | Otro contenido generado por el usuario | Sí: el texto que se envía al coach IA. Propósito: funcionalidad de la app. Opcional. Se conserva hasta 7 días |
   | ID de dispositivo u otros identificadores | Sí: el id anónimo de VOXA. Propósito: funcionalidad de la app (cupos y compras) |
   | Historial de compras | Sí, a través de RevenueCat. Propósito: funcionalidad de la app |
   | ¿Se cifran en tránsito? | Sí (https) |
   | ¿Se pueden borrar? | Sí: Progreso → «Borrar todos mis datos» |

6. **Clasificación de contenido:** cuestionario IARC. No tiene violencia, compras de azar ni interacción entre usuarios: queda «Para todos» o «PEGI 3».
7. **Política de privacidad:** `https://TU-SERVICIO.onrender.com/privacidad.html`.

## 4. App Store (iPhone)

1. **Cuenta:** https://developer.apple.com/programs (US$99 al año). Como persona o como empresa; como empresa se necesita un número D-U-N-S.
2. **App Store Connect → Apps → +:** nombre «VOXA: habla con seguridad», bundle ID `app.voxa.coach`, SKU `voxa`.
3. **Suscripciones:** el grupo «VOXA Pro» con `voxa_pro_mensual` y `voxa_pro_anual` (§2).
4. **Privacidad de la app:**
   - Datos no vinculados a la identidad: contenido del usuario, identificadores (id de dispositivo) y compras, todos para funcionalidad de la app.
   - **Sin rastreo.**
5. **Compilar:** iOS necesita una Mac con Xcode, o un servicio de compilación en la nube con macOS, con tu cuenta de Apple. Cuando tengas la cuenta, preparo el flujo para compilar en la nube y subir a TestFlight.
6. **Notas para la revisión de Apple:** «No requiere cuenta. La prueba de 7 días del coach IA se activa al abrir la app. Para probar: Hoy → Hacer la práctica de hoy. El micrófono y la cámara se usan para analizar la práctica en el dispositivo».

## 5. Datos legales que faltan

En `prototype/privacidad.html` y `prototype/terminos.html` hay tres marcadores entre corchetes que sólo tú puedes completar:
- **[nombre de la persona o empresa responsable]**;
- **[país]**, que define la ley aplicable;
- **[correo de contacto]**, mejor uno dedicado como `privacidad@…`.

Dímelos y los reemplazo. Antes de publicar, conviene que alguien con conocimiento legal de tu país revise ambos textos.

## 6. Fichas de las tiendas (textos listos)

**Nombre:** VOXA: habla con seguridad

**Subtítulo (App Store, 30 caracteres):** Coach de comunicación con IA

**Descripción corta (Google Play, 80 caracteres):** Practica entrevistas, presentaciones y conversaciones difíciles con un coach IA.

**Descripción larga:**

> Habla con seguridad en entrevistas, presentaciones, reuniones y conversaciones difíciles. VOXA es tu entrenador de comunicación en español: practicas unos minutos al día y ves cómo mejoras.
>
> EMPIEZA SABIENDO DÓNDE ESTÁS
> Un diagnóstico de 6 minutos mide tu voz, tu estructura y tu escritura en 8 dimensiones. En el primer minuto ya ves tu primera fortaleza.
>
> PRACTICA CON FEEDBACK REAL
> • Ritmo, pausas, «eeh», muletillas, tono y volumen, medidos en tu teléfono.
> • Mirada y postura con la cámara, sin que el video salga de tu dispositivo.
> • Estructura de tus respuestas: PREP, STAR, BLUF y SBI, con la parte que falta y cómo agregarla.
> • Coach IA (plan Pro): lo que hiciste bien, un solo foco y cómo sonaría mejor.
>
> ENSAYA ANTES DEL MOMENTO REAL
> • Simulacro de entrevista que repregunta.
> • Roleplay con 9 personajes: reclutadora, jefe, cliente, comité, y conversaciones de feedback o malas noticias.
> • Evento real: plan día a día hasta tu fecha y las preguntas más probables.
> • Correos y mensajes reescritos listos para enviar.
>
> HECHO CON CUIDADO
> • Modo calma para quienes se ponen nerviosos.
> • Metas de exposición gradual.
> • Líneas de ayuda de tu país si las necesitas.
>
> GRATIS PARA SIEMPRE: el diagnóstico, todo el análisis de tu voz, la estructura, el simulacro, el gimnasio de voz, las lecciones y el plan de evento.
> PRO: el coach IA, con 7 días de prueba sin tarjeta. Te avisamos 3 días antes de cada renovación y cancelas en un toque.

**Palabras clave (App Store, 100 caracteres):** oratoria,hablar en público,entrevista,comunicación,presentaciones,liderazgo,voz,nervios,coach

**Categoría:** Educación (secundaria: Productividad)

**Capturas sugeridas** (6, en un teléfono de 6,7"):
1. «Tu primera fortaleza en 1 minuto» (diagnóstico).
2. «Así suena tu voz»: el reporte de la práctica.
3. «Te dice qué falta en tu respuesta» (estructura STAR).
4. «Ensaya con personajes que reaccionan a cómo hablas» (roleplay).
5. «Tu plan hasta el día de tu entrevista» (evento real).
6. «Te comparas contigo» (progreso e Índice VOXA).
