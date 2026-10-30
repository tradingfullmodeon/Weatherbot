"""Servidor de Talkride con un coach IA SIMULADO: respuestas fijas y realistas, sin clave y sin costo.

Sirve para recorrer la app completa (incluidas las funciones con IA) en el navegador o en las pruebas
de punta a punta. Nunca se usa en producción.

    python voxa/tests/e2e/servidor_simulado.py 8800        # luego abrir http://localhost:8800
"""

import json
import os
import sys
import tempfile
from pathlib import Path
from types import SimpleNamespace

SERVER = Path(__file__).resolve().parents[2] / "server"
sys.path.insert(0, str(SERVER))
os.environ.setdefault("VOXA_DB", str(Path(tempfile.mkdtemp()) / "simulado.db"))
os.environ.setdefault("VOXA_DEFAULT_PLAN", "prueba")
os.environ["ANTHROPIC_API_KEY"] = "simulada"   # sólo para que la app muestre el coach como disponible

import app as voxa  # noqa: E402

FEEDBACK = {
    "strength": {"text": "Abriste con quién eres y qué haces en una sola frase: se entiende de inmediato.", "quote": ""},
    "focus": {"area": "Cerrar con un resultado concreto", "why": "Contaste qué hiciste, pero no qué cambió gracias a eso. Un número hace creíble tu historia."},
    "structure": {"method": "STAR", "present": ["Situación", "Acción"], "missing": ["Resultado"], "comment": "Agrega el resultado en una frase con un dato."},
    "rewrite": "En mi trabajo anterior las entregas se atrasaban dos semanas. Mi tarea era ordenarlas antes del cierre. Armé un tablero con prioridades y reuniones de 10 minutos. En un mes, el 90% de las entregas llegó a tiempo.",
    "exercise": {"title": "El resultado en 10 segundos", "steps": ["Elige un logro reciente.", "Dilo en voz alta terminando con un número.", "Repite hasta decirlo sin «eh»."], "minutes": 3},
    "rubric": {"claridad": 74, "estructura": 58, "persuasion": 61, "asertividad": 70, "conexion": 66},
    "next_challenge": "Responde «Cuéntame de un logro» en 90 segundos con STAR completo.",
    "safety_note": "",
}
REPLIES = [
    "Entiendo. ¿Y qué resultado concreto lograste con eso?",
    "Interesante. Si tuvieras que hacerlo de nuevo, ¿qué cambiarías?",
    "Bien. Última pregunta: ¿por qué deberíamos elegirte a ti?",
]
EVALUATE = {
    "summary": "Mantuviste la calma y respondiste lo que te preguntaron. Te faltó cerrar cada respuesta con un resultado.",
    "scores": {"escucha": 72, "empatia": 68, "claridad": 70, "asertividad": 64, "manejo_objeciones": 60, "logro_objetivo": 66},
    "best_moment": {"quote": "", "why": "Reconociste la pregunta antes de responder."},
    "missed_moment": {"quote": "", "better": "Termina con «El resultado fue…» y un número."},
    "techniques_used": ["Reformular la pregunta", "Ejemplo concreto"],
    "next_step": "Practica el cierre con resultado en el simulacro de entrevista.",
    "safety_note": "",
}
WRITING = {
    "strengths": ["Tono cordial", "Dejas claro quién eres"],
    "issues": ["El pedido aparece al final", "Hay dos disculpas que restan seguridad"],
    "rewrite": "Hola Carolina: ¿puedo tomarme libre el viernes 14? Dejo el informe listo el jueves y Pedro cubre las llamadas. ¡Gracias!",
    "subject": "Viernes 14 libre",
    "tone": "cordial y directo",
    "changes": ["El pedido va primero", "Sin disculpas innecesarias", "Ofreces cómo cubrir tu ausencia"],
    "safety_note": "",
}
EVENT = {"questions": [
    {"q": f"Pregunta difícil {i + 1} para tu evento", "why": "Es lo que más suelen preguntar en esta situación.", "tip": "Responde con STAR y cierra con un dato."}
    for i in range(6)]}


class SimulatedMessages:
    def __init__(self):
        self.turn = 0

    def create(self, **kw):
        schema = kw["output_config"]["format"]["schema"]
        if schema is voxa.FEEDBACK_SCHEMA:
            body = FEEDBACK
        elif schema is voxa.ROLEPLAY_SCHEMA:
            users = sum(m["role"] == "user" for m in kw["messages"]) - 1
            body = {"reply": REPLIES[min(users - 1, 2)] if users < 4 else "Gracias por tu tiempo. Te escribiremos esta semana.",
                    "end": users >= 4, "coach_hint": "Cierra con un resultado concreto.", "safety_note": ""}
        elif schema is voxa.EVAL_SCHEMA:
            body = EVALUATE
        elif schema is voxa.WRITING_SCHEMA:
            body = WRITING
        else:
            body = EVENT
        return SimpleNamespace(stop_reason="end_turn", content=[SimpleNamespace(type="text", text=json.dumps(body, ensure_ascii=False))],
                               usage=SimpleNamespace(input_tokens=1500, output_tokens=600, cache_read_input_tokens=0))


fake = SimulatedMessages()
voxa._clients["anthropic"] = SimpleNamespace(beta=SimpleNamespace(messages=fake), messages=fake)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(voxa.app, host="127.0.0.1", port=int(sys.argv[1]) if len(sys.argv) > 1 else 8800, log_level="warning")
