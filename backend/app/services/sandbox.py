"""
==============================================================================
🐳 DOCKER SANDBOX RUNNER (Ephemeral Workspaces & Async Subprocesses)
==============================================================================
FastAPI Concept:
1. Non-Blocking Async Subprocesses: Using `asyncio.create_subprocess_exec`,
   the Python event loop remains responsive while Docker commands execute.
2. Ephemeral Workspaces: Using `tempfile.mkdtemp()`, an isolated
   directory is created for each benchmark job and completely wiped from disk
   after the run finishes, preventing persistent disk bloat.
3. Real-Time Log Streaming: Output from `stdout` and `stderr` is read line-by-line
   and periodically synced to the database so clients can monitor progress live.
4. ANSI Stripping: Raw terminal escape codes (colors, cursor movement) from
   Docker/opencode output are stripped before storing logs, so the browser
   terminal displays clean readable text.
==============================================================================
"""

import asyncio
import os
import re
import shutil
import tempfile
from pathlib import Path
from typing import Optional, Callable, Awaitable, List
from dataclasses import dataclass


# ANSI escape code pattern — matches sequences like \x1b[0m, \x1b[32m, etc.
# These are control codes terminals use for colors/formatting.
# We strip them so logs stored in the DB and shown on the frontend are clean text.
ANSI_ESCAPE = re.compile(r'\x1b\[[0-9;]*[mGKHF]|\x1b\(B|\r')


def strip_ansi(text: str) -> str:
    """Remove all ANSI terminal escape codes from a string."""
    return ANSI_ESCAPE.sub('', text)


@dataclass
class SandboxResult:
    exit_code: int
    logs: str
    tests_passed: bool
    test_pass_rate: float
    files_generated: int       # NEW: how many code files were actually written
    duration_ms: int


