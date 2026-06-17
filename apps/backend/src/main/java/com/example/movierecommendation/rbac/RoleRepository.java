package com.example.movierecommendation.rbac;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RoleRepository extends JpaRepository<Role, Long> {

    Optional<Role> findByPublicId(UUID publicId);

    Optional<Role> findByName(String name);

    boolean existsByName(String name);

    List<Role> findByActiveTrue();

    @EntityGraph(attributePaths = {"permissions"})
    Optional<Role> findWithPermissionsByPublicId(UUID publicId);

    @EntityGraph(attributePaths = {"permissions"})
    Optional<Role> findWithPermissionsByName(String name);
}