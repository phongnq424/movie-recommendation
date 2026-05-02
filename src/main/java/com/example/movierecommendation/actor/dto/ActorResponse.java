package com.example.movierecommendation.actor.dto;

import com.example.movierecommendation.actor.Actor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class ActorResponse {

    private Long id;
    private String fullName;
    private String biography;
    private String avatarUrl;
    private String nationality;
    private Integer birthYear;
    private Boolean featured;

    public static ActorResponse from(Actor actor) {
        return ActorResponse.builder()
                .id(actor.getId())
                .fullName(actor.getFullName())
                .biography(actor.getBiography())
                .avatarUrl(actor.getAvatarUrl())
                .nationality(actor.getNationality())
                .birthYear(actor.getBirthYear())
                .featured(actor.getFeatured())
                .build();
    }
}