class DockerSandboxService:
    """
    Manages isolated Docker containers for executing LLM-generated code.
    """

    def __init__(self):
        self.default_image = "ubuntu:22.04"

    async def run_sandbox(
        self,
        job_id: str,
        model_name: str,
        api_key: Optional[str],
        prompt: str,
        reference_repo: Optional[str],
        log_callback: Optional[Callable[[str], Awaitable[None]]] = None
    ) -> SandboxResult:
        """
        Runs the benchmark inside an isolated Docker container with an ephemeral directory.
        """
        start_time = asyncio.get_event_loop().time()
        log_collector: List[str] = []

        async def emit_log(line: str):
            # Strip ANSI before collecting — clean logs in, clean logs out
            clean = strip_ansi(line)
            if not clean.strip():
                return
            log_collector.append(clean)
            if log_callback:
                try:
                    await log_callback("\n".join(log_collector))
                except Exception:
                    pass

        container_name = f"vibebench-job-{job_id}"

        # 1. Create an Ephemeral Workspace Directory on the HOST machine.
        #    This directory is mounted into the Docker container as /workspace.
        #    opencode inside the container writes files to /workspace/project,
        #    which appear on the host at job_path/project.
        temp_dir = tempfile.mkdtemp(prefix=f"vibebench_{job_id}_")
        job_path = Path(temp_dir)
        project_path = job_path / "project"
        project_path.mkdir(parents=True, exist_ok=True)

        try:
            await emit_log(f"🚀 Initializing isolated ephemeral sandbox")
            await emit_log(f"📦 Spawning container: {container_name}")

            # 2. Write plan.md — this is what opencode reads as its task
            instructions = (
                "You are inside a Docker container (Ubuntu 22.04). "
                "Install whatever languages/tools are needed for the task below. "
                "Write ALL code files to /workspace/project/. "
                "Write unit tests in the SAME directory. "
                "For any database dependencies in tests, use SQLite or in-memory databases. "
                "Do NOT leave any placeholder comments or TODO items — fully implement everything."
            )
            if not self._mentions_language_or_framework(prompt):
                instructions += " Use Python with pytest for tests."

            prefixed_prompt = f"{instructions}\n\nTASK:\n{prompt}"
            (job_path / "plan.md").write_text(prefixed_prompt, encoding="utf-8")

            # 3. Write the runner bash script to the workspace
            script_content = self._get_runner_script()
            script_path = job_path / "run_generation.sh"
            script_path.write_text(script_content, encoding="utf-8")
            os.chmod(script_path, 0o755)

            # 4. Kill any leftover container with the same name from a previous run
            await self._run_command(["docker", "rm", "-f", container_name])

            # 5. Start a fresh Docker container with:
            #    - 1.5GB RAM limit
            #    - The workspace directory mounted as /workspace inside the container
            #    - Runs `tail -f /dev/null` to keep it alive until we `docker exec` into it
            run_cmd = [
                "docker", "run", "-d",
                "--name", container_name,
                "-m", "1536m",                       # 1.5GB memory limit
                "--cpus", "2",                       # Limit to 2 CPU cores
                "-v", f"{job_path}:/workspace",      # Mount the workspace
                self.default_image,
                "tail", "-f", "/dev/null"            # Keep container alive
            ]

            run_code, _ = await self._run_command_streaming(run_cmd, emit_log)
            if run_code != 0:
                await emit_log("❌ ERROR: Failed to start Docker container. Is Docker running?")
                return SandboxResult(
                    exit_code=1,
                    logs="\n".join(log_collector),
                    tests_passed=False,
                    test_pass_rate=0.0,
                    files_generated=0,
                    duration_ms=int((asyncio.get_event_loop().time() - start_time) * 1000)
                )

            await emit_log("⚙️ Container running. Starting opencode generation + test runner...")

            # 6. Execute the runner script inside the container via docker exec
            exec_cmd = ["docker", "exec"]
            if api_key and api_key.strip():
                # Pass API key as environment variables inside the container
                exec_cmd.extend([
                    "-e", f"OPENAI_API_KEY={api_key}",
                    "-e", f"ANTHROPIC_API_KEY={api_key}",
                    "-e", f"GOOGLE_API_KEY={api_key}",
                    "-e", f"GEMINI_API_KEY={api_key}",
                    "-e", f"DEEPSEEK_API_KEY={api_key}",
                    "-e", f"GROQ_API_KEY={api_key}",
                    "-e", f"MISTRAL_API_KEY={api_key}",
                ])
            exec_cmd.extend([
                "-e", f"MODEL_NAME={model_name}",
                "-e", f"REFERENCE_REPO={reference_repo or ''}",
                container_name,
                "bash", "/workspace/run_generation.sh"
            ])

            exec_code, _ = await self._run_command_streaming(exec_cmd, emit_log)

            # 7. Count how many real code files were generated in the project directory.
            #    This is the key anti-cheat check: if opencode wrote 0 files, the run FAILS
            #    regardless of what the script reported.
            files_generated = self._count_generated_files(project_path)
            await emit_log(f"📁 Files generated in /workspace/project: {files_generated}")

            # 8. Parse test results from the full log output
            full_logs = "\n".join(log_collector)
            tests_passed, pass_rate = self._parse_test_results(full_logs, files_generated)

            duration_ms = int((asyncio.get_event_loop().time() - start_time) * 1000)

            if tests_passed:
                await emit_log(f"✅ Tests PASSED — pass rate: {pass_rate * 100:.1f}%")
            else:
                await emit_log(f"❌ Tests FAILED — pass rate: {pass_rate * 100:.1f}%")

            return SandboxResult(
                exit_code=exec_code,
                logs="\n".join(log_collector),
                tests_passed=tests_passed,
                test_pass_rate=pass_rate,
                files_generated=files_generated,
                duration_ms=duration_ms
            )

        finally:
            # 9. Always clean up the Docker container when we're done
            await emit_log("🧹 Cleaning up Docker container...")
            await self._run_command(["docker", "stop", container_name])
            await self._run_command(["docker", "rm", "-f", container_name])

            # 10. Remove the ephemeral workspace directory from host disk
            try:
                shutil.rmtree(temp_dir, ignore_errors=True)
                await emit_log("🗑️ Ephemeral workspace removed from disk.")
            except Exception as e:
                print(f"Warning: Could not remove temp dir {temp_dir}: {e}")

    def _count_generated_files(self, project_path: Path) -> int:
        """
        Counts how many actual source/test code files were written by the model.
        Excludes config-only files like .gitignore, README, pytest.ini, pom.xml, etc.
        
        WHY THIS MATTERS:
        If opencode runs but crashes before writing files, the project dir is empty.
        The old code had an `else: echo "All synthetic tests passed"` fallback that
        would give the model a perfect score even with zero generated files.
        Now we count files first — zero files = real failure score.
        """
        if not project_path.exists():
            return 0

        # Extensions that count as actual generated code
        code_extensions = {
            '.py', '.js', '.ts', '.jsx', '.tsx', '.java', '.go',
            '.rs', '.cpp', '.c', '.cs', '.rb', '.kt', '.swift',
            '.php', '.scala', '.sh'
        }

        count = 0
        for f in project_path.rglob("*"):
            if f.is_file() and f.suffix.lower() in code_extensions:
                count += 1
        return count

    def _parse_test_results(self, full_logs: str, files_generated: int) -> tuple[bool, float]:
        """
        Parses the sandbox output logs to determine if tests actually passed.
        
        CRITICAL RULES:
        1. If zero files were generated by the model → ALWAYS FAIL (0.0)
        2. "VIBEBENCH_TEST_SUCCESS" must appear AND files must exist → PASS (1.0)
        3. "All synthetic verification tests passed" without real files → FAIL
        4. Parse partial pass rates from pytest/jest output if available
        """
        # Rule 1: No files = no real execution, regardless of what the script printed
        if files_generated == 0:
            return False, 0.0

        # Rule 2: If the sentinel appears AND there are real files, it's a genuine pass
        if "VIBEBENCH_TEST_SUCCESS" in full_logs:
            # Double-check it's not the fake fallback message
            if "All synthetic verification tests passed" in full_logs and files_generated == 0:
                return False, 0.0
            return True, 1.0

        # Rule 3: Parse partial pass rate from test framework output
        pass_rate = 0.0
        if "TEST_PASS_RATE=" in full_logs:
            try:
                line = [l for l in full_logs.splitlines() if "TEST_PASS_RATE=" in l][-1]
                pass_rate = float(line.split("=")[1].strip())
            except Exception:
                pass_rate = 0.0

        # Also try to extract from pytest summary line: "X passed, Y failed"
        if pass_rate == 0.0:
            import re
            match = re.search(r'(\d+) passed', full_logs)
            failed_match = re.search(r'(\d+) failed', full_logs)
            if match:
                passed = int(match.group(1))
                failed = int(failed_match.group(1)) if failed_match else 0
                total = passed + failed
                if total > 0:
                    pass_rate = passed / total

        return False, pass_rate

    async def _run_command_streaming(
        self,
        cmd: List[str],
        emit_log: Callable[[str], Awaitable[None]]
    ) -> tuple[int, str]:
        """
        Executes a shell command asynchronously and streams each output line
        through the emit_log callback (which strips ANSI and saves to DB).
        """
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT   # Merge stderr into stdout so we see all output
        )

        output_lines = []
        while True:
            line = await process.stdout.readline()
            if not line:
                break
            # Decode bytes to string, strip ANSI codes, remove trailing whitespace
            decoded = strip_ansi(line.decode("utf-8", errors="replace").rstrip())
            if decoded:  # Skip blank lines after stripping
                output_lines.append(decoded)
                await emit_log(decoded)

        await process.wait()
        return process.returncode or 0, "\n".join(output_lines)

    async def _run_command(self, cmd: List[str]) -> tuple[int, str]:
        """Runs a command silently (no streaming) — used for docker stop/rm."""
        try:
            proc = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await proc.communicate()
            return proc.returncode or 0, stdout.decode()
        except Exception as e:
            return 1, str(e)

    def _get_runner_script(self) -> str:
        """
        The bash script that runs INSIDE the Docker container.
        
        KEY FIXES vs the previous version:
        1. NO MORE FAKE FALLBACK: The `else` branch now FAILS with exit code 1
           instead of printing "All synthetic tests passed." This was the main bug
           causing empty runs to get 91-point scores.
        2. File count verification: Before running tests, we check that at least
           one code file actually exists in /workspace/project/
        3. Maven/Java timeout: mvn is given a 5-minute timeout to avoid hangs
        4. Proper error reporting: Shows exactly what went wrong and what files exist
        """
        return r"""#!/bin/bash
# Exit on errors — but NOT set -e globally since we want to capture TEST_STATUS
export PATH="$PATH:/root/.opencode/bin:/root/.local/bin:/usr/local/bin"

echo "=== [1/4] Environment Setup ==="
apt-get update -qq && apt-get install -y -qq curl git python3 python3-pip > /dev/null 2>&1 || true
echo "Python: $(python3 --version 2>&1)"

echo "=== [2/4] Initializing LLM Code Engine ==="
if ! command -v opencode > /dev/null 2>&1; then
    curl -fsSL https://opencode.ai/install | OPENCODE_INSTALL_DIR=/usr/local/bin bash > /dev/null 2>&1 || true
fi

if command -v opencode > /dev/null 2>&1; then
    echo "opencode: $(opencode --version 2>&1)"
else
    echo "WARNING: opencode not available"
fi

mkdir -p /workspace/project

echo "=== [3/4] Generating Solution for Model: $MODEL_NAME ==="

if command -v opencode > /dev/null 2>&1; then
    # Run opencode with a strict prompt that forces it to write ALL files before exiting
    opencode run \
        -m "$MODEL_NAME" \
        "$(cat /workspace/plan.md)

IMPORTANT RULES:
- Write ALL implementation files and test files to /workspace/project/ before finishing.
- Do NOT stop after writing one file. Write EVERY file needed.
- Tests must be complete and runnable with no TODOs or placeholders.
- Confirm by listing files with: ls -la /workspace/project/"
else
    echo "FATAL: opencode is not installed. Cannot generate code."
    echo "VIBEBENCH_TEST_FAILED"
    echo "TEST_PASS_RATE=0.0"
    exit 1
fi

echo "=== [4/4] Compiling & Running Unit Tests ==="

# CRITICAL: Verify that the model actually wrote files before running tests.
# If the project dir is empty, the model failed — we must NOT fake a passing result.
FILE_COUNT=$(find /workspace/project -type f \( \
    -name "*.py" -o -name "*.js" -o -name "*.ts" -o -name "*.java" \
    -o -name "*.go" -o -name "*.rs" -o -name "*.cpp" -o -name "*.c" \
    -o -name "*.cs" -o -name "*.rb" -o -name "*.kt" \
\) 2>/dev/null | wc -l)

echo "Code files found in /workspace/project: $FILE_COUNT"
ls -la /workspace/project/ 2>/dev/null || echo "(project dir is empty)"

if [ "$FILE_COUNT" -eq 0 ]; then
    echo "FATAL: No code files were generated by the model."
    echo "The model ran but did not write any files to /workspace/project/"
    echo "VIBEBENCH_TEST_FAILED"
    echo "TEST_PASS_RATE=0.0"
    exit 1
fi

cd /workspace/project
TEST_STATUS=0

# Detect what kind of project was generated and run the appropriate test runner
if [ -f "package.json" ]; then
    echo "Detected: Node.js project"
    npm install --silent > /dev/null 2>&1 || true
    npm test > /workspace/test_output.log 2>&1 || TEST_STATUS=$?

elif [ -f "pom.xml" ]; then
    echo "Detected: Java/Maven project"
    # Install Java if not present
    apt-get install -y -qq default-jdk maven > /dev/null 2>&1 || true
    # Run Maven with a 5-minute timeout
    timeout 300 mvn clean test -q > /workspace/test_output.log 2>&1 || TEST_STATUS=$?

elif [ -f "build.gradle" ] || [ -f "build.gradle.kts" ]; then
    echo "Detected: Gradle project"
    apt-get install -y -qq default-jdk > /dev/null 2>&1 || true
    timeout 300 ./gradlew test > /workspace/test_output.log 2>&1 || TEST_STATUS=$?

elif [ -f "go.mod" ]; then
    echo "Detected: Go project"
    apt-get install -y -qq golang > /dev/null 2>&1 || true
    go test ./... > /workspace/test_output.log 2>&1 || TEST_STATUS=$?

elif [ -f "Cargo.toml" ]; then
    echo "Detected: Rust project"
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y > /dev/null 2>&1
    source "$HOME/.cargo/env"
    cargo test > /workspace/test_output.log 2>&1 || TEST_STATUS=$?

elif ls *.py > /dev/null 2>&1 || [ -f "requirements.txt" ]; then
    echo "Detected: Python project"
    pip3 install pytest pytest-cov --quiet > /dev/null 2>&1 || true
    # Install project requirements if they exist
    [ -f "requirements.txt" ] && pip3 install -r requirements.txt --quiet > /dev/null 2>&1 || true
    python3 -m pytest -v > /workspace/test_output.log 2>&1 || TEST_STATUS=$?

else
    # Unknown project type — this is a real failure, NOT a fake pass
    echo "ERROR: Could not determine project type."
    echo "Files present: $(ls -la /workspace/project/)"
    echo "VIBEBENCH_TEST_FAILED"
    echo "TEST_PASS_RATE=0.0"
    exit 1
fi

# Print test output to stdout so it appears in the live terminal stream
cat /workspace/test_output.log 2>/dev/null || true

# Report result
if [ $TEST_STATUS -eq 0 ]; then
    echo "VIBEBENCH_TEST_SUCCESS"
else
    echo "VIBEBENCH_TEST_FAILED"
    # Try to parse partial pass rate from test output
    PASSED=$(grep -oE '[0-9]+ passed' /workspace/test_output.log 2>/dev/null | grep -oE '[0-9]+' | tail -1 || echo "0")
    FAILED=$(grep -oE '[0-9]+ failed' /workspace/test_output.log 2>/dev/null | grep -oE '[0-9]+' | tail -1 || echo "0")
    TOTAL=$((${PASSED:-0} + ${FAILED:-0}))
    if [ "$TOTAL" -gt 0 ]; then
        PASS_RATE=$(python3 -c "print(${PASSED:-0} / $TOTAL)" 2>/dev/null || echo "0.0")
    else
        PASS_RATE="0.0"
    fi
    echo "TEST_PASS_RATE=$PASS_RATE"
fi
"""

    def _mentions_language_or_framework(self, prompt: str) -> bool:
        if not prompt:
            return False
        lower = prompt.lower()
        keywords = [
            "java", "spring", "maven", "javascript", "typescript", "node",
            "react", "vue", "golang", "go ", "rust", "python", "pytest", "fastapi",
            "django", "flask", "ruby", "c++", "c#", "dotnet", "kotlin", "gradle"
        ]
        return any(kw in lower for kw in keywords)


sandbox_service = DockerSandboxService()
