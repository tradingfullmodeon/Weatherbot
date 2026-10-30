# Panel experto de evaluación (simulado)

Talkride todavía no tiene calificaciones de usuarios reales. Para medir y mejorar antes de la beta, se armó un **panel simulado de 6 perfiles**. Evaluaron la app como lo haría cada perfil y con los mismos criterios que usan los usuarios en las tiendas (ver [CALIFICACIONES.md](CALIFICACIONES.md)).

> Los panelistas son simulaciones hechas con IA, no personas reales. Su valor está en revisar el producto desde 6 miradas distintas con exigencia de mercado y en verificar sus afirmaciones en la app y en el código. No reemplazan la beta con personas ([PLAN_ACCION.md](PLAN_ACCION.md)).

## 1. Integrantes

| Panelista | Perfil | Qué evalúa |
|---|---|---|
| Dra. Elena Ruiz | Profesora de oratoria con 20 años de experiencia y formadora de Toastmasters | Pedagogía: calidad del feedback, métodos (PREP, STAR, BLUF, SBI) y progresión |
| Martín Herrera | Coach ejecutivo y ex head of talent; ha entrevistado a más de 3.000 personas | Utilidad laboral: entrevistas, líderes, realismo del roleplay y valor B2B |
| Dra. Lucía Fernández | Psicóloga clínica (TCC, ansiedad social) | Cuidado de las personas nerviosas: exposición gradual, seguridad y ética |
| Sofía Navarro | Directora de diseño de apps de aprendizaje con 4,7 ★ o más | Primera experiencia, hábito, claridad y móvil |
| Dr. Andrés Kim | Investigador en voz e IA | Validez de las métricas, robustez, prompts, alucinaciones y privacidad |
| Camila (usuaria simulada) | 26 años, Bogotá, primera entrevista en 5 días, nerviosa | La experiencia real de una principiante, de punta a punta |

## 2. Método

1. **Material:**
   - 14 pantallas capturadas a 390 px, con su texto.
   - La app funcionando (los panelistas la recorrieron con un navegador automatizado y subieron grabaciones de prueba).
   - El código.
2. **Qué entrega cada panelista:**
   - Estrellas de 1 a 5 y NPS de 0 a 10.
   - Puntaje de 1 a 5 en los 10 criterios A1–A10.
   - Fortalezas y 5 problemas priorizados, con evidencia y corrección.
   - Una reseña de tienda.
3. **Ronda 2:** los mismos panelistas reevaluaron con la lista de cambios y verificaron en la app al menos dos de sus problemas. Andrés Kim volvió a correr sus pruebas acústicas y de texto.
4. **Regla:** a las mejores apps (Speak, BoldVoice, ELSA, Yoodli) les correspondería 4,5–5 en cada criterio.

## 3. Resultados

| Panelista | Ronda 1 | Ronda 2 | NPS (R1 → R2) |
|---|---|---|---|
| Elena Ruiz (oratoria) | 3,4 ★ | **3,8 ★** | 6 → 7 |
| Martín Herrera (coach y reclutador) | 3,2 ★ | **3,9 ★** | 5 → 7 |
| Lucía Fernández (psicóloga) | 3,6 ★ | **4,2 ★** | 6 → 8 |
| Sofía Navarro (diseño de producto) | 3,6 ★ | **4,0 ★** | 6 → 7 |
| Andrés Kim (voz e IA) | 3,8 ★ | **4,2 ★** | 7 → 8 |
| Camila (usuaria principiante) | 3,6 ★ | **4,1 ★** | 7 → 8 |
| **Promedio** | **3,5 ★** | **4,0 ★** | **NPS −67 → 0** |

**Cómo se calcula el NPS:** % de promotores (9–10) menos % de detractores (0–6).
- **Ronda 1:** no hubo promotores y 4 de 6 eran detractores.
- **Ronda 2:** ningún detractor; quedaron 3 pasivos y 3 respuestas de 8, que también se cuentan como pasivas.

Para llegar a NPS 40, al menos 3 de 6 deben dar 9 o 10.

### Por criterio (promedio de los 6)

| Criterio | R1 | R2 | Líderes |
|---|---|---|---|
| A1 Feedback granular y accionable | 3,5 | **3,9** | 4,5–5 |
| A2 Roleplay y conversación | 2,6 | **3,2** | 4,5–5 |
| A3 Diagnóstico → plan | 3,3 | **3,9** | 4,5 |
| A4 Hábito diario | 3,4 | **3,6** | 5 |
| A5 Progreso visible | 3,4 | **3,9** | 4,5 |
| A6 Precisión de la medición | 2,3 | **2,9** | 4,5–5 |
| A7 Autoridad experta | 3,4 | **3,6** | 4–4,5 |
| A8 Valor gratis | 4,2 | **4,2** | 4,5–5 |
| A9 Cercanía cultural y disfrute | 3,4 | **3,5** | 5 |
| A10 Confianza y cuidado | 3,6 | **4,4** | 4,5 |
| **Promedio** | **3,3** | **3,7** | |

