package com.example.movierecommendation.rbac.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.Set;

@Getter
@Setter
public class AssignRolePermissionsRequest {

    @NotNull
    private Set<String> permissionCodes;
}