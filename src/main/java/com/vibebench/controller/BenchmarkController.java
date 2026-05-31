package com.vibebench.controller;

import com.vibebench.model.BenchmarkJob;
import com.vibebench.model.BenchmarkRequest;
import com.vibebench.model.JobStatus;
import com.vibebench.repository.BenchmarkJobRepository;
import com.vibebench.service.BenchmarkOrchestrator;
import com.vibebench.service.LeaderboardService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@CrossOrigin(origins = "*")
public class BenchmarkController {

    private static final Logger log = LoggerFactory.getLogger(BenchmarkController.class);

    private final BenchmarkJobRepository jobRepository;
    private final BenchmarkOrchestrator orchestrator;
    private final LeaderboardService leaderboardService;

    public BenchmarkController(BenchmarkJobRepository jobRepository,
                               BenchmarkOrchestrator orchestrator,
                               LeaderboardService leaderboardService) {
        this.jobRepository = jobRepository;
        this.orchestrator = orchestrator;
        this.leaderboardService = leaderboardService;
    }

    @PostMapping("/model")
    public ResponseEntity<Map<String, String>> triggerBenchmark(@RequestBody BenchmarkRequest request) {
        log.info("Received request to trigger benchmark for model: {}", request.getModelName());

        if (request.getModelName() == null || request.getModelName().trim().isEmpty()) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "model_name is required");
            return ResponseEntity.badRequest().body(err);
        }

        if (request.getPrompt() == null || request.getPrompt().trim().isEmpty()) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "prompt/plan.md is required");
            return ResponseEntity.badRequest().body(err);
        }

        String jobId = UUID.randomUUID().toString();

        BenchmarkJob job = new BenchmarkJob();
        job.setJobId(jobId);
        job.setModelName(request.getModelName());
        job.setPrompt(request.getPrompt());
        job.setReferenceRepo(request.getReferenceRepo());
        job.setStatus(JobStatus.QUEUED);
        job.setCreatedAt(Instant.now());
        job.setUpdatedAt(Instant.now());
        jobRepository.save(job);

        orchestrator.executeBenchmark(jobId, request);

        Map<String, String> response = new HashMap<>();
        response.put("job_id", jobId);
        response.put("status", "accepted");
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(response);
    }

    @GetMapping("/leaderboard")
    public ResponseEntity<List<LeaderboardService.LeaderboardEntry>> getLeaderboard() {
        return ResponseEntity.ok(leaderboardService.getLeaderboard());
    }

    @GetMapping("/model")
    public ResponseEntity<?> getModels(@RequestParam(required = false) String name) {
        if (name != null && !name.trim().isEmpty()) {
            List<BenchmarkJob> runs = jobRepository.findByModelName(name);
            return ResponseEntity.ok(runs);
        }

        List<BenchmarkJob> allJobs = jobRepository.findAll();
        return ResponseEntity.ok(allJobs);
    }

    @GetMapping("/job/{jobId}")
    public ResponseEntity<?> getJobStatus(@PathVariable String jobId) {
        BenchmarkJob job = jobRepository.findById(jobId).orElse(null);
        if (job == null) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Job not found");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(err);
        }
        return ResponseEntity.ok(job);
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        List<BenchmarkJob> allJobs = jobRepository.findAll();
        long totalRuns = allJobs.size();

        String topModel = "N/A";
        List<LeaderboardService.LeaderboardEntry> leaderboard = leaderboardService.getLeaderboard();
        if (leaderboard != null && !leaderboard.isEmpty()) {
            topModel = leaderboard.get(0).getModelName();
        }

        List<BenchmarkJob> completedJobs = allJobs.stream()
                .filter(j -> j.getStatus() == com.vibebench.model.JobStatus.COMPLETED && j.getMetrics() != null)
                .toList();

        double avgLatencyMs = 0.0;
        double totalCostUsd = 0.0;

        if (!completedJobs.isEmpty()) {
            double totalLatency = completedJobs.stream()
                    .mapToDouble(j -> j.getMetrics().getOrDefault("latencyMs", 0.0))
                    .sum();
            avgLatencyMs = totalLatency / completedJobs.size();

            totalCostUsd = completedJobs.stream()
                    .mapToDouble(j -> j.getMetrics().getOrDefault("costUsd", 0.0))
                    .sum();
        }

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalRuns", totalRuns);
        stats.put("topModel", topModel);
        stats.put("avgLatencyMs", avgLatencyMs);
        stats.put("totalCostUsd", totalCostUsd);

        return ResponseEntity.ok(stats);
    }
}