## 4. Qué cambió entre rondas

Los panelistas coincidieron en tres causas de fondo. Todas se corrigieron entre la ronda 1 y la 2:

1. **Puntajes poco creíbles.** El simulacro daba 91 sin responder lo que se preguntaba, la voz daba 97 con 21 segundos y se comparaba un texto con un audio. Las correcciones:
   - Solo se compara dentro del mismo formato y escenario.
   - Una grabación sin texto da un puntaje parcial, que no se compara.
   - Las muestras cortas tienen tope.
   - La estructura se revisa según el método.
   - Hay simulacro con repregunta.
   - La rúbrica de la IA es anclada.
2. **Validación falsa.** A «perdón por molestar, ¿tal vez podría…?» se le respondía «lo haces mejor de lo que crees». Ahora la asertividad del escrito mide el pedido directo, los atenuadores y las disculpas.
3. **Poco cuidado con principiantes nerviosos.** Las correcciones:
   - Modo calma sin números.
   - Meta de exposición en vez de «empezar calmado».
   - Color neutro para los puntajes bajos.
   - Líneas de ayuda y de emergencia por país.
   - Detección local de crisis.
   - Una sección «Buscar un profesional», separada de las líneas de crisis.

La lista completa está en los commits de esta versión.

**Correcciones posteriores a la ronda 2.** Se aplicaron después de la ronda 2 y no están reflejadas en sus puntajes:
- El chequeo de estructura ya no da 100 a una respuesta STAR vacía: los años no cuentan como resultado y «así» o «aquí» no cuentan como verbos.
- La situación reconoce prácticas, la universidad y proyectos.
- El modo calma se aplica en toda la app.
- La fluidez se mide por cada 100 palabras.
- El «por qué te interesa» debe nombrar el puesto, la empresa o un aporte.
- El «nosotros» no cuenta como acción tuya.
- Las citas del roleplay se verifican.
- La grabación en vivo usa el techo de tono de 600 Hz.

## 5. Lo que el panel sigue pidiendo (para la ronda 3)

| Pedido | Quién lo pide | Plan |
|---|---|---|
| Transcripción automática y roleplay por voz | Todos | App instalable con transcripción en el servidor (P0 en [PLAN_ACCION.md](PLAN_ACCION.md)) |
| Dimensiones de la evaluación con IA propias de cada personaje (S/T/A/R para la reclutadora, SBI para el colaborador) y feedback turno a turno | Martín Herrera | P1 |
| Pantalla de cierre con celebración, «mañana: …» y diagnóstico paginado | Sofía Navarro | P1 |
| Escalera de confianza conectada al plan (peldaño sugerido según los nervios) | Lucía Fernández | P1 |
| Calibración con profesores humanos y margen de error publicado | Elena Ruiz, Andrés Kim | P1 |
| «Eeh» en hablantes monótonos y segmentación por pausas en el texto transcrito | Andrés Kim | P2 |
| Modo equipos (B2B) y cumplimiento de protección de datos para empresas | Martín Herrera | P2 |

## 6. Reseñas de la ronda 2

- **Elena Ruiz:** «Ahora sí es una app honesta: me dijo exactamente qué parte de STAR o PREP me faltaba y dejó de inflar las notas.»
- **Martín Herrera:** «Mi "perdón por molestar" bajó mi asertividad como correspondía, y los casos de feedback, comité de finanzas y mala noticia son exactamente lo que vivo como gerente.»
- **Lucía Fernández:** «Ahora sí cuida a la gente nerviosa: modo sin puntajes, una meta que premia animarse aunque haya nervios y ayuda visible si estás mal.»
- **Sofía Navarro:** «Se siente honesta y cuidadosa […]. Le falta un poco de alegría y un motivo para volver mañana, pero ya la recomiendo para preparar entrevistas.»
- **Andrés Kim:** «Mucho más honesta: ya no me inventa "eeh" ni cuenta "este es el plan" como muletilla, y avisa con claridad qué se procesa fuera del teléfono.»
- **Camila:** «El plan de mi entrevista se va marcando solo y el simulacro me repregunta como un entrevistador de verdad 🙌. Lástima que tenga que escribir en vez de hablar.»

## 7. Cómo repetirlo

Hay que repetirlo después de cada cambio importante, con los mismos 6 perfiles y criterios:
1. Capturar las pantallas a 390 px.
2. Entregar a cada perfil su pauta.
3. Calcular promedios y NPS.
4. Corregir los 3 problemas más repetidos.

Se pasa a la beta con personas reales cuando el panel promedie 4,0 ★ o más. Esta versión ya lo alcanzó.
