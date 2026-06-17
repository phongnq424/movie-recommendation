package com.example.movierecommendation.rbac;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static com.example.movierecommendation.rbac.PermissionCode.*;

@Component
@RequiredArgsConstructor
public class RbacBootstrap implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;

    @Override
    @Transactional
    public void run(String... args) {
        Map<String, PermissionSeed> permissions = new LinkedHashMap<>();

        add(permissions, USER_READ, "USER", "READ", "View users");
        add(permissions, USER_UPDATE, "USER", "UPDATE", "Update user profile");
        add(permissions, USER_CHANGE_STATUS, "USER", "CHANGE_STATUS", "Change user status");
        add(permissions, USER_DELETE, "USER", "DELETE", "Delete user");
        add(permissions, USER_ASSIGN_ROLE, "USER", "ASSIGN_ROLE", "Assign roles to user");

        add(permissions, ROLE_READ, "RBAC", "READ_ROLE", "View roles");
        add(permissions, ROLE_CREATE, "RBAC", "CREATE_ROLE", "Create role");
        add(permissions, ROLE_UPDATE, "RBAC", "UPDATE_ROLE", "Update role");
        add(permissions, ROLE_DELETE, "RBAC", "DELETE_ROLE", "Delete role");
        add(permissions, ROLE_ASSIGN_PERMISSION, "RBAC", "ASSIGN_PERMISSION", "Assign permissions to role");
        add(permissions, PERMISSION_READ, "RBAC", "READ_PERMISSION", "View permissions");

        add(permissions, MOVIE_READ_ADMIN, "MOVIE", "READ_ADMIN", "View all movies in admin");
        add(permissions, MOVIE_CREATE, "MOVIE", "CREATE", "Create movie");
        add(permissions, MOVIE_UPDATE, "MOVIE", "UPDATE", "Update movie");
        add(permissions, MOVIE_CHANGE_STATUS, "MOVIE", "CHANGE_STATUS", "Change movie status");
        add(permissions, MOVIE_DELETE, "MOVIE", "DELETE", "Delete movie");

        add(permissions, ACTOR_READ_ADMIN, "ACTOR", "READ_ADMIN", "View all actors in admin");
        add(permissions, ACTOR_CREATE, "ACTOR", "CREATE", "Create actor");
        add(permissions, ACTOR_UPDATE, "ACTOR", "UPDATE", "Update actor");
        add(permissions, ACTOR_CHANGE_STATUS, "ACTOR", "CHANGE_STATUS", "Change actor status");
        add(permissions, ACTOR_DELETE, "ACTOR", "DELETE", "Delete actor");

        add(permissions, GENRE_READ_ADMIN, "GENRE", "READ_ADMIN", "View all genres in admin");
        add(permissions, GENRE_CREATE, "GENRE", "CREATE", "Create genre");
        add(permissions, GENRE_UPDATE, "GENRE", "UPDATE", "Update genre");
        add(permissions, GENRE_CHANGE_STATUS, "GENRE", "CHANGE_STATUS", "Change genre status");
        add(permissions, GENRE_DELETE, "GENRE", "DELETE", "Delete genre");

        add(permissions, MOVIE_CAST_MANAGE, "MOVIE_CAST", "MANAGE", "Manage movie cast");
        add(permissions, MOVIE_GENRE_MANAGE, "MOVIE_GENRE", "MANAGE", "Manage movie genres");

        add(permissions, REVIEW_WRITE, "REVIEW", "WRITE", "Create or update own review");
        add(permissions, REVIEW_READ_OWN, "REVIEW", "READ_OWN", "View own reviews");
        add(permissions, REVIEW_UPDATE_OWN, "REVIEW", "UPDATE_OWN", "Update own review");
        add(permissions, REVIEW_DELETE_OWN, "REVIEW", "DELETE_OWN", "Delete own review");
        add(permissions, REVIEW_READ_ADMIN, "REVIEW", "READ_ADMIN", "View all reviews in admin");
        add(permissions, REVIEW_MODERATE, "REVIEW", "MODERATE", "Moderate reviews");
        add(permissions, REVIEW_DELETE_ANY, "REVIEW", "DELETE_ANY", "Delete any review");

        add(permissions, RATING_WRITE, "RATING", "WRITE", "Rate movie");
        add(permissions, RATING_READ_ADMIN, "RATING", "READ_ADMIN", "View ratings in admin");

        add(permissions, RECOMMENDATION_READ_OWN, "RECOMMENDATION", "READ_OWN", "View own recommendations");
        add(permissions, RECOMMENDATION_REFRESH_OWN, "RECOMMENDATION", "REFRESH_OWN", "Refresh own recommendations");
        add(permissions, RECOMMENDATION_REFRESH_PUBLIC, "RECOMMENDATION", "REFRESH_PUBLIC", "Refresh public recommendations");

        add(permissions, INTERACTION_WRITE, "INTERACTION", "WRITE", "Track user interactions");
        add(permissions, INTERACTION_READ_OWN, "INTERACTION", "READ_OWN", "View own interactions");

        for (PermissionSeed seed : permissions.values()) {
            permissionRepository.findByCode(seed.code())
                    .orElseGet(() -> permissionRepository.save(
                            Permission.builder()
                                    .code(seed.code())
                                    .module(seed.module())
                                    .action(seed.action())
                                    .description(seed.description())
                                    .active(true)
                                    .build()
                    ));
        }

        Role userRole = roleRepository.findWithPermissionsByName("USER")
                .orElseGet(() -> roleRepository.save(
                        Role.builder()
                                .name("USER")
                                .description("Default authenticated user")
                                .systemRole(true)
                                .active(true)
                                .build()
                ));

        Role adminRole = roleRepository.findWithPermissionsByName("ADMIN")
                .orElseGet(() -> roleRepository.save(
                        Role.builder()
                                .name("ADMIN")
                                .description("System administrator")
                                .systemRole(true)
                                .active(true)
                                .build()
                ));

        List<String> userPermissions = List.of(
                REVIEW_WRITE,
                REVIEW_READ_OWN,
                REVIEW_UPDATE_OWN,
                REVIEW_DELETE_OWN,
                RATING_WRITE,
                RECOMMENDATION_READ_OWN,
                RECOMMENDATION_REFRESH_OWN,
                INTERACTION_WRITE,
                INTERACTION_READ_OWN
        );

        if (userRole.getPermissions() == null) {
            userRole.setPermissions(new HashSet<>());
        }

        userRole.getPermissions().clear();
        userRole.getPermissions().addAll(permissionRepository.findByCodeIn(userPermissions));
        roleRepository.save(userRole);

        if (adminRole.getPermissions() == null) {
            adminRole.setPermissions(new HashSet<>());
        }

        adminRole.getPermissions().clear();
        adminRole.getPermissions().addAll(permissionRepository.findAll());
        roleRepository.save(adminRole);
    }

    private void add(
            Map<String, PermissionSeed> permissions,
            String code,
            String module,
            String action,
            String description
    ) {
        permissions.put(code, new PermissionSeed(code, module, action, description));
    }

    private record PermissionSeed(
            String code,
            String module,
            String action,
            String description
    ) {
    }
}