"""Prueba con usuarios (beta): opiniones y uso anónimo, sin contenido de las prácticas.

Guarda sólo lo necesario para saber si la app sirve y si la gente vuelve:
  · opiniones: estrellas, recomendación (0–10), lo que más sirvió y un comentario opcional;
  · uso: qué tipo de práctica se hizo cada día (evaluación, roleplay, gimnasio…), con el id anónimo del dispositivo.
Nunca se guarda lo que la persona dijo o escribió en una práctica. Mismo SQLite que los cupos.
"""

import time
from datetime import datetime, timedelta, timezone

from quotas import _db

SCHEMA = """
CREATE TABLE IF NOT EXISTS opinions (user TEXT, at REAL, stars INTEGER, nps INTEGER, liked TEXT, comment TEXT, lang TEXT, version TEXT);
CREATE TABLE IF NOT EXISTS pings (user TEXT, day TEXT, kind TEXT, n INTEGER, PRIMARY KEY (user, day, kind));
"""
KINDS = {"evaluacion", "roleplay", "gimnasio", "escritura", "diagnostico", "evento", "leccion"}
_ready: set[str] = set()


def _run(fn):
    """Ejecuta fn(con) en una transacción; crea las tablas de la prueba la primera vez."""
    from quotas import db_path
    with _db() as con:
        if db_path() not in _ready:
            for stmt in filter(str.strip, SCHEMA.split(";")):
                con.execute(stmt)
            _ready.add(db_path())
        return fn(con)


def today() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def save_opinion(user: str, stars: int, nps: int | None, liked: list[str], comment: str, lang: str, version: str) -> None:
    _run(lambda con: con.execute("INSERT INTO opinions VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                                 (user, time.time(), stars, nps, ",".join(liked), comment.strip(), lang, version)))


def ping(user: str, kind: str) -> None:
    _run(lambda con: con.execute("INSERT INTO pings VALUES (?, ?, ?, 1) ON CONFLICT(user, day, kind) DO UPDATE SET n = n + 1",
                                 (user, today(), kind)))


def forget(user: str) -> None:
    def go(con):
        con.execute("DELETE FROM opinions WHERE user = ?", (user,))
        con.execute("DELETE FROM pings WHERE user = ?", (user,))
    _run(go)


def summary(days: int = 30) -> dict:
    """Panel de la prueba: personas activas, retención, prácticas por tipo y opiniones."""
    since = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%d")

    def go(con):
        rows = con.execute("SELECT user, day, kind, n FROM pings WHERE day >= ?", (since,)).fetchall()
        ops = con.execute("SELECT at, stars, nps, liked, comment, lang, version FROM opinions ORDER BY at DESC").fetchall()
        return rows, ops
    rows, ops = _run(go)
    by_user: dict[str, set] = {}
    by_day: dict[str, set] = {}
    kinds: dict[str, int] = {}
    for user, day, kind, n in rows:
        by_user.setdefault(user, set()).add(day)
        by_day.setdefault(day, set()).add(user)
        kinds[kind] = kinds.get(kind, 0) + n
    week = (datetime.now(timezone.utc) - timedelta(days=7)).strftime("%Y-%m-%d")
    stars = [o[1] for o in ops if o[1]]
    nps = [o[2] for o in ops if o[2] is not None]
    liked: dict[str, int] = {}
    for o in ops:
        for f in filter(None, (o[3] or "").split(",")):
            liked[f] = liked.get(f, 0) + 1
    return {
        "personas": len(by_user),
        "activas_7_dias": len({u for u, ds in by_user.items() if any(d >= week for d in ds)}),
        "volvieron_otro_dia": len([u for u, ds in by_user.items() if len(ds) >= 2]),
        "dias_promedio_por_persona": round(sum(len(ds) for ds in by_user.values()) / len(by_user), 1) if by_user else 0,
        "activas_por_dia": {d: len(us) for d, us in sorted(by_day.items())},
        "practicas_por_tipo": dict(sorted(kinds.items(), key=lambda x: -x[1])),
        "opiniones": {
            "cantidad": len(ops),
            "estrellas_promedio": round(sum(stars) / len(stars), 2) if stars else None,
            # NPS: % de promotores (9–10) menos % de detractores (0–6).
            "nps": round(100 * (sum(n >= 9 for n in nps) - sum(n <= 6 for n in nps)) / len(nps)) if nps else None,
            "lo_que_mas_sirve": dict(sorted(liked.items(), key=lambda x: -x[1])),
            "comentarios": [{"fecha": datetime.fromtimestamp(o[0], timezone.utc).strftime("%Y-%m-%d"), "estrellas": o[1], "nps": o[2],
                             "comentario": o[4], "idioma": o[5], "version": o[6]} for o in ops if o[4]][:200],
        },
    }
