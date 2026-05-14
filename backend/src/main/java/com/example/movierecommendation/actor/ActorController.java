package com.example.movierecommendation.actor;

import com.example.movierecommendation.actor.dto.ActorRequest;
import com.example.movierecommendation.actor.dto.ActorResponse;
import com.example.movierecommendation.actor.dto.BulkActorDeleteRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/actors")
@RequiredArgsConstructor
@CrossOrigin("*")
public class ActorController {

    private final ActorService actorService;

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public List<ActorResponse> getAllActors() {
        return actorService.getAllActors();
    }

    /**
     * Public API for frontend movie detail/cast display.
     */
    @GetMapping("/active")
    public List<ActorResponse> getActiveActors() {
        return actorService.getActiveActors();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/search")
    public List<ActorResponse> searchActors(@RequestParam String keyword) {
        return actorService.searchActors(keyword);
    }

    /**
     * Public API for homepage / featured actor section.
     */
    @GetMapping("/featured")
    public List<ActorResponse> getFeaturedActors() {
        return actorService.getFeaturedActors();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{publicId}")
    public ActorResponse getActorByPublicId(@PathVariable UUID publicId) {
        return actorService.getActorByPublicId(publicId);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ActorResponse createActor(@Valid @RequestBody ActorRequest request) {
        return actorService.createActor(request);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/bulk")
    public List<ActorResponse> createActors(
            @Valid @RequestBody List<ActorRequest> requests
    ) {
        return actorService.createActors(requests);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{publicId}")
    public ActorResponse updateActor(
            @PathVariable UUID publicId,
            @Valid @RequestBody ActorRequest request
    ) {
        return actorService.updateActor(publicId, request);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{publicId}/status")
    public ActorResponse updateActorStatus(
            @PathVariable UUID publicId,
            @RequestParam String status
    ) {
        return actorService.updateActorStatus(publicId, status);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{publicId}")
    public ActorResponse deleteActor(@PathVariable UUID publicId) {
        return actorService.deleteActor(publicId);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/bulk-delete")
    public List<ActorResponse> deleteActors(
            @Valid @RequestBody BulkActorDeleteRequest request
    ) {
        return actorService.deleteActors(request.getPublicIds());
    }
}