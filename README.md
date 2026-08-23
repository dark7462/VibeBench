# ⚡ VibeBench

**Real-time AI Coding Model Evaluation Platform**

VibeBench benchmarks AI coding models by giving them real programming tasks, executing their output in isolated Docker sandboxes, running actual unit tests, and scoring them across five dimensions — all in real time with a live terminal stream.

---

## 📐 Original System Design

This is the hand-drawn design sketch that started it all:

![Original System Design](./VibeBench_SystemDesign.png)

---

## 🏗️ Current Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          USER / BROWSER                             │
│              React + Vite SPA  (deployed on Vercel)                 │
└───────────────────────────┬─────────────────────────────────────────┘
                            │  HTTPS  (VITE_API_BASE env var)
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   FastAPI Backend  (AWS EC2 t3.medium)              │
│                                                                     │
│  POST /api/v1/model          → Submit job (202 Accepted + job_id)  │
│  GET  /api/v1/job/{id}/stream → SSE real-time log stream           │
│  GET  /api/v1/job/{id}       → Job status + scores + logs          │
│  GET  /api/v1/leaderboard    → Top 10 models by score              │
│  GET  /api/v1/models         → Live free models from opencode CLI  │
│  GET  /api/v1/healthcheck    → System health probe                 │
│                                                                     │
│          ┌──────────────────────────────┐                          │
│          │   DOCKER SANDBOX             │                          │
│          │   ubuntu:22.04               │                          │
│          │   1. Write plan.md           │                          │
│          │   2. Run opencode CLI        │                          │
│          │   3. Count code files ←gate  │                          │
│          │   4. Run pytest/npm test     │                          │
│          │   5. Stream stdout via SSE   │                          │
│          │   6. Destroy container       │                          │
│          │   7. Wipe temp dir           │                          │
│          └──────────────┬───────────────┘                          │
│                         │                                           │
│          ┌──────────────▼───────────────┐                          │
│          │   EVALUATOR SERVICE          │                          │
│          │   Functional Accuracy  40%   │                          │
│          │   Code Quality         20%   │                          │
│          │   Production Realism   15%   │                          │
│          │   Security             15%   │                          │
│          │   Cost + Latency       10%   │                          │
│          │   files==0 → score=0 ←gate   │                          │
│          └──────────────┬───────────────┘                          │
│                         │                                           │
│          ┌──────────────▼───────────────┐                          │
│          │   SQLite Database            │                          │
│          │   benchmark_jobs / users     │                          │
│          └──────────────────────────────┘                          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
VibeBench/
├── backend/              → Python FastAPI backend (see backend/README.md)
├── frontend/             → React 19 + Vite SPA (see frontend/README.md)
├── docker-compose.yml    → Local full-stack dev setup
├── .env                  → Credentials (git-ignored)
├── VibeBench_SystemDesign.png
└── README.md             → This file
```

---

## 🚀 Quick Start

```bash
# Backend
cd backend && python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

# Frontend (new terminal)
cd frontend && npm install
echo "VITE_API_BASE=http://localhost:8000" > .env.local
npm run dev
```

→ App: http://localhost:5173  
→ API Docs: http://localhost:8000/docs

---

## 🔑 Default Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `1234578` |

---

## 🌐 API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/v1/healthcheck` | No | System health + Docker probe |
| `POST` | `/api/v1/auth/login` | No | Returns JWT token |
| `POST` | `/api/v1/auth/register` | No | Create account |
| `GET` | `/api/v1/models` | JWT | Live free models from `opencode` CLI |
| `POST` | `/api/v1/model` | JWT | Submit benchmark job |
| `GET` | `/api/v1/model` | JWT | List all past runs |
| `GET` | `/api/v1/job/{id}` | JWT | Job status, scores, logs |
| `GET` | `/api/v1/job/{id}/stream` | JWT | SSE live log stream |
| `GET` | `/api/v1/leaderboard` | No | Top 10 models by score |
| `GET` | `/api/v1/stats` | No | Global platform stats |

---

## 🚢 Production Deployment

- **Frontend**: Vercel — set env var `VITE_API_BASE=http://YOUR_EC2_IP:8000`, redeploy
- **Backend**: AWS EC2 (Ubuntu t3.medium) — see [backend/README.md](./backend/README.md) for the full guide

---

## 📚 Engineering Decisions & Lessons Learned

### 🐳 Docker Containers vs Full VMs

**The Problem**: AI-generated code must NEVER run on the host machine. A buggy model could `rm -rf /`, exhaust RAM, or fork-bomb the server. We needed isolation.

**What we evaluated:**

| Option | Boot Time | Isolation | Complexity | Decision |
|--------|-----------|-----------|------------|----------|
| Run on host directly | 0ms | ❌ None | Low | ❌ Security catastrophe |
| Full VM per job (QEMU) | 30-60s | ✅ Maximum | High | ❌ Too slow |
| Docker containers | 1-2s | ✅ Good | Low | ✅ **Chosen** |
| AWS Lambda | 0ms | ✅ Good | Low | ❌ Can't spawn Docker from inside Lambda |
| AWS Fargate | 20-30s | ✅ Good | High | ❌ Docker-in-Docker needs `--privileged` (risky) |

**Why Docker won**: 1-2s startup, trivial cleanup with `docker rm -f`, easy resource limits (`-m 1536m --cpus 2`), and the Docker socket can be shared via a simple volume mount (`/var/run/docker.sock:/var/run/docker.sock`).

**Lesson**: Lambda and Fargate sound appealing but both block the core use case — spawning containers from within the backend. EC2 is the only AWS option that gives you direct Docker daemon access without complex workarounds.

