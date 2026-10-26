# VOXA — Entrenamiento acelerado en comunicación

Plataforma para mejorar cómo se comunica una persona (confianza, desarrollo profesional, liderazgo, hablar en público, conversaciones difíciles, comunicación digital) con práctica guiada por IA y evaluación objetiva por cámara y micrófono.

> Proyecto independiente de PolyWeather Bot; vive en esta carpeta y no comparte código con el bot.

## Contenido

| Ruta | Qué es |
|---|---|
| [`docs/ESTRATEGIA.md`](docs/ESTRATEGIA.md) | Benchmark de la industria, modelos y metodologías de comunicación, ciencia del aprendizaje, lenguaje no verbal basado en evidencia, competencias y niveles, canales de aprendizaje, motor de evaluación, diferenciales, arquitectura, privacidad/regulación, programa de 30 días, modelo de negocio, roadmap y KPIs. |
| [`prototype/index.html`](prototype/index.html) | MVP funcional en el navegador: grabación con cámara y micrófono, transcripción en vivo, métricas de voz, lenguaje y presencia, puntaje VOXA, feedback accionable, replay y prompt para un coach IA. |

## Probar el prototipo

La cámara y el micrófono requieren HTTPS o `localhost`:

```bash
cd voxa/prototype
python3 -m http.server 8000
# abrir http://localhost:8000 en Chrome o Edge
```

1. Elige un escenario (presentación, entrevista STAR, pitch, actualización ejecutiva, feedback SBI, improvisación) y tu variante de español.
2. Activa cámara y micrófono → **Comenzar** → habla → **Terminar y evaluar**.
3. Revisa tu puntaje, tu foco de mejora, el ejercicio sugerido y la línea de tiempo; reintenta.

Qué mide (todo se procesa localmente en el dispositivo):

- **Voz:** palabras por minuto, muletillas por minuto (diccionario regional), tiempo hablando, silencios largos, variación de tono en semitonos, estabilidad de volumen.
- **Lenguaje:** atenuadores que restan asertividad ("creo que", "un poquito", "perdón"), desarrollo del contenido.
- **Presencia** (MediaPipe Face Landmarker, cargado desde CDN): rostro en cuadro, mirada aproximada a cámara, sonrisa, estabilidad de cabeza. Son conductas observables, **no** inferencia de emociones.

Limitaciones conocidas: la transcripción depende de la Web Speech API (mejor en Chrome/Edge) y suele omitir "eh/em"; los rangos objetivo son heurísticas iniciales a calibrar con datos reales; si el CDN de MediaPipe no carga, se evalúan sólo voz y lenguaje.
