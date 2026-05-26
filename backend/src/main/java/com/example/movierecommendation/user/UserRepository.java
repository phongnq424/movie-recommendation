package com.example.movierecommendation.user;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByPublicId(UUID publicId);

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    List<User> findByFullNameContainingIgnoreCase(String keyword);

    List<User> findByFullNameContainingIgnoreCaseOrEmailContainingIgnoreCase(
            String fullName,
            String email
    );

    List<User> findByStatus(String status);

    List<User> findByRole(String role);

    List<User> findByStatusAndLastLoginAtAfter(
            String status,
            LocalDateTime lastLoginAt
    );

    List<User> findByStatusAndLastLoginAtIsNull(String status);
}