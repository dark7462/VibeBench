"""
==============================================================================
🗄️ DATABASE MODULE (SQLAlchemy Async + SQLite)
==============================================================================
FastAPI Concept:
1. Async Database Sessions: We use SQLAlchemy 2.0's `create_async_engine`
   with the `aiosqlite` driver to handle database transactions asynchronously.
2. Dependency Injection (`get_db`): FastAPI injects a clean database session
   into any endpoint that requests it via `db: AsyncSession = Depends(get_db)`.
   The `yield` ensures the session is automatically closed after the request ends.
3. Database Lifespan (`init_db`): Seeds the default admin account (admin / 1234578)
   and starter benchmark data on server startup.
==============================================================================
"""

import os
from pathlib import Path
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import select

from .config import settings
from .models.user import Base, User
from .models.benchmark import BenchmarkJob, JobStatus


# Ensure the parent directory for the SQLite file exists
db_path = Path(settings.SQLITE_DB_PATH)
db_path.parent.mkdir(parents=True, exist_ok=True)

# Create the asynchronous SQLite engine
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    connect_args={"check_same_thread": False}  # Needed for SQLite multi-threaded access
)

# Factory for creating async database sessions
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI Dependency that yields an active database session for a single HTTP request,
    then automatically commits or closes it cleanly.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    """
    Called once during FastAPI lifespan startup to create tables and seed default data.
    """
    # 1. Create all tables defined in SQLAlchemy Base
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # 2. Seed Default Admin User & Starter Benchmark Jobs
    async with AsyncSessionLocal() as session:
        # Import password hashing function lazily to prevent circular import
        from .auth.security import hash_password

        # Check if default admin exists
        stmt = select(User).where((User.username == "admin") | (User.email == "admin@vibebench.ai") | (User.email == "admin"))
        result = await session.execute(stmt)
        admin_user = result.scalars().first()

        if not admin_user:
            # Seed default admin (admin / 1234578)
            seeded_admin = User(
                email="admin",
                username="admin",
                name="System Administrator",
                hashed_password=hash_password("1234578"),
                profession="VibeBench Lead",
                role="ROLE_ADMIN"
            )
            session.add(seeded_admin)

            # Also seed standard developer alias
            dev_user = User(
                email="developer@vibebench.ai",
                username="developer",
                name="Lead Researcher",
                hashed_password=hash_password("1234578"),
                profession="AI Scientist",
                role="ROLE_USER"
            )
            session.add(dev_user)
            await session.commit()
            print("✨ Default Admin (username: 'admin', password: '1234578') initialized in SQLite.")

        # Check if we should seed default benchmark sample jobs
        job_check = await session.execute(select(BenchmarkJob))
        if not job_check.scalars().first():
            from datetime import datetime, timedelta
            sample_jobs = [
                BenchmarkJob(
                    job_id="job_seed_gpt4o",
                    model_name="GPT-4o",
                    prompt="Payment Gateway Distributed Lock & Idempotency",
                    status=JobStatus.COMPLETED.value,
                    score=92.46,
                    metrics_json='{"functionalAccuracy": 0.962, "codeQuality": 0.91, "productionRealism": 0.94, "security": 0.99, "costLatency": 0.88, "costUsd": 0.014, "latencyMs": 12400}',
                    logs="[Init Sandbox] Spawning Ubuntu 22.04 container...\n[Tests] 84/84 unit tests passed.\nVIBEBENCH_TEST_SUCCESS\nEvaluation overall score: 92.46",
                    created_at=datetime.utcnow() - timedelta(hours=2)
                ),
                BenchmarkJob(
                    job_id="job_seed_claude",
                    model_name="Claude 3.5 Sonnet",
                    prompt="Sliding Window Token Bucket Rate Limiter",
                    status=JobStatus.COMPLETED.value,
                    score=89.31,
                    metrics_json='{"functionalAccuracy": 0.941, "codeQuality": 0.89, "productionRealism": 0.92, "security": 0.98, "costLatency": 0.82, "costUsd": 0.018, "latencyMs": 14100}',
                    logs="[Init Sandbox] Spawning Ubuntu 22.04 container...\n[Tests] 60/60 unit tests passed.\nVIBEBENCH_TEST_SUCCESS\nEvaluation overall score: 89.31",
                    created_at=datetime.utcnow() - timedelta(hours=4)
                ),
                BenchmarkJob(
                    job_id="job_seed_gemini",
                    model_name="Gemini 1.5 Pro",
                    prompt="OAuth2 PKCE & JWT Rotation Engine",
                    status=JobStatus.COMPLETED.value,
                    score=86.72,
                    metrics_json='{"functionalAccuracy": 0.915, "codeQuality": 0.86, "productionRealism": 0.89, "security": 0.97, "costLatency": 0.89, "costUsd": 0.009, "latencyMs": 11800}',
                    logs="[Init Sandbox] Spawning Ubuntu 22.04 container...\n[Tests] 72/72 unit tests passed.\nVIBEBENCH_TEST_SUCCESS\nEvaluation overall score: 86.72",
                    created_at=datetime.utcnow() - timedelta(hours=6)
                ),
                BenchmarkJob(
                    job_id="job_seed_deepseek",
                    model_name="DeepSeek V3",
                    prompt="Distributed Task Queue with Redis Streams",
                    status=JobStatus.COMPLETED.value,
                    score=84.15,
                    metrics_json='{"functionalAccuracy": 0.894, "codeQuality": 0.83, "productionRealism": 0.85, "security": 0.96, "costLatency": 0.95, "costUsd": 0.003, "latencyMs": 16200}',
                    logs="[Init Sandbox] Spawning Ubuntu 22.04 container...\n[Tests] 45/45 unit tests passed.\nVIBEBENCH_TEST_SUCCESS\nEvaluation overall score: 84.15",
                    created_at=datetime.utcnow() - timedelta(hours=8)
                )
            ]
            session.add_all(sample_jobs)
            await session.commit()
            print("✨ Initial sample benchmark runs seeded in SQLite.")
