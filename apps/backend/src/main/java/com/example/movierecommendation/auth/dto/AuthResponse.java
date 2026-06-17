package com.example.movierecommendation.auth.dto;

import com.example.movierecommendation.rbac.Permission;
import com.example.movierecommendation.rbac.Role;
import com.example.movierecommendation.user.User;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
public class AuthResponse {

    private UUID userPublicId;
    private String fullName;
    private String email;
    private List<String> roles;
    private List<String> permissions;
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
        List<String> roles = user.getRoles()
                .stream()
                .map(Role::getName)
                .sorted()
                .toList();

        List<String> permissions = user.getRoles()
                .stream()
                .flatMap(role -> role.getPermissions().stream())
                .map(Permission::getCode)
                .distinct()
                .sorted(Comparator.naturalOrder())
                .toList();

        return AuthResponse.builder()
                .userPublicId(user.getPublicId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .roles(roles)
                .permissions(permissions)
                .message(message)
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .build();
    }
}