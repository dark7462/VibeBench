package com.vibebench.service;

import com.vibebench.model.BenchmarkJob;
import com.vibebench.model.BenchmarkRequest;
import com.vibebench.model.JobStatus;
import com.vibebench.repository.BenchmarkJobRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Service
public class BenchmarkOrchestrator {

    private static final Logger log = LoggerFactory.getLogger(BenchmarkOrchestrator.class);

    private final BenchmarkJobRepository jobRepository;
    private final DockerSandboxService sandboxService;
    private final EvaluatorService evaluatorService;
    private final LeaderboardService leaderboardService;

    public BenchmarkOrchestrator(BenchmarkJobRepository jobRepository, 
                                 DockerSandboxService sandboxService, 
                                 EvaluatorService evaluatorService, 
                                 LeaderboardService leaderboardService) {
        this.jobRepository = jobRepository;
        this.sandboxService = sandboxService;
        this.evaluatorService = evaluatorService;
        this.leaderboardService = leaderboardService;
    }

    @Async("benchmarkTaskExecutor")
    public void executeBenchmark(String jobId, BenchmarkRequest request) {
        log.info("Starting asynchronous benchmark job {} for model {}", jobId, request.getModelName());

        BenchmarkJob job = jobRepository.findById(jobId).orElse(null);
        if (job == null) {
            log.error("Job {} not found in database", jobId);
            return;
        }

        job.setStatus(JobStatus.RUNNING);
        job.setUpdatedAt(Instant.now());
        jobRepository.save(job);

        try {
            long startTime = System.currentTimeMillis();
            boolean isFreeModel = request.getApikey() == null || request.getApikey().trim().isEmpty()
                    || request.getModelName().toLowerCase().contains("free");

            int attempt = 1;
            DockerSandboxService.SandboxExecutionResult sandboxResult = sandboxService.runSandbox(
                    jobId,
                    request.getModelName(),
                    request.getApikey(),
                    request.getPrompt(),
                    request.getReferenceRepo()
            );

            while (!sandboxResult.testsPassed && attempt < 5) {
                log.info("Job {} tests failed (attempt {}/5). Starting healing runner...", jobId, attempt);
                sandboxResult = sandboxService.runHealing(
                        jobId,
                        request.getModelName(),
                        request.getApikey(),
                        sandboxResult.logs
                );
                attempt++;
            }

            long totalDuration = System.currentTimeMillis() - startTime;

            EvaluatorService.Evaluation eval = evaluatorService.evaluate(
                    jobId,
                    sandboxResult.testPassRate,
                    totalDuration,
                    isFreeModel
            );

            Map<String, Double> metrics = new HashMap<>();
            metrics.put("functionalAccuracy", eval.functionalAccuracy);
            metrics.put("codeQuality", eval.codeQuality);
            metrics.put("productionRealism", eval.productionRealism);
            metrics.put("security", eval.security);
            metrics.put("costLatency", eval.costLatency);
            metrics.put("costUsd", eval.costUsd);
            metrics.put("latencyMs", (double) totalDuration);

            job.setStatus(JobStatus.COMPLETED);
            job.setScore(eval.overallScore);
            job.setMetrics(metrics);
            job.setLogs(sandboxResult.logs);
            job.setUpdatedAt(Instant.now());
            jobRepository.save(job);

            log.info("Job {} completed successfully with score {}", jobId, eval.overallScore);

            leaderboardService.refreshCache();

        } catch (Exception e) {
            log.error("Error executing benchmark job {}", jobId, e);
            job.setStatus(JobStatus.FAILED);
            job.setErrorDetails(e.getMessage());
            job.setUpdatedAt(Instant.now());
            jobRepository.save(job);
        }
    }
}
