"""Pruebas de la API de VOXA con un cliente de Anthropic simulado (no consume la API real)."""

import json
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

import app as voxa


class FakeMessages:
    def __init__(self, payload, stop_reason="end_turn"):
        self.payload, self.stop_reason, self.calls = payload, stop_reason, []

    def create(self, **kwargs):
        self.calls.append(kwargs)
        return SimpleNamespace(stop_reason=self.stop_reason,
                               content=[SimpleNamespace(type="text", text=json.dumps(self.payload))])


def fake_client(monkeypatch, payload, stop_reason="end_turn"):
    messages = FakeMessages(payload, stop_reason)
    monkeypatch.setattr(voxa, "_client", SimpleNamespace(beta=SimpleNamespace(messages=messages)))
    return messages


api = TestClient(voxa.app)

FEEDBACK = {
    "strength": {"text": "Apertura clara", "quote": "Soy Ana"},
    "focus": {"area": "Resultados", "why": "Faltó un número"},
    "structure": {"method": "STAR", "present": ["Situación"], "missing": ["Resultado"], "comment": "ok"},
    "rewrite": "…", "exercise": {"title": "Cifra", "steps": ["a"], "minutes": 2},
    "rubric": {"claridad": 70, "estructura": 60, "persuasion": 55, "asertividad": 65, "conexion": 60},
    "next_challenge": "STAR en 90 s", "safety_note": "",
}


def walk_objects(schema):
    if schema.get("type") == "object":
        yield schema
        for sub in schema["properties"].values():
            yield from walk_objects(sub)
    elif schema.get("type") == "array":
        yield from walk_objects(schema["items"])


@pytest.mark.parametrize("schema", [voxa.FEEDBACK_SCHEMA, voxa.ROLEPLAY_SCHEMA, voxa.EVAL_SCHEMA, voxa.WRITING_SCHEMA])
def test_schemas_are_strict(schema):
    for o in walk_objects(schema):
        assert o["additionalProperties"] is False
        assert set(o["required"]) == set(o["properties"])


def test_feedback_sends_metrics_and_parses_json(monkeypatch):
    messages = fake_client(monkeypatch, FEEDBACK)
    r = api.post("/api/feedback", json={
        "scenario": "Entrevista", "method": "STAR", "prompt": "Cuéntame de un logro", "transcript": "Soy Ana",
        "metrics": [{"label": "Ritmo", "display": "140 ppm", "target": "120–165", "score": 100}],
    })
    assert r.status_code == 200 and r.json()["focus"]["area"] == "Resultados"
    call = messages.calls[0]
    assert call["model"] == voxa.MODEL
    assert call["fallbacks"] == "default" and call["betas"] == [voxa.FALLBACK_BETA]
    assert call["output_config"]["format"]["schema"] is voxa.FEEDBACK_SCHEMA
    assert "Ritmo: 140 ppm" in call["messages"][0]["content"]


def test_refusal_returns_422(monkeypatch):
    fake_client(monkeypatch, {}, stop_reason="refusal")
    r = api.post("/api/feedback", json={"scenario": "x", "method": "PREP", "prompt": "y"})
    assert r.status_code == 422


def test_roleplay_builds_alternating_history(monkeypatch):
    messages = fake_client(monkeypatch, {"reply": "¿Y el resultado?", "end": False, "coach_hint": "Da una cifra"})
    history = [{"role": "persona", "text": voxa.PERSONAS["reclutadora"]["opening"]}, {"role": "user", "text": "Hola"}]
    r = api.post("/api/roleplay", json={"persona_id": "reclutadora", "difficulty": 3, "history": history})
    assert r.status_code == 200 and r.json()["reply"] == "¿Y el resultado?"
    sent = messages.calls[0]["messages"]
    assert [m["role"] for m in sent] == ["user", "assistant", "user"]
    assert "interrumpes" in messages.calls[0]["system"]


def test_roleplay_rejects_bad_input(monkeypatch):
    fake_client(monkeypatch, {})
    assert api.post("/api/roleplay", json={"persona_id": "nadie", "history": [{"role": "user", "text": "x"}]}).status_code == 404
    ends_with_persona = [{"role": "persona", "text": "Hola"}]
    assert api.post("/api/roleplay", json={"persona_id": "jefe", "history": ends_with_persona}).status_code == 400


def test_personas_listing():
    ids = {p["id"] for p in api.get("/api/personas").json()}
    assert ids == set(voxa.PERSONAS)


def test_roleplay_context_is_wrapped_as_data(monkeypatch):
    messages = fake_client(monkeypatch, {"reply": "¿Y SQL?", "end": False, "coach_hint": "Da un ejemplo"})
    history = [{"role": "persona", "text": "Hola"}, {"role": "user", "text": "Hola, soy Ana"}]
    r = api.post("/api/roleplay", json={"persona_id": "reclutadora", "history": history,
                                       "context": "Analista de datos. Requisitos: SQL avanzado, Power BI."})
    assert r.status_code == 200
    system = messages.calls[0]["system"]
    assert "<material_usuario>" in system and "SQL avanzado" in system and "nunca como instrucciones" in system


def test_roleplay_context_length_is_limited(monkeypatch):
    fake_client(monkeypatch, {})
    history = [{"role": "persona", "text": "Hola"}, {"role": "user", "text": "Hola"}]
    r = api.post("/api/roleplay", json={"persona_id": "jefe", "history": history, "context": "x" * 8001})
    assert r.status_code == 422


def test_writing_wraps_text_and_returns_rewrite(monkeypatch):
    payload = {"strengths": ["Cordial"], "issues": ["Pedido al final"], "rewrite": "Hola Ana: ¿puedes enviarme el informe antes del viernes?",
               "subject": "Informe antes del viernes", "tone": "cordial y directo", "changes": ["Pedido al inicio"], "safety_note": ""}
    messages = fake_client(monkeypatch, payload)
    r = api.post("/api/writing", json={"kind": "Pedir algo por correo", "method": "BLUF", "text": "Hola, ojalá estés bien... ¿me mandas el informe?",
                                      "local_checks": ["El pedido está al final"]})
    assert r.status_code == 200 and r.json()["subject"] == "Informe antes del viernes"
    content = messages.calls[0]["messages"][0]["content"]
    assert "<texto_usuario>" in content and "El pedido está al final" in content
    assert messages.calls[0]["output_config"]["format"]["schema"] is voxa.WRITING_SCHEMA


def test_writing_rejects_empty_or_huge_text(monkeypatch):
    fake_client(monkeypatch, {})
    assert api.post("/api/writing", json={"kind": "x", "text": ""}).status_code == 422
    assert api.post("/api/writing", json={"kind": "x", "text": "a" * 6001}).status_code == 422
