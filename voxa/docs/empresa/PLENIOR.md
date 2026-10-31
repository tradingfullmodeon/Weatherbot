# Talkride como negocio de Plenior SpA

Trámites para que **Plenior SpA** sea dueña de Talkride y la publique en Google Play y la App Store, con los textos y datos listos para copiar. Están ordenados según lo que bloquea a lo siguiente.

> Es una guía práctica, no asesoría legal ni tributaria formal. El régimen tributario, el tratamiento de los pagos de las tiendas y la cesión de derechos los valida el contador y, si hace falta, un abogado.

## Datos de la empresa (del SII, al 31-10-2026)

| Dato | Valor |
|---|---|
| Razón social | PLENIOR SPA |
| RUT | 78.512.567-3 |
| Constitución e inicio de actividades | 11-09-2026 y 12-09-2026 |
| Domicilio en el SII | M. de Zamora 4965, Las Condes, Región Metropolitana. Usar exactamente el mismo texto en el D-U-N-S, Apple y Google |
| Actividad | 620900 Otras actividades de tecnología de la información y de servicios informáticos (afecta a IVA) |
| Segmento | Microempresa |
| Régimen tributario | Aparece vacío en el SII; lo esperable es 14 D N°3 Pro Pyme General. Lo confirma el contador |
| Facturación electrónica | No es emisor electrónico todavía |
| Correo administrativo | administracion@plenior.cl (Google Workspace) |

## Checklist

| # | Trámite | Dónde | Estado |
|---|---|---|---|
| 1 | Revisar el objeto social y ampliarlo si hace falta | Registro de Empresas y Sociedades | Pendiente (dueño) |
| 2 | Ampliar la glosa en el SII y agregar la actividad 582000 | SII | Pendiente (dueño) |
| 3 | Pedir el D-U-N-S | Apple D-U-N-S lookup | Pendiente (dueño) |
| 4 | Hacer a Plenior emisor electrónico | SII + certificado digital | Pendiente (dueño + contador) |
| 5 | Confirmar el régimen y el tratamiento de los pagos de las tiendas | Contador | Pendiente |
| 6 | Cuenta bancaria a nombre de Plenior | Banco | Pendiente (dueño) |
| 7 | Correo `apps@plenior.cl` para las cuentas de desarrollador | Google Workspace | Pendiente (dueño) |
| 8 | Cuentas de organización en Google Play y Apple | Play Console / Apple Developer | Después del D-U-N-S |
| 9 | Cesión de derechos del código de Talkride a Plenior | Ver `CESION_TALKRIDE.md` | Borrador listo |
| 10 | Marca TALKRIDE a nombre de Plenior | INAPI. Ver `MARCA_TALKRIDE.md` | Datos listos |
| 11 | Gastos de Talkride en la rendición de Plenior | Ver `GASTOS_TALKRIDE.md`; pasarla al panel de Plenior | Lista lista |
| 12 | Plenior como responsable en la privacidad y los términos | App | **Hecho** |

## 1. Objeto social

1. Entra a https://www.registrodeempresasysociedades.cl con tu ClaveÚnica, abre Plenior SpA y descarga los **estatutos vigentes**.
2. Lee la cláusula del **objeto**:
   - Si ya incluye software o plataformas tecnológicas en general, o «cualquier otra actividad lícita que acuerden los accionistas», no hay que hacer nada.
   - Si se limita a residencias o adultos mayores, haz una **modificación** en el mismo portal. Es gratis y se firma con ClaveÚnica o firma electrónica avanzada.

**Texto propuesto para el objeto** (ajustarlo al resto de los estatutos):

> La sociedad tendrá por objeto: (a) el desarrollo, la edición, la licencia, la comercialización y la operación de software, aplicaciones móviles, plataformas tecnológicas y servicios de software como servicio (SaaS), incluidos los de gestión y derivación para residencias de personas mayores y los de formación y entrenamiento en comunicación; (b) la prestación de servicios de capacitación, educación no formal y asesoría, presenciales o a distancia; (c) la explotación de marcas, derechos de propiedad intelectual e industrial y contenidos digitales; y (d) en general, cualquier otra actividad civil o comercial lícita que acuerden los accionistas.

## 2. Glosa y actividades en el SII

En https://www.sii.cl ve a **Servicios online → Actualización de información → Actividades económicas y glosa**.

