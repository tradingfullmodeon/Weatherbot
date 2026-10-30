# Marca Talkride

**Talkride: habla con seguridad.** El nombre une *talk* (hablar) y *ride* (el recorrido). Talkride es el camino que haces practicando, desde tu primera grabación hasta hablar con seguridad.

![Logo de Talkride en todos sus formatos](presentacion.png)

## El logo

| Pieza | Archivo | Uso |
|---|---|---|
| Ícono | [`icono.svg`](icono.svg) | Ícono de la app, favicon, avatar en redes |
| Marca sola (blanca, fondo transparente) | [`marca.svg`](marca.svg) | Sobre el degradado de la marca: pantalla de inicio, ícono adaptable de Android |
| Logo horizontal, fondo claro | [`logo-claro.svg`](logo-claro.svg) | Web, documentos, presentaciones |
| Logo horizontal, fondo oscuro | [`logo-oscuro.svg`](logo-oscuro.svg) | Modo oscuro, fondos negros |
| Ícono para Google Play (512 × 512) | [`tienda-icono-512.png`](tienda-icono-512.png) | Ficha de Play Console |
| Portada para Google Play (1024 × 500) | [`tienda-portada-1024x500.png`](tienda-portada-1024x500.png) | Gráfico de funciones de Play Console |

**Qué significa.** El globo de diálogo es la conversación. La línea que sube es tu avance, y el punto ámbar es la meta: la charla, la entrevista o la reunión para la que te preparas. Por eso el «ride» se lee como recorrido y no como transporte.

**Por qué funciona a cualquier tamaño.** Tiene sólo tres formas (globo, línea y punto) y se reconoce incluso a 24 px. El índigo transmite seriedad y el ámbar le da energía, lo que da autoridad sin ser frío.

## Colores

| Nombre | Hex | Uso |
|---|---|---|
| Índigo | `#4f46e5` | Color principal: botones, enlaces, la línea del logo |
| Violeta | `#7c3aed` | Final del degradado (índigo → violeta, a 135°) |
| Ámbar | `#f59e0b` | Sólo el punto de la meta. No usarlo en textos ni botones |
| Tinta | `#1b1f2a` | Texto sobre fondo claro |
| Índigo claro | `#8b85ff` | «ride» y los acentos en modo oscuro |

## Logotipo

- Se escribe **talkride**, en minúsculas y en negrita 800, con la fuente del sistema (SF Pro en iPhone, Roboto en Android). «talk» va en color tinta y «ride» en índigo.
- En un texto corrido se escribe **Talkride**, con mayúscula inicial. Nunca TalkRide, Talk Ride ni TALKRIDE.
- El nombre en las tiendas es «Talkride: habla con seguridad». En inglés, «Talkride: Speak with Confidence».

**Qué no hacer:**

- Cambiar los colores del ícono.
- Ponerle sombras o contornos.
- Girarlo.
- Poner el ícono sobre fotos con mucho detalle.
- Separar el globo de la línea.

## Regenerar los íconos

Todos los PNG salen de `icono.svg` y `marca.svg`: web, Android (ícono normal, redondo y adaptable), iPhone (1024 × 1024 opaco), pantallas de inicio y tiendas. Si cambias el logo, edita los SVG y corre:

```bash
node voxa/docs/marca/generar.cjs
```

## Nombres internos que no cambian

La carpeta `voxa/`, las variables de entorno `VOXA_*`, la cabecera `X-VOXA-User` y las claves que la app guarda en el teléfono (`voxa.*`) siguen como estaban, porque nadie las ve:

- **Variables de entorno:** cambiarlas obligaría a volver a configurar Render, GitHub y RevenueCat, y dejaría el servidor sin claves hasta hacerlo.
- **Claves del teléfono:** cambiarlas borraría el progreso que ya guardaron quienes prueban la app.
- **Servicio de Render:** se sigue llamando `voxa`, y la dirección https://voxa-kfg6.onrender.com no cambia. Si se renombra en el Blueprint, Render crea un servicio nuevo, sin el disco ni las claves.
