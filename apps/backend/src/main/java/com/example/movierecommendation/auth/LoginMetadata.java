package com.example.movierecommendation.auth;

import jakarta.servlet.http.HttpServletRequest;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class LoginMetadata {

    private String ipAddress;
    private String userAgent;
    private String deviceType;
    private String browser;
    private String operatingSystem;

    public static LoginMetadata from(HttpServletRequest request) {
        String userAgent = request.getHeader("User-Agent");
        String ipAddress = extractIpAddress(request);

        return LoginMetadata.builder()
                .ipAddress(limit(ipAddress, 100))
                .userAgent(limit(userAgent, 1000))
                .deviceType(resolveDeviceType(userAgent))
                .browser(resolveBrowser(userAgent))
                .operatingSystem(resolveOperatingSystem(userAgent))
                .build();
    }

    private static String extractIpAddress(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");

        if (forwardedFor != null && !forwardedFor.isBlank()) {
            int commaIndex = forwardedFor.indexOf(",");

            if (commaIndex >= 0) {
                return forwardedFor.substring(0, commaIndex).trim();
            }

            return forwardedFor.trim();
        }

        String realIp = request.getHeader("X-Real-IP");

        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }

        return request.getRemoteAddr();
    }

    private static String resolveDeviceType(String userAgent) {
        if (userAgent == null || userAgent.isBlank()) {
            return "UNKNOWN";
        }

        String value = userAgent.toLowerCase();

        if (value.contains("mobile") || value.contains("android") || value.contains("iphone")) {
            return "MOBILE";
        }

        if (value.contains("ipad") || value.contains("tablet")) {
            return "TABLET";
        }

        return "DESKTOP";
    }

    private static String resolveBrowser(String userAgent) {
        if (userAgent == null || userAgent.isBlank()) {
            return "UNKNOWN";
        }

        String value = userAgent.toLowerCase();

        if (value.contains("edg/")) {
            return "EDGE";
        }

        if (value.contains("chrome/")) {
            return "CHROME";
        }

        if (value.contains("firefox/")) {
            return "FIREFOX";
        }

        if (value.contains("safari/") && !value.contains("chrome/")) {
            return "SAFARI";
        }

        return "UNKNOWN";
    }

    private static String resolveOperatingSystem(String userAgent) {
        if (userAgent == null || userAgent.isBlank()) {
            return "UNKNOWN";
        }

        String value = userAgent.toLowerCase();

        if (value.contains("windows")) {
            return "WINDOWS";
        }

        if (value.contains("mac os")) {
            return "MACOS";
        }

        if (value.contains("android")) {
            return "ANDROID";
        }

        if (value.contains("iphone") || value.contains("ipad")) {
            return "IOS";
        }

        if (value.contains("linux")) {
            return "LINUX";
        }

        return "UNKNOWN";
    }

    private static String limit(String value, int maxLength) {
        if (value == null) {
            return null;
        }

        if (value.length() <= maxLength) {
            return value;
        }

        return value.substring(0, maxLength);
    }
}