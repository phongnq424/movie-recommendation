package com.example.movierecommendation.user;

import com.example.movierecommendation.rbac.Role;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
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

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "user_roles",
            joinColumns = @JoinColumn(name = "user_id", nullable = false),
            inverseJoinColumns = @JoinColumn(name = "role_id", nullable = false),
            uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "role_id"}),
            indexes = {
                    @Index(name = "idx_user_roles_user_id", columnList = "user_id"),
                    @Index(name = "idx_user_roles_role_id", columnList = "role_id")
            }
    )
    @Builder.Default
    private Set<Role> roles = new HashSet<>();

    @PrePersist
    public void onCreate() {
        if (this.publicId == null) {
            this.publicId = UUID.randomUUID();
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