- **Glosa propuesta:** `DESARROLLO Y COMERCIALIZACION DE PLATAFORMAS Y APLICACIONES DE SOFTWARE (SAAS Y APPS MOVILES)`
- **Mantener:** 620900 Otras actividades de tecnología de la información y de servicios informáticos.
- **Agregar:** 582000 Edición de programas informáticos. Es el que mejor describe vender una app en las tiendas.
- **Opcional:** 854900 Otros tipos de enseñanza n.c.p., si más adelante se venden cursos o programas de formación a empresas. Antes, confirmar con el contador cómo afecta al IVA.

## 3. D-U-N-S

1. Entra a https://developer.apple.com/enroll/duns-lookup/ y busca «PLENIOR SPA», Chile.
2. Si no aparece, pídelo ahí mismo. Es gratis.
3. Usa **exactamente** los datos del SII: razón social `PLENIOR SPA`, la dirección completa como figura en el SII, el teléfono de la empresa y el correo `administracion@plenior.cl`.
4. D&B puede pedir un respaldo, como el **certificado de estatuto actualizado** del Registro de Empresas (gratis) o la carpeta tributaria del SII.
5. Tarda de unos días a 2 o 3 semanas. Cuando llegue el número, espera unos días a que Apple lo vea antes de inscribirte.

## 4. Facturación electrónica (necesaria para cobrar a Apple y Google)

1. **Certificado digital** del representante legal, para firmar los documentos. Se compra en una empresa autorizada (por ejemplo E-Cert Chile o Acepta) y cuesta del orden de $15.000 a $30.000 al año.
2. Postula al **sistema de facturación gratuito del SII**: https://www.sii.cl → Factura electrónica → Sistema de facturación gratuito del SII → Inscripción.
3. Con esto se resuelven también las **facturas de compra** a proveedores extranjeros, lo que el panel de Plenior tiene pendiente.

## 5. Preguntas para el contador

1. Confirmar el régimen tributario (14 D N°3 Pro Pyme General) y por qué aparece vacío en el SII.
2. ¿Con qué documento se respaldan los pagos que harán Apple y Google a Plenior? ¿Factura de exportación electrónica? ¿Califica como exportación de servicios?
3. Apple y Google cobran y pagan el IVA de las ventas a usuarios en Chile. ¿Cómo se registra eso en Plenior?
4. Formulario **W-8BEN-E** de EE. UU. para Apple y Google: tipo de entidad, uso del convenio Chile–EE. UU. y qué tipo de ingreso declarar.
5. Gastos de Talkride pagados con medios personales (Claude, Render, RevenueCat, dominio, cuotas de las tiendas):
   - ¿Rendición de gastos hasta que estén a nombre de Plenior?
   - ¿Qué criterio de reparto se usa entre Plenior y Talkride?
6. Si Talkride se lleva como línea de negocio separada dentro de Plenior, ¿cómo conviene registrarla (centro de costo)?

## 6. Cuenta bancaria

Apple y Google pagan sólo a una cuenta **a nombre de Plenior SpA**. Sirve en pesos. En dólares se evitan dos conversiones, pero hay que comparar comisiones.

## 7. Correo para las cuentas de desarrollador

Crea `apps@plenior.cl` (o reenvía ese alias a tu correo) en https://admin.google.com. Úsalo para inscribir a Plenior en Google Play Console y en Apple Developer. Así las cuentas quedan en la empresa y no dependen de un Gmail personal.

## 8. Cuentas de organización (cuando llegue el D-U-N-S)

- **Google Play Console** (https://play.google.com/console/signup):
  - tipo **Organización**;
  - nombre de desarrollador **Talkride**;
  - nombre legal PLENIOR SPA, el D-U-N-S, sitio web https://talkride.app y el correo `apps@plenior.cl`;
  - US$25 (pago único).
  - Con cuenta de organización **no se exige la prueba con 12 testers**.
- **Apple Developer** (https://developer.apple.com/programs/enroll/):
  - tipo **Organization**;
  - el D-U-N-S y el sitio web;
  - inscribe el representante legal;
  - US$99 al año.
  - En la App Store, el vendedor aparece como «Plenior SpA».

## 9 y 10. Propiedad de Talkride

- **Código:** la cesión de derechos del autor a Plenior está en [`CESION_TALKRIDE.md`](CESION_TALKRIDE.md).
- **Marca:** los datos para solicitarla en INAPI están en [`MARCA_TALKRIDE.md`](MARCA_TALKRIDE.md).
- **Dominio talkride.app:** está en Cloudflare a nombre del dueño. Se puede dejar así o transferir a una cuenta de Plenior, sin costo dentro de Cloudflare.
