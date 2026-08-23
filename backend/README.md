# ⚙️ VibeBench — Backend

Python FastAPI backend powering the VibeBench benchmark platform. Handles authentication, job orchestration, Docker sandbox execution, SSE log streaming, and multi-dimensional scoring.

---

## 🏗️ Architecture

```
backend/
├── app/
│   ├── main.py              # FastAPI app factory, CORS, lifespan hooks
│   ├── config.py            # Pydantic Settings — reads from .env
│   ├── database.py          # Async SQLite engine, session factory, seed data
│   ├── auth/
│   │   ├── jwt_handler.py   # Token create/verify (PyJWT)
│   │   ├── security.py      # bcrypt password hashing
│   │   └── google.py        # Google One-Tap OAuth token verify
│   ├── models/
│   │   ├── benchmark.py     # BenchmarkJob SQLAlchemy model + Pydantic schemas
│   │   └── user.py          # User model + schemas
│   ├── routers/
│   │   ├── auth.py          # POST /auth/login, /register, /google
│   │   ├── benchmark.py     # POST/GET /model, GET /job/{id}, /leaderboard, /stats
│   │   ├── stream.py        # GET /job/{id}/stream  (SSE)
│   │   ├── models.py        # GET /models  (live opencode model discovery)
│   │   └── health.py        # GET /healthcheck
│   └── services/
│       ├── sandbox.py       # Docker container lifecycle + ANSI stripping
│       ├── orchestrator.py  # Async job dispatch + log callback + DB updates
│       ├── evaluator.py     # 5-pillar weighted scoring engine
│       ├── healing.py       # Self-healing retry loop (up to 5 attempts)
│       └── leaderboard.py   # Top-10 query with in-memory TTL cache
├── requirements.txt
└── Dockerfile
```

---

## ⚡ FastAPI Key Concepts Used

### 1. Background Tasks (Non-Blocking Jobs)
```python
# HTTP handler returns 202 immediately
# Benchmark runs async in background without blocking other requests
asyncio.create_task(orchestrator.execute_benchmark_task(job_id, request))
return {"job_id": job_id, "status": "accepted"}
```

### 2. Server-Sent Events (SSE Streaming)
```python
# Client connects once, receives log lines pushed in real time
@router.get("/job/{job_id}/stream")
async def stream_logs(job_id: str):
    async def event_generator():
        while job.status == "RUNNING":
            yield {"data": latest_logs}
            await asyncio.sleep(1)
    return EventSourceResponse(event_generator())
```

### 3. Async SQLite (No Blocking I/O)
```python
# SQLAlchemy async engine — never blocks the event loop
async with AsyncSessionLocal() as session:
    result = await session.execute(select(BenchmarkJob).where(...))
    job = result.scalars().first()
```

### 4. Pydantic Settings (Type-Safe Config)
```python
class Settings(BaseSettings):
    VIBEBENCH_JWT_SECRET: str = "..."
    SQLITE_DB_PATH: str = "..."
    CORS_ORIGINS: List[str] = [...]
    model_config = SettingsConfigDict(env_file=".env")
```

---

## 🐳 How the Sandbox Works

1. **Ephemeral workspace**: `tempfile.mkdtemp()` creates an isolated directory on the host
2. **plan.md written**: User's prompt + strict instructions go into `plan.md`
3. **Container spawned**: `docker run -d -m 1536m --cpus 2 -v {job_path}:/workspace ubuntu:22.04`
4. **Script executed**: `docker exec {container} bash /workspace/run_generation.sh`
5. **opencode runs**: Installs itself if needed, reads `plan.md`, writes code to `/workspace/project/`
6. **File count verified**: Python counts actual code files — zero files = hard fail, score 0
7. **Tests run**: Detects project type (Python/Node/Go/Java/Rust) and runs appropriate test runner
8. **Logs streamed**: Every stdout line stripped of ANSI codes, stored in SQLite, pushed via SSE
9. **Cleanup**: Container destroyed, temp directory wiped from disk

---

## 📊 Scoring Formula

