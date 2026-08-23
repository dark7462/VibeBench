"""
==============================================================================
📡 REAL-TIME LOG STREAMING (Server-Sent Events - SSE)
==============================================================================
FastAPI Concept:
Server-Sent Events (SSE) provide a one-way persistent HTTP connection from
the server to the browser client. As new container output arrives, we yield
events that the frontend JavaScript `EventSource` receives in real time.
==============================================================================
"""

import asyncio
import json
from fastapi import APIRouter, HTTPException, Request
from sse_starlette.sse import EventSourceResponse
from sqlalchemy import select

from ..database import AsyncSessionLocal
from ..models.benchmark import BenchmarkJob, JobStatus

router = APIRouter(prefix="/api/v1", tags=["Log Streaming"])


@router.get("/job/{job_id}/stream")
async def stream_job_logs(job_id: str, request: Request):
    """
    Streams live terminal execution logs to the browser via Server-Sent Events (SSE).
    """

    async def event_generator():
        last_log_len = 0
        while True:
            # If client disconnected, exit generator
            if await request.is_disconnected():
                break

            async with AsyncSessionLocal() as session:
                stmt = select(BenchmarkJob).where(BenchmarkJob.job_id == job_id)
                res = await session.execute(stmt)
                job = res.scalars().first()

                if not job:
                    yield {
                        "event": "error",
                        "data": json.dumps({"error": "Job not found"})
                    }
                    break

                current_logs = job.logs or ""
                if len(current_logs) > last_log_len:
                    new_chunk = current_logs[last_log_len:]
                    last_log_len = len(current_logs)
                    yield {
                        "event": "log",
                        "data": json.dumps({
                            "status": job.status,
                            "chunk": new_chunk,
                            "fullLogs": current_logs,
                            "score": job.score
                        })
                    }

                if job.status in [JobStatus.COMPLETED.value, JobStatus.FAILED.value]:
                    yield {
                        "event": "done",
                        "data": json.dumps({
                            "status": job.status,
                            "score": job.score,
                            "metrics": job.metrics
                        })
                    }
                    break

            await asyncio.sleep(0.8)

    return EventSourceResponse(event_generator())
