package com.vibebench;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.nio.charset.StandardCharsets;

@SpringBootApplication
@EnableAsync
public class VibeBenchApplication {
    public static void main(String[] args) {
        loadDotEnv();
        SpringApplication.run(VibeBenchApplication.class, args);
    }

    private static void loadDotEnv() {
        File envFile = new File(".env");
        if (envFile.exists()) {
            try (BufferedReader reader = new BufferedReader(new FileReader(envFile, StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    String trimmed = line.trim();
                    if (trimmed.isEmpty() || trimmed.startsWith("#")) {
                        continue;
                    }
                    int eqIndex = trimmed.indexOf('=');
                    if (eqIndex != -1) {
                        String key = trimmed.substring(0, eqIndex).trim();
                        String value = trimmed.substring(eqIndex + 1).trim();
                        if (value.startsWith("\"") && value.endsWith("\"") && value.length() >= 2) {
                            value = value.substring(1, value.length() - 1);
                        } else if (value.startsWith("'") && value.endsWith("'") && value.length() >= 2) {
                            value = value.substring(1, value.length() - 1);
                        }
                        System.setProperty(key, value);
                    }
                }
            } catch (Exception e) {
                System.err.println("Failed to load .env file: " + e.getMessage());
            }
        }
    }
}
