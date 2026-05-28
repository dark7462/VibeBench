package com.vibebench.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.Map;

@Document(collection = "benchmark_runs")
public class BenchmarkJob {
    @Id
    private String jobId;
    private String modelName;
    private JobStatus status;
    private String prompt;
    private String referenceRepo;
    private Double score;
    private Instant createdAt;
    private Instant updatedAt;
    private Map<String, Double> metrics;
    private String logs;
    private String errorDetails;

    public BenchmarkJob() {}

    public BenchmarkJob(String jobId, String modelName, JobStatus status, String prompt, String referenceRepo, 
                        Double score, Instant createdAt, Instant updatedAt, Map<String, Double> metrics, 
                        String logs, String errorDetails) {
        this.jobId = jobId;
        this.modelName = modelName;
        this.status = status;
        this.prompt = prompt;
        this.referenceRepo = referenceRepo;
        this.score = score;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.metrics = metrics;
        this.logs = logs;
        this.errorDetails = errorDetails;
    }

    public String getJobId() {
        return jobId;
    }

    public void setJobId(String jobId) {
        this.jobId = jobId;
    }

    public String getModelName() {
        return modelName;
    }

    public void setModelName(String modelName) {
        this.modelName = modelName;
    }

    public JobStatus getStatus() {
        return status;
    }

    public void setStatus(JobStatus status) {
        this.status = status;
    }

    public String getPrompt() {
        return prompt;
    }

    public void setPrompt(String prompt) {
        this.prompt = prompt;
    }

    public String getReferenceRepo() {
        return referenceRepo;
    }

    public void setReferenceRepo(String referenceRepo) {
        this.referenceRepo = referenceRepo;
    }

    public Double getScore() {
        return score;
    }

    public void setScore(Double score) {
        this.score = score;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Map<String, Double> getMetrics() {
        return metrics;
    }

    public void setMetrics(Map<String, Double> metrics) {
        this.metrics = metrics;
    }

    public String getLogs() {
        return logs;
    }

    public void setLogs(String logs) {
        this.logs = logs;
    }

    public String getErrorDetails() {
        return errorDetails;
    }

    public void setErrorDetails(String errorDetails) {
        this.errorDetails = errorDetails;
    }
}
