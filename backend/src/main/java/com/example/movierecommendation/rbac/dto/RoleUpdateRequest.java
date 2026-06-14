package com.example.movierecommendation.rbac.dto;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RoleUpdateRequest {

    @Size(max = 255)
    private String description;

    private Boolean active;
}