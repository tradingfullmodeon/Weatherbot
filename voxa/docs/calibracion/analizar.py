"""Calibración de Talkride con profesores: ¿los puntajes automáticos ordenan las prácticas como lo haría un experto?

Uso:
    python analizar.py --voxa exportaciones/ --profes notas.csv [--out resultado.md]

- exportaciones/: un archivo por participante, el JSON de Progreso → «Exportar mis datos», llamado <participante>.json.
- notas.csv: una fila por grabación y evaluador (ver plantilla_profes.csv). «grabacion» es <participante>:<id de la sesión>.
  Las columnas vacías se ignoran. Los profesores puntúan de 0 a 100 con la escala anclada (README.md).

Mide por dimensión:
- Spearman entre Talkride y el promedio de los profesores (meta ≥ 0,6);
- error medio absoluto y sesgo (Talkride − profesores);
- acuerdo entre profesores (el techo razonable para Talkride);
- y las 5 grabaciones con más desacuerdo, para revisarlas.
"""

import argparse
import csv
import json
import statistics
from pathlib import Path

# Columna de la planilla → cómo leer el mismo puntaje en una sesión de Talkride.
DIMENSIONS = {
    "global": lambda s: s.get("total"),
    "voz": lambda s: (s.get("dims") or {}).get("voz"),
    "lenguaje": lambda s: (s.get("dims") or {}).get("lenguaje"),
    "presencia": lambda s: (s.get("dims") or {}).get("presencia"),
    "ritmo": lambda s: ((s.get("metrics") or {}).get("wpm") or {}).get("s"),
    "muletillas": lambda s: ((s.get("metrics") or {}).get("fillers") or {}).get("s"),
    "estructura": lambda s: ((s.get("metrics") or {}).get("structure") or {}).get("s"),
}
TARGET = 0.6


def ranks(xs):
    order = sorted(range(len(xs)), key=lambda i: xs[i])
    r = [0.0] * len(xs)
    i = 0
    while i < len(order):
        j = i
        while j + 1 < len(order) and xs[order[j + 1]] == xs[order[i]]:
            j += 1
        for k in range(i, j + 1):
            r[order[k]] = (i + j) / 2 + 1   # empates: rango promedio
        i = j + 1
    return r


def spearman(a, b):
    if len(a) < 3:
        return None
    ra, rb = ranks(a), ranks(b)
    try:
        return statistics.correlation(ra, rb)
    except statistics.StatisticsError:   # todos iguales: no hay orden que comparar
        return None


def load_voxa(folder: Path) -> dict:
    sessions = {}
    for f in sorted(folder.glob("*.json")):
        data = json.loads(f.read_text(encoding="utf-8"))
        for s in data.get("sessions", []):
            sessions[f"{f.stem}:{s.get('id')}"] = s
    return sessions


def load_profes(path: Path) -> dict:
    """{grabación: {dimensión: {evaluador: puntaje}}}"""
    notas: dict = {}
    with path.open(encoding="utf-8-sig") as fh:
        for row in csv.DictReader(fh):
            for dim in DIMENSIONS:
                v = (row.get(dim) or "").strip()
                if v:
                    notas.setdefault(row["grabacion"].strip(), {}).setdefault(dim, {})[row["evaluador"].strip()] = float(v)
    return notas


def analyze(voxa: dict, notas: dict) -> dict:
    out = {"missing": sorted(g for g in notas if g not in voxa), "dims": {}}
    for dim, read in DIMENSIONS.items():
        pairs = []
        for g, by_dim in notas.items():
            raters = by_dim.get(dim)
            v = read(voxa[g]) if g in voxa else None
            if raters and v is not None:
                pairs.append((g, float(v), statistics.mean(raters.values()), raters))
        if not pairs:
            continue
        vox, prof = [p[1] for p in pairs], [p[2] for p in pairs]
        # Acuerdo entre los dos primeros evaluadores que coinciden en más grabaciones.
        names = sorted({n for p in pairs for n in p[3]})
        inter = None
        if len(names) >= 2:
            both = [(p[3][names[0]], p[3][names[1]]) for p in pairs if names[0] in p[3] and names[1] in p[3]]
            inter = spearman([x for x, _ in both], [y for _, y in both])
        worst = sorted(pairs, key=lambda p: -abs(p[1] - p[2]))[:5]
        out["dims"][dim] = {
            "n": len(pairs), "spearman": spearman(vox, prof),
            "mae": statistics.mean(abs(a - b) for a, b in zip(vox, prof)),
            "bias": statistics.mean(a - b for a, b in zip(vox, prof)),
            "inter": inter, "worst": [(g, v, round(p, 1)) for g, v, p, _ in worst],
        }
    return out


def fmt(x, nd=2):
    return "—" if x is None else f"{x:.{nd}f}".replace(".", ",")


def report(res: dict) -> str:
    lines = ["# Calibración de Talkride con profesores", "",
             f"Meta: Spearman ≥ {fmt(TARGET, 1)} entre Talkride y el promedio de los profesores en cada dimensión.", "",
             "| Dimensión | Grabaciones | Spearman Talkride–profes | Acuerdo entre profes | Error medio | Sesgo de Talkride | ¿Cumple? |",
             "|---|---|---|---|---|---|---|"]
    for dim, d in res["dims"].items():
        ok = d["spearman"] is not None and d["spearman"] >= TARGET
        lines.append(f"| {dim} | {d['n']} | {fmt(d['spearman'])} | {fmt(d['inter'])} | {fmt(d['mae'], 1)} | "
                     f"{'+' if d['bias'] > 0 else ''}{fmt(d['bias'], 1)} | {'✅' if ok else '⚠️ revisar'} |")
    lines += ["", "**Cómo leerlo:**",
              "- Si el sesgo es positivo, Talkride puntúa más alto que los profesores: conviene endurecer esa dimensión.",
              "- Si el acuerdo entre profesores es bajo, la dimensión es difícil de juzgar incluso para expertos: no se le puede exigir más a Talkride.",
              "", "## Grabaciones con más desacuerdo", ""]
    for dim, d in res["dims"].items():
        lines.append(f"- **{dim}:** " + "; ".join(f"{g} (Talkride {fmt(v, 0)}, profes {fmt(p, 1)})" for g, v, p in d["worst"]))
    if res["missing"]:
        lines += ["", f"Grabaciones de la planilla que no están en las exportaciones: {', '.join(res['missing'])}"]
    return "\n".join(lines) + "\n"


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--voxa", required=True, type=Path)
    ap.add_argument("--profes", required=True, type=Path)
    ap.add_argument("--out", type=Path)
    a = ap.parse_args()
    text = report(analyze(load_voxa(a.voxa), load_profes(a.profes)))
    print(text)
    if a.out:
        a.out.write_text(text, encoding="utf-8")


if __name__ == "__main__":
    main()
