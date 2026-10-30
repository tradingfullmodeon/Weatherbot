"""El análisis de calibración detecta acuerdo, sesgo y desacuerdos con datos conocidos."""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import analizar  # noqa: E402


def test_spearman_ties_and_constant():
    assert analizar.ranks([10, 20, 20, 30]) == [1, 2.5, 2.5, 4]
    assert abs(analizar.spearman([1, 2, 3, 4], [10, 20, 30, 40]) - 1) < 1e-9
    assert analizar.spearman([5, 5, 5], [1, 2, 3]) is None
    assert analizar.spearman([1, 2], [1, 2]) is None


def test_end_to_end(tmp_path):
    exp = tmp_path / "exp"; exp.mkdir()
    sessions = [{"id": f"s{i}", "total": t, "dims": {"voz": t - 5}, "metrics": {"fillers": {"s": 100 - t}}}
                for i, t in enumerate([40, 55, 70, 85, 90])]
    (exp / "ana.json").write_text(json.dumps({"profile": {}, "sessions": sessions}), encoding="utf-8")
    rows = ["grabacion,evaluador,global,voz,muletillas"]
    for i, t in enumerate([40, 55, 70, 85, 90]):
        rows.append(f"ana:s{i},p1,{t - 10},{t},{t}")      # global: mismo orden, Talkride 10 más alto
        rows.append(f"ana:s{i},p2,{t - 12},{t + 2},{t}")
    rows.append("ana:nada,p1,50,,")
    notas = tmp_path / "notas.csv"; notas.write_text("\n".join(rows), encoding="utf-8")
    res = analizar.analyze(analizar.load_voxa(exp), analizar.load_profes(notas))
    g = res["dims"]["global"]
    assert g["n"] == 5 and abs(g["spearman"] - 1) < 1e-9 and abs(g["bias"] - 11) < 1e-9 and abs(g["inter"] - 1) < 1e-9
    assert res["dims"]["muletillas"]["spearman"] < 0            # Talkride invertido: debe salir mal
    assert res["missing"] == ["ana:nada"]
    text = analizar.report(res)
    assert "| global | 5 | 1,00 |" in text and "⚠️ revisar" in text
