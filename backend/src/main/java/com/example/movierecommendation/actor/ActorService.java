package com.example.movierecommendation.actor;

import com.example.movierecommendation.actor.dto.ActorRequest;
import com.example.movierecommendation.actor.dto.ActorResponse;
import com.example.movierecommendation.common.PageResponse;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ActorService {

    private static final String STATUS_ACTIVE = "ACTIVE";
    private static final String STATUS_INACTIVE = "INACTIVE";
    private static final String STATUS_DELETED = "DELETED";

    private final ActorRepository actorRepository;

    public PageResponse<ActorResponse> getAllActors(int page, int size) {
        Pageable pageable = createPageable(page, size);

        Page<ActorResponse> actors = actorRepository
                .findByStatusNot(STATUS_DELETED, pageable)
                .map(ActorResponse::from);

        return PageResponse.from(actors);
    }

    public List<ActorResponse> getActiveActors() {
        return actorRepository.findByStatus(STATUS_ACTIVE)
                .stream()
                .map(ActorResponse::from)
                .toList();
    }

    public ActorResponse getActorByPublicId(UUID publicId) {
        Actor actor = getActorEntityByPublicId(publicId);
        return ActorResponse.from(actor);
    }

    public PageResponse<ActorResponse> searchActors(String keyword, int page, int size) {
        Pageable pageable = createPageable(page, size);
        String safeKeyword = keyword == null ? "" : keyword.trim();

        Page<ActorResponse> actors = actorRepository
                .findByFullNameContainingIgnoreCaseAndStatusNot(
                        safeKeyword,
                        STATUS_DELETED,
                        pageable
                )
                .map(ActorResponse::from);

        return PageResponse.from(actors);
    }

    public List<ActorResponse> getFeaturedActors() {
        return actorRepository.findByFeaturedTrue()
                .stream()
                .filter(actor -> STATUS_ACTIVE.equals(actor.getStatus()))
                .map(ActorResponse::from)
                .toList();
    }

    public ActorResponse createActor(ActorRequest request) {
        return createActors(List.of(request)).get(0);
    }

    @Transactional
    public List<ActorResponse> createActors(List<ActorRequest> requests) {
        if (requests == null || requests.isEmpty()) {
            throw new RuntimeException("Actor list is required");
        }

        List<Actor> actors = requests.stream()
                .map(request -> {
                    validateActorRequest(request);

                    return Actor.builder()
                            .fullName(request.getFullName().trim())
                            .biography(request.getBiography())
                            .avatarUrl(request.getAvatarUrl())
                            .nationality(request.getNationality())
                            .birthYear(request.getBirthYear())
                            .featured(request.getFeatured() != null ? request.getFeatured() : false)
                            .status(normalizeStatus(request.getStatus()))
                            .build();
                })
                .toList();

        return actorRepository.saveAll(actors)
                .stream()
                .map(ActorResponse::from)
                .toList();
    }

    public ActorResponse updateActor(UUID publicId, ActorRequest request) {
        validateActorRequest(request);

        Actor actor = getActorEntityByPublicId(publicId);

        actor.setFullName(request.getFullName().trim());
        actor.setBiography(request.getBiography());
        actor.setAvatarUrl(request.getAvatarUrl());
        actor.setNationality(request.getNationality());
        actor.setBirthYear(request.getBirthYear());
        actor.setFeatured(request.getFeatured() != null ? request.getFeatured() : false);

        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            actor.setStatus(normalizeStatus(request.getStatus()));
        }

        return ActorResponse.from(actorRepository.save(actor));
    }

    public ActorResponse updateActorStatus(UUID publicId, String status) {
        Actor actor = getActorEntityByPublicId(publicId);

        String normalizedStatus = normalizeStatus(status);
        actor.setStatus(normalizedStatus);

        if (STATUS_DELETED.equals(normalizedStatus)) {
            actor.setFeatured(false);
        }

        return ActorResponse.from(actorRepository.save(actor));
    }

    public ActorResponse deleteActor(UUID publicId) {
        Actor actor = getActorEntityByPublicId(publicId);

        actor.setStatus(STATUS_DELETED);
        actor.setFeatured(false);

        return ActorResponse.from(actorRepository.save(actor));
    }

    @Transactional
    public List<ActorResponse> deleteActors(List<UUID> publicIds) {
        validatePublicIds(publicIds);

        List<Actor> actors = actorRepository.findAllByPublicIdIn(publicIds);

        if (actors.size() != publicIds.size()) {
            throw new RuntimeException("Some actors were not found");
        }

        actors.forEach(actor -> {
            actor.setStatus(STATUS_DELETED);
            actor.setFeatured(false);
        });

        return actorRepository.saveAll(actors)
                .stream()
                .map(ActorResponse::from)
                .toList();
    }

    public Actor getActorEntityByPublicId(UUID publicId) {
        if (publicId == null) {
            throw new RuntimeException("Actor public ID is required");
        }

        return actorRepository.findByPublicId(publicId)
                .orElseThrow(() -> new RuntimeException("Actor not found"));
    }

    private void validateActorRequest(ActorRequest request) {
        if (request == null) {
            throw new RuntimeException("Actor request is required");
        }

        if (request.getFullName() == null || request.getFullName().isBlank()) {
            throw new RuntimeException("Actor full name is required");
        }
    }

    private void validatePublicIds(List<UUID> publicIds) {
        if (publicIds == null || publicIds.isEmpty()) {
            throw new RuntimeException("Actor public IDs are required");
        }
    }

    private String normalizeStatus(String status) {
        if (status == null || status.isBlank()) {
            return STATUS_ACTIVE;
        }

        String normalizedStatus = status.trim().toUpperCase();

        if (!normalizedStatus.equals(STATUS_ACTIVE)
                && !normalizedStatus.equals(STATUS_INACTIVE)
                && !normalizedStatus.equals(STATUS_DELETED)) {
            throw new RuntimeException("Actor status must be ACTIVE, INACTIVE, or DELETED");
        }

        return normalizedStatus;
    }

    private Pageable createPageable(int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 50);

        return PageRequest.of(
                safePage,
                safeSize,
                Sort.by(Sort.Direction.DESC, "createdAt")
        );
    }
}