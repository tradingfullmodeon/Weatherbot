"""
PolyWeather Bot — Root entry point for Railway.
Railway runs from /app, so we launch from here (not python -m src.main).
"""
import sys
import os

# Add the project root to sys.path so 'src' is importable
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import asyncio
from src.main import main

if __name__ == "__main__":
    asyncio.run(main())
