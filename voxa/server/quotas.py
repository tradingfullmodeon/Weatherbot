"""Planes, cupos de IA por persona y tope de gasto mensual.

La IA la paga Talkride (la clave de Anthropic vive sólo en el servidor), así que cada llamada se controla:
  · gratis: sin IA (todo el análisis local sigue funcionando en el teléfono);
  · prueba: 7 días con cupos amplios para conocer el coach;
  · pro: uso justo mensual, pensado para que nadie que practique de verdad lo alcance.
Además, VOXA_MONTHLY_BUDGET_USD pone un techo al gasto total del mes: nunca llega una cuenta sorpresa.

Guarda todo en SQLite (un archivo; sin servicios extra). Para producción con varias instancias, la misma
interfaz se implementa sobre Postgres.
"""

import json
import os
import re
import sqlite3
import threading
import time
from contextlib import contextmanager
from datetime import datetime, timezone

from fastapi import HTTPException, Request

ROUTES = ("feedback", "roleplay", "evaluate", "writing", "event")
PLANS = {
    "gratis": {r: 0 for r in ROUTES},
    "prueba": {"feedback": 15, "roleplay": 80, "evaluate": 6, "writing": 6, "event": 2},
    "pro": {"feedback": 60, "roleplay": 400, "evaluate": 30, "writing": 30, "event": 10},
}
TRIAL_DAYS = 7
LIMIT_MSG = {
    "gratis": "El coach IA es parte del plan Pro. Todo el análisis de tu voz, la estructura y el simulacro siguen gratis.",
    "prueba": "Usaste el cupo de tu prueba en esta función. Con el plan Pro sigues practicando con el coach IA.",
    "pro": "Llegaste al uso justo de este mes en esta función. Se renueva el día 1.",
}
USER_RE = re.compile(r"^[A-Za-z0-9_-]{8,64}$")


def db_path() -> str:
    return os.environ.get("VOXA_DB", os.path.join(os.path.dirname(__file__), "voxa.db"))


SCHEMA = """
CREATE TABLE IF NOT EXISTS plans (user TEXT PRIMARY KEY, plan TEXT, until REAL);
CREATE TABLE IF NOT EXISTS usage (user TEXT, period TEXT, route TEXT, n INTEGER, PRIMARY KEY (user, period, route));
CREATE TABLE IF NOT EXISTS spend (month TEXT PRIMARY KEY, usd REAL);
CREATE TABLE IF NOT EXISTS answers (key TEXT PRIMARY KEY, at REAL, body TEXT);
CREATE TABLE IF NOT EXISTS trials_used (user TEXT PRIMARY KEY);
"""
_ready: set[str] = set()
_lock = threading.Lock()


@contextmanager
def _db():
    """Una conexión corta por operación (los endpoints corren en hilos): confirma y se cierra siempre.

    WAL permite leer mientras otro hilo escribe; el esquema se crea una sola vez por archivo.
    """
    path = db_path()
    con = sqlite3.connect(path, timeout=30, isolation_level=None)   # transacciones explícitas (BEGIN IMMEDIATE)
    try:
        if path not in _ready:
            with _lock:
                con.execute("PRAGMA journal_mode=WAL")
                con.executescript(SCHEMA)
                _ready.add(path)
        con.execute("BEGIN IMMEDIATE")   # una escritura a la vez: cupos y altas no se pisan entre hilos
        try:
            yield con
            con.execute("COMMIT")
        except BaseException:
            con.execute("ROLLBACK")
            raise
    finally:
        con.close()


def month() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m")


