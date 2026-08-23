"""
==============================================================================
🩺 HEALTH CHECK ROUTER
==============================================================================
FastAPI Concept:
The health check endpoint provides a lightweight, non-blocking route that
verifies whether the FastAPI server is running, the SQLite database is reachable,
and Docker is responsive on the host system.
==============================================================================
"""

import asyncio
from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from ..database import get_db
from ..config import settings

router = APIRouter(prefix="/api/v1", tags=["Health"])


@router.get("/healthcheck")
async def healthcheck(db: AsyncSession = Depends(get_db)):
    """
    Returns system operational health status, database connectivity, and Docker availability.
    """
    db_status = "ok"
    try:
        await db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"error: {str(e)}"

    docker_available = False
    try:
        proc = await asyncio.create_subprocess_exec(
            "docker", "info",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        await proc.communicate()
        docker_available = (proc.returncode == 0)
    except Exception:
        docker_available = False

    return {
        "status": "healthy" if db_status == "ok" else "degraded",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "database": db_status,
        "docker_available": docker_available
    }
