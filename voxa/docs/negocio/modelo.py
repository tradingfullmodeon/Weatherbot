"""Mini caso de negocio de VOXA: costo por usuario, precio, margen, LTV y punto de equilibrio.

Todos los supuestos están arriba y se pueden cambiar. Uso: python3 voxa/docs/negocio/modelo.py
Las fuentes de cada cifra están en voxa/docs/CASO_NEGOCIO.md.
"""

# ----------------------------------------------------------------------------- precios de IA (USD por millón de tokens)
MODELS = {  # entrada, salida, lectura de caché
    "Opus 5.5": (4.00, 20.00, 0.20),
    "Sonnet 5.5": (2.00, 10.00, 0.20),
    "Haiku 5.5": (0.10, 0.50, 0.01),
}

# ----------------------------------------------------------------------------- llamadas de IA (tokens estimados por llamada)
# (tokens de entrada, de salida incluido el razonamiento, fracción de la entrada que sale de caché)
CALLS = {
    "coach": (1800, 2500, 0.0),        # consejo tras un ensayo (esfuerzo medio)
    "roleplay_turn": (2500, 500, 0.6),  # turno del personaje (esfuerzo bajo; historial en caché)
    "evaluate": (3500, 2500, 0.0),      # evaluación final del roleplay
    "writing": (1200, 2000, 0.0),       # reescritura de un correo
    "event": (1000, 2000, 0.0),         # preguntas difíciles para un evento
    "presence": (7000, 1500, 0.0),      # 4 fotogramas de lenguaje corporal
}

# Uso mensual de una persona que paga y está activa (unas 3 prácticas por semana).
USAGE_PAID = {"coach": 10, "roleplay_turn": 32, "evaluate": 4, "writing": 3, "event": 1, "presence": 2}
# Uso de una persona del plan gratis (cupo: unos 4 consejos y 1 roleplay al mes).
USAGE_FREE = {"coach": 4, "roleplay_turn": 8, "evaluate": 1, "writing": 1, "event": 0, "presence": 0}

# Configuraciones de modelo por uso (la elección es una decisión de calidad que hay que medir antes).
CONFIGS = {
    "A · todo Opus 5.5 (hoy)": {k: "Opus 5.5" for k in CALLS},
    "B · todo Sonnet 5.5": {k: "Sonnet 5.5" for k in CALLS},
    "C · mixto (Haiku en turnos de roleplay y escritura)": {**{k: "Opus 5.5" for k in CALLS}, "roleplay_turn": "Haiku 5.5", "writing": "Haiku 5.5"},
}

# ----------------------------------------------------------------------------- voz e infraestructura
STT_PER_MIN = 0.003        # transcripción en servidor (p. ej. gpt-4o-mini-transcribe o lotes de Google/Azure)
STT_MIN_PAID = 40          # minutos transcritos al mes (peor caso: todo en el servidor)
STT_SERVER_SHARE = 0.4     # parte que no se resuelve en el dispositivo (iOS/Android transcriben gratis)
TTS_PER_USER = 0.0         # voz del sistema (gratis); voces neuronales sólo como extra
INFRA_FIXED = 60           # servidor + base de datos al inicio (USD/mes)
INFRA_PER_USER = 0.02      # almacenamiento, logs y ancho de banda por usuario activo

# ----------------------------------------------------------------------------- precios y cobro
PRICES = {  # mensual, anual
    "LatAm": (4.99, 34.99),
    "España/EE. UU.": (9.99, 59.99),
}
MARKET_MIX = {"LatAm": 0.7, "España/EE. UU.": 0.3}
ANNUAL_SHARE = 0.7          # la mayoría elige el plan anual (descuento)
VAT = 0.15                  # IVA promedio incluido en el precio de tienda (lo retiene la tienda)
STORE_SHARE, STORE_FEE = 0.6, 0.15   # 60% de los cobros por tienda (15% de comisión)
WEB_FEE = 0.045                      # 40% por la web (pasarela de pago)

# Retención: vida media de quien paga (meses).
LIFE_MONTHLY = 1 / 0.10     # plan mensual: 10% de bajas al mes
LIFE_ANNUAL = 12 / (1 - 0.30)   # plan anual: 30% renueva

# Conversión y adquisición.
INSTALL_TO_PAID = 0.015     # 1,5% de las descargas termina pagando (mediana global ~2%; LatAm menor)
CPI = 1.00                  # costo por instalación pagada en LatAm (supuesto)
FREE_PER_PAID = 1 / INSTALL_TO_PAID   # usuarios gratis que acompañan a cada persona que paga (activos o no)
FREE_ACTIVE_SHARE = 0.15    # de esos, cuántos siguen activos y usan IA cada mes

