package com.example.movierecommendation.actor;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "actors")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Actor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String fullName;

    @Column(length = 2000)
    private String biography;

    private String avatarUrl;

    private String nationality;

    private Integer birthYear;

    /**
     * Diễn viên nổi bật toàn hệ thống.
     * Dùng cho trang chủ hoặc khu vực Featured Actors.
     */
    private Boolean featured = false;
}