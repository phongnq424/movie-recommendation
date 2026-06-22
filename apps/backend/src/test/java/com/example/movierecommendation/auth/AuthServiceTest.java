package com.example.movierecommendation.auth;

import com.example.movierecommendation.auth.dto.AuthResponse;
import com.example.movierecommendation.auth.dto.LoginRequest;
import com.example.movierecommendation.auth.dto.RegisterRequest;
import com.example.movierecommendation.common.exception.BadRequestException;
import com.example.movierecommendation.common.exception.ConflictException;
import com.example.movierecommendation.common.exception.ForbiddenException;
import com.example.movierecommendation.rbac.Role;
import com.example.movierecommendation.rbac.RoleRepository;
import com.example.movierecommendation.security.JwtService;
import com.example.movierecommendation.user.User;
import com.example.movierecommendation.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private RefreshTokenService refreshTokenService;

    @Mock
    private UserLoginAuditService userLoginAuditService;

    @Mock
    private RoleRepository roleRepository;

    @InjectMocks
    private AuthService authService;

    @Test
    void register_shouldCreateUser_whenEmailDoesNotExist() {
        RegisterRequest request = new RegisterRequest();
        request.setFullName("Nguyen Van A");
        request.setEmail("TEST@EMAIL.COM");
        request.setPassword("123456");

        Role userRole = Role.builder()
                .id(1L)
                .name("USER")
                .active(true)
                .build();

        User savedUser = User.builder()
                .id(1L)
                .publicId(UUID.randomUUID())
                .fullName("Nguyen Van A")
                .email("test@email.com")
                .password("encoded-password")
                .status("ACTIVE")
                .build();
        savedUser.getRoles().add(userRole);

        when(userRepository.existsByEmail("test@email.com")).thenReturn(false);
        when(roleRepository.findByName("USER")).thenReturn(Optional.of(userRole));
        when(passwordEncoder.encode("123456")).thenReturn("encoded-password");
        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(jwtService.generateAccessToken(savedUser)).thenReturn("access-token");
        when(refreshTokenService.createRefreshToken(savedUser)).thenReturn("refresh-token");

        AuthResponse response = authService.register(request);

        assertNotNull(response);
        assertEquals("Register successfully", response.getMessage());
        assertEquals("access-token", response.getAccessToken());
        assertEquals("refresh-token", response.getRefreshToken());

        verify(userRepository).save(any(User.class));
        verify(jwtService).generateAccessToken(savedUser);
        verify(refreshTokenService).createRefreshToken(savedUser);
    }

    @Test
    void register_shouldThrowConflictException_whenEmailAlreadyExists() {
        RegisterRequest request = new RegisterRequest();
        request.setFullName("Nguyen Van A");
        request.setEmail("test@email.com");
        request.setPassword("123456");

        when(userRepository.existsByEmail("test@email.com")).thenReturn(true);

        assertThrows(ConflictException.class, () -> authService.register(request));

        verify(userRepository, never()).save(any());
    }

    @Test
    void login_shouldReturnToken_whenCredentialsAreValid() {
        LoginRequest request = new LoginRequest();
        request.setEmail("test@email.com");
        request.setPassword("123456");

        LoginMetadata metadata = LoginMetadata.builder()
                .ipAddress("127.0.0.1")
                .userAgent("JUnit")
                .browser("Chrome")
                .deviceType("Desktop")
                .operatingSystem("Windows")
                .build();

        User user = User.builder()
                .id(1L)
                .publicId(UUID.randomUUID())
                .fullName("Nguyen Van A")
                .email("test@email.com")
                .password("encoded-password")
                .status("ACTIVE")
                .build();

        when(userRepository.findByEmail("test@email.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("123456", "encoded-password")).thenReturn(true);
        when(userRepository.save(user)).thenReturn(user);
        when(jwtService.generateAccessToken(user)).thenReturn("access-token");
        when(refreshTokenService.createRefreshToken(user)).thenReturn("refresh-token");

        AuthResponse response = authService.login(request, metadata);

        assertNotNull(response);
        assertEquals("Login successfully", response.getMessage());
        assertEquals("access-token", response.getAccessToken());
        assertEquals("refresh-token", response.getRefreshToken());

        verify(userLoginAuditService).recordSuccessfulLogin(user, metadata);
    }

    @Test
    void login_shouldThrowBadRequestException_whenPasswordIsInvalid() {
        LoginRequest request = new LoginRequest();
        request.setEmail("test@email.com");
        request.setPassword("wrong-password");

        LoginMetadata metadata = LoginMetadata.builder().build();

        User user = User.builder()
                .id(1L)
                .publicId(UUID.randomUUID())
                .email("test@email.com")
                .password("encoded-password")
                .status("ACTIVE")
                .build();

        when(userRepository.findByEmail("test@email.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong-password", "encoded-password")).thenReturn(false);

        assertThrows(BadRequestException.class, () -> authService.login(request, metadata));

        verify(userLoginAuditService).recordFailedLogin(
                eq("test@email.com"),
                eq(metadata),
                eq("Invalid password")
        );
    }

    @Test
    void login_shouldThrowForbiddenException_whenAccountIsNotActive() {
        LoginRequest request = new LoginRequest();
        request.setEmail("test@email.com");
        request.setPassword("123456");

        LoginMetadata metadata = LoginMetadata.builder().build();

        User user = User.builder()
                .id(1L)
                .publicId(UUID.randomUUID())
                .email("test@email.com")
                .password("encoded-password")
                .status("LOCKED")
                .build();

        when(userRepository.findByEmail("test@email.com")).thenReturn(Optional.of(user));

        assertThrows(ForbiddenException.class, () -> authService.login(request, metadata));

        verify(passwordEncoder, never()).matches(anyString(), anyString());
        verify(userLoginAuditService).recordFailedLogin(
                eq("test@email.com"),
                eq(metadata),
                eq("Account is not active")
        );
    }
}