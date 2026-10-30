# Talkride completa: la app web (prototype/) y el servidor con la IA de Talkride (server/) en un solo servicio.
# La clave de Anthropic se pasa como variable de entorno (ANTHROPIC_API_KEY); nunca va al teléfono.
FROM python:3.12-slim
WORKDIR /app
COPY server/requirements.txt server/requirements.txt
RUN pip install --no-cache-dir -r server/requirements.txt
COPY server server
COPY prototype prototype
WORKDIR /app/server
ENV VOXA_DB=/data/voxa.db
EXPOSE 8000
CMD ["sh", "-c", "mkdir -p /data && uvicorn app:app --host 0.0.0.0 --port ${PORT:-8000}"]
