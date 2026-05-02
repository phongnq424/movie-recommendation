package com.example.movierecommendation.movieactor.dto;

import com.example.movierecommendation.movieactor.MovieActor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@Builder
public class MovieActorResponse {

    private UUID moviePublicId;
    private String movieTitle;
    private String movieSlug;

    private UUID actorPublicId;
    private String actorFullName;
    private String actorAvatarUrl;

    private String characterName;
    private Integer castOrder;
    private Boolean mainCast;

    public static MovieActorResponse from(MovieActor movieActor) {
        return MovieActorResponse.builder()
                .moviePublicId(movieActor.getMovie().getPublicId())
                .movieTitle(movieActor.getMovie().getTitle())
                .movieSlug(movieActor.getMovie().getSlug())
                .actorPublicId(movieActor.getActor().getPublicId())
                .actorFullName(movieActor.getActor().getFullName())
                .actorAvatarUrl(movieActor.getActor().getAvatarUrl())
                .characterName(movieActor.getCharacterName())
                .castOrder(movieActor.getCastOrder())
                .mainCast(movieActor.getMainCast())
                .build();
    }
}