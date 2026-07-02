package com.example.movierecommendation.ratelimit;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpMethod;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class RateLimitKeyResolver {

    private final RateLimitProperties properties;

    public RateLimitProperties.Policy resolvePolicy(HttpServletRequest request) {
        String path = request.getRequestURI();
        String method = request.getMethod();

        if (path.startsWith("/api/auth/login")
                || path.startsWith("/api/auth/register")
                || path.startsWith("/api/auth/refresh")) {
            return properties.getAuth();
        }

        if (path.startsWith("/api/recommendations")) {
            return properties.getRecommendation();
        }

        if (path.matches("^/api/movies/[^/]+/view$")) {
            return properties.getView();
        }

        if (!HttpMethod.GET.matches(method)) {
            return properties.getWrite();
        }

        return properties.getDefaultPolicy();
    }

    public String resolveKey(HttpServletRequest request) {
        String pathGroup = resolvePathGroup(request);
        String identity = resolveIdentity(request);

        return "rate-limit:" + pathGroup + ":" + identity;
    }

    private String resolvePathGroup(HttpServletRequest request) {
        String path = request.getRequestURI();

        if (path.startsWith("/api/auth/login")) {
            return "auth:login";
        }

        if (path.startsWith("/api/auth/register")) {
            return "auth:register";
        }

        if (path.startsWith("/api/auth/refresh")) {
            return "auth:refresh";
        }

        if (path.startsWith("/api/recommendations")) {
            return "recommendations";
        }

        if (path.matches("^/api/movies/[^/]+/view$")) {
            return "movie:view";
        }

        if (!HttpMethod.GET.matches(request.getMethod())) {
            return "write:" + request.getMethod() + ":" + path;
        }

        return "read:" + path;
    }

    private String resolveIdentity(HttpServletRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication != null
                && authentication.isAuthenticated()
                && authentication.getName() != null
                && !"anonymousUser".equals(authentication.getName())) {
            return "user:" + authentication.getName();
        }

        return "ip:" + resolveClientIp(request);
    }

    private String resolveClientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");

        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }

        String realIp = request.getHeader("X-Real-IP");

        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }

        return request.getRemoteAddr();
    }
}