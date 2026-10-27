"""Prueba cada función de VOXA con distintos modelos y nubes, y mide calidad, velocidad y costo.

Pasa por el mismo código que usan las personas (los endpoints reales), así que mide lo que la app hará en producción.

    cd voxa/server
    python -m evals.run                                          # Opus, Sonnet y Haiku en la API de Anthropic
    python -m evals.run --models claude-opus-5-5 --provider bedrock
    python -m evals.run --repeat 3 --out ../docs/evals/RESULTADOS.md
    python -m evals.run --simulate                               # sin clave: prueba el banco, no los modelos

Costo de una corrida completa (9 casos × 3 modelos): menos de US$1 a precios de la API de Anthropic.
"""

import argparse
import json
import os
import statistics
import sys
import tempfile
import time
from datetime import date
from pathlib import Path
from types import SimpleNamespace

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

DEFAULT_MODELS = ["claude-opus-5-5", "claude-sonnet-5-5", "claude-haiku-5-5"]


def sample(schema: dict):
    """Respuesta válida y genérica para un esquema: sólo para comprobar el banco sin llamar a ningún modelo."""
    t = schema.get("type")
    if t == "object":
        return {k: sample(v) for k, v in schema["properties"].items()}
    if t == "array":
        return [sample(schema["items"])]
    return {"string": "texto de prueba", "integer": 50, "boolean": False}.get(t)


class SimulatedMessages:
    def create(self, **kw):
        body = sample(kw["output_config"]["format"]["schema"])
        return SimpleNamespace(stop_reason="end_turn", content=[SimpleNamespace(type="text", text=json.dumps(body))],
                               usage=SimpleNamespace(input_tokens=1500, output_tokens=400, cache_read_input_tokens=0))


def run(models: list[str], provider: str, repeat: int, simulate: bool) -> dict:
    os.environ.update({"VOXA_PROVIDER": provider, "VOXA_DEFAULT_PLAN": "pro", "VOXA_RATE_LIMIT": "100000",
                       "VOXA_DB": str(Path(tempfile.mkdtemp()) / "evals.db")})
    os.environ.pop("VOXA_MONTHLY_BUDGET_USD", None)
    import app as voxa
    from fastapi.testclient import TestClient
    from evals.cases import CASES, DISCRIMINATION

    if simulate:
        fake = SimulatedMessages()
        voxa._clients[provider] = SimpleNamespace(beta=SimpleNamespace(messages=fake), messages=fake)
    api = TestClient(voxa.app)
    results = {}
    for model in models:
        for route in voxa.ROUTES:
            os.environ[f"VOXA_MODEL_{route.upper()}"] = model
        rows = []
        for case in CASES:
            for i in range(repeat):
                body = json.loads(json.dumps(case["body"]))
                if repeat > 1 and case["route"] == "feedback":
                    body["prompt"] += " " * i   # evita la caché de respuestas idénticas entre repeticiones
                usd_before = voxa.USAGE[case["route"]]["usd"]
                t0 = time.perf_counter()
                r = api.post(case["path"], json=body, headers={"X-VOXA-User": f"evals_{model}"[:64].replace(".", "_")})
                seconds = time.perf_counter() - t0
                row = {"case": case["id"], "route": case["route"], "status": r.status_code, "seconds": round(seconds, 2),
                       "usd": round(voxa.USAGE[case["route"]]["usd"] - usd_before, 5), "checks": {}}
                if r.status_code == 200:
                    out = r.json()
                    row["output"] = out
                    for name, check in case["checks"].items():
                        try:
                            row["checks"][name] = bool(check(out))
                        except Exception:
                            row["checks"][name] = False
                else:
                    row["error"] = r.text[:200]
                rows.append(row)
        gaps = []
        for good, poor, score in DISCRIMINATION:
            g = [score(x["output"]) for x in rows if x["case"] == good and "output" in x]
            p = [score(x["output"]) for x in rows if x["case"] == poor and "output" in x]
            if g and p:
                gaps.append(round(statistics.mean(g) - statistics.mean(p), 1))
        results[model] = {"rows": rows, "gaps": gaps}
    return results


def summary(results: dict, provider: str, simulate: bool) -> str:
    from evals.cases import CASES
    routes = list(dict.fromkeys(c["route"] for c in CASES))
    lines = [f"# Pruebas por modelo · {provider} · {date.today().isoformat()}" + (" · SIMULADO (sin modelos reales)" if simulate else ""), "",
             "Verificaciones automáticas por función (aprobadas / total), segundos promedio por llamada y costo promedio por llamada "
             "a precios de la API de Anthropic. «Separación» = puntaje de la respuesta buena menos el de la floja (más es mejor).", "",
             "| Modelo | " + " | ".join(routes) + " | Separación | Errores |", "|---|" + "---|" * (len(routes) + 2)]
    for model, res in results.items():
        cells = []
        for route in routes:
            rows = [r for r in res["rows"] if r["route"] == route]
            ok = sum(sum(r["checks"].values()) for r in rows)
            total = sum(len(c["checks"]) for c in CASES if c["route"] == route) * (len(rows) // max(1, sum(c["route"] == route for c in CASES)))
            secs = statistics.mean(r["seconds"] for r in rows)
            usd = statistics.mean(r["usd"] for r in rows)
            cells.append(f"{ok}/{total} · {secs:.1f} s · ${usd:.4f}")
        errors = sum(r["status"] != 200 for r in res["rows"])
        lines.append(f"| {model} | " + " | ".join(cells) + f" | {', '.join(map(str, res['gaps'])) or '—'} | {errors} |")
    lines += ["", "## Verificaciones que fallaron", ""]
    for model, res in results.items():
        failed = [f"{r['case']}: {k}" for r in res["rows"] for k, v in r["checks"].items() if not v]
        failed += [f"{r['case']}: HTTP {r['status']}" for r in res["rows"] if r["status"] != 200]
        lines.append(f"- **{model}**: " + ("; ".join(failed) if failed else "ninguna"))
    return "\n".join(lines) + "\n"


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--models", default=",".join(DEFAULT_MODELS))
    ap.add_argument("--provider", default=os.environ.get("VOXA_PROVIDER", "anthropic"))
    ap.add_argument("--repeat", type=int, default=1)
    ap.add_argument("--simulate", action="store_true")
    ap.add_argument("--out", help="archivo Markdown para el resumen (además se guarda el detalle en .json)")
    a = ap.parse_args()
    results = run(a.models.split(","), a.provider, a.repeat, a.simulate)
    text = summary(results, a.provider, a.simulate)
    print(text)
    if a.out:
        Path(a.out).parent.mkdir(parents=True, exist_ok=True)
        Path(a.out).write_text(text, encoding="utf-8")
        Path(a.out).with_suffix(".json").write_text(json.dumps(results, ensure_ascii=False, indent=1), encoding="utf-8")


if __name__ == "__main__":
    main()