# Estrategia de plan gratis. «Gratis sin IA»: todo el análisis local (diagnóstico, métricas, estructura,
# simulacro, lecciones) + prueba de 7 días con IA completa antes de pagar.
TRIAL_TO_PAID = 0.25        # de quien empieza la prueba, cuántos pagan (EE. UU. ~34%; se asume menos en LatAm)
TRIAL_DAYS = 7

# B2B (empresas y universidades).
B2B_SEAT = 8.0              # USD por asiento al mes, contrato anual
B2B_USAGE_FACTOR = 1.3      # en empresa se usa más el roleplay

# Costos fijos mensuales por escenario.
FIXED = {"Fundador + freelancers": 3000, "Equipo chico (2 dev + contenido + crecimiento)": 15000}


def call_cost(call: str, model: str) -> float:
    inp, out, cached = CALLS[call]
    pin, pout, pcache = MODELS[model]
    return (inp * (1 - cached) * pin + inp * cached * pcache + out * pout) / 1e6


def ai_cost(usage: dict, config: dict, factor: float = 1.0) -> float:
    return sum(n * factor * call_cost(c, config[c]) for c, n in usage.items())


def net_revenue_per_payer() -> float:
    gross = sum(share * ((1 - ANNUAL_SHARE) * PRICES[m][0] + ANNUAL_SHARE * PRICES[m][1] / 12) for m, share in MARKET_MIX.items())
    fee = STORE_SHARE * STORE_FEE + (1 - STORE_SHARE) * WEB_FEE
    return gross / (1 + VAT) * (1 - fee), gross


def variable_cost(cfg: dict, free_with_ai: bool) -> float:
    paid_ai = ai_cost(USAGE_PAID, cfg)
    stt = STT_MIN_PAID * STT_SERVER_SHARE * STT_PER_MIN
    free_active = FREE_PER_PAID * FREE_ACTIVE_SHARE
    if free_with_ai:   # cada pagador «carga» la IA de los usuarios gratis activos que lo acompañan
        free_load = free_active * (ai_cost(USAGE_FREE, cfg) + INFRA_PER_USER)
    else:              # gratis sin IA: sólo infraestructura, más la IA de las pruebas que no convierten
        free_load = free_active * INFRA_PER_USER + (1 / TRIAL_TO_PAID) * paid_ai * TRIAL_DAYS / 30
    return paid_ai + stt + TTS_PER_USER + INFRA_PER_USER + free_load