---

### 🤯 The Fake 91-Point Score Bug

**What happened**: The bash runner script had a fallback `else` branch for unknown project types that printed `"All synthetic verification tests passed"` and exited 0. When `opencode` crashed before writing any files, this branch triggered and the evaluator scored the empty run as 91/100.

**Root cause**: Trusting exit code instead of verifying actual file output.

**The triple-gate fix we built:**
1. `FILE_COUNT` check in bash — `find /workspace/project -type f | wc -l` must be > 0 or `exit 1`
2. `_count_generated_files()` in Python as an independent second check  
3. Hard gate in the evaluator: `if files_generated == 0: return score=0.0` — no bypass possible

**Lesson**: Never trust a subprocess's exit code alone. Verify the physical artifact it was supposed to produce.

---

### 📡 SSE vs WebSockets for Live Log Streaming

**The requirement**: Benchmark jobs take 2-8 minutes. Users need to see logs in real time.

| Option | Complexity | Works Through nginx | Decision |
|--------|-----------|---------------------|----------|
| Polling every 2s | Low | ✅ | Acceptable but laggy |
| WebSockets | High | ❌ Needs sticky sessions | Too complex |
| SSE (Server-Sent Events) | Low | ✅ With config | ✅ **Chosen** |

SSE won because it's one-directional (server → client, which is all we needed), uses standard HTTP with no protocol upgrade, and the browser's `EventSource` API handles reconnection automatically.

**The nginx gotcha**: nginx buffers proxy responses by default — this completely breaks SSE. You must add `proxy_buffering off;` and `proxy_cache off;` to the nginx config.

---

### 🗄️ Ditching MongoDB + Redis for SQLite

**Original stack**: Java Spring Boot + MongoDB Atlas + Redis Cloud

**Why we switched to SQLite:**

1. **Operational complexity**: MongoDB Atlas and Redis Cloud both needed separate accounts, connection strings, IP whitelisting, and cloud billing.
2. **Connection pool exhaustion**: With async FastAPI + MongoDB (Motor), concurrent benchmark jobs kept hitting pool limits. Debugging async connection lifecycle across three external services was painful.
3. **SQLite is enough**: Our write pattern is simple — one row per benchmark job, updated ~5 times during execution. SQLite in WAL mode handles this fine with zero setup.
4. **Zero deployment friction**: SQLite creates its `.db` file on first boot. Works on Mac, Linux, EC2 — no daemon, no port, no credentials.

**The one real trade-off**: SQLite doesn't scale horizontally across multiple servers. If VibeBench ever needed to run on 5 EC2 instances, we'd migrate to PostgreSQL. For now, the simplicity wins.

---

### 🔄 Java Spring Boot → Python FastAPI Migration

**Why Java originally**: Spring Boot is a mature ecosystem with great tooling.

**Why we migrated:**

1. **Async subprocess management**: Spawning Docker containers and streaming their stdout in Java requires `ProcessBuilder` + thread pools + `CompletableFuture` chains. In Python, `asyncio.create_subprocess_exec` with async stdout reading is ~15 clean lines.
2. **FastAPI background tasks**: `asyncio.create_task()` lets us return `202 Accepted` immediately and run the benchmark job in the background — no separate Celery/RQ worker queue needed.
3. **SSE streaming**: `sse-starlette` adds SSE in 5 lines. Spring Boot's `SseEmitter` required thread executors, timeout management, and careful error handling.
4. **opencode integration**: Calling CLI tools from Python via `asyncio.create_subprocess_exec` is trivial vs Java's shell-escape-prone `ProcessBuilder`.

**Lesson**: Match your language to your I/O pattern. Async Python is a natural fit for "orchestrate subprocesses and stream their output over HTTP."

---

### ⚡ ANSI Escape Code Leakage

**The Problem**: Docker and opencode output ANSI color codes (`\x1b[32m`, `\x1b[0m`) for terminal formatting. Stored raw in SQLite and sent to the browser, the frontend showed `←[0m←[32m✓←[0m` instead of readable text.

**The Fix**: Strip at the source, not at the display layer:
```python
ANSI_ESCAPE = re.compile(r'\x1b\[[0-9;]*[mGKHF]|\x1b\(B|\r')
strip_ansi = lambda text: ANSI_ESCAPE.sub('', text)
```
Called on every log line before it's stored in the DB — so every consumer of the API gets clean text.

---

### 🔁 White Screen on Tab Switch

**The Problem**: Every time the user navigated back to the landing page, the loading screen replayed (1.5s white flash). The Navbar used plain `<a href="/dashboard">` which caused full page reloads.

**Two fixes:**
1. `sessionStorage.getItem('vb_loaded')` — loading screen only shows once per browser session
2. React Router `<Link to="/dashboard">` instead of `<a href>` — client-side navigation with zero reload

---

## 🛠️ Full Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend Framework | React | 19 |
| Frontend Build | Vite | 8 |
| Styling | TailwindCSS | 4 |
| Animation | Framer Motion | 13 |
| 3D Scene | Three.js | 0.185 |
| Routing | React Router | 7 |
| Backend | FastAPI | 0.115 |
| ASGI Server | Uvicorn | 0.32 |
| DB ORM | SQLAlchemy (async) | 2.0 |
| Database | SQLite + aiosqlite | — |
| Auth | PyJWT + bcrypt | — |
| SSE | sse-starlette | 2.1 |
| Sandbox | Docker ubuntu:22.04 | — |
| AI Runner | opencode CLI | latest |
| Frontend Deploy | Vercel | — |
| Backend Deploy | AWS EC2 t3.medium | Ubuntu 24.04 |
