"""Dónde corre la IA de Talkride: la misma app y los mismos prompts sobre la nube que convenga.

VOXA_PROVIDER elige la plataforma (todas sirven los modelos Claude con la misma API de mensajes):
  · anthropic (por defecto): API de Anthropic. Clave en ANTHROPIC_API_KEY.
  · aws: Claude Platform on AWS (operada por Anthropic, facturación de AWS). AWS_REGION y ANTHROPIC_AWS_WORKSPACE_ID.
  · bedrock: Amazon Bedrock. AWS_REGION y credenciales de AWS; los modelos llevan el prefijo «anthropic.».
  · vertex: Google Cloud Vertex AI. VOXA_GCP_PROJECT y VOXA_GCP_REGION (por defecto «global»).
  · foundry: Microsoft Foundry. ANTHROPIC_FOUNDRY_API_KEY y VOXA_FOUNDRY_RESOURCE.
Cambiar de nube es cambiar variables de entorno: sirve para usar créditos de una nube o tener un respaldo.
"""

import os

import anthropic

PROVIDERS = ("anthropic", "aws", "bedrock", "vertex", "foundry")
FALLBACK_BETA = "server-side-fallback-2026-07-01"
# Modelos con respaldo automático en el servidor ante un rechazo de seguridad (Haiku no lo tiene).
FALLBACK_MODELS = {"claude-opus-5-5", "claude-sonnet-5-5", "claude-opus-5", "claude-fable-5-1"}
# Plataformas donde existe ese respaldo en el servidor.
FALLBACK_PROVIDERS = {"anthropic", "aws"}


def provider() -> str:
    p = os.environ.get("VOXA_PROVIDER", "anthropic").lower()
    if p not in PROVIDERS:
        raise ValueError(f"VOXA_PROVIDER desconocido: {p}")
    return p


def make_client(p: str):
    if p == "anthropic":
        return anthropic.Anthropic()
    if p == "aws":
        return anthropic.AnthropicAWS()
    if p == "bedrock":
        return anthropic.AnthropicBedrockMantle(aws_region=os.environ.get("AWS_REGION"))
    if p == "vertex":
        return anthropic.AnthropicVertex(project_id=os.environ["VOXA_GCP_PROJECT"],
                                         region=os.environ.get("VOXA_GCP_REGION", "global"))
    return anthropic.AnthropicFoundry(api_key=os.environ.get("ANTHROPIC_FOUNDRY_API_KEY"),
                                      resource=os.environ.get("VOXA_FOUNDRY_RESOURCE"))


def model_id(p: str, model: str) -> str:
    return f"anthropic.{model}" if p == "bedrock" and not model.startswith("anthropic.") else model


def fallback_kwargs(p: str, model: str) -> dict:
    """Respaldo ante rechazos sólo donde el modelo y la plataforma lo admiten; en el resto se omite."""
    if p in FALLBACK_PROVIDERS and model in FALLBACK_MODELS:
        return {"betas": [FALLBACK_BETA], "fallbacks": "default"}
    return {}


def has_credentials(p: str) -> bool:
    env = os.environ.get
    if p == "anthropic":
        return bool(env("ANTHROPIC_API_KEY") or env("ANTHROPIC_AUTH_TOKEN") or env("ANTHROPIC_PROFILE")) or \
            os.path.isdir(os.path.expanduser("~/.config/anthropic"))
    if p == "aws":
        return bool(env("AWS_REGION") and env("ANTHROPIC_AWS_WORKSPACE_ID"))
    if p == "bedrock":
        return bool(env("AWS_REGION"))
    if p == "vertex":
        return bool(env("VOXA_GCP_PROJECT"))
    return bool(env("ANTHROPIC_FOUNDRY_API_KEY") and env("VOXA_FOUNDRY_RESOURCE"))