def account_id(request: Request) -> str | None:
    """Cuenta verificada (Supabase Auth u otro emisor de JWT): «Authorization: Bearer <token>».

    VOXA_JWT_SECRET valida tokens HS256 (secreto del proyecto); VOXA_JWKS_URL, tokens firmados con clave
    pública (RS256/ES256). Sin ninguna de las dos, las cuentas están apagadas y se usa el id del dispositivo.
    """
    auth = request.headers.get("authorization", "")
    secret, jwks = os.environ.get("VOXA_JWT_SECRET"), os.environ.get("VOXA_JWKS_URL")
    if not auth.startswith("Bearer ") or not (secret or jwks):
        return None
    import jwt  # sólo se carga si hay cuentas
    token = auth[7:]
    try:
        if jwks:
            key, algs = _jwks_client(jwks).get_signing_key_from_jwt(token).key, ["RS256", "ES256"]
        else:
            key, algs = secret, ["HS256"]
        claims = jwt.decode(token, key, algorithms=algs, audience=os.environ.get("VOXA_JWT_AUD", "authenticated"))
    except jwt.PyJWTError as e:
        raise HTTPException(401, "Sesión vencida: vuelve a iniciar sesión.") from e
    sub = re.sub(r"[^A-Za-z0-9_-]", "", str(claims.get("sub", "")))
    return f"u_{sub}"[:64] if sub else None


_jwks: dict = {}


def _jwks_client(url: str):
    import jwt
    if url not in _jwks:
        _jwks[url] = jwt.PyJWKClient(url, cache_keys=True)
    return _jwks[url]


def user_id(request: Request) -> str:
    """Cuenta verificada si la hay; si no, el identificador anónimo del dispositivo (la app lo genera)."""
    if acc := account_id(request):
        return acc
    uid = request.headers.get("x-voxa-user", "")
    if USER_RE.match(uid):
        return uid
    return "ip_" + (request.client.host if request.client else "desconocido").replace(".", "_").replace(":", "_")


def _plan(con, user: str) -> tuple[str, float | None]:
    """Plan vigente dentro de una transacción. Quien llega por primera vez recibe VOXA_DEFAULT_PLAN (por defecto,
    la prueba de 7 días), salvo que ya la haya usado y después borrado sus datos: la prueba no se reinicia."""
    row = con.execute("SELECT plan, until FROM plans WHERE user = ?", (user,)).fetchone()
    if row is None:
        plan = os.environ.get("VOXA_DEFAULT_PLAN", "prueba")
        if plan == "prueba" and con.execute("SELECT 1 FROM trials_used WHERE user = ?", (user,)).fetchone():
            plan = "gratis"
        until = time.time() + TRIAL_DAYS * 86400 if plan == "prueba" else None
        con.execute("INSERT OR IGNORE INTO plans VALUES (?, ?, ?)", (user, plan, until))
        if plan == "prueba":
            con.execute("INSERT OR IGNORE INTO trials_used VALUES (?)", (user,))
        row = con.execute("SELECT plan, until FROM plans WHERE user = ?", (user,)).fetchone()
    plan, until = row
    if until is not None and time.time() > until:
        return "gratis", None
    return plan, until


def plan_of(user: str) -> tuple[str, float | None]:
    with _db() as con:
        return _plan(con, user)


def set_plan(user: str, plan: str, until: float | None = None) -> None:
    """Lo llama la integración de pagos (RevenueCat o la pasarela web) al confirmar una compra o una baja."""
    if plan not in PLANS:
        raise ValueError(plan)
    with _db() as con:
        con.execute("INSERT INTO plans VALUES (?, ?, ?) ON CONFLICT(user) DO UPDATE SET plan = excluded.plan, until = excluded.until",
                    (user, plan, until))


def _period(plan: str) -> str:
    return "prueba" if plan == "prueba" else month()


def used(user: str, plan: str, route: str) -> int:
    with _db() as con:
        row = con.execute("SELECT n FROM usage WHERE user = ? AND period = ? AND route = ?", (user, _period(plan), route)).fetchone()
    return row[0] if row else 0


