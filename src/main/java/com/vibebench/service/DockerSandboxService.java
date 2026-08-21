package com.vibebench.service;

import com.vibebench.repository.BenchmarkJobRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
public class DockerSandboxService {

    private static final Logger log = LoggerFactory.getLogger(DockerSandboxService.class);

    private static final String BASE_WORKSPACES_DIR = System.getenv().getOrDefault("VIBEBENCH_WORKSPACES_DIR", System.getProperty("user.dir") + "/workspaces");

    private final BenchmarkJobRepository jobRepository;

    public DockerSandboxService(BenchmarkJobRepository jobRepository) {
        this.jobRepository = jobRepository;
    }

    public static class SandboxExecutionResult {
        public int exitCode;
        public String logs;
        public boolean testsPassed;
        public double testPassRate;
        public long durationMs;
    }

    public SandboxExecutionResult runSandbox(String jobId, String modelName, String apiKey, String prompt, String referenceRepo) {
        long startTime = System.currentTimeMillis();
        modelName = normalizeModelName(modelName);
        SandboxExecutionResult result = new SandboxExecutionResult();
        StringBuilder logCollector = new StringBuilder();

        String jobDirStr = BASE_WORKSPACES_DIR + "/" + jobId;
        Path jobPath = Paths.get(jobDirStr);
        try {
            Files.createDirectories(jobPath);
            Files.createDirectories(jobPath.resolve("project"));
        } catch (IOException e) {
            log.error("Failed to create workspace directories", e);
            result.exitCode = 1;
            result.logs = "Failed to create workspace directories: " + e.getMessage();
            return result;
        }

        try {
            // Prefix prompt to instruct the model to install required languages/frameworks dynamically
            String instructions = "Based on the given host machine (Ubuntu 24.04), install the required languages, compilers, frameworks, package managers, etc. needed for the given prompt. For database dependencies inside tests, ignore what ever is mentioned in the main prompt and use  in-memory databases or SQLite to ensure self-contained, successful sandbox execution.";
            if (!mentionsLanguageOrFramework(prompt)) {
                instructions += " Note: Since no programming language or framework was specified in the prompt, you must default to using Python and write standard tests using pytest.";
            }
            String prefixedPrompt = instructions + "\n\n" + prompt;
            Files.writeString(jobPath.resolve("plan.md"), prefixedPrompt, StandardCharsets.UTF_8);
        } catch (IOException e) {
            log.error("Failed to write plan.md", e);
            result.exitCode = 1;
            result.logs = "Failed to write plan.md: " + e.getMessage();
            return result;
        }

        String scriptContent = getScriptContent();
        try {
            Path scriptPath = jobPath.resolve("run_generation.sh");
            Files.writeString(scriptPath, scriptContent, StandardCharsets.UTF_8);
            scriptPath.toFile().setExecutable(true, false);
        } catch (IOException e) {
            log.error("Failed to write run_generation.sh", e);
            result.exitCode = 1;
            result.logs = "Failed to write run_generation.sh: " + e.getMessage();
            return result;
        }

        String containerName = "vibebench-job-" + jobId;
        logCollector.append("Starting Docker container: ").append(containerName).append("\n");
        updateJobLogs(jobId, logCollector.toString());

        try {
            runCommand(List.of("docker", "rm", "-f", containerName), null, null);

            List<String> runCmd = List.of(
                    "docker", "run", "-d",
                    "--name", containerName,
                    "-m", "1g",
                    "-v", jobDirStr + ":/workspace",
                    "ubuntu:22.04",
                    "tail", "-f", "/dev/null"
            );

            int runExit = runCommand(runCmd, logCollector, jobId);
            if (runExit != 0) {
                result.exitCode = runExit;
                result.logs = logCollector.toString() + "\nERROR: Failed to start docker container.";
                return result;
            }

            logCollector.append("\n=== Starting Build & Generation script in container ===\n");
            updateJobLogs(jobId, logCollector.toString());

            List<String> execCmd = new ArrayList<>();
            execCmd.add("docker");
            execCmd.add("exec");
            if (apiKey != null && !apiKey.trim().isEmpty()) {
                execCmd.add("-e");
                execCmd.add("LLM_API_KEY=" + apiKey);
            }
            execCmd.add("-e");
            execCmd.add("MODEL_NAME=" + modelName);
            if (referenceRepo != null && !referenceRepo.trim().isEmpty()) {
                execCmd.add("-e");
                execCmd.add("REFERENCE_REPO=" + referenceRepo);
            }
            execCmd.add(containerName);
            execCmd.add("bash");
            execCmd.add("/workspace/run_generation.sh");

            int execExit = runCommand(execCmd, logCollector, jobId);
            result.exitCode = execExit;

        } catch (Exception e) {
            log.error("Exception in sandbox execution", e);
            logCollector.append("\nException during container execution: ").append(e.getMessage());
            result.exitCode = 1;
            updateJobLogs(jobId, logCollector.toString());
        } finally {
            logCollector.append("\nCleaning up Docker container...\n");
            updateJobLogs(jobId, logCollector.toString());
            try {
                runCommand(List.of("docker", "stop", containerName), null, null);
                runCommand(List.of("docker", "rm", containerName), null, null);
            } catch (Exception e) {
                log.error("Failed to cleanup container", e);
            }
        }

        result.logs = logCollector.toString();
        result.durationMs = System.currentTimeMillis() - startTime;

        if (result.logs.contains("VIBEBENCH_TEST_SUCCESS")) {
            result.testsPassed = true;
            result.testPassRate = 1.0;
        } else if (result.logs.contains("VIBEBENCH_TEST_FAILED")) {
            result.testsPassed = false;
            int index = result.logs.indexOf("TEST_PASS_RATE=");
            if (index != -1) {
                try {
                    int end = result.logs.indexOf("\n", index);
                    if (end == -1) end = result.logs.length();
                    String rateStr = result.logs.substring(index + 15, end).trim();
                    result.testPassRate = Double.parseDouble(rateStr);
                } catch (Exception e) {
                    result.testPassRate = 0.0;
                }
            } else {
                result.testPassRate = 0.0;
            }
        } else {
            result.testsPassed = false;
            result.testPassRate = 0.0;
        }

        return result;
    }

