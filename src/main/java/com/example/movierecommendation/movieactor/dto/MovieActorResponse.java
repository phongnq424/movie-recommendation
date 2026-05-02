package com.example.movierecommendation.movieactor.dto;

import com.example.movierecommendation.movieactor.MovieActor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class MovieActorResponse {

    private Long id;

    private Long movieId;
    private String movieTitle;

    private Long actorId;
    private String actorFullName;
    private String actorAvatarUrl;

    private String characterName;
    private Integer castOrder;
    private Boolean mainCast;

    public static MovieActorResponse from(MovieActor movieActor) {
        return MovieActorResponse.builder()
                .id(movieActor.getId())
                .movieId(movieActor.getMovie().getId())
                .movieTitle(movieActor.getMovie().getTitle())
                .actorId(movieActor.getActor().getId())
                .actorFullName(movieActor.getActor().getFullName())
                .actorAvatarUrl(movieActor.getActor().getAvatarUrl())
                .characterName(movieActor.getCharacterName())
                .castOrder(movieActor.getCastOrder())
                .mainCast(movieActor.getMainCast())
                .build();
    }
}