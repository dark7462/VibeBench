package com.vibebench.config;

import com.vibebench.model.BenchmarkJob;
import com.vibebench.model.User;
import com.vibebench.repository.BenchmarkJobRepository;
import com.vibebench.repository.UserRepository;
import com.vibebench.service.LeaderboardService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DatabaseInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseInitializer.class);

    private final BenchmarkJobRepository jobRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RedisTemplate<String, Object> redisTemplate;
    private final LeaderboardService leaderboardService;

    public DatabaseInitializer(BenchmarkJobRepository jobRepository,
                               UserRepository userRepository,
                               PasswordEncoder passwordEncoder,
                               RedisTemplate<String, Object> redisTemplate,
                               LeaderboardService leaderboardService) {
        this.jobRepository = jobRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.redisTemplate = redisTemplate;
        this.leaderboardService = leaderboardService;
    }

    @Override
    public void run(String... args) throws Exception {
        log.info("Executing startup database initialization and cleanup...");

        // 1. Delete DeepSeek records from MongoDB
        try {
            List<BenchmarkJob> allJobs = jobRepository.findAll();
            List<BenchmarkJob> deepseekJobs = allJobs.stream()
                    .filter(job -> job.getModelName() != null && job.getModelName().toLowerCase().contains("deepseek"))
                    .toList();

            if (!deepseekJobs.isEmpty()) {
                log.info("Found {} DeepSeek job records. Deleting from MongoDB...", deepseekJobs.size());
                jobRepository.deleteAll(deepseekJobs);
                log.info("DeepSeek job records successfully deleted.");
            } else {
                log.info("No DeepSeek job records found in MongoDB.");
            }
        } catch (Exception e) {
            log.error("Failed to delete DeepSeek records from MongoDB", e);
        }

        // 2. Clear Redis cache key for leaderboard
        try {
            String cacheKey = "vibebench:leaderboard:top10";
            Boolean deleted = redisTemplate.delete(cacheKey);
            if (Boolean.TRUE.equals(deleted)) {
                log.info("Successfully evicted leaderboard cache '{}' from Redis.", cacheKey);
            }
            // Trigger recalculation to seed the new leaderboard without DeepSeek records
            leaderboardService.refreshCache();
        } catch (Exception e) {
            log.warn("Failed to delete leaderboard cache from Redis: {}. Leaderboard will fall back to DB lookup.", e.getMessage());
        }

        // 3. Clear all existing registered users and seed the Admin account
        try {
            log.info("Clearing previous registered user accounts to reset authorization logins...");
            userRepository.deleteAll();

            String adminEmail = "anu870906@gmail.com";
            User admin = new User(
                adminEmail,
                "Admin",
                passwordEncoder.encode("admin123"),
                "System Administrator",
                "ROLE_ADMIN"
            );
            userRepository.save(admin);
            log.info("Successfully seeded single Admin user account: {} / pass: admin123", adminEmail);
        } catch (Exception e) {
            log.error("Failed to seed Admin user account", e);
        }
    }
}
