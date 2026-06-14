package com.example.movierecommendation.rbac;

import com.example.movierecommendation.common.exception.BadRequestException;
import com.example.movierecommendation.common.exception.ConflictException;
import com.example.movierecommendation.common.exception.ResourceNotFoundException;
import com.example.movierecommendation.rbac.dto.*;
import com.example.movierecommendation.user.User;
import com.example.movierecommendation.user.UserRepository;
import com.example.movierecommendation.user.dto.UserResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RbacService {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<RoleResponse> getRoles() {
        return roleRepository.findAll()
                .stream()
                .map(RoleResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PermissionResponse> getPermissions() {
        return permissionRepository.findAll()
                .stream()
                .map(PermissionResponse::from)
                .toList();
    }

    @Transactional
    public RoleResponse createRole(RoleCreateRequest request) {
        String name = normalizeRoleName(request.getName());

        if (roleRepository.existsByName(name)) {
            throw new ConflictException("Role already exists");
        }

        Role role = Role.builder()
                .name(name)
                .description(trimToNull(request.getDescription()))
                .systemRole(false)
                .active(true)
                .build();

        return RoleResponse.from(roleRepository.save(role));
    }

    @Transactional
    public RoleResponse updateRole(UUID rolePublicId, RoleUpdateRequest request) {
        Role role = roleRepository.findWithPermissionsByPublicId(rolePublicId)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found"));

        if (Boolean.TRUE.equals(role.getSystemRole()) && Boolean.FALSE.equals(request.getActive())) {
            throw new BadRequestException("System role cannot be disabled");
        }

        if (request.getDescription() != null) {
            role.setDescription(trimToNull(request.getDescription()));
        }

        if (request.getActive() != null) {
            role.setActive(request.getActive());
        }

        return RoleResponse.from(roleRepository.save(role));
    }

    @Transactional
    public void deleteRole(UUID rolePublicId) {
        Role role = roleRepository.findByPublicId(rolePublicId)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found"));

        if (Boolean.TRUE.equals(role.getSystemRole())) {
            throw new BadRequestException("System role cannot be deleted");
        }

        roleRepository.delete(role);
    }

    @Transactional
    public RoleResponse assignPermissionsToRole(
            UUID rolePublicId,
            AssignRolePermissionsRequest request
    ) {
        Role role = roleRepository.findWithPermissionsByPublicId(rolePublicId)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found"));

        Set<String> requestedCodes = normalizeCodes(request.getPermissionCodes());

        List<Permission> permissions = permissionRepository.findByCodeIn(requestedCodes);

        if (permissions.size() != requestedCodes.size()) {
            throw new BadRequestException("One or more permissions do not exist");
        }

        role.setPermissions(new HashSet<>(permissions));

        return RoleResponse.from(roleRepository.save(role));
    }

    @Transactional
    public UserResponse assignRolesToUser(
            UUID userPublicId,
            AssignUserRolesRequest request
    ) {
        User user = userRepository.findWithRolesByPublicId(userPublicId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Set<String> requestedRoleNames = normalizeCodes(request.getRoleNames());

        if (requestedRoleNames.isEmpty()) {
            throw new BadRequestException("User must have at least one role");
        }

        List<Role> roles = requestedRoleNames
                .stream()
                .map(roleName -> roleRepository.findWithPermissionsByName(roleName)
                        .orElseThrow(() -> new BadRequestException("Role does not exist: " + roleName)))
                .toList();

        boolean hasInactiveRole = roles.stream()
                .anyMatch(role -> !Boolean.TRUE.equals(role.getActive()));

        if (hasInactiveRole) {
            throw new BadRequestException("Cannot assign inactive role");
        }

        user.setRoles(new HashSet<>(roles));

        return UserResponse.from(userRepository.save(user));
    }

    private String normalizeRoleName(String name) {
        if (name == null || name.isBlank()) {
            throw new BadRequestException("Role name is required");
        }

        return name.trim().toUpperCase();
    }

    private Set<String> normalizeCodes(Set<String> values) {
        if (values == null) {
            throw new BadRequestException("Values are required");
        }

        Set<String> normalized = new HashSet<>();

        for (String value : values) {
            if (value != null && !value.isBlank()) {
                normalized.add(value.trim().toUpperCase());
            }
        }

        return normalized;
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }
}