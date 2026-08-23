# ⚡ VibeBench: AI Model Coding Benchmark Platform

VibeBench is a real-time AI Coding Model evaluation platform. It automates LLM code generation, isolated Docker sandbox execution, automated self-healing feedback loops, multi-dimensional metric scoring, and live leaderboard rankings.

Built with an ultra-lightweight **Python FastAPI** backend, **SQLite** database (zero external DB installation needed), and a **Modern React + Vite** frontend.

---

## 🚀 Key Features

*   **Isolated Docker Sandboxes**: Spawns isolated execution environments (`ubuntu:22.04`) to compile and test LLM-generated code safely without host exposure.
*   **Ephemeral Workspace Lifecycle**: Transient workspace directories are generated in temporary storage per job and automatically cleaned up from disk upon completion.
*   **5-Step Self-Healing Loop**: If generated unit tests fail, the orchestrator triggers an automatic self-healing cycle feeding the error logs back to the LLM to fix the codebase.
*   **Multi-Dimensional Scoring (Evaluator)**:
    *   **Functional Accuracy (35%)**: Actual unit test pass rates parsed from test suites.
    *   **Code Quality (20%)**: Line-based Jaccard similarity compared to reference repo or structural heuristics.
    *   **Production Realism (15%)**: Scans codebases for standard enterprise architecture components (Controllers, Services, Auth, Configs).
    *   **Security (15%)**: Scans codebases for command execution vulnerabilities (`eval()`, `exec()`) and hardcoded credentials.
    *   **Cost & Latency (15%)**: Scores based on execution duration and whether a cloud API key was used or a free model.
*   **Zero-Config SQLite Storage**: Embedded database created automatically in `backend/vibebench.db`. Runs identically on Mac, Linux, and Cloud instances without MongoDB or Redis daemons.
*   **Real-Time Log Streaming**: Live SSE stream `/api/v1/job/{jobId}/stream` and polled telemetry `/api/v1/job/{jobId}` for instant terminal inspection.

---

## 📂 Project Structure

```
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app initialization, CORS, healthcheck, lifespan
│   │   ├── config.py            # Pydantic Settings loading environment & SQLite configuration
│   │   ├── database.py          # SQLAlchemy async SQLite engine & session manager
│   │   ├── models/              # User & Benchmark database models and Pydantic schemas
│   │   ├── auth/                # JWT handler, password hashing, and Google OAuth
│   │   ├── routers/             # API routes: /healthcheck, /auth, /model, /leaderboard, /job
│   │   └── services/            # Docker Sandbox, Self-Healing, Evaluator, Leaderboard, Orchestrator
│   ├── requirements.txt         # Python dependencies (FastAPI, SQLAlchemy, aiosqlite, PyJWT, etc.)
│   └── Dockerfile               # Production container blueprint
├── frontend/                    # Modern React + Vite UI (Dashboard, Leaderboard, Terminal modal)
├── docker-compose.yml           # Multi-container deployment config
├── .env                         # Environment credentials
└── VibeBench_SystemDesign.png   # Architecture diagram
```

---

## 🛠️ Quick Start (Local Development)

### 1. Prerequisites
*   Python 3.10+
*   Node.js 18+ & npm
*   Docker Desktop running locally

### 2. Run Backend (FastAPI)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
* Interactive Swagger API Docs: **`http://localhost:8000/docs`**
* Health Check Endpoint: **`http://localhost:8000/api/v1/healthcheck`**

### 3. Run Frontend (React + Vite)
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
Open **`http://localhost:5173`** in your browser!

---

## 🔑 Default Credentials

The application automatically seeds a default administrator account on first boot:

| Role | Username / Email | Password |
| :--- | :--- | :--- |
| **System Admin** | `admin` (or `admin@vibebench.ai`) | `1234578` |

---

## 🌐 API Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/healthcheck` | System status, SQLite connectivity, Docker readiness |
| `POST` | `/api/v1/auth/login` | Authenticates username/email & password; returns JWT |
| `POST` | `/api/v1/auth/register` | Registers new user account |
| `POST` | `/api/v1/auth/google` | Google OAuth One-Tap sign in |
| `POST` | `/api/v1/model` | Enqueues a new benchmark job in Docker sandbox |
| `GET` | `/api/v1/leaderboard` | Top 10 evaluated models ordered by score |
| `GET` | `/api/v1/model` | Lists all past benchmark runs |
| `GET` | `/api/v1/job/{jobId}` | Detailed status, scores, and execution logs for a job |
| `GET` | `/api/v1/job/{jobId}/stream` | Server-Sent Events (SSE) live log stream |
| `GET` | `/api/v1/stats` | Global platform metrics and summary |
