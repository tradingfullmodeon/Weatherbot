# Calibración de VOXA con profesores

**Para qué:** comprobar con expertos reales que los puntajes de VOXA ordenan las prácticas como lo haría un profesor de oratoria. Es la acción P1 «Calibración con profesores» del [plan de acción](../PLAN_ACCION.md) y la prueba de credibilidad más fuerte frente a la competencia (A7 en el [benchmark de calificaciones](../CALIFICACIONES.md)).

**Meta:** correlación de Spearman de **0,6 o más** entre VOXA y el promedio de los profesores en cada dimensión. Como referencia de techo, se mide también cuánto coinciden los profesores entre sí.

## 1. Quiénes y cuánto

| Qué | Propuesta |
|---|---|
| Grabaciones | **50**, de la beta, en 3 situaciones: presentación personal, entrevista (STAR) y opinión (PREP). Distintos niveles: no sólo las mejores |
| Profesores | **2 o 3** de oratoria o de comunicación. Los 6 profesores o coaches de la beta sirven |
| Tiempo por profesor | Unas 4 horas: 50 grabaciones de 1 minuto, más unos 3 minutos para puntuar cada una |
| Costo | Una sesión de coaching pagada, o un reconocimiento como «profesor fundador» de VOXA |
| Plazo | 1 semana |

## 2. Cómo se juntan las grabaciones

1. Cada participante hace la práctica en **Evaluar** y guarda **su propia grabación**, con la grabadora del celular o con «Elegir una grabación».
2. Al final exporta sus datos: Progreso → «Exportar mis datos (JSON)». Renombra el archivo con su seudónimo (por ejemplo `ana.json`) y lo envía junto con la grabación.
3. Cada grabación se identifica como `seudónimo:id-de-la-sesión`. El id está en el JSON exportado.
4. **Consentimiento** (mensaje para enviar antes):

   > «Para mejorar VOXA, dos profesores de comunicación escucharán tu grabación y la puntuarán. Sólo la usaremos para comparar los puntajes de la app con los de expertos. Se identifica con un seudónimo y se borra al terminar el estudio. Puedes retirarte cuando quieras.»

## 3. Cómo puntúan los profesores

- Cada uno trabaja **por separado y sin ver el puntaje de VOXA**.
- Llenan una fila por grabación en [`plantilla_profes.csv`](plantilla_profes.csv). Pueden dejar vacía una columna que no puedan juzgar; por ejemplo, presencia en un audio.
- Usan la misma escala anclada que el coach IA:

| Puntaje | Significa |
|---|---|
| 0–39 | Ausente o contraproducente |
| 40–69 | Parcial o genérico |
| 70–84 | Sólido, con evidencia en lo que dijo |
| 85–100 | Excelente y citable |

| Columna | Qué juzgar |
|---|---|
| `global` | La impresión general como comunicador en esa situación |
| `voz` | Ritmo, pausas, tono, volumen y énfasis |
| `lenguaje` | Claridad, desarrollo, estructura y seguridad de las frases |
| `presencia` | Mirada y postura (sólo con video) |
| `ritmo` | Velocidad: ni apurado ni lento |
| `muletillas` | Ausencia de «este», «o sea», «eeh» (100 = ninguna) |
| `estructura` | Si sigue el método de la situación (STAR o PREP) |

## 4. Cómo se analiza

```bash
cd voxa/docs/calibracion
python analizar.py --voxa exportaciones/ --profes notas.csv --out resultado.md
```

El resultado trae, por dimensión:
- la correlación entre VOXA y los profesores;
- el acuerdo entre profesores;
- el error medio;
- el **sesgo** (si VOXA puntúa más alto o más bajo);
- las 5 grabaciones con más desacuerdo, para escucharlas y entender por qué.

## 5. Qué hacer con el resultado

| Resultado | Acción |
|---|---|
| Spearman ≥ 0,6 | Publicarlo como prueba de credibilidad («validado con profesores de comunicación») |
| Spearman bajo pero acuerdo entre profesores también bajo | La dimensión es difícil incluso para expertos: explicarla mejor en la app antes que ajustar números |
| Spearman bajo y acuerdo alto | Ajustar los rangos de esa métrica en `prototype/audiofile.js` (`band(...)`) o su peso en el total, y volver a medir con las mismas grabaciones |
| Sesgo de más de 10 puntos | Mover los rangos para que VOXA no infle ni castigue |

Todo el proceso se puede repetir después de cada cambio importante del motor de puntajes, con las mismas grabaciones.
