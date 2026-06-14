package com.example.movierecommendation.rbac.dto;

import com.example.movierecommendation.rbac.Permission;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@Builder
public class PermissionResponse {

    private UUID publicId;
    private String code;
    private String module;
    private String action;
    private String description;
    private Boolean active;

    public static PermissionResponse from(Permission permission) {
        return PermissionResponse.builder()
                .publicId(permission.getPublicId())
                .code(permission.getCode())
                .module(permission.getModule())
                .action(permission.getAction())
                .description(permission.getDescription())
                .active(permission.getActive())
                .build();
    }
}