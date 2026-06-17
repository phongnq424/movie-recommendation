package com.example.movierecommendation.auth;

import com.example.movierecommendation.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserLoginAuditService {

    private final UserLoginAuditRepository userLoginAuditRepository;

    public void recordSuccessfulLogin(User user, LoginMetadata metadata) {
        UserLoginAudit audit = UserLoginAudit.builder()
                .user(user)
                .ipAddress(metadata.getIpAddress())
                .userAgent(metadata.getUserAgent())
                .deviceType(metadata.getDeviceType())
                .browser(metadata.getBrowser())
                .operatingSystem(metadata.getOperatingSystem())
                .successful(true)
                .build();

        userLoginAuditRepository.save(audit);
    }

    public void recordFailedLogin(String email, LoginMetadata metadata, String reason) {
        UserLoginAudit audit = UserLoginAudit.builder()
                .ipAddress(metadata.getIpAddress())
                .userAgent(metadata.getUserAgent())
                .deviceType(metadata.getDeviceType())
                .browser(metadata.getBrowser())
                .operatingSystem(metadata.getOperatingSystem())
                .successful(false)
                .failureReason(email == null ? reason : reason + " | email=" + email)
                .build();

        userLoginAuditRepository.save(audit);
    }
}