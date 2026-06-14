package com.example.movierecommendation.rbac.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.Set;

@Getter
@Setter
public class AssignUserRolesRequest {

    @NotNull
    private Set<String> roleNames;
}