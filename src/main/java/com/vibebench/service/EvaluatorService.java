package com.vibebench.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.*;
import java.util.*;
import java.util.stream.Stream;

@Service
public class EvaluatorService {

    private static final Logger log = LoggerFactory.getLogger(EvaluatorService.class);

    private static final String BASE_WORKSPACES_DIR = "/Users/dark/MyStuff/Code/Projects/OpenAiXOutSkill-Hackerthon/VibeBench/workspaces";

    public static class Evaluation {
        public double overallScore;
        public double functionalAccuracy;
        public double codeQuality;
        public double productionRealism;
        public double security;
        public double costLatency;
        public double costUsd;
    }

    public Evaluation evaluate(String jobId, double testPassRate, long durationMs, boolean isFreeModel) {
        Evaluation eval = new Evaluation();

        Path jobPath = Paths.get(BASE_WORKSPACES_DIR, jobId);
        Path projectPath = jobPath.resolve("project");
        Path referencePath = jobPath.resolve("reference");

        eval.functionalAccuracy = testPassRate;

        boolean hasReference = Files.exists(referencePath) && Files.isDirectory(referencePath);

        if (!hasReference) {
            // Attempt to parse peer review scores from OpenCode review log
            Map<String, Double> peerReview = parsePeerReview(jobPath.resolve("review_raw.txt"));
            if (peerReview != null) {
                log.info("Successfully parsed strict peer review scores from OpenCode for job {}", jobId);
                eval.codeQuality = peerReview.getOrDefault("codeQuality", 0.5);
                eval.productionRealism = peerReview.getOrDefault("productionRealism", 0.4);
                eval.security = peerReview.getOrDefault("security", 1.0);
            } else {
                eval.codeQuality = calculateCodeQuality(projectPath, referencePath);
                eval.productionRealism = calculateProductionRealism(projectPath);
                eval.security = calculateSecurityScore(projectPath);
            }
        } else {
            eval.codeQuality = calculateCodeQuality(projectPath, referencePath);
            eval.productionRealism = calculateProductionRealism(projectPath);
            eval.security = calculateSecurityScore(projectPath);
        }

        eval.costUsd = isFreeModel ? 0.0 : 0.015;
        double latencyScore = Math.max(0.0, 1.0 - (durationMs / 600000.0));
        double costScore = isFreeModel ? 1.0 : 0.8;
        eval.costLatency = (latencyScore * 0.5) + (costScore * 0.5);

        double rawScore = (eval.functionalAccuracy * 0.35)
                + (eval.codeQuality * 0.20)
                + (eval.productionRealism * 0.15)
                + (eval.security * 0.15)
                + (eval.costLatency * 0.15);

        eval.overallScore = Math.round(rawScore * 100.0) / 100.0;
        return eval;
    }

    private Map<String, Double> parsePeerReview(Path reviewPath) {
        if (!Files.exists(reviewPath)) return null;
        try {
            String content = Files.readString(reviewPath);
            int start = content.indexOf('{');
            int end = content.lastIndexOf('}');
            if (start != -1 && end != -1 && end > start) {
                String json = content.substring(start, end + 1);
                Map<String, Double> scores = new HashMap<>();
                scores.put("codeQuality", parseJsonKey(json, "codeQuality"));
                scores.put("productionRealism", parseJsonKey(json, "productionRealism"));
                scores.put("security", parseJsonKey(json, "security"));
                return scores;
            }
        } catch (Exception e) {
            log.error("Failed to parse peer review file", e);
        }
        return null;
    }

    private double parseJsonKey(String json, String key) {
        int keyIndex = json.indexOf("\"" + key + "\"");
        if (keyIndex == -1) keyIndex = json.indexOf("'" + key + "'");
        if (keyIndex == -1) return 0.5;

        int colonIndex = json.indexOf(':', keyIndex);
        if (colonIndex == -1) return 0.5;

        int nextCommaIndex = json.indexOf(',', colonIndex);
        if (nextCommaIndex == -1) nextCommaIndex = json.indexOf('}', colonIndex);
        if (nextCommaIndex == -1) return 0.5;

        try {
            String valStr = json.substring(colonIndex + 1, nextCommaIndex).trim();
            valStr = valStr.replace("\"", "").replace("'", "");
            return Double.parseDouble(valStr);
        } catch (Exception e) {
            return 0.5;
        }
    }

