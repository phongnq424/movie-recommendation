package com.example.movierecommendation.user.dto;

import com.example.movierecommendation.user.User;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

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

    public static UserResponse from(User user) {
        return UserResponse.builder()
                .publicId(user.getPublicId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole())
                .avatarUrl(user.getAvatarUrl())
                .status(user.getStatus())
                .build();
    }
}