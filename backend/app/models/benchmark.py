"""
==============================================================================
📊 BENCHMARK MODELS & SCHEMAS
==============================================================================
FastAPI Concept:
Pydantic schemas with `model_config = {"populate_by_name": True}` and `Field(..., alias=...)`
allow our API to accept both camelCase (`promptText`, `modelName`, `apiKey`) and
legacy snake_case/slash formats (`prompt/plan.md`, `model_name`, `reference_repo`)
without any breaking changes to the frontend.
==============================================================================
"""

from datetime import datetime
from enum import Enum
import json
from typing import Optional, Dict, Any, List
from sqlalchemy import Column, String, Float, Text, DateTime
from pydantic import BaseModel, Field
from .user import Base


class JobStatus(str, Enum):
    """Execution status of a benchmark job"""
    QUEUED = "QUEUED"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class BenchmarkJob(Base):
    """
    SQLAlchemy Database Table for storing benchmark run logs, metrics, and scores.
    """
    __tablename__ = "benchmark_jobs"

    job_id = Column(String, primary_key=True, index=True)
    model_name = Column(String, index=True, nullable=False)
    prompt = Column(Text, nullable=True)
    reference_repo = Column(String, nullable=True)
    status = Column(String, default=JobStatus.QUEUED.value)
    score = Column(Float, default=0.0)
    metrics_json = Column(Text, default="{}")  # Stored as serialized JSON string
    logs = Column(Text, default="")
    error_details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    @property
    def metrics(self) -> Dict[str, Any]:
        if not self.metrics_json:
            return {}
        try:
            return json.loads(self.metrics_json)
        except Exception:
            return {}

    @metrics.setter
    def metrics(self, val: Dict[str, Any]):
        self.metrics_json = json.dumps(val or {})

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.job_id,
            "jobId": self.job_id,
            "job_id": self.job_id,
            "modelName": self.model_name,
            "model_name": self.model_name,
            "prompt": self.prompt,
            "referenceRepo": self.reference_repo,
            "status": self.status,
            "score": self.score,
            "metrics": self.metrics,
            "logs": self.logs,
            "errorDetails": self.error_details,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }


# ==============================================================================
# PYDANTIC SCHEMAS
# ==============================================================================

class BenchmarkRequest(BaseModel):
    """
    Unified payload parser accepting various frontend key naming conventions.
    """
    modelName: str = Field(
        ...,
        alias="model_name",
        description="Target LLM model name (e.g. 'GPT-4o', 'Claude 3.5 Sonnet')"
    )
    apiKey: Optional[str] = Field(
        default=None,
        alias="apikey",
        description="Optional API key for proprietary LLM providers"
    )
    prompt: Optional[str] = Field(
        default=None,
        alias="prompt/plan.md",
        description="Task plan or prompt instructions"
    )
    promptText: Optional[str] = Field(
        default=None,
        description="Alternative prompt field sent by frontend modals"
    )
    referenceRepo: Optional[str] = Field(
        default=None,
        alias="reference_repo",
        description="Optional Git repository URL for Jaccard code comparison"
    )

    def get_effective_prompt(self) -> str:
        """Returns the non-empty prompt text from any provided alias"""
        if self.prompt and self.prompt.strip():
            return self.prompt.strip()
        if self.promptText and self.promptText.strip():
            return self.promptText.strip()
        return "Implement standard code solution with automated unit tests."

    model_config = {
        "populate_by_name": True,
        "extra": "ignore"
    }


class LeaderboardEntry(BaseModel):
    """Structured response for leaderboard rankings"""
    rank: str
    name: str
    provider: str
    badge: str
    score: float
    accuracy: float
    latency: str
    cost: str
    selfHealing: str
    security: str
    type: str
    language: str
    change: str


class BenchmarkTriggerResponse(BaseModel):
    """Immediate response after queuing a benchmark job"""
    job_id: str
    jobId: str
    status: str = "accepted"
    message: str = "Benchmark job successfully scheduled in isolated sandbox pool"
