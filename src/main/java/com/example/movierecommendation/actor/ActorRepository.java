package com.example.movierecommendation.actor;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ActorRepository extends JpaRepository<Actor, Long> {

    List<Actor> findByFullNameContainingIgnoreCase(String keyword);

    List<Actor> findByFeaturedTrue();
}