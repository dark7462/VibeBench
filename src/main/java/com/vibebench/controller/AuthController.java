package com.vibebench.controller;

import com.vibebench.model.User;
import com.vibebench.repository.UserRepository;
import com.vibebench.service.GoogleAuthService;
import com.vibebench.service.JwtService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/v1/auth")
@CrossOrigin
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final GoogleAuthService googleAuthService;

    public AuthController(UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          JwtService jwtService,
                          GoogleAuthService googleAuthService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.googleAuthService = googleAuthService;
    }

    public static class RegisterRequest {
        private String name;
        private String email;
        private String password;
        private String profession;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }

        public String getProfession() { return profession; }
        public void setProfession(String profession) { this.profession = profession; }
    }

    public static class LoginRequest {
        private String email;
        private String password;

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    public static class GoogleLoginRequest {
        private String idToken;

        public String getIdToken() { return idToken; }
        public void setIdToken(String idToken) { this.idToken = idToken; }
    }

    public static class GoogleRegisterRequest {
        private String idToken;
        private String name;
        private String profession;

        public String getIdToken() { return idToken; }
        public void setIdToken(String idToken) { this.idToken = idToken; }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getProfession() { return profession; }
        public void setProfession(String profession) { this.profession = profession; }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        log.info("Processing user registration request for email: {}", request.getEmail());

        if (request.getName() == null || request.getName().trim().isEmpty() ||
            request.getEmail() == null || request.getEmail().trim().isEmpty() ||
            request.getPassword() == null || request.getPassword().trim().isEmpty() ||
            request.getProfession() == null || request.getProfession().trim().isEmpty()) {
            
            Map<String, String> err = new HashMap<>();
            err.put("error", "All fields are required");
            return ResponseEntity.badRequest().body(err);
        }

        String email = request.getEmail().trim().toLowerCase();
        if (!EMAIL_PATTERN.matcher(email).matches()) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Please enter a valid email address");
            return ResponseEntity.badRequest().body(err);
        }

        if (request.getPassword().length() < 6) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Password must be at least 6 characters long");
            return ResponseEntity.badRequest().body(err);
        }

        if (userRepository.existsById(email)) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Email is already registered");
            return ResponseEntity.badRequest().body(err);
        }

        // Determine user role (anu870906@gmail.com is ADMIN, others are USER)
        String role = "ROLE_USER";
        if ("anu870906@gmail.com".equals(email)) {
            role = "ROLE_ADMIN";
        }

        User user = new User(
            email,
            request.getName().trim(),
            passwordEncoder.encode(request.getPassword()),
            request.getProfession().trim(),
            role
        );
        userRepository.save(user);

        log.info("Successfully registered user {} with role {}", email, role);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Registration successful");
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        log.info("Processing user login request for email: {}", request.getEmail());

        if (request.getEmail() == null || request.getEmail().trim().isEmpty() ||
            request.getPassword() == null || request.getPassword().trim().isEmpty()) {
            
            Map<String, String> err = new HashMap<>();
            err.put("error", "Email and password are required");
            return ResponseEntity.badRequest().body(err);
        }

        String email = request.getEmail().trim().toLowerCase();
        User user = userRepository.findById(email).orElse(null);

        if (user == null || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Invalid email or password");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(err);
        }

        String token = jwtService.generateToken(user.getEmail(), user.getName(), user.getRole());

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("email", user.getEmail());
        response.put("name", user.getName());
        response.put("role", user.getRole());
        response.put("profession", user.getProfession());

        log.info("User {} logged in successfully with role {}", user.getEmail(), user.getRole());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/google")
    public ResponseEntity<?> loginWithGoogle(@RequestBody GoogleLoginRequest request) {
        log.info("Processing Google OAuth login request");

        if (request.getIdToken() == null || request.getIdToken().trim().isEmpty()) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "idToken is required");
            return ResponseEntity.badRequest().body(err);
        }

        String targetEmail;
        String targetName;

        // Support Developer/Demo logins
        if ("mock-admin-token".equals(request.getIdToken())) {
            targetEmail = "anu870906@gmail.com";
            targetName = "Admin (Mock)";
        } else if ("mock-user-token".equals(request.getIdToken())) {
            targetEmail = "visitor@vibebench.org";
            targetName = "Guest (Mock)";
        } else {
            // Verify token info via Google API
            GoogleAuthService.GoogleUser googleUser = googleAuthService.verify(request.getIdToken());
            if (googleUser == null) {
                Map<String, String> err = new HashMap<>();
                err.put("error", "Invalid Google ID token");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(err);
            }
            targetEmail = googleUser.email;
            targetName = googleUser.name;
        }

        String email = targetEmail.trim().toLowerCase();

        // Check if user exists in local MongoDB User records
        User user = userRepository.findById(email).orElse(null);
        if (user == null) {
            log.info("Google user {} not found in database. Returning unregistered flag...", email);
            Map<String, Object> response = new HashMap<>();
            response.put("registered", false);
            response.put("email", email);
            response.put("name", targetName);
            return ResponseEntity.ok(response);
        }

        // Generate application session token
        String token = jwtService.generateToken(user.getEmail(), user.getName(), user.getRole());

        Map<String, Object> response = new HashMap<>();
        response.put("registered", true);
        response.put("token", token);
        response.put("email", user.getEmail());
        response.put("name", user.getName());
        response.put("role", user.getRole());
        response.put("profession", user.getProfession());

        log.info("Google User {} authenticated successfully via database record with role {}", user.getEmail(), user.getRole());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/google/register")
    public ResponseEntity<?> registerWithGoogle(@RequestBody GoogleRegisterRequest request) {
        log.info("Processing Google OAuth registration completion request");

        if (request.getIdToken() == null || request.getIdToken().trim().isEmpty() ||
            request.getName() == null || request.getName().trim().isEmpty() ||
            request.getProfession() == null || request.getProfession().trim().isEmpty()) {
            
            Map<String, String> err = new HashMap<>();
            err.put("error", "All fields are required");
            return ResponseEntity.badRequest().body(err);
        }

        String targetEmail;
        String targetName = request.getName().trim();

        // Support Developer/Demo logins
        if ("mock-admin-token".equals(request.getIdToken())) {
            targetEmail = "anu870906@gmail.com";
        } else if ("mock-user-token".equals(request.getIdToken())) {
            targetEmail = "visitor@vibebench.org";
        } else {
            // Verify token info via Google API
            GoogleAuthService.GoogleUser googleUser = googleAuthService.verify(request.getIdToken());
            if (googleUser == null) {
                Map<String, String> err = new HashMap<>();
                err.put("error", "Invalid Google ID token");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(err);
            }
            targetEmail = googleUser.email;
        }

        String email = targetEmail.trim().toLowerCase();

        // Check if user already exists
        User user = userRepository.findById(email).orElse(null);
        if (user != null) {
            log.info("User {} already registered. Logging in directly...", email);
        } else {
            String role = "ROLE_USER";
            if ("anu870906@gmail.com".equals(email)) {
                role = "ROLE_ADMIN";
            }

            user = new User(
                email,
                targetName,
                passwordEncoder.encode(UUID.randomUUID().toString()),
                request.getProfession().trim(),
                role
            );
            userRepository.save(user);
            log.info("Google user {} successfully registered with profession '{}' and role '{}'", email, user.getProfession(), role);
        }

        // Generate application session token
        String token = jwtService.generateToken(user.getEmail(), user.getName(), user.getRole());

        Map<String, Object> response = new HashMap<>();
        response.put("registered", true);
        response.put("token", token);
        response.put("email", user.getEmail());
        response.put("name", user.getName());
        response.put("role", user.getRole());
        response.put("profession", user.getProfession());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/config")
    public ResponseEntity<Map<String, String>> getConfig() {
        Map<String, String> config = new HashMap<>();
        config.put("clientId", System.getProperty("VIBEBENCH_GOOGLE_CLIENT_ID", ""));
        return ResponseEntity.ok(config);
    }
}
