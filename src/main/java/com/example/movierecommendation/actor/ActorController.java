package com.example.movierecommendation.actor;

import com.example.movierecommendation.actor.dto.ActorRequest;
import com.example.movierecommendation.actor.dto.ActorResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/actors")
@RequiredArgsConstructor
@CrossOrigin("*")
public class ActorController {

    private final ActorService actorService;

    @GetMapping
    public List<ActorResponse> getAllActors() {
        return actorService.getAllActors();
    }

    @GetMapping("/{id}")
    public ActorResponse getActorById(@PathVariable Long id) {
        return actorService.getActorById(id);
    }

    @GetMapping("/search")
    public List<ActorResponse> searchActors(@RequestParam String keyword) {
        return actorService.searchActors(keyword);
    }

    @GetMapping("/featured")
    public List<ActorResponse> getFeaturedActors() {
        return actorService.getFeaturedActors();
    }

    @PostMapping
    public ActorResponse createActor(@RequestBody ActorRequest request) {
        return actorService.createActor(request);
    }

    @PutMapping("/{id}")
    public ActorResponse updateActor(
            @PathVariable Long id,
            @RequestBody ActorRequest request
    ) {
        return actorService.updateActor(id, request);
    }

    @DeleteMapping("/{id}")
    public String deleteActor(@PathVariable Long id) {
        actorService.deleteActor(id);
        return "Actor deleted successfully";
    }
}