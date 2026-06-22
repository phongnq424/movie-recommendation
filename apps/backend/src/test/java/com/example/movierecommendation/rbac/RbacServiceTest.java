package com.example.movierecommendation.rbac;

import com.example.movierecommendation.common.exception.BadRequestException;
import com.example.movierecommendation.common.exception.ConflictException;
import com.example.movierecommendation.rbac.dto.AssignRolePermissionsRequest;
import com.example.movierecommendation.rbac.dto.AssignUserRolesRequest;
import com.example.movierecommendation.rbac.dto.RoleCreateRequest;
import com.example.movierecommendation.rbac.dto.RoleResponse;
import com.example.movierecommendation.rbac.dto.RoleUpdateRequest;
import com.example.movierecommendation.user.User;
import com.example.movierecommendation.user.UserRepository;
import com.example.movierecommendation.user.dto.UserResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RbacServiceTest {

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private PermissionRepository permissionRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private RbacService rbacService;

    @Test
    void createRole_shouldCreateRole_whenNameDoesNotExist() {
        RoleCreateRequest request = new RoleCreateRequest();
        request.setName("moderator");
        request.setDescription("Can manage content");

        Role savedRole = Role.builder()
                .id(1L)
                .publicId(UUID.randomUUID())
                .name("MODERATOR")
                .description("Can manage content")
                .systemRole(false)
                .active(true)
                .permissions(new HashSet<>())
                .build();

        when(roleRepository.existsByName("MODERATOR")).thenReturn(false);
        when(roleRepository.save(any(Role.class))).thenReturn(savedRole);

        RoleResponse response = rbacService.createRole(request);

        assertNotNull(response);
        assertEquals("MODERATOR", response.getName());
        assertEquals("Can manage content", response.getDescription());
        assertTrue(response.getActive());

        verify(roleRepository).save(argThat(role ->
                "MODERATOR".equals(role.getName())
                        && "Can manage content".equals(role.getDescription())
                        && Boolean.FALSE.equals(role.getSystemRole())
                        && Boolean.TRUE.equals(role.getActive())
        ));
    }

    @Test
    void createRole_shouldThrowConflictException_whenRoleNameAlreadyExists() {
        RoleCreateRequest request = new RoleCreateRequest();
        request.setName("admin");
        request.setDescription("Duplicate role");

        when(roleRepository.existsByName("ADMIN")).thenReturn(true);

        assertThrows(ConflictException.class, () -> rbacService.createRole(request));

        verify(roleRepository, never()).save(any(Role.class));
    }

    @Test
    void createRole_shouldThrowBadRequestException_whenNameIsBlank() {
        RoleCreateRequest request = new RoleCreateRequest();
        request.setName("   ");
        request.setDescription("Invalid role");

        assertThrows(BadRequestException.class, () -> rbacService.createRole(request));

        verify(roleRepository, never()).existsByName(anyString());
        verify(roleRepository, never()).save(any(Role.class));
    }

    @Test
    void updateRole_shouldUpdateDescriptionAndActiveStatus_whenRoleIsNotSystemRole() {
        UUID rolePublicId = UUID.randomUUID();

        Role role = Role.builder()
                .id(1L)
                .publicId(rolePublicId)
                .name("MODERATOR")
                .description("Old description")
                .systemRole(false)
                .active(true)
                .permissions(new HashSet<>())
                .build();

        RoleUpdateRequest request = new RoleUpdateRequest();
        request.setDescription("Updated description");
        request.setActive(false);

        when(roleRepository.findWithPermissionsByPublicId(rolePublicId))
                .thenReturn(Optional.of(role));
        when(roleRepository.save(role)).thenReturn(role);

        RoleResponse response = rbacService.updateRole(rolePublicId, request);

        assertEquals("Updated description", response.getDescription());
        assertFalse(response.getActive());
        assertEquals("Updated description", role.getDescription());
        assertFalse(role.getActive());

        verify(roleRepository).save(role);
    }

    @Test
    void updateRole_shouldThrowBadRequestException_whenDisablingSystemRole() {
        UUID rolePublicId = UUID.randomUUID();

        Role role = Role.builder()
                .id(1L)
                .publicId(rolePublicId)
                .name("ADMIN")
                .description("System role")
                .systemRole(true)
                .active(true)
                .permissions(new HashSet<>())
                .build();

        RoleUpdateRequest request = new RoleUpdateRequest();
        request.setActive(false);

        when(roleRepository.findWithPermissionsByPublicId(rolePublicId))
                .thenReturn(Optional.of(role));

        assertThrows(BadRequestException.class, () ->
                rbacService.updateRole(rolePublicId, request)
        );

        verify(roleRepository, never()).save(any(Role.class));
    }

    @Test
    void deleteRole_shouldDeleteRole_whenRoleIsNotSystemRole() {
        UUID rolePublicId = UUID.randomUUID();

        Role role = Role.builder()
                .id(1L)
                .publicId(rolePublicId)
                .name("MODERATOR")
                .systemRole(false)
                .active(true)
                .permissions(new HashSet<>())
                .build();

        when(roleRepository.findByPublicId(rolePublicId)).thenReturn(Optional.of(role));

        rbacService.deleteRole(rolePublicId);

        verify(roleRepository).delete(role);
    }

    @Test
    void deleteRole_shouldThrowBadRequestException_whenRoleIsSystemRole() {
        UUID rolePublicId = UUID.randomUUID();

        Role role = Role.builder()
                .id(1L)
                .publicId(rolePublicId)
                .name("ADMIN")
                .systemRole(true)
                .active(true)
                .permissions(new HashSet<>())
                .build();

        when(roleRepository.findByPublicId(rolePublicId)).thenReturn(Optional.of(role));

        assertThrows(BadRequestException.class, () -> rbacService.deleteRole(rolePublicId));

        verify(roleRepository, never()).delete(any(Role.class));
    }

    @Test
    void assignPermissionsToRole_shouldAssignPermissions_whenPermissionCodesAreValid() {
        UUID rolePublicId = UUID.randomUUID();

        Role role = Role.builder()
                .id(1L)
                .publicId(rolePublicId)
                .name("MODERATOR")
                .systemRole(false)
                .active(true)
                .permissions(new HashSet<>())
                .build();

        Permission readPermission = Permission.builder()
                .id(1L)
                .publicId(UUID.randomUUID())
                .code("MOVIE_READ")
                .module("MOVIE")
                .action("READ")
                .active(true)
                .build();

        Permission updatePermission = Permission.builder()
                .id(2L)
                .publicId(UUID.randomUUID())
                .code("MOVIE_UPDATE")
                .module("MOVIE")
                .action("UPDATE")
                .active(true)
                .build();

        AssignRolePermissionsRequest request = new AssignRolePermissionsRequest();
        request.setPermissionCodes(Set.of("movie_read", " movie_update "));

        when(roleRepository.findWithPermissionsByPublicId(rolePublicId))
                .thenReturn(Optional.of(role));
        when(permissionRepository.findByCodeIn(Set.of("MOVIE_READ", "MOVIE_UPDATE")))
                .thenReturn(List.of(readPermission, updatePermission));
        when(roleRepository.save(role)).thenReturn(role);

        RoleResponse response = rbacService.assignPermissionsToRole(rolePublicId, request);

        assertNotNull(response);
        assertEquals(2, role.getPermissions().size());
        assertTrue(role.getPermissions().contains(readPermission));
        assertTrue(role.getPermissions().contains(updatePermission));

        verify(roleRepository).save(role);
    }

    @Test
    void assignPermissionsToRole_shouldThrowBadRequestException_whenSomePermissionDoesNotExist() {
        UUID rolePublicId = UUID.randomUUID();

        Role role = Role.builder()
                .id(1L)
                .publicId(rolePublicId)
                .name("MODERATOR")
                .systemRole(false)
                .active(true)
                .permissions(new HashSet<>())
                .build();

        Permission readPermission = Permission.builder()
                .id(1L)
                .publicId(UUID.randomUUID())
                .code("MOVIE_READ")
                .module("MOVIE")
                .action("READ")
                .active(true)
                .build();

        AssignRolePermissionsRequest request = new AssignRolePermissionsRequest();
        request.setPermissionCodes(Set.of("MOVIE_READ", "MOVIE_UPDATE"));

        when(roleRepository.findWithPermissionsByPublicId(rolePublicId))
                .thenReturn(Optional.of(role));
        when(permissionRepository.findByCodeIn(Set.of("MOVIE_READ", "MOVIE_UPDATE")))
                .thenReturn(List.of(readPermission));

        assertThrows(BadRequestException.class, () ->
                rbacService.assignPermissionsToRole(rolePublicId, request)
        );

        verify(roleRepository, never()).save(any(Role.class));
    }

    @Test
    void assignRolesToUser_shouldAssignRoles_whenRolesAreActive() {
        UUID userPublicId = UUID.randomUUID();

        User user = User.builder()
                .id(1L)
                .publicId(userPublicId)
                .email("user@email.com")
                .fullName("User")
                .status("ACTIVE")
                .roles(new HashSet<>())
                .build();

        Role userRole = Role.builder()
                .id(1L)
                .publicId(UUID.randomUUID())
                .name("USER")
                .systemRole(true)
                .active(true)
                .permissions(new HashSet<>())
                .build();

        Role moderatorRole = Role.builder()
                .id(2L)
                .publicId(UUID.randomUUID())
                .name("MODERATOR")
                .systemRole(false)
                .active(true)
                .permissions(new HashSet<>())
                .build();

        AssignUserRolesRequest request = new AssignUserRolesRequest();
        request.setRoleNames(Set.of("user", " moderator "));

        when(userRepository.findWithRolesByPublicId(userPublicId)).thenReturn(Optional.of(user));
        when(roleRepository.findWithPermissionsByName("USER")).thenReturn(Optional.of(userRole));
        when(roleRepository.findWithPermissionsByName("MODERATOR")).thenReturn(Optional.of(moderatorRole));
        when(userRepository.save(user)).thenReturn(user);

        UserResponse response = rbacService.assignRolesToUser(userPublicId, request);

        assertNotNull(response);
        assertEquals(2, user.getRoles().size());
        assertTrue(user.getRoles().contains(userRole));
        assertTrue(user.getRoles().contains(moderatorRole));

        verify(userRepository).save(user);
    }

    @Test
    void assignRolesToUser_shouldThrowBadRequestException_whenRoleListIsEmpty() {
        UUID userPublicId = UUID.randomUUID();

        User user = User.builder()
                .id(1L)
                .publicId(userPublicId)
                .email("user@email.com")
                .fullName("User")
                .status("ACTIVE")
                .roles(new HashSet<>())
                .build();

        AssignUserRolesRequest request = new AssignUserRolesRequest();
        request.setRoleNames(Set.of(" ", ""));

        when(userRepository.findWithRolesByPublicId(userPublicId)).thenReturn(Optional.of(user));

        assertThrows(BadRequestException.class, () ->
                rbacService.assignRolesToUser(userPublicId, request)
        );

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void assignRolesToUser_shouldThrowBadRequestException_whenRoleIsInactive() {
        UUID userPublicId = UUID.randomUUID();

        User user = User.builder()
                .id(1L)
                .publicId(userPublicId)
                .email("user@email.com")
                .fullName("User")
                .status("ACTIVE")
                .roles(new HashSet<>())
                .build();

        Role inactiveRole = Role.builder()
                .id(1L)
                .publicId(UUID.randomUUID())
                .name("MODERATOR")
                .systemRole(false)
                .active(false)
                .permissions(new HashSet<>())
                .build();

        AssignUserRolesRequest request = new AssignUserRolesRequest();
        request.setRoleNames(Set.of("MODERATOR"));

        when(userRepository.findWithRolesByPublicId(userPublicId)).thenReturn(Optional.of(user));
        when(roleRepository.findWithPermissionsByName("MODERATOR"))
                .thenReturn(Optional.of(inactiveRole));

        assertThrows(BadRequestException.class, () ->
                rbacService.assignRolesToUser(userPublicId, request)
        );

        verify(userRepository, never()).save(any(User.class));
    }
}