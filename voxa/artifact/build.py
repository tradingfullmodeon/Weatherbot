"""Genera dist/voxa.html: la versión de Talkride publicable como Artifact de claude.ai.

Toma los módulos del prototipo (prototype/shared.js, prototype/scenarios.js, prototype/lessons.js, prototype/writing.js, prototype/voxa.css) y los
personajes del servidor (server/personas.py) para que la versión publicada no se desincronice del resto.
Uso: python3 voxa/artifact/build.py
"""

import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
sys.path.insert(0, str(ROOT / "server"))
from personas import PERSONAS  # noqa: E402


def as_script(path: Path) -> str:
    """Convierte un módulo ES en código de script clásico: quita imports y la palabra export."""
    src = path.read_text(encoding="utf-8")
    src = re.sub(r"^import .*?;\n", "", src, flags=re.M | re.S)
    return re.sub(r"^export ", "", src, flags=re.M)


def main() -> None:
    css = (ROOT / "prototype" / "voxa.css").read_text(encoding="utf-8") + (HERE / "artifact.css").read_text(encoding="utf-8")
    app = (HERE / "app.js").read_text(encoding="utf-8").replace("{{PERSONAS}}", json.dumps(PERSONAS, ensure_ascii=False, indent=1))
    js = "\n".join([
        "(() => {",
        as_script(ROOT / "prototype" / "shared.js"),
        as_script(ROOT / "prototype" / "scenarios.js"),
        as_script(ROOT / "prototype" / "lessons.js"),
        as_script(ROOT / "prototype" / "writing.js"),
        as_script(ROOT / "prototype" / "events.js"),
        as_script(ROOT / "prototype" / "goals.js"),
        as_script(ROOT / "prototype" / "structure.js"),
        as_script(ROOT / "prototype" / "interview.js"),
        as_script(ROOT / "prototype" / "audiofile.js"),
        as_script(ROOT / "prototype" / "help.js"),
        as_script(ROOT / "prototype" / "feedback.js"),
        as_script(ROOT / "prototype" / "reminder.js"),
        app,
        "})();",
    ])
    page = (HERE / "template.html").read_text(encoding="utf-8").replace("{{CSS}}", css).replace("{{JS}}", js)
    out = HERE / "dist" / "voxa.html"
    out.parent.mkdir(exist_ok=True)
    out.write_text(page, encoding="utf-8")
    print(f"{out.relative_to(ROOT.parent)} · {len(page.encode()) / 1024:.0f} KB")


if __name__ == "__main__":
    main()
