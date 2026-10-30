# Mini caso de negocio de Talkride

Octubre de 2026. El modelo es reproducible: los supuestos están en [`negocio/modelo.py`](negocio/modelo.py) y se recalcula con `python3 voxa/docs/negocio/modelo.py`. Las fuentes de precios y benchmarks se citan al final.

## En simple: qué cuesta y cuándo

**La IA la pone Talkride, incluida en la app.** La persona no necesita ninguna cuenta de IA. La clave de Anthropic vive sólo en el servidor de Talkride, y nosotros pagamos cada llamada. Todos los costos de este documento ya lo suponen.

El link de claude.ai es sólo una **demo** para mostrar la idea: allí la IA corre con la cuenta de quien la abre. **No es el producto.**

Los **US$3.000 al mes no son un costo obligatorio.** Eran un escenario: lo que costaría pagarle a un desarrollador y a un creador de contenido a medio tiempo. Hay un escenario mucho más barato.

| Tipo de costo | Cuándo aparece | Cuánto |
|---|---|---|
| Probar con las primeras 30 personas | Ahora | Versión completa en la web con nuestra IA: servidor US$7–25 al mes + IA de unos US$1,6 por persona activa (≈ US$50 al mes con 30 personas). Tope de gasto configurable: `VOXA_MONTHLY_BUDGET_USD` |
| Construir la app instalable | Una vez, si decides hacerla | Tu tiempo con un asistente de programación con IA (8–11 semanas) **o** un desarrollador freelance |
| Publicar en tiendas | Al lanzar | Apple US$99 al año + Google US$25 una vez (≈ US$10 al mes) |
| Servidor y base de datos | Cuando la app esté publicada | US$30–80 al mes al inicio |
| IA y transcripción | Sólo cuando alguien la usa (la pagamos nosotros) | Unos US$1,6 al mes por cada persona que paga, con la máxima calidad (Opus 5.5). El plan gratis no usa IA en el servidor y la prueba tiene cupos |
| Cuenta de Anthropic (API) | Al publicar | Pago por uso, sin mensualidad; se carga crédito y se fijan límites de gasto |

**Con la operación «solo»** (fundador más IA para programar, unos US$150 al mes de fijos) y el precio medio:
- se cubren los costos con **unos 140 pagadores, o 33 asientos de empresa**;
- cada pagador deja US$4,42 netos al mes, de los que US$1,10 son ganancia con Opus 5.5 en todo;
- con la optimización del punto 7, la ganancia sube a unos US$2,2–2,6.

## 1. Conclusión

**Sí puede ser rentable, pero no como app de consumo barata con IA gratis y publicidad pagada.** Es rentable con cuatro decisiones:

1. **El plan gratis no usa IA en el servidor.** Todo el análisis local (diagnóstico, voz, estructura, simulacro, lecciones, escritura) es gratis y ya cuesta casi cero. La IA llega con una prueba de 7 días y con el plan pago. Si el plan gratis usa IA, cada pagador carga con unos 10 usuarios gratis activos y el margen queda negativo (−86% con Opus 5.5).
2. **Precio en la banda media del mercado, no en la más baja:**
   - LatAm: US$6,99 al mes o US$44,99 al año.
   - España y EE. UU.: US$12,99 al mes o US$69,99 al año.
   - Sigue siendo más barato que Speak, Speeko, BoldVoice y ELSA.
3. **El canal B2B (empresas y universidades) es el motor del margen:**
   - Se gana US$4,5–5,5 por asiento al mes, con un margen de 68–83%.
   - 700 asientos cubren una operación mínima.
4. **Sin publicidad pagada al inicio.** Conseguir un pagador con anuncios cuesta unos US$67 y su valor de vida es de US$2–27 según la configuración. El crecimiento tiene que ser orgánico: universidades, clubes de oratoria, contenido en LinkedIn y TikTok, y referidos.

