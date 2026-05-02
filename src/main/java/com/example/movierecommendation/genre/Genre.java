package com.example.movierecommendation.genre;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "genres",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = "name"),
                @UniqueConstraint(columnNames = "slug")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Genre {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private String name;
    /**
     * Slug dùng cho URL hoặc filter.
     * Ví dụ: action, comedy, romance.
     */
    @Column(nullable = false)
    private String slug;

    @Column(length = 1000)
    private String description;
    private String status;
}