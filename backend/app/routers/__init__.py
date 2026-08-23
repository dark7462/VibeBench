from .health import router as health_router
from .auth import router as auth_router
from .benchmark import router as benchmark_router
from .stream import router as stream_router
from .models import router as models_router

__all__ = [
    "health_router",
    "auth_router",
    "benchmark_router",
    "stream_router",
    "models_router"
]
