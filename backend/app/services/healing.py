"""
==============================================================================
🔄 5-STEP SELF-HEALING ENGINE
==============================================================================
FastAPI Concept:
If initial test suites fail, the orchestrator triggers an automatic self-healing
cycle (up to 5 attempts). Error logs and test outputs are captured and passed back
into the model to generate patches, which are re-tested in the sandbox.
==============================================================================
"""

import asyncio
from typing import Optional, Callable, Awaitable, List
from .sandbox import SandboxResult, DockerSandboxService


class SelfHealingService:
    """
    Orchestrates recursive error-correction feedback loops.
    """

    def __init__(self, sandbox: DockerSandboxService):
        self.sandbox = sandbox

    async def attempt_healing(
        self,
        job_id: str,
        model_name: str,
        api_key: Optional[str],
        error_logs: str,
        attempt: int,
        log_callback: Optional[Callable[[str], Awaitable[None]]] = None
    ) -> SandboxResult:
        """
        Runs a healing cycle by passing failure logs back to the LLM.
        """
        healing_prompt = (
            f"The previous implementation in /workspace/project had compile/test errors.\n"
            f"Here are the error logs:\n{error_logs}\n\n"
            f"Fix the project files inside /workspace/project so they compile and pass all tests."
        )

        return await self.sandbox.run_sandbox(
            job_id=f"{job_id}-heal-{attempt}",
            model_name=model_name,
            api_key=api_key,
            prompt=healing_prompt,
            reference_repo=None,
            log_callback=log_callback
        )


from .sandbox import sandbox_service
healing_service = SelfHealingService(sandbox=sandbox_service)

