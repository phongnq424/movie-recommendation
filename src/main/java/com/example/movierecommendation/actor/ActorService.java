package com.example.movierecommendation.actor;

import com.example.movierecommendation.actor.dto.ActorRequest;
import com.example.movierecommendation.actor.dto.ActorResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ActorService {

    private final ActorRepository actorRepository;

    public List<ActorResponse> getAllActors() {
        return actorRepository.findAll()
                .stream()
                .map(ActorResponse::from)
                .toList();
    }

    public ActorResponse getActorById(Long id) {
        Actor actor = getActorEntityById(id);
        return ActorResponse.from(actor);
    }

    public List<ActorResponse> searchActors(String keyword) {
        return actorRepository.findByFullNameContainingIgnoreCase(keyword)
                .stream()
                .map(ActorResponse::from)
                .toList();
    }

    public List<ActorResponse> getFeaturedActors() {
        return actorRepository.findByFeaturedTrue()
                .stream()
                .map(ActorResponse::from)
                .toList();
    }

    public ActorResponse createActor(ActorRequest request) {
        validateActorRequest(request);

        Actor actor = Actor.builder()
                .fullName(request.getFullName())
                .biography(request.getBiography())
                .avatarUrl(request.getAvatarUrl())
                .nationality(request.getNationality())
                .birthYear(request.getBirthYear())
                .featured(request.getFeatured() != null ? request.getFeatured() : false)
                .build();

        return ActorResponse.from(actorRepository.save(actor));
    }

    public ActorResponse updateActor(Long id, ActorRequest request) {
        validateActorRequest(request);

        Actor actor = getActorEntityById(id);

        actor.setFullName(request.getFullName());
        actor.setBiography(request.getBiography());
        actor.setAvatarUrl(request.getAvatarUrl());
        actor.setNationality(request.getNationality());
        actor.setBirthYear(request.getBirthYear());
        actor.setFeatured(request.getFeatured() != null ? request.getFeatured() : false);

        return ActorResponse.from(actorRepository.save(actor));
    }

    public void deleteActor(Long id) {
        Actor actor = getActorEntityById(id);
        actorRepository.delete(actor);
    }

    public Actor getActorEntityById(Long id) {
        return actorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Actor not found"));
    }

    private void validateActorRequest(ActorRequest request) {
        if (request.getFullName() == null || request.getFullName().isBlank()) {
            throw new RuntimeException("Actor full name is required");
        }
    }
}