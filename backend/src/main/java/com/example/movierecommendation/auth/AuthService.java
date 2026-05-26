package com.example.movierecommendation.auth;

import com.example.movierecommendation.auth.dto.AuthResponse;
import com.example.movierecommendation.auth.dto.LoginRequest;
import com.example.movierecommendation.auth.dto.RefreshTokenRequest;
import com.example.movierecommendation.auth.dto.RegisterRequest;
import com.example.movierecommendation.common.exception.BadRequestException;
import com.example.movierecommendation.common.exception.ConflictException;
import com.example.movierecommendation.common.exception.ForbiddenException;
import com.example.movierecommendation.security.JwtService;
import com.example.movierecommendation.user.User;
import com.example.movierecommendation.user.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final UserLoginAuditService userLoginAuditService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new ConflictException("Email already exists");
        }

        User user = User.builder()
                .fullName(request.getFullName().trim())
                .email(normalizedEmail)
                .password(passwordEncoder.encode(request.getPassword()))
                .role("USER")
                .status("ACTIVE")
                .build();

        User savedUser = userRepository.save(user);

        String accessToken = jwtService.generateAccessToken(savedUser);
        String refreshToken = refreshTokenService.createRefreshToken(savedUser);

        return AuthResponse.from(
                savedUser,
                "Register successfully",
                accessToken,
                refreshToken
        );
    }

    @Transactional
    public AuthResponse login(LoginRequest request, LoginMetadata metadata) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> {
                    userLoginAuditService.recordFailedLogin(
                            normalizedEmail,
                            metadata,
                            "Invalid email"
                    );

                    return new BadRequestException("Invalid email or password");
                });

        if (!"ACTIVE".equals(user.getStatus())) {
            userLoginAuditService.recordFailedLogin(
                    normalizedEmail,
                    metadata,
                    "Account is not active"
            );

            throw new ForbiddenException("Account is not active");
        }

        boolean matched = passwordEncoder.matches(
                request.getPassword(),
                user.getPassword()
        );

        if (!matched) {
            userLoginAuditService.recordFailedLogin(
                    normalizedEmail,
                    metadata,
                    "Invalid password"
            );

            throw new BadRequestException("Invalid email or password");
        }

        user.setLastLoginAt(LocalDateTime.now());
        user.setLastLoginIp(metadata.getIpAddress());
        user.setLastLoginUserAgent(metadata.getUserAgent());
        user.setLastLoginDeviceType(metadata.getDeviceType());
        user.setLastLoginBrowser(metadata.getBrowser());
        user.setLastLoginOs(metadata.getOperatingSystem());

        User savedUser = userRepository.save(user);

        userLoginAuditService.recordSuccessfulLogin(savedUser, metadata);

        String accessToken = jwtService.generateAccessToken(savedUser);
        String refreshToken = refreshTokenService.createRefreshToken(savedUser);

        return AuthResponse.from(
                savedUser,
                "Login successfully",
                accessToken,
                refreshToken
        );
    }

    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        RefreshToken refreshTokenEntity = refreshTokenService.validateRefreshToken(
                request.getRefreshToken()
        );

        User user = refreshTokenEntity.getUser();

        refreshTokenEntity.setRevoked(true);
        refreshTokenEntity.setRevokedAt(java.time.LocalDateTime.now());

        String newAccessToken = jwtService.generateAccessToken(user);
        String newRefreshToken = refreshTokenService.createRefreshToken(user);

        return AuthResponse.from(
                user,
                "Refresh token successfully",
                newAccessToken,
                newRefreshToken
        );
    }

    @Transactional
    public void logout(String refreshToken) {
        refreshTokenService.revokeRefreshToken(refreshToken);
    }
}