package com.example.movierecommendation.actor;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ActorRepository extends JpaRepository<Actor, Long> {

    List<Actor> findByFullNameContainingIgnoreCase(String keyword);

    List<Actor> findByFeaturedTrue();

    List<Actor> findByStatus(String status);

    Optional<Actor> findByPublicId(UUID publicId);

    List<Actor> findAllByPublicIdIn(List<UUID> publicIds);

    boolean existsByPublicId(UUID publicId);
}