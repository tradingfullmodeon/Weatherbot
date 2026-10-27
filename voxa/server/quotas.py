"""Planes, cupos de IA por persona y tope de gasto mensual.

La IA la paga VOXA (la clave de Anthropic vive sólo en el servidor), así que cada llamada se controla:
  · gratis: sin IA (todo el análisis local sigue funcionando en el teléfono);
  · prueba: 7 días con cupos amplios para conocer el coach;
  · pro: uso justo mensual, pensado para que nadie que practique de verdad lo alcance.
Además, VOXA_MONTHLY_BUDGET_USD pone un techo al gasto total del mes: nunca llega una cuenta sorpresa.

Guarda todo en SQLite (un archivo; sin servicios extra). Para producción con varias instancias, la misma
interfaz se implementa sobre Postgres.
"""

import os
import re
import sqlite3
import time
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


def _db() -> sqlite3.Connection:
    con = sqlite3.connect(db_path())
    con.execute("CREATE TABLE IF NOT EXISTS plans (user TEXT PRIMARY KEY, plan TEXT, until REAL)")
    con.execute("CREATE TABLE IF NOT EXISTS usage (user TEXT, period TEXT, route TEXT, n INTEGER, PRIMARY KEY (user, period, route))")
    con.execute("CREATE TABLE IF NOT EXISTS spend (month TEXT PRIMARY KEY, usd REAL)")
    return con


def month() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m")


def user_id(request: Request) -> str:
    """Identificador anónimo del dispositivo (la app lo genera); con cuentas, será el id de la cuenta."""
    uid = request.headers.get("x-voxa-user", "")
    if USER_RE.match(uid):
        return uid
    return "ip_" + (request.client.host if request.client else "desconocido").replace(".", "_").replace(":", "_")


def plan_of(user: str) -> tuple[str, float | None]:
    """Plan vigente. Quien llega por primera vez recibe VOXA_DEFAULT_PLAN (por defecto, la prueba de 7 días)."""
    with _db() as con:
        row = con.execute("SELECT plan, until FROM plans WHERE user = ?", (user,)).fetchone()
        if row is None:
            plan = os.environ.get("VOXA_DEFAULT_PLAN", "prueba")
            until = time.time() + TRIAL_DAYS * 86400 if plan == "prueba" else None
            con.execute("INSERT INTO plans VALUES (?, ?, ?)", (user, plan, until))
            return plan, until
    plan, until = row
    if until is not None and time.time() > until:
        return "gratis", None
    return plan, until


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
    """Antes de llamar a la IA: corta si se acabó el cupo del plan o el presupuesto del mes."""
    budget = float(os.environ.get("VOXA_MONTHLY_BUDGET_USD", "0") or 0)
    if budget and spent_this_month() >= budget:
        raise HTTPException(503, "El coach IA está en pausa por hoy. El análisis local de tu práctica sigue funcionando.")
    plan, _ = plan_of(user)
    if used(user, plan, route) >= PLANS[plan][route]:
        raise HTTPException(402, LIMIT_MSG[plan])


def count(user: str, route: str, usd: float) -> None:
    """Después de una llamada exitosa: suma el uso de la persona y el gasto del mes."""
    plan, _ = plan_of(user)
    with _db() as con:
        con.execute("INSERT INTO usage VALUES (?, ?, ?, 1) ON CONFLICT(user, period, route) DO UPDATE SET n = n + 1",
                    (user, _period(plan), route))
        con.execute("INSERT INTO spend VALUES (?, ?) ON CONFLICT(month) DO UPDATE SET usd = usd + excluded.usd", (month(), usd))


def spent_this_month() -> float:
    with _db() as con:
        row = con.execute("SELECT usd FROM spend WHERE month = ?", (month(),)).fetchone()
    return row[0] if row else 0.0


def summary(user: str) -> dict:
    plan, until = plan_of(user)
    return {"plan": plan, "until": until,
            "remaining": {r: max(0, PLANS[plan][r] - used(user, plan, r)) for r in ROUTES}}
