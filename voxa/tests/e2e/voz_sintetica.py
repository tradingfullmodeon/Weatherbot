"""Genera una «voz» sintética de 40 s (sílabas con armónicos, pausas y cambios de tono) para el micrófono simulado.

No dice palabras: sirve para que el análisis de voz (ritmo de sílabas, pausas, tono y volumen) tenga señal que medir.
    python voz_sintetica.py voz.wav
"""
import math
import random
import struct
import sys
import wave

SR = 16000


def main(path: str) -> None:
    random.seed(3)
    out: list[float] = []

    def syllable(dur: float, f0: float) -> None:
        n, ph = int(dur * SR), 0.0
        for i in range(n):
            env = math.sin(math.pi * i / n) ** 0.6
            ph += 2 * math.pi * f0 * (1 + 0.04 * math.sin(2 * math.pi * 5 * i / SR)) / SR
            out.append(0.25 * env * sum(math.sin(k * ph) / k for k in range(1, 8)))

    while len(out) < 40 * SR:
        base = random.uniform(120, 200)
        for _ in range(random.randint(6, 12)):   # una frase
            syllable(random.uniform(0.15, 0.25), base * random.uniform(0.85, 1.25))
            out.extend([0.0] * int(random.uniform(0.02, 0.06) * SR))
        out.extend([0.0] * int(random.uniform(0.3, 0.7) * SR))   # pausa entre frases
    with wave.open(path, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(b"".join(struct.pack("<h", int(max(-1, min(1, x)) * 30000)) for x in out))


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "voz.wav")
