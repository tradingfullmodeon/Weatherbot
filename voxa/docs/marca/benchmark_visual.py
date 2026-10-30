"""Benchmark visual de la categoría: colores reales de los íconos y de las pantallas de las apps de comunicación.

Busca en la App Store (API pública de iTunes) las apps más usadas para hablar en público, oratoria, entrevistas,
acento y comunicación, en EE. UU., México y España; baja el ícono y las 3 primeras capturas de cada una y mide sus
colores dominantes. Sirve para comprobar que Talkride no se parece a ninguna. Corre en GitHub Actions (voxa-marca.yml):

    python voxa/docs/marca/benchmark_visual.py --out resultados   # deja benchmark_visual.json, .md y hoja.png
"""

import argparse
import colorsys
import io
import json
import time
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image

TERMS = ["public speaking", "speech coach", "communication skills", "speaking confidence", "interview practice ai",
         "accent training", "vocal coach", "hablar en publico", "oratoria", "comunicacion efectiva", "Yoodli",
         "Orai", "Speeko", "BoldVoice", "ELSA Speak", "Vocal Image", "VirtualSpeech", "Poised", "Ummo"]
COUNTRIES = ["us", "mx", "es"]
TALKRIDE = {"Índigo": "#4f46e5", "Violeta": "#7c3aed", "Ámbar": "#f59e0b"}


def get(url: str) -> bytes:
    for i in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "talkride-benchmark"}), timeout=30) as r:
                return r.read()
        except Exception:
            time.sleep(2 * (i + 1))
    return b""


def hexc(rgb) -> str:
    return "#%02x%02x%02x" % tuple(rgb)


def palette(img: Image.Image, n: int = 6):
    """Colores dominantes con su proporción, sin contar blancos, negros y grises (fondos y texto)."""
    small = img.convert("RGB").resize((96, 96))
    q = small.quantize(colors=n, method=Image.Quantize.MEDIANCUT)
    pal = q.getpalette()
    out = []
    for count, idx in sorted(q.getcolors(), reverse=True):
        rgb = pal[idx * 3: idx * 3 + 3]
        h, l, s = colorsys.rgb_to_hls(*[c / 255 for c in rgb])
        out.append({"hex": hexc(rgb), "share": round(count / (96 * 96), 3), "hue": round(h * 360), "sat": round(s, 2),
                    "light": round(l, 2), "chromatic": s > 0.25 and 0.12 < l < 0.9})
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="resultados")
    out = Path(ap.parse_args().out)
    out.mkdir(parents=True, exist_ok=True)
    apps = {}
    for term in TERMS:
        for country in COUNTRIES:
            q = urllib.parse.urlencode({"term": term, "entity": "software", "limit": 8, "country": country})
            data = get(f"https://itunes.apple.com/search?{q}")
            for a in (json.loads(data).get("results", []) if data else []):
                if a.get("primaryGenreName") in ("Games",) or a.get("userRatingCount", 0) < 20:
                    continue
                cur = apps.get(a["trackId"])
                if not cur or a.get("userRatingCount", 0) > cur.get("userRatingCount", 0):
                    apps[a["trackId"]] = a
    ranked = sorted(apps.values(), key=lambda a: -a.get("userRatingCount", 0))[:45]
    rows, icons = [], []
    for a in ranked:
        icon = get(a.get("artworkUrl512", ""))
        if not icon:
            continue
        im = Image.open(io.BytesIO(icon))
        icons.append(im.convert("RGB").resize((96, 96)))
        ui = []
        for s in a.get("screenshotUrls", [])[:3]:
            raw = get(s)
            if raw:
                ui += [c for c in palette(Image.open(io.BytesIO(raw)), 8) if c["chromatic"]]
        ui.sort(key=lambda c: -c["share"])
        rows.append({"name": a["trackName"], "id": a["trackId"], "genre": a.get("primaryGenreName"),
                     "ratings": a.get("userRatingCount", 0), "icon": palette(im), "ui_accents": ui[:3]})
    (out / "benchmark_visual.json").write_text(json.dumps(rows, ensure_ascii=False, indent=1), encoding="utf-8")

    def main_hue(cols):
        c = [x for x in cols if x["chromatic"]]
        return c[0] if c else None

    def family(h):
        return ("rojo" if h < 15 or h >= 345 else "naranja" if h < 45 else "amarillo" if h < 65 else "verde" if h < 160
                else "turquesa" if h < 195 else "azul" if h < 235 else "índigo-violeta" if h < 290 else "magenta-rosa")

    fams = {}
    lines = ["# Benchmark visual de la categoría (App Store EE. UU., México y España)", "",
             f"{len(rows)} apps con al menos 20 calificaciones, ordenadas por cantidad de calificaciones.", "",
             "| App | Calificaciones | Color principal del ícono | Familia | Acento de sus pantallas |", "|---|---|---|---|---|"]
    for r in rows:
        m = main_hue(r["icon"])
        fam = family(m["hue"]) if m else "neutro (blanco/negro/gris)"
        fams[fam] = fams.get(fam, 0) + 1
        ui = ", ".join(f"{c['hex']} ({family(c['hue'])})" for c in r["ui_accents"]) or "—"
        lines.append(f"| {r['name']} | {r['ratings']:,} | {m['hex'] if m else '—'} | {fam} | {ui} |")
    lines += ["", "## Familias de color de los íconos", ""] + [f"- **{k}**: {v}" for k, v in sorted(fams.items(), key=lambda x: -x[1])]
    lines += ["", "## Talkride", ""] + [f"- {k} {v}: {family(round(colorsys.rgb_to_hls(*[int(v[i:i+2], 16) / 255 for i in (1, 3, 5)])[0] * 360))}" for k, v in TALKRIDE.items()]
    text = "\n".join(lines) + "\n"
    (out / "benchmark_visual.md").write_text(text, encoding="utf-8")
    print(text)
    if icons:   # hoja con todos los íconos para mirarlos juntos
        cols = 9
        sheet = Image.new("RGB", (cols * 104, ((len(icons) - 1) // cols + 1) * 104), "white")
        for i, im in enumerate(icons):
            sheet.paste(im, ((i % cols) * 104 + 4, (i // cols) * 104 + 4))
        sheet.save(out / "hoja.png")


if __name__ == "__main__":
    main()
