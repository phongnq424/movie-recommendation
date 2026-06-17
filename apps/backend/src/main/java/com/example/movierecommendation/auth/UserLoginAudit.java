package com.example.movierecommendation.auth;

import com.example.movierecommendation.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "user_login_audits",
        indexes = {
                @Index(name = "idx_user_login_audit_user_id", columnList = "user_id"),
                @Index(name = "idx_user_login_audit_login_at", columnList = "login_at")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserLoginAudit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDateTime loginAt;

    private String ipAddress;

    private String deviceType;

    private String browser;

    private String operatingSystem;

    @Column(length = 1000)
    private String userAgent;

    private Boolean successful;

    private String failureReason;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @PrePersist
    public void onCreate() {
        if (this.loginAt == null) {
            this.loginAt = LocalDateTime.now();
        }

        if (this.successful == null) {
            this.successful = true;
        }
    }
}