En el escenario mínimo (fundador más freelancers, US$3.000 al mes de gastos fijos):
- El **punto de equilibrio** llega alrededor del **mes 12**, con unos 670 pagadores y 700 asientos B2B.
- La **inversión máxima** es de unos **US$22.000**.
- Un equipo chico (US$15.000 al mes) necesita unos 3.300 asientos B2B o cerca de 8.000 pagadores, lo que lleva 2 a 3 años.

## 2. Costo por usuario

### 2.1 Costo de IA por llamada

Estos son los tokens estimados por llamada, con razonamiento incluido:

| Llamada | Tokens (entrada / salida) | Opus 5.5 (hoy) | Sonnet 5.5 | Haiku 5.5 |
|---|---|---|---|---|
| Consejo del coach | 1.800 / 2.500 | US$0,057 | 0,029 | 0,001 |
| Turno del personaje (historial en caché) | 2.500 / 500 | 0,014 | 0,007 | 0,0004 |
| Evaluación del roleplay | 3.500 / 2.500 | 0,064 | 0,032 | 0,002 |
| Reescritura de un correo | 1.200 / 2.000 | 0,045 | 0,022 | 0,001 |
| Preguntas de un evento | 1.000 / 2.000 | 0,044 | 0,022 | 0,001 |
| Lenguaje corporal (4 fotogramas) | 7.000 / 1.500 | 0,058 | 0,029 | 0,001 |

Precios de Claude: Opus 5.5 US$4/20, Sonnet 5.5 US$2/10 y Haiku 5.5 US$0,10/0,50 por millón de tokens de entrada/salida.

Los tokens son estimaciones del código de los prompts. Con la app en uso, el servidor ya mide el gasto real por uso en `/api/status`, y conviene reemplazar estas cifras por las medidas.

> **En el producto, la IA la paga Talkride.** El servidor controla el gasto en tres niveles:
> 1. Cupos por plan: gratis sin IA, prueba de 7 días con cupos, Pro con uso justo.
> 2. Tope de gasto total del mes.
> 3. Medición del costo real por uso (`/api/status`).
>
> El link de claude.ai queda sólo como demo.

### 2.2 Costo mensual de una persona que paga

Se asume un uso activo de unas 3 prácticas por semana: 10 consejos, 4 roleplays de 8 turnos con su evaluación, 3 correos, 1 evento y 2 análisis de lenguaje corporal.

| Concepto | Opus 5.5 | Sonnet 5.5 | Mixto* |
|---|---|---|---|
| IA | US$1,58 | US$0,79 | US$1,00 |
| Transcripción (40 min, 40% en el servidor a US$0,003/min) | 0,05 | 0,05 | 0,05 |
| Voz del personaje (voz del sistema) | 0 | 0 | 0 |
| Infraestructura variable | 0,02 | 0,02 | 0,02 |
| Pruebas de 7 días que no convierten (4 por pagador) | 1,47 | 0,74 | 0,93 |
| Usuarios gratis activos (10 por pagador, sin IA) | 0,20 | 0,20 | 0,20 |
| **Costo variable por pagador** | **US$3,32** | **US$1,80** | **US$2,21** |

\*Mixto: Haiku en los turnos del roleplay y en la escritura; Opus en el resto.

La **elección de modelo por uso** es una decisión de calidad contra costo. El servidor ya permite cambiarla sin tocar código (`VOXA_MODEL_ROLEPLAY`, etc.). Antes de cambiar conviene medir la calidad con el panel experto ([PANEL.md](PANEL.md)). Hoy todo usa Opus 5.5, la máxima calidad.

## 3. Precios: Talkride frente al mercado

