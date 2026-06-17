package com.example.movierecommendation.rbac.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RoleCreateRequest {

    @NotBlank
    @Size(max = 80)
    private String name;

    @Size(max = 255)
    private String description;
}