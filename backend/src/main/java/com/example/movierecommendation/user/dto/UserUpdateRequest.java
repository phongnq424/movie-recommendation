package com.example.movierecommendation.user.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserUpdateRequest {

    @NotBlank(message = "Full name is required")
    private String fullName;

    private String avatarUrl;
}