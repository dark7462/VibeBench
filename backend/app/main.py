"""
==============================================================================
⚡ VIBEBENCH FASTAPI MAIN APPLICATION
==============================================================================
FastAPI Concept & Educational Guide:
1. `FastAPI()` Instance: The central ASGI application instance that handles
   routing, OpenAPI documentation (/docs), dependency injection, and middleware.
2. `lifespan` Context Manager: Replaces legacy `@app.on_event("startup")` events.
   Code before `yield` runs when the server boots (database migrations, admin seeding).
   Code after `yield` runs when the server shuts down.
3. `CORSMiddleware`: Cross-Origin Resource Sharing middleware allowing browser clients
   from different origins (such as Vite on port 5173 or Vercel) to interact securely.
4. `app.include_router(...)`: Modular routing splitting endpoints across logical files
   (`health`, `auth`, `benchmark`, `stream`) while grouping them under `/api/v1`.
==============================================================================
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import settings
from .database import init_db
from .routers import health_router, auth_router, benchmark_router, stream_router, models_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application Lifespan Event Handler.
    Initializes SQLite tables and seeds default admin user ('admin' / '1234578') on startup.
    """
    print(f"🚀 Starting {settings.APP_NAME} v{settings.APP_VERSION}...")
    await init_db()
    print(f"✅ SQLite Database initialized at: {settings.SQLITE_DB_PATH}")
    yield
    print(f"🛑 Shutting down {settings.APP_NAME}...")


# Instantiate the FastAPI Application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="VibeBench: Real-time AI Model Coding Benchmark & Isolated Sandbox Platform",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Configure Cross-Origin Resource Sharing (CORS) Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permits local dev frontends (Vite, Next.js) and preview deployments
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(health_router)
app.include_router(auth_router)
app.include_router(benchmark_router)
app.include_router(stream_router)
app.include_router(models_router)   # /api/v1/models — live model discovery from opencode CLI


@app.get("/")
async def root():
    """
    Root landing endpoint confirming API service status.
    """
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "online",
        "docs": "/docs",
        "health": "/api/v1/healthcheck",
        "database": "SQLite (zero external DB requirements)"
    }