| App | Mensual | Anual | Notas |
|---|---|---|---|
| Speak | US$17,99 | 83,99 | Plus a 164,99 |
| Speeko | 19,99 web / 24,99 tienda | 79,99 / 89,99 | Vitalicio a 299,99 |
| BoldVoice | 12,50–24,99 | ~150–199 | Prueba de 7 días |
| ELSA | ~20 (trimestral 59,99) | ~100–160 | — |
| Yoodli | 11 (Pro) | 96 | Empresas: a cotizar |
| Vocal Image | 12,99–19,99 | 59,99–89,99 | Descuentos agresivos |
| Wellspoken | 12,99 | 69,99 | 3 sesiones gratis por día |
| Praktika | 9,99 | 49,99–99,99 | — |
| Orai | 12 | 49,99 | Vitalicio a 149 |
| Duolingo Super / Max | 6,99 / 29,99 | 83,88 / ~168 | Referencia de experiencia de uso |
| Coach humano de oratoria | 14 €/h (España, clases); MXN 244–325/h (México) | — | Coaching ejecutivo: 100–180 €/h |
| **Talkride (propuesta)** | **LatAm 6,99 · España y EE. UU. 12,99** | **44,99 · 69,99** | Diagnóstico, ensayo y lecciones siempre gratis |

Un mes de Talkride cuesta menos que media hora con un coach humano y menos que Speak o Speeko. La propuesta de valor es la única en español, con método (PREP, STAR, BLUF), roleplay, evento real y cuidado de la ansiedad.

## 4. Margen y punto de equilibrio

### 4.1 Consumidor (precio base: LatAm 4,99 / 34,99; España y EE. UU. 9,99 / 59,99)

Supuestos de cobro:
- 70% LatAm y 30% España/EE. UU.
- 70% de planes anuales.
- IVA del 15% incluido en el precio.
- 60% cobrado por tienda (15% de comisión) y 40% por la web (4,5%).

Con esto, el ingreso neto es de **US$3,43 por pagador al mes**.

| Configuración | Plan gratis | Costo variable | Contribución por mes | Margen | Valor de vida (15 meses) | Pagadores para equilibrio (fijos 3 mil / 15 mil) |
|---|---|---|---|---|---|---|
| Opus 5.5 | con IA limitada | 6,37 | **−2,94** | −86% | — | no hay |
| Opus 5.5 | sin IA + prueba | 3,32 | 0,11 | 3% | 2 | 27.806 / 136.851 |
| Sonnet 5.5 | sin IA + prueba | 1,80 | **1,63** | 47% | 24 | **1.879 / 9.250** |
| Mixto | sin IA + prueba | 2,21 | 1,23 | 36% | 18 | 2.497 / 12.289 |

**Sensibilidad al precio** (Opus 5.5, gratis sin IA):

| Precio LatAm | Precio España/EE. UU. | Contribución por pagador | Pagadores para equilibrio (3 mil / 15 mil) |
|---|---|---|---|
| 4,99 / 34,99 | 9,99 / 59,99 | US$0,11 | 27.806 / 136.851 |
| 5,99 / 39,99 | 11,99 / 69,99 | 0,71 | 4.330 / 21.312 |
| 7,99 / 49,99 | 14,99 / 89,99 | 1,83 | 1.672 / 8.229 |

### 4.2 Empresas y universidades (US$8 por asiento al mes, contrato anual, 30% más de uso)

| Configuración | Neto por asiento | Costo variable | Margen por asiento | Asientos para equilibrio (3 mil / 15 mil) |
|---|---|---|---|---|
| Opus 5.5 | US$6,64 | 2,12 | **4,52 (68%)** | **677 / 3.331** |
| Sonnet 5.5 | 6,64 | 1,10 | 5,54 (83%) | 552 / 2.717 |
| Mixto | 6,64 | 1,37 | 5,27 (79%) | 580 / 2.857 |

US$8 por asiento está por debajo de lo que la competencia cobra a empresas: Yoodli unos US$50 al mes en un dato anecdótico, y ELSA unos US$18, sin verificar. Hay margen para cobrar US$12–15 en programas con material propio de la empresa.

### 4.3 Proyección conservadora a 18 meses