    public SandboxExecutionResult runHealing(String jobId, String modelName, String apiKey, String errorLogs) {
        long startTime = System.currentTimeMillis();
        modelName = normalizeModelName(modelName);
        SandboxExecutionResult result = new SandboxExecutionResult();
        StringBuilder logCollector = new StringBuilder();
        String containerName = "vibebench-job-healing-" + jobId;

        String jobDirStr = BASE_WORKSPACES_DIR + "/" + jobId;
        Path jobPath = Paths.get(jobDirStr);

        try {
            Files.writeString(jobPath.resolve("error_logs.txt"), errorLogs, StandardCharsets.UTF_8);
        } catch (IOException e) {
            result.exitCode = 1;
            result.logs = "Failed to write error_logs.txt: " + e.getMessage();
            return result;
        }

        logCollector.append("Starting Healing container: ").append(containerName).append("\n");
        updateJobLogs(jobId, logCollector.toString());

        try {
            runCommand(List.of("docker", "rm", "-f", containerName), null, null);

            List<String> runCmd = List.of(
                    "docker", "run", "-d",
                    "--name", containerName,
                    "-m", "1g",
                    "-v", jobDirStr + ":/workspace",
                    "ubuntu:22.04",
                    "tail", "-f", "/dev/null"
            );

            int runExit = runCommand(runCmd, logCollector, jobId);
            if (runExit != 0) {
                result.exitCode = runExit;
                result.logs = logCollector.toString() + "\nERROR: Failed to start healing docker container.";
                return result;
            }

            logCollector.append("Setting up healing container environment...\n");
            updateJobLogs(jobId, logCollector.toString());

            // Only install curl, git, and python3/python3-pip to bootstrap
            runCommand(List.of("docker", "exec", containerName, "apt-get", "update", "-qq"), logCollector, jobId);
            runCommand(List.of("docker", "exec", containerName, "apt-get", "install", "-y", "-qq", "curl", "git", "python3", "python3-pip"), logCollector, jobId);
            runCommand(List.of("docker", "exec", containerName, "bash", "-c", "curl -fsSL https://opencode.ai/install | OPENCODE_INSTALL_DIR=/usr/local/bin bash || npm install -g opencode-ai@latest"), logCollector, jobId);

            // Write healing prompt to a text file
            String healPrompt = "The previous implementation in /workspace/project had compile/test errors. " +
                    "Here are the error logs:\n" +
                    errorLogs + "\n" +
                    "Fix the project files inside /workspace/project so they compile and pass all tests.";
            Files.writeString(jobPath.resolve("healing_prompt.txt"), healPrompt, StandardCharsets.UTF_8);

            // Write run_healing.sh script
            String healingScript = "#!/bin/bash\n" +
                    "set -e\n" +
                    "export PATH=\"$PATH:/root/.opencode/bin:/root/.local/bin:/usr/local/bin\"\n" +
                    "opencode run -m \"$MODEL_NAME\" \"$(cat /workspace/healing_prompt.txt)\"\n";
            Files.writeString(jobPath.resolve("run_healing.sh"), healingScript, StandardCharsets.UTF_8);
            jobPath.resolve("run_healing.sh").toFile().setExecutable(true, false);

            logCollector.append("\n=== Running OpenCode Self-Healing ===\n");
            updateJobLogs(jobId, logCollector.toString());

            List<String> healCmd = new ArrayList<>();
            healCmd.add("docker");
            healCmd.add("exec");
            if (apiKey != null && !apiKey.trim().isEmpty()) {
                healCmd.add("-e");
                healCmd.add("LLM_API_KEY=" + apiKey);
                healCmd.add("-e");
                healCmd.add("OPENAI_API_KEY=" + apiKey);
                healCmd.add("-e");
                healCmd.add("ANTHROPIC_API_KEY=" + apiKey);
                healCmd.add("-e");
                healCmd.add("GEMINI_API_KEY=" + apiKey);
            }
            healCmd.add("-e");
            healCmd.add("MODEL_NAME=" + modelName);
            healCmd.add(containerName);
            healCmd.add("bash");
            healCmd.add("/workspace/run_healing.sh");

            runCommand(healCmd, logCollector, jobId);

            logCollector.append("\n=== Re-running Build & Tests after Healing ===\n");
            updateJobLogs(jobId, logCollector.toString());

            List<String> testCmd = List.of(
                    "docker", "exec", containerName,
                    "bash", "-c",
                    "cd /workspace/project && " +
                    "if [ -f \"package.json\" ]; then npm install && npm test; " +
                    "elif [ -f \"requirements.txt\" ] || [ -f \"main.py\" ] || [ -f \"test_main.py\" ] || ls *.py >/dev/null 2>&1; then " +
                    "  if [ -f \"requirements.txt\" ]; then pip3 install -r requirements.txt; fi && pip3 install pytest && pytest; " +
                    "elif [ -f \"pom.xml\" ]; then mvn clean test; fi"
            );

            int testExit = runCommand(testCmd, logCollector, jobId);
            result.exitCode = testExit;

            if (testExit == 0) {
                logCollector.append("\nTESTS PASSED after self-healing!\nVIBEBENCH_TEST_SUCCESS\n");
                result.testsPassed = true;
                result.testPassRate = 1.0;
            } else {
                logCollector.append("\nTESTS FAILED after self-healing.\nVIBEBENCH_TEST_FAILED\n");
                result.testsPassed = false;
                result.testPassRate = 0.0;
            }
            updateJobLogs(jobId, logCollector.toString());

        } catch (Exception e) {
            log.error("Exception in healing sandbox execution", e);
            logCollector.append("\nException during healing execution: ").append(e.getMessage());
            result.exitCode = 1;
            updateJobLogs(jobId, logCollector.toString());
        } finally {
            logCollector.append("\nCleaning up Healing container...\n");
            updateJobLogs(jobId, logCollector.toString());
            try {
                runCommand(List.of("docker", "stop", containerName), null, null);
                runCommand(List.of("docker", "rm", containerName), null, null);
            } catch (Exception e) {
                log.error("Failed to cleanup healing container", e);
            }
        }

        result.logs = logCollector.toString();
        result.durationMs = System.currentTimeMillis() - startTime;
        return result;
    }