```
Overall Score = (
  Functional Accuracy  × 0.40   # actual test pass rate
  Code Quality         × 0.20   # based on pass rate + file count
  Production Realism   × 0.15   # enterprise pattern detection in logs
  Security             × 0.15   # eval/exec/hardcoded secret scan
  Cost + Latency       × 0.10   # execution time + free vs paid model
) × 100

HARD GATE: files_generated == 0 → score = 0.0 (no exceptions)
```

---

## 🛠️ Local Setup

### Prerequisites
- Python 3.10+
- Docker Desktop running
- [opencode](https://opencode.ai) CLI installed

### Install & Run
```bash
cd backend
python3 -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create .env (copy from root)
cp ../.env .env

# Start the server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

| URL | Purpose |
|-----|---------|
| http://localhost:8000/docs | Interactive Swagger UI |
| http://localhost:8000/redoc | ReDoc API docs |
| http://localhost:8000/api/v1/healthcheck | Health probe |

---

## 🚢 AWS EC2 Deployment

> The backend MUST run on EC2 (not Lambda/Fargate) because it spawns Docker containers via the Docker daemon.

### 1. Launch EC2
- AMI: Ubuntu 24.04 LTS
- Instance type: `t3.medium` (2 vCPU, 4 GB RAM)
- Security group: open port 22 (SSH) + 8000 (API)
- Storage: 20 GB gp3

### 2. Connect & Install
```bash
ssh -i vibebench-key.pem ubuntu@YOUR_EC2_IP

# Install Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu && newgrp docker

# Install Python
sudo apt-get install -y python3.11 python3.11-venv python3-pip git

# Install opencode
curl -fsSL https://opencode.ai/install | bash
```

### 3. Deploy
```bash
git clone https://github.com/dark7462/VibeBench.git
cd VibeBench/backend
python3.11 -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# Create .env
nano .env
# Paste:
# VIBEBENCH_JWT_SECRET=<your openssl rand -hex 32 output>
# SQLITE_DB_PATH=/home/ubuntu/VibeBench/backend/vibebench.db
# CORS_ORIGINS=["https://your-app.vercel.app"]
```

### 4. Run as systemd Service
```bash
sudo nano /etc/systemd/system/vibebench.service
```
```ini
[Unit]
Description=VibeBench FastAPI
After=network.target docker.service

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/VibeBench/backend
Environment="PATH=/home/ubuntu/VibeBench/backend/venv/bin:/usr/local/bin:/usr/bin:/bin"
ExecStart=/home/ubuntu/VibeBench/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```
```bash
sudo systemctl daemon-reload
sudo systemctl enable vibebench
sudo systemctl start vibebench
sudo systemctl status vibebench
```

### 5. View Logs
```bash
sudo journalctl -u vibebench -f
```

### 6. Update After Code Push
```bash
cd /home/ubuntu/VibeBench && git pull origin main
cd backend && source venv/bin/activate && pip install -r requirements.txt
sudo systemctl restart vibebench
```

---

## 🌐 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VIBEBENCH_JWT_SECRET` | (hardcoded dev key) | **Change in production** — `openssl rand -hex 32` |
| `SQLITE_DB_PATH` | `backend/vibebench.db` | Path to SQLite file |
| `CORS_ORIGINS` | Localhost + `*.vercel.app` | JSON array of allowed origins |
| `VIBEBENCH_GOOGLE_CLIENT_ID` | (included) | Google OAuth client ID |
| `DEFAULT_ADMIN_PASSWORD` | `1234578` | Seed admin password |

---

## 🔗 Dependencies

| Package | Purpose |
|---------|---------|
| `fastapi` | Web framework |
| `uvicorn[standard]` | ASGI server |
| `pydantic-settings` | Type-safe env config |
| `sqlalchemy` | Async ORM |
| `aiosqlite` | Async SQLite driver |
| `pyjwt` | JWT tokens |
| `passlib[bcrypt]` | Password hashing |
| `sse-starlette` | Server-Sent Events |
| `httpx` | Async HTTP client (Google OAuth) |
| `python-multipart` | Form data parsing |
| `greenlet` | Required by SQLAlchemy async |
