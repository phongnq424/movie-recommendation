package com.example.movierecommendation.actor;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
        name = "actors",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = "public_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Actor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * ID public dùng cho API/frontend.
     * Long id chỉ dùng nội bộ database.
     */
    @Column(name = "public_id", nullable = false, unique = true, updatable = false)
    private UUID publicId;

    @Column(nullable = false)
    private String fullName;

    @Column(length = 2000)
    private String biography;

    private String avatarUrl;

    private String nationality;

    private Integer birthYear;

    private Boolean featured;

    /**
     * ACTIVE = đang dùng
     * INACTIVE = tạm ẩn/ngưng dùng
     * DELETED = xóa mềm
     */
    private String status;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    public void onCreate() {
        if (this.publicId == null) {
            this.publicId = UUID.randomUUID();
        }

        if (this.featured == null) {
            this.featured = false;
        }

        if (this.status == null) {
            this.status = "ACTIVE";
        }

        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}