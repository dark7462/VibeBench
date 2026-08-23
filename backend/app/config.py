"""
==============================================================================
⚙️ CONFIGURATION MODULE (Pydantic BaseSettings)
==============================================================================
FastAPI Concept:
Pydantic's `BaseSettings` automatically reads environment variables from your
system or a `.env` file, validates their types (e.g. str, int, list), and provides
a strongly-typed settings singleton accessible across the entire application.
==============================================================================
"""

import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

# Locate the root .env file (one directory above /backend)
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
ENV_FILE = ROOT_DIR / ".env"


class Settings(BaseSettings):
    """
    Application Settings schema.
    Values defined here will be automatically overridden if a matching environment
    variable exists in the `.env` file or host environment.
    """

    # --- Application Metadata ---
    APP_NAME: str = "VibeBench API"
    APP_VERSION: str = "2.0.0"
    DEBUG: bool = False

    # --- Database Settings (SQLite) ---
    # Using async SQLite with SQLAlchemy (`sqlite+aiosqlite:///...`)
    # Defaults to `backend/vibebench.db`
    SQLITE_DB_PATH: str = str(ROOT_DIR / "backend" / "vibebench.db")

    @property
    def DATABASE_URL(self) -> str:
        return f"sqlite+aiosqlite:///{self.SQLITE_DB_PATH}"

    # --- Security & JWT Token Settings ---
    VIBEBENCH_JWT_SECRET: str = "vibe-bench-custom-auth-v2-jwt-signature-key-256-bits-long-secure-key"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 60 * 24 * 7  # 7 Days token validity

    # --- Google OAuth Client ID ---
    VIBEBENCH_GOOGLE_CLIENT_ID: str = "972017410426-v9na2cep5uvu47odj524nsbb90np39n3.apps.googleusercontent.com"

    # --- Default Seed Admin Credentials ---
    DEFAULT_ADMIN_USERNAME: str = "admin"
    DEFAULT_ADMIN_EMAIL: str = "admin@vibebench.ai"
    DEFAULT_ADMIN_PASSWORD: str = "1234578"
    DEFAULT_ADMIN_NAME: str = "VibeBench Administrator"
    DEFAULT_ADMIN_PROFESSION: str = "System Admin"

    # --- CORS Allowed Origins ---
    # In production, set CORS_ORIGINS env var to your Vercel URL.
    # Example in .env:
    #   CORS_ORIGINS=["https://your-app.vercel.app","https://yourdomain.com"]
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8080",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8000",
        "http://localhost:8000",
        "https://*.vercel.app",
        "*"   # Removed in production — set CORS_ORIGINS env var instead
    ]

    # Tell Pydantic to read from root .env if present
    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE) if ENV_FILE.exists() else None,
        env_file_encoding="utf-8",
        extra="ignore"
    )


# Instantiate a global singleton settings object
settings = Settings()
