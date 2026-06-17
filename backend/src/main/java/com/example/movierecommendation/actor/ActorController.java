package com.example.movierecommendation.actor;

import com.example.movierecommendation.actor.dto.ActorRequest;
import com.example.movierecommendation.actor.dto.ActorResponse;
import com.example.movierecommendation.actor.dto.BulkActorDeleteRequest;
import com.example.movierecommendation.common.PageResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

import static com.example.movierecommendation.rbac.PermissionCode.*;

@RestController
@RequestMapping("/api/actors")
@RequiredArgsConstructor
@CrossOrigin("*")
public class ActorController {

    private final ActorService actorService;

    @PreAuthorize("hasAuthority('" + ACTOR_READ_ADMIN + "')")
    @GetMapping
    public PageResponse<ActorResponse> getAllActors(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return actorService.getAllActors(page, size);
    }

    @GetMapping("/active")
    public List<ActorResponse> getActiveActors() {
        return actorService.getActiveActors();
    }

    @PreAuthorize("hasAuthority('" + ACTOR_READ_ADMIN + "')")
    @GetMapping("/search")
    public PageResponse<ActorResponse> searchActors(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return actorService.searchActors(keyword, page, size);
    }

    @GetMapping("/featured")
    public List<ActorResponse> getFeaturedActors() {
        return actorService.getFeaturedActors();
    }

    @PreAuthorize("hasAuthority('" + ACTOR_READ_ADMIN + "')")
    @GetMapping("/{publicId}")
    public ActorResponse getActorByPublicId(@PathVariable UUID publicId) {
        return actorService.getActorByPublicId(publicId);
    }

    @PreAuthorize("hasAuthority('" + ACTOR_CREATE + "')")
    @PostMapping
    public ActorResponse createActor(@Valid @RequestBody ActorRequest request) {
        return actorService.createActor(request);
    }

    @PreAuthorize("hasAuthority('" + ACTOR_CREATE + "')")
    @PostMapping("/bulk")
    public List<ActorResponse> createActors(
            @Valid @RequestBody List<ActorRequest> requests
    ) {
        return actorService.createActors(requests);
    }

    @PreAuthorize("hasAuthority('" + ACTOR_UPDATE + "')")
    @PutMapping("/{publicId}")
    public ActorResponse updateActor(
            @PathVariable UUID publicId,
            @Valid @RequestBody ActorRequest request
    ) {
        return actorService.updateActor(publicId, request);
    }

    @PreAuthorize("hasAuthority('" + ACTOR_CHANGE_STATUS + "')")
    @PutMapping("/{publicId}/status")
    public ActorResponse updateActorStatus(
            @PathVariable UUID publicId,
            @RequestParam String status
    ) {
        return actorService.updateActorStatus(publicId, status);
    }

    @PreAuthorize("hasAuthority('" + ACTOR_DELETE + "')")
    @DeleteMapping("/{publicId}")
    public ActorResponse deleteActor(@PathVariable UUID publicId) {
        return actorService.deleteActor(publicId);
    }

    @PreAuthorize("hasAuthority('" + ACTOR_DELETE + "')")
    @PostMapping("/bulk-delete")
    public List<ActorResponse> deleteActors(
            @Valid @RequestBody BulkActorDeleteRequest request
    ) {
        return actorService.deleteActors(request.getPublicIds());
    }
}