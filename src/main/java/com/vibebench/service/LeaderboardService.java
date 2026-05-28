package com.vibebench.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vibebench.model.BenchmarkJob;
import com.vibebench.model.JobStatus;
import com.vibebench.repository.BenchmarkJobRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class LeaderboardService {

    private static final Logger log = LoggerFactory.getLogger(LeaderboardService.class);

    private final BenchmarkJobRepository jobRepository;
    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;

    private static final String CACHE_KEY = "vibebench:leaderboard:top10";

    public LeaderboardService(BenchmarkJobRepository jobRepository, RedisTemplate<String, Object> redisTemplate, ObjectMapper objectMapper) {
        this.jobRepository = jobRepository;
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    public static class LeaderboardEntry {
        private String modelName;
        private Double score;
        private Long runCount;
        private Double avgLatencyMs;
        private Double avgCostUsd;

        public String getModelName() {
            return modelName;
        }

        public void setModelName(String modelName) {
            this.modelName = modelName;
        }

        public Double getScore() {
            return score;
        }

        public void setScore(Double score) {
            this.score = score;
        }

        public Long getRunCount() {
            return runCount;
        }

        public void setRunCount(Long runCount) {
            this.runCount = runCount;
        }

        public Double getAvgLatencyMs() {
            return avgLatencyMs;
        }

        public void setAvgLatencyMs(Double avgLatencyMs) {
            this.avgLatencyMs = avgLatencyMs;
        }

        public Double getAvgCostUsd() {
            return avgCostUsd;
        }

        public void setAvgCostUsd(Double avgCostUsd) {
            this.avgCostUsd = avgCostUsd;
        }
    }

    public List<LeaderboardEntry> getLeaderboard() {
        try {
            Object cached = redisTemplate.opsForValue().get(CACHE_KEY);
            if (cached != null) {
                log.info("Leaderboard cache hit");
                return objectMapper.convertValue(cached, new TypeReference<List<LeaderboardEntry>>() {});
            }
        } catch (Exception e) {
            log.error("Failed to read from Redis cache", e);
        }

        log.info("Leaderboard cache miss, recalculating...");
        List<LeaderboardEntry> list = computeLeaderboard();
        cacheLeaderboard(list);
        return list;
    }

    public void refreshCache() {
        log.info("Evicting and refreshing leaderboard cache...");
        List<LeaderboardEntry> list = computeLeaderboard();
        cacheLeaderboard(list);
    }

    private List<LeaderboardEntry> computeLeaderboard() {
        List<BenchmarkJob> completedJobs = jobRepository.findAll().stream()
                .filter(job -> job.getStatus() == JobStatus.COMPLETED && job.getScore() != null)
                .toList();

        Map<String, List<BenchmarkJob>> grouped = completedJobs.stream()
                .collect(Collectors.groupingBy(BenchmarkJob::getModelName));

        List<LeaderboardEntry> entries = new ArrayList<>();
        for (Map.Entry<String, List<BenchmarkJob>> entry : grouped.entrySet()) {
            String model = entry.getKey();
            List<BenchmarkJob> jobs = entry.getValue();

            double avgScore = jobs.stream().mapToDouble(BenchmarkJob::getScore).average().orElse(0.0);
            long count = jobs.size();

            double avgLatency = jobs.stream()
                    .filter(j -> j.getMetrics() != null && j.getMetrics().containsKey("latencyMs"))
                    .mapToDouble(j -> j.getMetrics().get("latencyMs"))
                    .average().orElse(0.0);

            double avgCost = jobs.stream()
                    .filter(j -> j.getMetrics() != null && j.getMetrics().containsKey("costUsd"))
                    .mapToDouble(j -> j.getMetrics().get("costUsd"))
                    .average().orElse(0.0);

            LeaderboardEntry le = new LeaderboardEntry();
            le.setModelName(model);
            le.setScore(Math.round(avgScore * 100.0) / 100.0);
            le.setRunCount(count);
            le.setAvgLatencyMs(Math.round(avgLatency * 100.0) / 100.0);
            le.setAvgCostUsd(Math.round(avgCost * 10000.0) / 10000.0);
            entries.add(le);
        }

        return entries.stream()
                .sorted((a, b) -> {
                    int scoreCompare = Double.compare(b.getScore(), a.getScore());
                    if (scoreCompare != 0) return scoreCompare;
                    return Double.compare(a.getAvgLatencyMs(), b.getAvgLatencyMs());
                })
                .limit(10)
                .collect(Collectors.toList());
    }

    private void cacheLeaderboard(List<LeaderboardEntry> list) {
        try {
            redisTemplate.opsForValue().set(CACHE_KEY, list);
            log.info("Leaderboard cached in Redis");
        } catch (Exception e) {
            log.error("Failed to write leaderboard cache to Redis", e);
        }
    }
}
