"""
==============================================================================
📐 MULTI-DIMENSIONAL EVALUATOR SERVICE
==============================================================================
Scores benchmark jobs using a 5-pillar weighted formula:
  1. Functional Accuracy (40%): Real test pass rate from the sandbox.
  2. Code Quality      (20%): Based on whether actual files were generated
                              and test outcomes — not heuristic fluff.
  3. Production Realism(15%): Checks for enterprise patterns in the logs.
  4. Security          (15%): Scans for dangerous patterns (eval, hardcoded keys).
  5. Cost & Latency    (10%): Penalises very slow runs; rewards free models.

IMPORTANT SCORING RULES:
  - If files_generated == 0: score is 0. Period. No empty runs get rewarded.
  - If tests_passed is False and pass_rate == 0: functional accuracy is 0.
  - The "synthetic fallback" path was removed from the sandbox — this evaluator
    trusts that VIBEBENCH_TEST_SUCCESS now only appears when real tests ran.
==============================================================================
"""

import re
from typing import Dict, Any
from dataclasses import dataclass


@dataclass
class EvaluationScores:
    overall_score: float
    functional_accuracy: float
    code_quality: float
    production_realism: float
    security: float
    cost_latency: float
    cost_usd: float
    latency_ms: int
    files_generated: int

    def to_dict(self) -> Dict[str, Any]:
        return {
            "functionalAccuracy": round(self.functional_accuracy, 3),
            "codeQuality":        round(self.code_quality, 3),
            "productionRealism":  round(self.production_realism, 3),
            "security":           round(self.security, 3),
            "costLatency":        round(self.cost_latency, 3),
            "costUsd":            round(self.cost_usd, 4),
            "latencyMs":          self.latency_ms,
            "filesGenerated":     self.files_generated,
        }


class EvaluatorService:
    """
    Evaluates generated codebase and outputs normalized multi-metric scores.
    """

    def evaluate(
        self,
        test_pass_rate: float,
        duration_ms: int,
        is_free_model: bool,
        logs: str = "",
        files_generated: int = 0,   # NEW: passed in from SandboxResult
    ) -> EvaluationScores:
        """
        Calculates all score dimensions and overall weighted score (0–100).

        Args:
            test_pass_rate:   Float 0.0–1.0 from parsed test output.
            duration_ms:      Wall-clock time in milliseconds.
            is_free_model:    True if no API key was needed.
            logs:             Full sandbox stdout logs for heuristic analysis.
            files_generated:  How many code files opencode actually wrote.
        """

        # ── GATE: Zero files = Zero score ──────────────────────────────────
        # If the model generated no code files, we give it a ZERO overall score.
        # This fixes the bug where empty runs scored 91 via the fake fallback.
        if files_generated == 0:
            return EvaluationScores(
                overall_score=0.0,
                functional_accuracy=0.0,
                code_quality=0.0,
                production_realism=0.0,
                security=0.0,
                cost_latency=0.0,
                cost_usd=0.0,
                latency_ms=duration_ms,
                files_generated=0,
            )

        # ── 1. Functional Accuracy (40% weight) ────────────────────────────
        # Directly maps test pass rate (0.0–1.0) from the sandbox runner.
        functional_accuracy = max(0.0, min(1.0, test_pass_rate))

        # ── 2. Code Quality (20% weight) ───────────────────────────────────
        # Based on actual test results and file count, NOT keyword heuristics.
        #   - Full tests passed + multiple files → 0.90–0.95
        #   - Partial pass + files exist → scaled score
        #   - No tests passed but files exist → 0.35 (model tried but failed)
        #   - No files at all → 0.0 (handled above by gate)
        if functional_accuracy >= 1.0:
            # All tests passed → high quality
            quality_base = 0.90
            # Bonus for generating multiple files (more complete solution)
            file_bonus = min(0.05, files_generated * 0.01)
            code_quality = min(1.0, quality_base + file_bonus)
        elif functional_accuracy > 0.0:
            # Partial pass
            code_quality = 0.50 + (functional_accuracy * 0.35)
        else:
            # Tests failed but files exist
            code_quality = 0.30

        # ── 3. Production Realism (15% weight) ────────────────────────────
        # Checks for enterprise-grade patterns in the logs (services, auth, etc.)
        realism_keywords = [
            "service", "controller", "handler", "router", "middleware",
            "auth", "jwt", "config", "model", "schema", "test", "mock",
            "interface", "repository", "factory", "decorator"
        ]
        logs_lower = logs.lower()
        matches = sum(1 for kw in realism_keywords if kw in logs_lower)
        # Scale: 0 keywords → 0.40, 5 keywords → 0.75, 10+ keywords → 1.0
        production_realism = min(1.0, 0.40 + (matches * 0.06))

        # ── 4. Security (15% weight) ───────────────────────────────────────
        # Penalise dangerous coding patterns found in logs/generated code
        security = 1.0
        danger_patterns = [
            (r'\beval\s*\(',     0.20),   # eval() call
            (r'\bexec\s*\(',     0.15),   # exec() call
            (r'os\.system\s*\(', 0.10),   # os.system shell injection
            (r'password\s*=\s*["\'][^"\']+["\']', 0.10),  # hardcoded password
            (r'secret\s*=\s*["\'][^"\']+["\']',   0.10),  # hardcoded secret
        ]
        for pattern, penalty in danger_patterns:
            if re.search(pattern, logs, re.IGNORECASE):
                security -= penalty
        security = max(0.0, security)

        # ── 5. Cost & Latency (10% weight) ────────────────────────────────
        # Latency score decays linearly: 0 ms → 1.0, 10 min → 0.0
        max_duration_ms = 600_000  # 10 minutes = maximum tolerated time
        latency_score = max(0.0, 1.0 - (duration_ms / max_duration_ms))

        # Free models get bonus (no cost to user), paid models are slightly penalised
        cost_score = 1.0 if is_free_model else 0.80
        cost_usd = 0.0 if is_free_model else round(0.014 * (duration_ms / 30000), 4)

        cost_latency = (latency_score * 0.6) + (cost_score * 0.4)

        # ── Weighted Aggregate ─────────────────────────────────────────────
        raw_score = (
            (functional_accuracy  * 0.40)
            + (code_quality       * 0.20)
            + (production_realism * 0.15)
            + (security           * 0.15)
            + (cost_latency       * 0.10)
        )

        overall_score = round(raw_score * 100.0, 2)

        return EvaluationScores(
            overall_score=overall_score,
            functional_accuracy=functional_accuracy,
            code_quality=code_quality,
            production_realism=production_realism,
            security=security,
            cost_latency=cost_latency,
            cost_usd=cost_usd,
            latency_ms=duration_ms,
            files_generated=files_generated,
        )


evaluator_service = EvaluatorService()
