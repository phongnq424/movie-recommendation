package com.example.movierecommendation.review.dto;

import com.example.movierecommendation.review.Review;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
public class ReviewResponse {

    private Long id;

    private Long userId;
    private String userFullName;
    private String userAvatarUrl;

    private Long movieId;
    private String movieTitle;

    private String content;
    private Boolean spoiler;
    private String status;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ReviewResponse from(Review review) {
        return ReviewResponse.builder()
                .id(review.getId())
                .userId(review.getUser().getId())
                .userFullName(review.getUser().getFullName())
                .userAvatarUrl(review.getUser().getAvatarUrl())
                .movieId(review.getMovie().getId())
                .movieTitle(review.getMovie().getTitle())
                .content(review.getContent())
                .spoiler(review.getSpoiler())
                .status(review.getStatus())
                .createdAt(review.getCreatedAt())
                .updatedAt(review.getUpdatedAt())
                .build();
    }
}