def main() -> None:
    net, gross = net_revenue_per_payer()
    life = (1 - ANNUAL_SHARE) * LIFE_MONTHLY + ANNUAL_SHARE * LIFE_ANNUAL
    stt = STT_MIN_PAID * STT_SERVER_SHARE * STT_PER_MIN
    print(f"Ingreso bruto por pagador: US${gross:.2f}/mes · neto (sin IVA ni comisiones): US${net:.2f}/mes · vida media: {life:.1f} meses\n")
    print("| Configuración de IA | Plan gratis | IA por pagador/mes | Costo variable por pagador* | Contribución/mes | Margen | LTV | Pagadores para equilibrio (fijos 3 mil / 15 mil USD) |")
    print("|---|---|---|---|---|---|---|---|")
    for name, cfg in CONFIGS.items():
        for free_ai, label in [(True, "con IA limitada"), (False, "sin IA + prueba 7 días")]:
            v = variable_cost(cfg, free_ai)
            contrib = net - v
            be = [f"{round((f + INFRA_FIXED) / contrib):,}" if contrib > 0 else "no hay" for f in FIXED.values()]
            print(f"| {name} | {label} | US${ai_cost(USAGE_PAID, cfg):.2f} | US${v:.2f} | US${contrib:.2f} | {100 * contrib / net:.0f}% | US${contrib * life:.0f} | {be[0]} / {be[1]} |")
    print("\n*Incluye transcripción, infraestructura y la carga de los usuarios gratis (o de las pruebas) por cada pagador.")

    print("\nB2B (asiento US$%.0f/mes, uso x%.1f):" % (B2B_SEAT, B2B_USAGE_FACTOR))
    print("| Configuración | Neto por asiento | Costo variable | Margen por asiento | Asientos para equilibrio (3 mil / 15 mil) |")
    print("|---|---|---|---|---|")
    for name, cfg in CONFIGS.items():
        seat_net = B2B_SEAT / (1 + VAT) * (1 - WEB_FEE)
        v = ai_cost(USAGE_PAID, cfg, B2B_USAGE_FACTOR) + stt + INFRA_PER_USER
        m = seat_net - v
        print(f"| {name} | US${seat_net:.2f} | US${v:.2f} | US${m:.2f} ({100 * m / seat_net:.0f}%) | {round((3000 + INFRA_FIXED) / m):,} / {round((15000 + INFRA_FIXED) / m):,} |")

    cac = CPI / INSTALL_TO_PAID
    print(f"\nCosto de conseguir un pagador sólo con anuncios: US${cac:.0f} (US${CPI:.2f} por instalación / {INSTALL_TO_PAID:.1%} de conversión)")
    print("\nCosto por llamada de IA (USD):")
    print("| Llamada | Opus 5.5 | Sonnet 5.5 | Haiku 5.5 |")
    print("|---|---|---|---|")
    for c in CALLS:
        print(f"| {c} | {call_cost(c, 'Opus 5.5'):.4f} | {call_cost(c, 'Sonnet 5.5'):.4f} | {call_cost(c, 'Haiku 5.5'):.4f} |")

    print("\nSensibilidad (config A, gratis sin IA): contribución mensual por pagador según el precio")
    print("| Precio LatAm (mes/año) | Precio España/EE. UU. (mes/año) | Neto | Contribución | Pagadores para equilibrio (3 mil / 15 mil) |")
    print("|---|---|---|---|---|")
    global PRICES
    base = PRICES
    for latam, es in [((4.99, 34.99), (9.99, 59.99)), ((5.99, 39.99), (11.99, 69.99)), ((7.99, 49.99), (14.99, 89.99))]:
        PRICES = {"LatAm": latam, "España/EE. UU.": es}
        n, _ = net_revenue_per_payer()
        c = n - variable_cost(CONFIGS["A · todo Opus 5.5 (hoy)"], False)
        print(f"| {latam[0]} / {latam[1]} | {es[0]} / {es[1]} | US${n:.2f} | US${c:.2f} | {round(3060 / c):,} / {round(15060 / c):,} |")
    PRICES = base

    projection()


def projection(months: int = 18) -> None:
    """Proyección conservadora (sin publicidad pagada): descargas orgánicas que crecen, pagadores con bajas y
    pilotos B2B desde el mes 6. Precio medio (LatAm 6,99/44,99; España/EE. UU. 12,99/69,99), config A, gratis sin IA."""
    global PRICES
    base, PRICES = PRICES, {"LatAm": (6.99, 44.99), "España/EE. UU.": (12.99, 69.99)}
    net, _ = net_revenue_per_payer()
    v = variable_cost(CONFIGS["A · todo Opus 5.5 (hoy)"], False)
    seat_m = B2B_SEAT / (1 + VAT) * (1 - WEB_FEE) - (ai_cost(USAGE_PAID, CONFIGS["A · todo Opus 5.5 (hoy)"], B2B_USAGE_FACTOR) + 0.07)
    churn = 1 / ((1 - ANNUAL_SHARE) * LIFE_MONTHLY + ANNUAL_SHARE * LIFE_ANNUAL)
    payers, cum = 0.0, 0.0
    print(f"\nProyección (contribución por pagador US${net - v:.2f}/mes, por asiento B2B US${seat_m:.2f}/mes, fijos US$3.060/mes):")
    print("| Mes | Descargas del mes | Pagadores | Asientos B2B | Ingreso neto | Contribución | Resultado (fijos 3 mil) | Acumulado |")
    print("|---|---|---|---|---|---|---|---|")
    for mth in range(1, months + 1):
        downloads = min(1000 * 1.25 ** (mth - 1), 15000)        # orgánico: contenido, universidades, clubes, referidos
        payers = payers * (1 - churn) + downloads * INSTALL_TO_PAID
        seats = 0 if mth < 6 else min(100 * (mth - 5), 800)       # pilotos con empresas y universidades
        revenue = payers * net + seats * B2B_SEAT / (1 + VAT) * (1 - WEB_FEE)
        contrib = payers * (net - v) + seats * seat_m
        result = contrib - 3060
        cum += result
        if mth in (1, 3, 6, 9, 12, 15, 18):
            print(f"| {mth} | {downloads:,.0f} | {payers:,.0f} | {seats} | US${revenue:,.0f} | US${contrib:,.0f} | US${result:,.0f} | US${cum:,.0f} |")
    PRICES = base


if __name__ == "__main__":
    main()
