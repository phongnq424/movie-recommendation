package com.example.movierecommendation.review.dto;

import com.example.movierecommendation.review.Review;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
public class ReviewResponse {

    private Long id;

    private UUID userPublicId;
    private String userFullName;
    private String userAvatarUrl;

    private UUID moviePublicId;
    private String movieTitle;

    private String content;
    private Boolean spoiler;
    private String status;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ReviewResponse from(Review review) {
        return ReviewResponse.builder()
                .id(review.getId())
                .userPublicId(review.getUser().getPublicId())
                .userFullName(review.getUser().getFullName())
                .userAvatarUrl(review.getUser().getAvatarUrl())
                .moviePublicId(review.getMovie().getPublicId())
                .movieTitle(review.getMovie().getTitle())
                .content(review.getContent())
                .spoiler(review.getSpoiler())
                .status(review.getStatus())
                .createdAt(review.getCreatedAt())
                .updatedAt(review.getUpdatedAt())
                .build();
    }
}