Supuestos:
- Sin publicidad pagada; descargas orgánicas que crecen un 25% al mes hasta 15 mil.
- Conversión de 1,5%.
- Pilotos B2B desde el mes 6, con 100 asientos más por mes hasta 800.
- Precio medio (6,99/44,99 y 12,99/69,99), Opus 5.5, gratis sin IA y US$3.060 al mes de gastos fijos.

| Mes | Descargas del mes | Pagadores | Asientos B2B | Ingreso neto | Contribución | Resultado mensual | Acumulado |
|---|---|---|---|---|---|---|---|
| 1 | 1.000 | 15 | 0 | US$66 | 16 | −3.044 | −3.044 |
| 6 | 3.052 | 149 | 100 | 1.325 | 616 | −2.444 | −17.423 |
| 9 | 5.960 | 327 | 400 | 4.105 | 2.167 | −893 | −21.680 |
| **12** | 11.642 | 669 | 700 | 7.606 | 3.898 | **+838** | −20.952 |
| 18 | 15.000 | 1.581 | 800 | 12.304 | 5.351 | +2.291 | −9.526 |

Con este ritmo, lo invertido se recupera alrededor del mes 22. El 75% de la contribución viene de los asientos B2B.

## 5. Riesgos y palancas

| Riesgo | Efecto | Palanca |
|---|---|---|
| Costo de IA más alto del estimado | Baja el margen | Medir con `/api/status`, bajar el esfuerzo donde no pierda calidad, elegir el modelo por uso tras medir con el panel |
| Conversión menor (LatAm ~0,7–1,5%) | Más usuarios gratis por pagador | El plan gratis sin IA hace que esto casi no cueste; la prueba de 7 días mejora la conversión (la de 5–9 días convierte ~37%) |
| Abandono alto (las apps con IA retienen 21% al año frente a 31% sin IA) | Menos valor de vida | Hábito: semana visible, metas, evento real, recordatorios y notificaciones |
| Quejas por cobros (queja número 1 de la categoría) | Mala calificación | Aviso antes de cobrar, cancelar en un toque, reembolso en 14 días |
| Venta B2B lenta | Equilibrio más tarde | Pilotos de 90 días con universidades (centros de carrera) y áreas de RR. HH., con el índice Talkride antes y después como prueba de valor |
| Competidor grande que entra en español | Presión de precio | Diferenciar con método, situaciones latinas, cuidado de la ansiedad y precio regional |

## 6. Recomendación

1. **Publicar ya la versión completa en la web con nuestra IA** (servidor más app en un solo servicio, con cupos y tope de gasto; ver [APP_NATIVA.md](APP_NATIVA.md) §4, paso 0) para la beta. En paralelo, construir la app de tiendas (8–11 semanas).
2. **En la app:** plan gratis sin IA en el servidor, prueba de 7 días con IA completa, precio medio y pagos honestos.
3. **Salir a vender pilotos B2B desde el mes 3** a universidades y empresas medianas en LatAm, con precio de US$8–12 por asiento.
4. **Decidir el modelo de IA por uso con datos.** Medir el costo real de las primeras 200 sesiones y la calidad con el panel. Si Sonnet 5.5 mantiene la calidad en algún uso, el margen al consumidor sube de 3% a 47%.
5. **No invertir en publicidad pagada** hasta que el valor de vida medido supere 3 veces el costo de adquirir un usuario.

## Fuentes

