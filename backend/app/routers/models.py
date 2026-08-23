"""
==============================================================================
🤖 MODELS ROUTER — Live Model Discovery via opencode CLI
==============================================================================
FastAPI Concept:
  - `asyncio.create_subprocess_exec`: Runs an external CLI command (`opencode models`)
    without blocking the event loop. The server stays responsive while the shell
    command executes.
  - Response Caching: We cache the result for 5 minutes (TTL_SECONDS) so we don't
    shell out on every request.
  - The endpoint `/api/v1/models` is public (no auth needed) so the frontend can
    call it before the user logs in.

What this does:
  1. Runs `opencode models` which returns the list of FREE models (no API key needed)
  2. Also returns a hardcoded list of popular API-key-required models grouped by
     provider (OpenAI, Anthropic, Google, Mistral, DeepSeek, etc.)
  3. Frontend uses this to power the two-tab model selector:
       Tab 1 → "Free Models"   (from opencode models output)
       Tab 2 → "API Providers" (pick provider → enter key → pick model)
==============================================================================
"""

import asyncio
import shutil
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

from fastapi import APIRouter

router = APIRouter(prefix="/api/v1", tags=["Models"])

# ── Simple in-memory cache ──────────────────────────────────────────────────
# We store the last result + timestamp. If data is fresh enough, skip the shell call.
_cache: Dict[str, Any] = {"data": None, "fetched_at": None}
TTL_SECONDS = 300  # Cache for 5 minutes so model list feels fresh but not slow


def _is_cache_fresh() -> bool:
    """Returns True if the cached data is younger than TTL_SECONDS."""
    if _cache["data"] is None or _cache["fetched_at"] is None:
        return False
    age = (datetime.utcnow() - _cache["fetched_at"]).total_seconds()
    return age < TTL_SECONDS


