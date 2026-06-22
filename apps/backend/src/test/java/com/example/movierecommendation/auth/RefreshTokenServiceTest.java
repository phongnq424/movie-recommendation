package com.example.movierecommendation.auth;

import com.example.movierecommendation.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RefreshTokenServiceTest {

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @InjectMocks
    private RefreshTokenService refreshTokenService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(
                refreshTokenService,
                "refreshTokenExpirationMs",
                7L * 24 * 60 * 60 * 1000
        );
    }

    @Test
    void createRefreshToken_shouldSaveHashedTokenAndReturnRawToken() {
        User user = activeUser();

        when(refreshTokenRepository.save(any(RefreshToken.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        String rawToken = refreshTokenService.createRefreshToken(user);

        assertNotNull(rawToken);
        assertFalse(rawToken.isBlank());

        verify(refreshTokenRepository).save(argThat(token ->
                token.getUser().equals(user)
                        && token.getTokenHash() != null
                        && !token.getTokenHash().equals(rawToken)
                        && Boolean.FALSE.equals(token.getRevoked())
                        && token.getExpiresAt().isAfter(LocalDateTime.now())
        ));
    }

    @Test
    void validateRefreshToken_shouldReturnToken_whenTokenIsValid() {
        String rawToken = "raw-token";
        String hash = refreshTokenService.hashToken(rawToken);

        RefreshToken token = RefreshToken.builder()
                .tokenHash(hash)
                .user(activeUser())
                .expiresAt(LocalDateTime.now().plusDays(1))
                .revoked(false)
                .build();

        when(refreshTokenRepository.findByTokenHash(hash)).thenReturn(Optional.of(token));

        RefreshToken result = refreshTokenService.validateRefreshToken(rawToken);

        assertSame(token, result);
    }

    @Test
    void validateRefreshToken_shouldThrow_whenTokenIsBlank() {
        assertThrows(RuntimeException.class, () -> refreshTokenService.validateRefreshToken(" "));
    }

    @Test
    void validateRefreshToken_shouldThrow_whenTokenDoesNotExist() {
        String rawToken = "raw-token";
        String hash = refreshTokenService.hashToken(rawToken);

        when(refreshTokenRepository.findByTokenHash(hash)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> refreshTokenService.validateRefreshToken(rawToken));
    }

    @Test
    void validateRefreshToken_shouldThrow_whenTokenIsRevoked() {
        String rawToken = "raw-token";
        String hash = refreshTokenService.hashToken(rawToken);

        RefreshToken token = RefreshToken.builder()
                .tokenHash(hash)
                .user(activeUser())
                .expiresAt(LocalDateTime.now().plusDays(1))
                .revoked(true)
                .build();

        when(refreshTokenRepository.findByTokenHash(hash)).thenReturn(Optional.of(token));

        assertThrows(RuntimeException.class, () -> refreshTokenService.validateRefreshToken(rawToken));
    }

    @Test
    void revokeRefreshToken_shouldMarkTokenAsRevoked() {
        String rawToken = "raw-token";
        String hash = refreshTokenService.hashToken(rawToken);

        RefreshToken token = RefreshToken.builder()
                .tokenHash(hash)
                .user(activeUser())
                .expiresAt(LocalDateTime.now().plusDays(1))
                .revoked(false)
                .build();

        when(refreshTokenRepository.findByTokenHash(hash)).thenReturn(Optional.of(token));
        when(refreshTokenRepository.save(any(RefreshToken.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        refreshTokenService.revokeRefreshToken(rawToken);

        assertTrue(token.getRevoked());
        assertNotNull(token.getRevokedAt());

        verify(refreshTokenRepository).save(token);
    }

    private User activeUser() {
        return User.builder()
                .id(1L)
                .publicId(UUID.randomUUID())
                .email("user@email.com")
                .password("password")
                .status("ACTIVE")
                .build();
    }
}