    private double calculateCodeQuality(Path projectPath, Path referencePath) {
        if (!Files.exists(projectPath)) {
            return 0.0;
        }

        if (Files.exists(referencePath) && Files.isDirectory(referencePath)) {
            try {
                Set<String> projectLines = collectUniqueLines(projectPath);
                Set<String> referenceLines = collectUniqueLines(referencePath);

                if (projectLines.isEmpty() || referenceLines.isEmpty()) {
                    return 0.5;
                }

                Set<String> intersection = new HashSet<>(projectLines);
                intersection.retainAll(referenceLines);

                Set<String> union = new HashSet<>(projectLines);
                union.addAll(referenceLines);

                double jaccard = (double) intersection.size() / union.size();
                return Math.round(Math.min(1.0, jaccard * 1.5) * 100.0) / 100.0;
            } catch (Exception e) {
                log.error("Failed to calculate Jaccard similarity", e);
                return 0.5;
            }
        }

        try {
            long fileCount;
            try (Stream<Path> walk = Files.walk(projectPath)) {
                fileCount = walk.filter(Files::isRegularFile).count();
            }
            if (fileCount > 2) {
                return 0.85;
            } else if (fileCount > 0) {
                return 0.6;
            }
        } catch (IOException e) {
            log.error("Failed to read project files for score fallback", e);
        }
        return 0.0;
    }

    private double calculateProductionRealism(Path projectPath) {
        if (!Files.exists(projectPath)) return 0.0;

        String[] keywords = {"login", "auth", "db", "config", "jwt", "controller", "repository", "exception", "handler", "service"};
        double score = 0.4;

        try (Stream<Path> paths = Files.walk(projectPath)) {
            List<Path> files = paths.filter(Files::isRegularFile).toList();
            int matchedKeywords = 0;
            Set<String> found = new HashSet<>();

            for (Path file : files) {
                if (isIgnoredPath(file)) continue;
                try {
                    String content = Files.readString(file).toLowerCase();
                    for (String kw : keywords) {
                        if (content.contains(kw) && found.add(kw)) {
                            matchedKeywords++;
                        }
                    }
                } catch (Exception ignored) {}
            }
            score += (matchedKeywords * 0.06);
        } catch (Exception e) {
            log.error("Error walking project dir for production realism", e);
        }
        return Math.min(1.0, score);
    }

    private double calculateSecurityScore(Path projectPath) {
        if (!Files.exists(projectPath)) return 1.0;

        double score = 1.0;
        try (Stream<Path> paths = Files.walk(projectPath)) {
            List<Path> files = paths.filter(Files::isRegularFile).toList();
            for (Path file : files) {
                if (isIgnoredPath(file)) continue;
                try {
                    String content = Files.readString(file);
                    if (content.contains("eval(") || content.contains("exec(")) {
                        score -= 0.15;
                    }
                    if (content.toLowerCase().contains("apikey = \"") || content.toLowerCase().contains("password = \"")) {
                        score -= 0.1;
                    }
                } catch (Exception ignored) {}
            }
        } catch (Exception e) {
            log.error("Error reading project for security evaluation", e);
        }
        return Math.max(0.0, score);
    }

    private Set<String> collectUniqueLines(Path path) throws IOException {
        Set<String> linesSet = new HashSet<>();
        try (Stream<Path> paths = Files.walk(path)) {
            List<Path> files = paths.filter(Files::isRegularFile).toList();
            for (Path file : files) {
                if (isIgnoredPath(file)) continue;
                try {
                    List<String> fileLines = Files.readAllLines(file);
                    for (String line : fileLines) {
                        String clean = line.trim();
                        if (!clean.isEmpty() && !clean.startsWith("//") && !clean.startsWith("#")) {
                            linesSet.add(clean);
                        }
                    }
                } catch (Exception ignored) {}
            }
        }
        return linesSet;
    }

    private boolean isIgnoredPath(Path path) {
        String p = path.toString();
        return p.contains("/.git/") || p.contains("/node_modules/") || p.contains("/target/")
                || p.contains("/__pycache__/") || p.contains("/.idea/") || p.contains("/dist/");
    }
}
