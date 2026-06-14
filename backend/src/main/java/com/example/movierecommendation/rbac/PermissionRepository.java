package com.example.movierecommendation.rbac;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PermissionRepository extends JpaRepository<Permission, Long> {

    Optional<Permission> findByPublicId(UUID publicId);

    Optional<Permission> findByCode(String code);

    boolean existsByCode(String code);

    List<Permission> findByActiveTrue();

    List<Permission> findByCodeIn(Collection<String> codes);
}