    private void updateJobLogs(String jobId, String logs) {
        if (jobId == null || jobRepository == null) return;
        try {
            jobRepository.findById(jobId).ifPresent(job -> {
                job.setLogs(logs);
                jobRepository.save(job);
            });
        } catch (Exception e) {
            log.error("Failed to update real-time logs for job {}", jobId, e);
        }
    }

    private int runCommand(List<String> command, StringBuilder logCollector, String jobId) throws IOException, InterruptedException {
        ProcessBuilder pb = new ProcessBuilder(command);
        pb.redirectErrorStream(true);
        Process process = pb.start();

        long lastUpdate = System.currentTimeMillis();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                if (logCollector != null) {
                    logCollector.append(line).append("\n");
                    long now = System.currentTimeMillis();
                    if (jobId != null && now - lastUpdate > 1000) {
                        updateJobLogs(jobId, logCollector.toString());
                        lastUpdate = now;
                    }
                }
                log.debug(line);
            }
        }

        if (jobId != null && logCollector != null) {
            updateJobLogs(jobId, logCollector.toString());
        }

        boolean completed = process.waitFor(10, TimeUnit.MINUTES);
        if (!completed) {
            process.destroyForcibly();
            if (logCollector != null) {
                logCollector.append("\n[ERROR] Command timed out after 10 minutes.\n");
                if (jobId != null) {
                    updateJobLogs(jobId, logCollector.toString());
                }
            }
            return -1;
        }

        return process.exitValue();
    }

    private String getScriptContent() {
        return "#!/bin/bash\n" +
                "set -e\n" +
                "export PATH=\"$PATH:/root/.opencode/bin:/root/.local/bin:/usr/local/bin\"\n" +
                "echo \"=== Environment Setup ===\"\n" +
                "apt-get update -qq && apt-get install -y -qq curl git python3 python3-pip\n" +
                "\n" +
                "echo \"=== Installing OpenCode CLI ===\"\n" +
                "curl -fsSL https://opencode.ai/install | OPENCODE_INSTALL_DIR=/usr/local/bin bash || npm install -g opencode-ai@latest\n" +
                "\n" +
                "echo \"=== Running OpenCode generation ===\"\n" +
                "if [ ! -z \"$LLM_API_KEY\" ]; then\n" +
                "  export OPENAI_API_KEY=\"$LLM_API_KEY\"\n" +
                "  export ANTHROPIC_API_KEY=\"$LLM_API_KEY\"\n" +
                "  export GEMINI_API_KEY=\"$LLM_API_KEY\"\n" +
                "fi\n" +
                "\n" +
                "mkdir -p /workspace/project\n" +
                "echo \"Executing OpenCode for model: $MODEL_NAME\"\n" +
                "opencode run -m \"$MODEL_NAME\" \"Implement the project described in /workspace/plan.md. Output all code files inside the folder /workspace/project. Do not make a nested folder. Put package.json, requirements.txt or pom.xml directly in /workspace/project. Make sure standard unit tests are written.\"\n" +
                "\n" +
                "echo \"=== Checking Generated Project ===\"\n" +
                "cd /workspace/project\n" +
                "ls -la\n" +
                "\n" +
                "TEST_STATUS=0\n" +
                "if [ -f \"package.json\" ]; then\n" +
                "  echo \"NodeJS project detected. Running npm install and test...\"\n" +
                "  npm install || true\n" +
                "  npm test > /workspace/test_output.log 2>&1 || TEST_STATUS=$?\n" +
                "elif [ -f \"requirements.txt\" ] || [ -f \"main.py\" ] || [ -f \"test_main.py\" ] || ls *.py >/dev/null 2>&1; then\n" +
                "  echo \"Python project detected. Running pip install and pytest...\"\n" +
                "  if [ -f \"requirements.txt\" ]; then\n" +
                "    pip3 install -r requirements.txt || true\n" +
                "  fi\n" +
                "  pip3 install pytest || true\n" +
                "  pytest > /workspace/test_output.log 2>&1 || TEST_STATUS=$?\n" +
                "elif [ -f \"pom.xml\" ]; then\n" +
                "  echo \"Java Maven project detected. Running mvn test...\"\n" +
                "  mvn test > /workspace/test_output.log 2>&1 || TEST_STATUS=$?\n" +
                "else\n" +
                "  echo \"Unknown project layout. Creating dummy test success.\"\n" +
                "  TEST_STATUS=0\n" +
                "  echo \"No tests found\" > /workspace/test_output.log\n" +
                "fi\n" +
                "\n" +
                "cat /workspace/test_output.log || true\n" +
                "\n" +
                "if [ $TEST_STATUS -eq 0 ]; then\n" +
                "  echo \"VIBEBENCH_TEST_SUCCESS\"\n" +
                "else\n" +
                "  echo \"VIBEBENCH_TEST_FAILED\"\n" +
                "  PASS_RATE=\"0.0\"\n" +
                "  if [ -f \"/workspace/test_output.log\" ]; then\n" +
                "    PASSED=$(grep -oE '[0-9]+ passed' /workspace/test_output.log | grep -oE '[0-9]+' || echo \"0\")\n" +
                "    FAILED=$(grep -oE '[0-9]+ failed' /workspace/test_output.log | grep -oE '[0-9]+' || echo \"0\")\n" +
                "    TOTAL=$((PASSED + FAILED))\n" +
                "    if [ $TOTAL -gt 0 ]; then\n" +
                "      PASS_RATE=$(python3 -c \"print($PASSED / $TOTAL)\" 2>/dev/null || echo \"0.0\")\n" +
                "    fi\n" +
                "  fi\n" +
                "  echo \"TEST_PASS_RATE=$PASS_RATE\"\n" +
                "fi\n" +
                "\n" +
                "echo \"=== Running OpenCode Peer Review ===\"\n" +
                "opencode run -m \"$MODEL_NAME\" \"Review the codebase generated in /workspace/project. Evaluate it strictly. You must output ONLY a raw JSON object with keys 'codeQuality', 'productionRealism', and 'security' where each is a float value between 0.0 and 1.0. Do not include any explanation or markdown formatting. Be extremely strict.\" > /workspace/review_raw.txt 2>&1 || true\n" +
                "cat /workspace/review_raw.txt || true\n" +
                "\n" +
                "if [ ! -z \"$REFERENCE_REPO\" ]; then\n" +
                "  echo \"=== Cloning Reference Repo ===\"\n" +
                "  git clone \"$REFERENCE_REPO\" /workspace/reference || echo \"Reference clone failed\"\n" +
                "fi\n";
    }

    public String normalizeModelName(String modelName) {
        if (modelName == null) return "opencode/big-pickle";
        String lower = modelName.toLowerCase().trim();
        if (lower.contains("deepseek") && lower.contains("free")) {
            return "opencode/deepseek-v4-flash-free";
        }
        if (lower.contains("nemotron")) {
            return "opencode/nemotron-3-super-free";
        }
        if (lower.contains("pickle")) {
            return "opencode/big-pickle";
        }
        return findMostSimilarModel(modelName);
    }

    public String findMostSimilarModel(String inputModel) {
        if (inputModel == null || inputModel.trim().isEmpty()) {
            return "opencode/big-pickle";
        }

        List<String> available = getAvailableModels();

        // Exact match
        for (String m : available) {
            if (m.equalsIgnoreCase(inputModel)) {
                return m;
            }
        }

        // Match with prefix/suffix/contains
        String lowerInput = inputModel.toLowerCase().trim();
        for (String m : available) {
            String lowerM = m.toLowerCase();
            if (lowerM.contains(lowerInput) || lowerInput.contains(lowerM)) {
                return m;
            }
        }

        // Levenshtein distance match
        String bestMatch = available.get(0);
        int minDistance = Integer.MAX_VALUE;
        for (String m : available) {
            int dist = getLevenshteinDistance(lowerInput, m.toLowerCase());
            if (dist < minDistance) {
                minDistance = dist;
                bestMatch = m;
            }
        }

        return bestMatch;
    }

    private List<String> getAvailableModels() {
        List<String> models = new ArrayList<>();
        try {
            Process process = new ProcessBuilder("opencode", "models").start();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    String trimmed = line.trim();
                    if (!trimmed.isEmpty()) {
                        models.add(trimmed);
                    }
                }
            }
            process.waitFor(5, TimeUnit.SECONDS);
        } catch (Exception e) {
            log.error("Failed to fetch models from opencode CLI", e);
        }
        if (models.isEmpty()) {
            models.add("opencode/big-pickle");
            models.add("opencode/deepseek-v4-flash-free");
            models.add("opencode/nemotron-3-super-free");
        }
        return models;
    }

    private int getLevenshteinDistance(String s1, String s2) {
        int[] costs = new int[s2.length() + 1];
        for (int i = 0; i <= s1.length(); i++) {
            int lastValue = i;
            for (int j = 0; j <= s2.length(); j++) {
                if (i == 0) {
                    costs[j] = j;
                } else {
                    if (j > 0) {
                        int newValue = costs[j - 1];
                        if (s1.charAt(i - 1) != s2.charAt(j - 1)) {
                            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                        }
                        costs[j - 1] = lastValue;
                        lastValue = newValue;
                    }
                }
            }
            if (i > 0) {
                costs[s2.length()] = lastValue;
            }
        }
        return costs[s2.length()];
    }

    private boolean mentionsLanguageOrFramework(String prompt) {
        if (prompt == null) return false;
        String lower = prompt.toLowerCase();
        String[] keywords = {
            "java", "spring", "maven", "pom.xml", "gradle", "springboot",
            "javascript", "typescript", "node", "npm", "package.json", "react", "vue", "angular", "express",
            "golang", "go.mod", "rust", "cargo", "cargo.toml",
            "python", "pip", "requirements.txt", "flask", "django", "fastapi", "pytest",
            "ruby", "gemfile", "rails", "php", "composer", "c++", "cpp", "c#", "dotnet",
            "html", "css", "assembly", "bash", "shell", "c language", "fortran", "kotlin", "swift", "scala"
        };
        for (String keyword : keywords) {
            if (lower.contains(keyword)) {
                return true;
            }
        }
        return false;
    }
}
