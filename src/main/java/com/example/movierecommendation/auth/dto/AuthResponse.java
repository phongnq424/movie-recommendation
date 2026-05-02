package com.example.movierecommendation.auth.dto;

import com.example.movierecommendation.user.User;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class AuthResponse {

    private Long userId;
    private String fullName;
    private String email;
    private String role;
    private String message;

    public static AuthResponse from(User user, String message) {
        return AuthResponse.builder()
                .userId(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole())
                .message(message)
                .build();
    }
}