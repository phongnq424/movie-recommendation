package com.example.movierecommendation.security;

import com.example.movierecommendation.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();

        ReflectionTestUtils.setField(
                jwtService,
                "jwtSecret",
                "this-is-a-test-secret-key-with-at-least-32-bytes"
        );
        ReflectionTestUtils.setField(
                jwtService,
                "accessTokenExpirationMs",
                60_000L
        );
    }

    @Test
    void generateAccessToken_shouldGenerateValidToken() {
        User user = User.builder()
                .publicId(UUID.randomUUID())
                .email("user@email.com")
                .status("ACTIVE")
                .build();

        String token = jwtService.generateAccessToken(user);

        assertNotNull(token);
        assertTrue(jwtService.isTokenValid(token));
        assertEquals(user.getPublicId(), jwtService.extractUserPublicId(token));
    }

    @Test
    void isTokenValid_shouldReturnFalse_whenTokenIsInvalid() {
        assertFalse(jwtService.isTokenValid("invalid-token"));
    }
}