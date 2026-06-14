package com.example.movierecommendation.rbac;

import com.example.movierecommendation.rbac.dto.*;
import com.example.movierecommendation.user.dto.UserResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

import static com.example.movierecommendation.rbac.PermissionCode.*;

@RestController
@RequestMapping("/api/admin/rbac")
@RequiredArgsConstructor
@CrossOrigin("*")
public class RbacController {

    private final RbacService rbacService;

    @PreAuthorize("hasAuthority('" + ROLE_READ + "')")
    @GetMapping("/roles")
    public List<RoleResponse> getRoles() {
        return rbacService.getRoles();
    }

    @PreAuthorize("hasAuthority('" + PERMISSION_READ + "')")
    @GetMapping("/permissions")
    public List<PermissionResponse> getPermissions() {
        return rbacService.getPermissions();
    }

    @PreAuthorize("hasAuthority('" + ROLE_CREATE + "')")
    @PostMapping("/roles")
    public RoleResponse createRole(@Valid @RequestBody RoleCreateRequest request) {
        return rbacService.createRole(request);
    }

    @PreAuthorize("hasAuthority('" + ROLE_UPDATE + "')")
    @PutMapping("/roles/{rolePublicId}")
    public RoleResponse updateRole(
            @PathVariable UUID rolePublicId,
            @Valid @RequestBody RoleUpdateRequest request
    ) {
        return rbacService.updateRole(rolePublicId, request);
    }

    @PreAuthorize("hasAuthority('" + ROLE_DELETE + "')")
    @DeleteMapping("/roles/{rolePublicId}")
    public String deleteRole(@PathVariable UUID rolePublicId) {
        rbacService.deleteRole(rolePublicId);
        return "Role deleted successfully";
    }

    @PreAuthorize("hasAuthority('" + ROLE_ASSIGN_PERMISSION + "')")
    @PutMapping("/roles/{rolePublicId}/permissions")
    public RoleResponse assignPermissionsToRole(
            @PathVariable UUID rolePublicId,
            @Valid @RequestBody AssignRolePermissionsRequest request
    ) {
        return rbacService.assignPermissionsToRole(rolePublicId, request);
    }

    @PreAuthorize("hasAuthority('" + USER_ASSIGN_ROLE + "')")
    @PutMapping("/users/{userPublicId}/roles")
    public UserResponse assignRolesToUser(
            @PathVariable UUID userPublicId,
            @Valid @RequestBody AssignUserRolesRequest request
    ) {
        return rbacService.assignRolesToUser(userPublicId, request);
    }
}