"""
==============================================================================
🎯 BENCHMARK ORCHESTRATOR (Async Background Execution)
==============================================================================
FastAPI Concept:
Using FastAPI's `BackgroundTasks` or `asyncio.create_task`, we dispatch the
heavy Docker container pipeline in the background. The HTTP request returns
immediately with `status: "accepted"` and `job_id`, allowing the client to poll
or stream real-time logs without blocking other API requests.
==============================================================================
"""

import asyncio
from datetime import datetime
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..database import AsyncSessionLocal
from ..models.benchmark import BenchmarkJob, JobStatus, BenchmarkRequest
from .sandbox import sandbox_service
from .healing import healing_service
from .evaluator import evaluator_service


class BenchmarkOrchestrator:
    """
    Coordinates execution of sandbox containers, self-healing cycles, and metric evaluations.
    """

    async def execute_benchmark_task(
        self,
        job_id: str,
        request: BenchmarkRequest
    ):
        """
        Asynchronous background task executing the benchmark pipeline.
        """
        async with AsyncSessionLocal() as session:
            # 1. Fetch and mark job as RUNNING
            stmt = select(BenchmarkJob).where(BenchmarkJob.job_id == job_id)
            result = await session.execute(stmt)
            job = result.scalars().first()

            if not job:
                print(f"Error: Job {job_id} not found in database.")
                return

            job.status = JobStatus.RUNNING.value
            job.updated_at = datetime.utcnow()
            await session.commit()

            last_db_log_update = 0.0

            async def save_logs_to_db(current_logs: str):
                """Callback to periodically write live logs into SQLite (throttled)"""
                nonlocal last_db_log_update
                now = asyncio.get_event_loop().time()
                if now - last_db_log_update < 0.5:
                    return
                last_db_log_update = now
                try:
                    async with AsyncSessionLocal() as update_session:
                        u_stmt = select(BenchmarkJob).where(BenchmarkJob.job_id == job_id)
                        u_res = await update_session.execute(u_stmt)
                        u_job = u_res.scalars().first()
                        if u_job:
                            u_job.logs = current_logs
                            u_job.updated_at = datetime.utcnow()
                            await update_session.commit()
                except Exception as e:
                    print(f"Error updating live logs: {e}")


            try:
                start_time = asyncio.get_event_loop().time()
                prompt_text = request.get_effective_prompt()
                is_free_model = not bool(request.apiKey) or "free" in request.modelName.lower()

                # 2. Run Sandbox Execution
                sandbox_result = await sandbox_service.run_sandbox(
                    job_id=job_id,
                    model_name=request.modelName,
                    api_key=request.apiKey,
                    prompt=prompt_text,
                    reference_repo=request.referenceRepo,
                    log_callback=save_logs_to_db
                )

                # 3. Trigger Self-Healing if tests failed (up to 5 attempts)
                attempt = 1
                while not sandbox_result.tests_passed and attempt < 5:
                    print(f"Job {job_id} tests failed (attempt {attempt}/5). Starting healing runner...")
                    heal_result = await healing_service.attempt_healing(
                        job_id=job_id,
                        model_name=request.modelName,
                        api_key=request.apiKey,
                        error_logs=sandbox_result.logs,
                        attempt=attempt,
                        log_callback=save_logs_to_db
                    )
                    if heal_result.tests_passed:
                        sandbox_result = heal_result
                        break
                    attempt += 1

                total_duration_ms = int((asyncio.get_event_loop().time() - start_time) * 1000)

                # 4. Multi-Metric Evaluation
                # files_generated is the anti-cheat gate: 0 files → 0 score
                evaluation = evaluator_service.evaluate(
                    test_pass_rate=sandbox_result.test_pass_rate,
                    duration_ms=total_duration_ms,
                    is_free_model=is_free_model,
                    logs=sandbox_result.logs,
                    files_generated=getattr(sandbox_result, 'files_generated', 0)
                )

                # 5. Update Database Record as COMPLETED
                async with AsyncSessionLocal() as final_session:
                    f_stmt = select(BenchmarkJob).where(BenchmarkJob.job_id == job_id)
                    f_res = await final_session.execute(f_stmt)
                    final_job = f_res.scalars().first()
                    if final_job:
                        final_job.status = JobStatus.COMPLETED.value
                        final_job.score = evaluation.overall_score
                        final_job.metrics = evaluation.to_dict()
                        final_job.logs = sandbox_result.logs
                        final_job.updated_at = datetime.utcnow()
                        await final_session.commit()

                print(f"✅ Job {job_id} completed successfully with score {evaluation.overall_score}")

            except Exception as e:
                print(f"❌ Error executing benchmark job {job_id}: {e}")
                async with AsyncSessionLocal() as err_session:
                    e_stmt = select(BenchmarkJob).where(BenchmarkJob.job_id == job_id)
                    e_res = await err_session.execute(e_stmt)
                    err_job = e_res.scalars().first()
                    if err_job:
                        err_job.status = JobStatus.FAILED.value
                        err_job.error_details = str(e)
                        err_job.updated_at = datetime.utcnow()
                        await err_session.commit()


orchestrator = BenchmarkOrchestrator()
