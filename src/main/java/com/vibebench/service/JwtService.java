package com.vibebench.service;

import com.auth0.jwt.JWT;
import com.auth0.jwt.JWTVerifier;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.interfaces.DecodedJWT;
import org.springframework.stereotype.Service;

import java.util.Date;

@Service
public class JwtService {

    private final String secretKey;
    private final JWTVerifier verifier;
    private final Algorithm algorithm;

    public JwtService() {
        String secret = System.getenv("VIBEBENCH_JWT_SECRET");
        if (secret == null || secret.trim().isEmpty()) {
            secret = System.getProperty("VIBEBENCH_JWT_SECRET");
        }
        if (secret == null || secret.trim().isEmpty() || secret.length() < 32) {
            secret = "vibebench-custom-auth-v2-fallback-hmac-key-256-bits-long-secret";
        }
        this.secretKey = secret;
        this.algorithm = Algorithm.HMAC256(secretKey);
        this.verifier = JWT.require(algorithm)
                .withIssuer("vibebench")
                .build();
    }

    public String generateToken(String email, String name, String role) {
        long expireTimeMs = 86400000; // 24 hours
        return JWT.create()
                .withIssuer("vibebench")
                .withSubject(email)
                .withClaim("email", email)
                .withClaim("name", name)
                .withClaim("role", role)
                .withIssuedAt(new Date())
                .withExpiresAt(new Date(System.currentTimeMillis() + expireTimeMs))
                .sign(algorithm);
    }

    public DecodedJWT verifyToken(String token) {
        try {
            return verifier.verify(token);
        } catch (Exception e) {
            return null;
        }
    }

    public String getEmail(DecodedJWT jwt) {
        return jwt.getClaim("email").asString();
    }

    public String getRole(DecodedJWT jwt) {
        return jwt.getClaim("role").asString();
    }
}
