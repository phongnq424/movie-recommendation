package com.example.movierecommendation.user;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByPublicId(UUID publicId);

    Optional<User> findByEmail(String email);

    @EntityGraph(attributePaths = {"roles", "roles.permissions"})
    Optional<User> findWithRolesByPublicId(UUID publicId);

    @EntityGraph(attributePaths = {"roles", "roles.permissions"})
    Optional<User> findWithRolesByEmail(String email);

    boolean existsByEmail(String email);

    List<User> findByFullNameContainingIgnoreCase(String keyword);

    @EntityGraph(attributePaths = {"roles", "roles.permissions"})
    List<User> findByFullNameContainingIgnoreCaseOrEmailContainingIgnoreCase(
            String fullName,
            String email
    );

    @EntityGraph(attributePaths = {"roles", "roles.permissions"})
    List<User> findByStatus(String status);

    @EntityGraph(attributePaths = {"roles", "roles.permissions"})
    List<User> findDistinctByRoles_Name(String roleName);

    List<User> findByStatusAndLastLoginAtAfter(
            String status,
            LocalDateTime lastLoginAt
    );

    List<User> findByStatusAndLastLoginAtIsNull(String status);
}