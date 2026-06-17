package com.example.movierecommendation.actor.dto;

import com.example.movierecommendation.actor.Actor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
public class ActorResponse {

    private UUID publicId;

    private String fullName;
    private String biography;
    private String avatarUrl;
    private String nationality;
    private Integer birthYear;
    private Boolean featured;
    private String status;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ActorResponse from(Actor actor) {
        return ActorResponse.builder()
                .publicId(actor.getPublicId())
                .fullName(actor.getFullName())
                .biography(actor.getBiography())
                .avatarUrl(actor.getAvatarUrl())
                .nationality(actor.getNationality())
                .birthYear(actor.getBirthYear())
                .featured(actor.getFeatured())
                .status(actor.getStatus())
                .createdAt(actor.getCreatedAt())
                .updatedAt(actor.getUpdatedAt())
                .build();
    }
}