def check(user: str, route: str) -> None:
    """Antes de llamar a la IA: reserva una unidad del cupo en la misma transacción en que la verifica, así varias
    solicitudes en paralelo no pueden pasarse del cupo. Si la llamada falla, release() la devuelve."""
    budget = float(os.environ.get("VOXA_MONTHLY_BUDGET_USD", "0") or 0)
    with _db() as con:
        if budget:
            row = con.execute("SELECT usd FROM spend WHERE month = ?", (month(),)).fetchone()
            if (row[0] if row else 0.0) >= budget:
                raise HTTPException(503, "El coach IA está en pausa por hoy. El análisis local de tu práctica sigue funcionando.")
        plan, _ = _plan(con, user)
        row = con.execute("SELECT n FROM usage WHERE user = ? AND period = ? AND route = ?", (user, _period(plan), route)).fetchone()
        if (row[0] if row else 0) >= PLANS[plan][route]:
            raise HTTPException(402, LIMIT_MSG[plan])
        con.execute("INSERT INTO usage VALUES (?, ?, ?, 1) ON CONFLICT(user, period, route) DO UPDATE SET n = n + 1",
                    (user, _period(plan), route))


def release(user: str, route: str) -> None:
    """Devuelve la unidad reservada cuando la IA falló o no entregó una respuesta usable: no se cobra."""
    with _db() as con:
        plan, _ = _plan(con, user)
        con.execute("UPDATE usage SET n = MAX(0, n - 1) WHERE user = ? AND period = ? AND route = ?", (user, _period(plan), route))


def add_spend(usd: float) -> None:
    with _db() as con:
        con.execute("INSERT INTO spend VALUES (?, ?) ON CONFLICT(month) DO UPDATE SET usd = usd + excluded.usd", (month(), usd))


def count(user: str, route: str, usd: float) -> None:
    """Suma un uso y su gasto sin pasar por la reserva (pruebas y cargas manuales)."""
    with _db() as con:
        plan, _ = _plan(con, user)
        con.execute("INSERT INTO usage VALUES (?, ?, ?, 1) ON CONFLICT(user, period, route) DO UPDATE SET n = n + 1",
                    (user, _period(plan), route))
    add_spend(usd)


def forget(user: str) -> None:
    """Derecho a borrar: elimina el plan y el uso de esta persona. Las compras se recuperan con «Restaurar compras».

    Sólo queda el id anónimo en trials_used, para que borrar los datos no reinicie la prueba gratis."""
    with _db() as con:
        if con.execute("SELECT 1 FROM plans WHERE user = ? AND plan = 'prueba'", (user,)).fetchone():
            con.execute("INSERT OR IGNORE INTO trials_used VALUES (?)", (user,))
        con.execute("DELETE FROM plans WHERE user = ?", (user,))
        con.execute("DELETE FROM usage WHERE user = ?", (user,))


def spent_this_month() -> float:
    with _db() as con:
        row = con.execute("SELECT usd FROM spend WHERE month = ?", (month(),)).fetchone()
    return row[0] if row else 0.0


def summary(user: str) -> dict:
    plan, until = plan_of(user)
    return {"plan": plan, "until": until,
            "remaining": {r: max(0, PLANS[plan][r] - used(user, plan, r)) for r in ROUTES}}


# --------------------------------------------------------------------------- respuestas ya calculadas
ANSWER_DAYS = 7


def cached_answer(key: str) -> dict | None:
    """La misma consulta (mismo texto, mismo modelo y prompt) no se paga dos veces: doble toque, reintento, volver atrás."""
    with _db() as con:
        row = con.execute("SELECT at, body FROM answers WHERE key = ?", (key,)).fetchone()
    if row and time.time() - row[0] < ANSWER_DAYS * 86400:
        return json.loads(row[1])
    return None


def save_answer(key: str, body: dict) -> None:
    with _db() as con:
        con.execute("INSERT OR REPLACE INTO answers VALUES (?, ?, ?)", (key, time.time(), json.dumps(body, ensure_ascii=False)))
        con.execute("DELETE FROM answers WHERE at < ?", (time.time() - ANSWER_DAYS * 86400,))