async def _fetch_free_models_from_opencode() -> list:
    """
    Runs `opencode models` shell command asynchronously and parses its output.
    Each line in the output is one model ID like: opencode/big-pickle
    Returns a list of model dicts with id, displayName, provider, and description.
    """
    # Find the opencode binary — works on Mac (homebrew) and Linux
    opencode_bin = shutil.which("opencode") or "/opt/homebrew/bin/opencode"

    try:
        # asyncio.create_subprocess_exec is non-blocking — the event loop stays free
        process = await asyncio.create_subprocess_exec(
            opencode_bin, "models",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        # Wait for the subprocess to finish (with a 10-second timeout)
        try:
            stdout, _ = await asyncio.wait_for(process.communicate(), timeout=10.0)
        except asyncio.TimeoutError:
            process.kill()
            return _fallback_free_models()

        raw = stdout.decode("utf-8", errors="replace").strip()
        if not raw:
            return _fallback_free_models()

        models = []
        for line in raw.splitlines():
            line = line.strip()
            if not line:
                continue

            # opencode model IDs look like: opencode/big-pickle
            model_id = line
            display_name = _pretty_name(model_id)

            models.append({
                "id": model_id,          # Exact string to pass to opencode -m flag
                "displayName": display_name,
                "provider": "opencode",
                "free": True,
                "description": _model_description(model_id)
            })

        return models if models else _fallback_free_models()

    except FileNotFoundError:
        # opencode is not installed — return safe fallback list
        return _fallback_free_models()
    except Exception:
        return _fallback_free_models()


def _pretty_name(model_id: str) -> str:
    """
    Converts a raw model ID like 'opencode/big-pickle' into a human-readable
    display name like 'Big Pickle'.
    """
    # Strip the 'opencode/' prefix
    name = model_id.split("/", 1)[-1] if "/" in model_id else model_id
    # Replace hyphens with spaces and title-case each word
    return name.replace("-", " ").replace("_", " ").title()


def _model_description(model_id: str) -> str:
    """Returns a short human-readable description for known free models."""
    descriptions = {
        "opencode/big-pickle":                    "Fast & capable free model by OpenCode",
        "opencode/hy3-free":                      "Hy3 — free reasoning model",
        "opencode/mimo-v2.5-free":                "MiMo V2.5 — free coding model",
        "opencode/muse-spark-1.2-contributor-free": "Muse Spark — creative code generation",
        "opencode/nemotron-3-ultra-free":         "Nemotron 3 Ultra — NVIDIA's free coding LLM",
        "opencode/nemotron-3.5-lightning-free":   "Nemotron 3.5 Lightning — fast & free",
        "opencode/x-preview-f-free":              "X Preview F — experimental free model",
    }
    return descriptions.get(model_id, "Free model via OpenCode — no API key needed")


def _fallback_free_models() -> list:
    """
    Hardcoded fallback list in case opencode CLI is unavailable.
    Matches the models seen in the screenshot the user provided.
    """
    return [
        {"id": "opencode/big-pickle",                    "displayName": "Big Pickle",                  "provider": "opencode", "free": True, "description": "Fast & capable free model by OpenCode"},
        {"id": "opencode/hy3-free",                      "displayName": "Hy3 Free",                    "provider": "opencode", "free": True, "description": "Hy3 — free reasoning model"},
        {"id": "opencode/mimo-v2.5-free",                "displayName": "MiMo V2.5 Free",              "provider": "opencode", "free": True, "description": "MiMo V2.5 — free coding model"},
        {"id": "opencode/muse-spark-1.2-contributor-free", "displayName": "Muse Spark 1.2 Free",       "provider": "opencode", "free": True, "description": "Muse Spark — creative code generation"},
        {"id": "opencode/nemotron-3-ultra-free",         "displayName": "Nemotron 3 Ultra Free",       "provider": "opencode", "free": True, "description": "Nemotron 3 Ultra — NVIDIA's free coding LLM"},
        {"id": "opencode/nemotron-3.5-lightning-free",   "displayName": "Nemotron 3.5 Lightning Free", "provider": "opencode", "free": True, "description": "Nemotron 3.5 Lightning — fast & free"},
        {"id": "opencode/x-preview-f-free",              "displayName": "Ox Alpha Free (Unlimited)",   "provider": "opencode", "free": True, "description": "X Preview F — experimental free model"},
    ]


def _api_providers() -> list:
    """
    Returns a static list of popular API providers and their available models.
    The user picks a provider, enters their API key, then picks a model.
    These model IDs are passed directly to opencode via: opencode -m <provider>/<model>
    """
    return [
        {
            "id": "openai",
            "name": "OpenAI",
            "keyPlaceholder": "sk-...",
            "keyHint": "Get your key at platform.openai.com",
            "models": [
                {"id": "openai/gpt-4.1",          "displayName": "GPT-4.1"},
                {"id": "openai/gpt-4.1-mini",     "displayName": "GPT-4.1 Mini"},
                {"id": "openai/gpt-4o",           "displayName": "GPT-4o"},
                {"id": "openai/gpt-4o-mini",      "displayName": "GPT-4o Mini"},
                {"id": "openai/o3",               "displayName": "o3 (Reasoning)"},
                {"id": "openai/o4-mini",          "displayName": "o4-mini (Reasoning)"},
            ]
        },
        {
            "id": "anthropic",
            "name": "Anthropic",
            "keyPlaceholder": "sk-ant-...",
            "keyHint": "Get your key at console.anthropic.com",
            "models": [
                {"id": "anthropic/claude-opus-4-5",   "displayName": "Claude Opus 4.5"},
                {"id": "anthropic/claude-sonnet-4-5", "displayName": "Claude Sonnet 4.5"},
                {"id": "anthropic/claude-haiku-4-5",  "displayName": "Claude Haiku 4.5"},
                {"id": "anthropic/claude-3-5-sonnet", "displayName": "Claude 3.5 Sonnet"},
            ]
        },
        {
            "id": "google",
            "name": "Google (Gemini)",
            "keyPlaceholder": "AIza...",
            "keyHint": "Get your key at aistudio.google.com",
            "models": [
                {"id": "google/gemini-2.5-pro",          "displayName": "Gemini 2.5 Pro"},
                {"id": "google/gemini-2.5-flash",        "displayName": "Gemini 2.5 Flash"},
                {"id": "google/gemini-2.5-flash-lite",   "displayName": "Gemini 2.5 Flash Lite"},
                {"id": "google/gemini-2.0-flash",        "displayName": "Gemini 2.0 Flash"},
            ]
        },
        {
            "id": "deepseek",
            "name": "DeepSeek",
            "keyPlaceholder": "sk-...",
            "keyHint": "Get your key at platform.deepseek.com",
            "models": [
                {"id": "deepseek/deepseek-chat",        "displayName": "DeepSeek Chat (V3)"},
                {"id": "deepseek/deepseek-coder",       "displayName": "DeepSeek Coder"},
                {"id": "deepseek/deepseek-reasoner",    "displayName": "DeepSeek Reasoner (R1)"},
            ]
        },
        {
            "id": "groq",
            "name": "Groq (Ultra Fast)",
            "keyPlaceholder": "gsk_...",
            "keyHint": "Get your key at console.groq.com",
            "models": [
                {"id": "groq/llama-3.3-70b-versatile",  "displayName": "Llama 3.3 70B"},
                {"id": "groq/llama-3.1-8b-instant",     "displayName": "Llama 3.1 8B (Instant)"},
                {"id": "groq/mixtral-8x7b-32768",       "displayName": "Mixtral 8x7B"},
                {"id": "groq/gemma2-9b-it",             "displayName": "Gemma 2 9B"},
            ]
        },
        {
            "id": "mistral",
            "name": "Mistral AI",
            "keyPlaceholder": "...",
            "keyHint": "Get your key at console.mistral.ai",
            "models": [
                {"id": "mistral/mistral-large-latest",    "displayName": "Mistral Large"},
                {"id": "mistral/codestral-latest",        "displayName": "Codestral (Code Specialist)"},
                {"id": "mistral/mistral-small-latest",    "displayName": "Mistral Small"},
            ]
        },
    ]


@router.get("/models")
async def get_available_models():
    """
    Returns two lists used by the frontend model selector:

    1. `free_models` — Fetched live from `opencode models` CLI command.
       These models require NO API key. Results are cached for 5 minutes.

    2. `api_providers` — Static list of popular providers (OpenAI, Anthropic,
       Google, DeepSeek, Groq, Mistral) with their available models.
       The user must supply their own API key for these.
    """
    # Use cached result if still fresh — avoids shelling out on every request
    if _is_cache_fresh():
        return _cache["data"]

    # Fetch live from opencode CLI
    free_models = await _fetch_free_models_from_opencode()

    response = {
        "free_models": free_models,
        "api_providers": _api_providers(),
        "opencode_installed": True,    # Will be False if CLI not found (future use)
        "cached": False
    }

    # Store in cache
    _cache["data"] = response
    _cache["fetched_at"] = datetime.utcnow()
    response["cached"] = False  # First fetch is never cached

    return response
