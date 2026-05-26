package com.example.movierecommendation.user;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
        name = "users",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = "email"),
                @UniqueConstraint(columnNames = "public_id")
        },
        indexes = {
                @Index(name = "idx_users_status", columnList = "status"),
                @Index(name = "idx_users_last_login_at", columnList = "last_login_at")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "public_id", nullable = false, unique = true, updatable = false)
    private UUID publicId;

    @Column(nullable = false)
    private String fullName;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String role;

    private String avatarUrl;

    @Column(nullable = false)
    private String status;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private LocalDateTime lastLoginAt;

    private String lastLoginIp;

    private String lastLoginDeviceType;

    private String lastLoginBrowser;

    private String lastLoginOs;

    @Column(length = 1000)
    private String lastLoginUserAgent;

    @PrePersist
    public void onCreate() {
        if (this.publicId == null) {
            this.publicId = UUID.randomUUID();
        }

        if (this.role == null || this.role.isBlank()) {
            this.role = "USER";
        }

        if (this.status == null || this.status.isBlank()) {
            this.status = "ACTIVE";
        }

        LocalDateTime now = LocalDateTime.now();

        if (this.createdAt == null) {
            this.createdAt = now;
        }

        if (this.updatedAt == null) {
            this.updatedAt = now;
        }
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}