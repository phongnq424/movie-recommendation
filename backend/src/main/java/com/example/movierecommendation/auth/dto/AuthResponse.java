package com.example.movierecommendation.auth.dto;

import com.example.movierecommendation.user.User;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@Builder
public class AuthResponse {

    private UUID userPublicId;
    private String fullName;
    private String email;
    private String role;
    private String message;

    private String accessToken;
    private String refreshToken;
    private String tokenType;

    public static AuthResponse from(
            User user,
            String message,
            String accessToken,
            String refreshToken
    ) {
        return AuthResponse.builder()
                .userPublicId(user.getPublicId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole())
                .message(message)
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .build();
    }
}