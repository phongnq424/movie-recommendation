package com.example.movierecommendation.user;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByPublicId(UUID publicId);

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    List<User> findByFullNameContainingIgnoreCase(String keyword);

    List<User> findByStatus(String status);

    List<User> findByRole(String role);
}