- **Precios de Claude:** tabla oficial de modelos (octubre de 2026).
- **Precios de las apps:**
  - Speak: [recurdash](https://recurdash.com/subscription-pricing/speak).
  - Speeko: [speeko.co](https://speeko.co/subscriptions).
  - Orai: [PricingSaaS](https://pricingsaas.com/companies/orai/diffs/2026W34).
  - Yoodli: [Final Round](https://www.finalroundai.com/blog/yoodli-pricing).
  - Wellspoken: [App Store](https://apps.apple.com/pg/app/id6752822613).
  - Praktika: [apppricinglab](https://apppricinglab.com/iap/apple/1624701477).
  - Vocal Image: [App Store](https://apps.apple.com/us/app/vocal-image-ai-speaking-coach/id1535324205).
  - ELSA: [fitgap](https://us.fitgap.com/products/elsa-speak).
  - BoldVoice: [aipicks](https://aipicks.jp/mag/boldvoice-pricing-plans-2026).
  - Duolingo: [subger](https://subger.com/en/service/duolingo-plus).
- **Coaches humanos:**
  - España: [Superprof](https://www.superprof.es/clases/oratoria/oviedo/) y [Cronoshare](https://www.cronoshare.com/cuanto-cuesta/coaching-empresarial).
  - México: [Cronoshare MX](https://www.cronoshare.com.mx/servicios/clases-oratoria/ciudad-de-mexico).
- **Conversión y retención:**
  - [RevenueCat, Educación 2026](https://www.revenuecat.com/state-of-subscription-apps-2026-education).
  - [Adapty, Educación](https://adapty.io/blog/education-app-subscription-benchmarks/).
  - [Duolingo SEC 8-K Q2-26](https://www.sec.gov/Archives/edgar/data/0001562088/000162828026053299/q2fy26duolingo6-30x26share.htm).
  - [apps con IA frente a sin IA](https://ppc.land/ai-apps-earn-41-more-per-user-but-churn-30-faster-revenuecat-finds/).
- **Comisiones:** [Apple y Google](https://appbot.co/blog/app-developers-apple-google-small-business-programs/) y [Google 15%](https://docs.glassfy.io/docs/reduced-platform-commission-for-new-and-small-publishers).
- **Transcripción:**
  - [AssemblyAI](https://www.assemblyai.com/pricing.md).
  - [Google STT](https://cloud.google.com/speech-to-text/pricing/).
  - [OpenAI (copia de la página de precios)](https://www.scribd.com/document/859642842/Pricing-OpenAI-API).
- **Hosting:** [Render](https://render.com/articles/how-much-does-cloud-application-hosting-cost-for-small-businesses) y [Supabase](https://makerkit.dev/blog/saas/supabase-pricing).

Las cifras de tiendas y de precios vienen en su mayoría de agregadores (las tiendas no se pudieron abrir en vivo). Conviene confirmarlas antes de presentarlas a inversionistas. El costo por instalación de US$1 en LatAm es un supuesto.

## 7. Cómo optimizar sin bajar la calidad

| Palanca | Efecto | Calidad |
|---|---|---|
| Lo que se puede medir en el dispositivo, gratis (voz, estructura, muletillas, escritura, simulacro, diagnóstico); la IA sólo cuando la persona la pide | Ya está así: el 80% del valor cuesta 0 | Igual |
| Plan gratis sin IA en el servidor, prueba de 7 días | Margen de −86% a positivo | Igual para quien paga |
| Opus 5.5 donde la calidad se nota (consejo del coach, evaluación final, lenguaje corporal); probar un modelo más económico sólo en los turnos del roleplay, **y cambiarlo sólo si el panel no ve diferencia** | Contribución por pagador de US$1,10 a ~2,2 (50% de margen) | Se valida antes de cambiar |
| Caché del historial del roleplay y techos de respuesta correctos | Ya hecho: menos tokens y sin reintentos | Igual |
| Transcripción y voz del personaje en el teléfono | Casi 0 en voz | Muy buena en iOS y Android |
| Precio medio (no el más bajo), con el plan anual como opción principal | Ingreso neto de US$3,43 a 4,42 por pagador | Coherente con la calidad |
| Empresas y universidades primero (asiento US$8–12, margen 68–83%) | 33 asientos cubren la operación «solo» | Igual |
| Sin publicidad pagada: universidades, clubes, contenido y referidos | Evita perder US$67 por cliente | — |

