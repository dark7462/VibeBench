# ⚡ VibeBench: AI Model Coding Benchmark

VibeBench is a premium, real-time AI Coding Model evaluation platform. It automates LLM generation, isolated docker sandbox execution, comprehensive self-healing loops, multi-dimensional metric scoring, and caches a top-10 leaderboard. 

Built using a modern **Java Spring Boot** backend, **MongoDB** for persistence, **Redis** for caching, and a **Glassmorphic Single-Page UI** for live visualization.

---

## 🚀 Key Features

*   **Isolated Docker Sandboxes**: Spawns isolated execution environments (`ubuntu:22.04`) to compile and test LLM-generated code safely without host exposure.
*   **Dynamic Language & Runtime Bootstrapping**: The sandbox boots with only Git, Curl, and Python, allowing the model itself to dynamically install any language runtime or compiler (Python, Node, Java, Go, Rust, etc.) on-demand at start time.
*   **5-Step Self-Healing Loop**: If generated unit tests fail, the orchestrator triggers an automatic self-healing cycle (up to 5 attempts) feeding the error logs back to the LLM to fix the codebase.
*   **Multi-Dimensional Scoring (Evaluator)**:
    *   **Functional Accuracy (35%)**: Actual unit test pass rates parsed from test suites.
    *   **Code Quality (20%)**: Line-based Jaccard similarity compared to a reference repository. If no reference is provided, it triggers an AI-driven strict self-evaluation using OpenCode.
    *   **Production Realism (15%)**: Scans codebases for standard enterprise architecture components (Controllers, Services, Auth, Configs).
    *   **Security (15%)**: Scans codebases for command execution vulnerabilities (`eval()`, `exec()`) and hardcoded credentials.
    *   **Cost & Latency (15%)**: Scores based on execution duration and whether a cloud API key was used or a free OpenCode model.
*   **Real-Time Log Streaming**: Streams sandbox installation, build, and test stdout logs to the frontend terminal panel in real time (throttled to 1-second MongoDB updates).
*   **Redis Caching**: Automatically recalculates and caches the top-10 leaderboard in Redis for instant client retrieval.

---

## 📂 Project Structure

```
├── pom.xml                       # Maven configuration (Java 21, Spring Boot 3.4.2)
├── Dockerfile.sandbox            # Optional Docker image blueprint to pre-bake runtimes
├── .env                          # Local credentials file (ignored by Git)
├── src/
│   └── main/
│       ├── java/com/vibebench/
│       │   ├── VibeBenchApplication.java       # Bootstrapping & .env loader
│       │   ├── model/                          # Domain objects (Job, Request, Status)
│       │   ├── repository/                     # MongoDB Job Repository
│       │   ├── controller/                     # REST API endpoints (runs, leaderboard, status)
│       │   └── service/                        # Business logic (Sandbox, Healing, Eval, Cache)
│       └── resources/
│           ├── application.yml                 # Spring Boot settings with environment variables
│           └── static/                         # Premium Frontend Assets (index.html, app.css, app.js)
```

---

## 🛠️ Setup & Running

### 1. Prerequisites
*   Java Development Kit (JDK) 21 or higher
*   Docker Desktop running locally

### 2. Configure Environment Variables
Create a `.env` file in the project's root folder and fill in your cloud database credentials:
```properties
# VibeBench Environment Variables
SPRING_MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/vibebench?appName=Cluster0
SPRING_REDIS_URL=redis://default:<password>@<host>:<port>
```
*Note: If no `.env` file is present, the application will automatically fall back to connecting to databases on `localhost:27017` and `redis://localhost:6379`.*

### 3. Build & Compile
Use Maven to clean and build the executable target class:
```bash
mvn clean compile
```

### 4. Running the Application
You can run the project directly from IntelliJ or via the Maven CLI:
```bash
mvn spring-boot:run
```
Once started, open **`http://localhost:8080`** in your browser to access the dashboard!

---

## ⚡ Optional: Sandbox Speed Optimization

By default, the sandbox container pulls `ubuntu:22.04` and installs basic tools. To speed up the benchmark runs by **1-2 minutes** per job, you can pre-bake a custom Docker image using `Dockerfile.sandbox`:

1.  **Build the custom sandbox image:**
    ```bash
    docker build -t vibebench-sandbox:latest -f Dockerfile.sandbox .
    ```
2.  **Update the runner configuration:**
    In [DockerSandboxService.java](file:///Users/dark/MyStuff/Code/Projects/OpenAiXOutSkill-Hackerthon/VibeBench/src/main/java/com/vibebench/service/DockerSandboxService.java), change the image name from `"ubuntu:22.04"` to `"vibebench-sandbox:latest"`.
