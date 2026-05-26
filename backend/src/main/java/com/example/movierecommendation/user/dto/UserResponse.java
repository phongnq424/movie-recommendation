package com.example.movierecommendation.user.dto;

import com.example.movierecommendation.user.User;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
public class UserResponse {

    private UUID publicId;
    private String fullName;
    private String email;
    private String role;
    private String avatarUrl;
    private String status;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private LocalDateTime lastLoginAt;
    private String lastLoginIp;
    private String lastLoginDeviceType;
    private String lastLoginBrowser;
    private String lastLoginOs;
    private String lastLoginUserAgent;

    public static UserResponse from(User user) {
        return UserResponse.builder()
                .publicId(user.getPublicId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole())
                .avatarUrl(user.getAvatarUrl())
                .status(user.getStatus())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .lastLoginAt(user.getLastLoginAt())
                .lastLoginIp(user.getLastLoginIp())
                .lastLoginDeviceType(user.getLastLoginDeviceType())
                .lastLoginBrowser(user.getLastLoginBrowser())
                .lastLoginOs(user.getLastLoginOs())
                .lastLoginUserAgent(user.getLastLoginUserAgent())
                .build();
    }
}