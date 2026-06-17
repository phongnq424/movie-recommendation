package com.example.movierecommendation.actor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ActorRepository extends JpaRepository<Actor, Long> {

    Page<Actor> findByStatusNot(String status, Pageable pageable);

    Page<Actor> findByFullNameContainingIgnoreCaseAndStatusNot(
            String keyword,
            String status,
            Pageable pageable
    );

    List<Actor> findByFullNameContainingIgnoreCase(String keyword);

    List<Actor> findByFeaturedTrue();

    List<Actor> findByStatus(String status);

    Optional<Actor> findByPublicId(UUID publicId);

    List<Actor> findAllByPublicIdIn(List<UUID> publicIds);

    boolean existsByPublicId(UUID publicId);
}