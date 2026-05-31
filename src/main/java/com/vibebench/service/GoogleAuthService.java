package com.vibebench.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
public class GoogleAuthService {

    private static final Logger log = LoggerFactory.getLogger(GoogleAuthService.class);

    private final RestTemplate restTemplate;
    private final String expectedClientId;

    public GoogleAuthService() {
        this.restTemplate = new RestTemplate();
        this.expectedClientId = System.getProperty("VIBEBENCH_GOOGLE_CLIENT_ID");
    }

    public static class GoogleUser {
        public String email;
        public String name;

        public GoogleUser(String email, String name) {
            this.email = email;
            this.name = name;
        }
    }

    @SuppressWarnings("unchecked")
    public GoogleUser verify(String idToken) {
        if (idToken == null || idToken.trim().isEmpty()) {
            return null;
        }

        try {
            String url = "https://oauth2.googleapis.com/tokeninfo?id_token=" + idToken;
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> body = response.getBody();

                String email = (String) body.get("email");
                String name = (String) body.get("name");
                String aud = (String) body.get("aud");

                if (email == null) {
                    log.error("Google token info returned null email");
                    return null;
                }

                // Verify client ID if configured
                if (expectedClientId != null && !expectedClientId.trim().isEmpty() && 
                    !"your-google-client-id-here.apps.googleusercontent.com".equals(expectedClientId)) {
                    if (!expectedClientId.equals(aud)) {
                        log.error("Google token client ID (aud) mismatch. Expected: {}, Got: {}", expectedClientId, aud);
                        return null;
                    }
                } else {
                    log.warn("VIBEBENCH_GOOGLE_CLIENT_ID is not configured in .env. Skipping audience matching check.");
                }

                log.info("Successfully verified Google Token for user: {}", email);
                return new GoogleUser(email, name != null ? name : email);
            }
        } catch (Exception e) {
            log.error("Failed to verify Google ID token with Google APIs", e);
        }

        return null;
    }
}
