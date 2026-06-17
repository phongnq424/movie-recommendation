package com.example.movierecommendation.rbac.dto;

import com.example.movierecommendation.rbac.Permission;
import com.example.movierecommendation.rbac.Role;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
public class RoleResponse {

    private UUID publicId;
    private String name;
    private String description;
    private Boolean systemRole;
    private Boolean active;
    private List<String> permissions;

    public static RoleResponse from(Role role) {
        return RoleResponse.builder()
                .publicId(role.getPublicId())
                .name(role.getName())
                .description(role.getDescription())
                .systemRole(role.getSystemRole())
                .active(role.getActive())
                .permissions(
                        role.getPermissions()
                                .stream()
                                .map(Permission::getCode)
                                .sorted(Comparator.naturalOrder())
                                .toList()
                )
                .build();
    }
}