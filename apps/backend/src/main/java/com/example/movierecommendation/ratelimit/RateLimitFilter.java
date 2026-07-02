package com.example.movierecommendation.ratelimit;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.bucket4j.ConsumptionProbe;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class RateLimitFilter extends OncePerRequestFilter {

    private static final long NANOS_IN_SECOND = 1_000_000_000L;

    private final RateLimitProperties properties;
    private final RateLimitService rateLimitService;
    private final RateLimitKeyResolver keyResolver;
    private final ObjectMapper objectMapper;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        if (!properties.isEnabled()) {
            return true;
        }

        String path = request.getRequestURI();

        return HttpMethod.OPTIONS.matches(request.getMethod())
                || path.startsWith("/swagger-ui")
                || path.startsWith("/v3/api-docs")
                || path.startsWith("/actuator");
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        RateLimitProperties.Policy policy = keyResolver.resolvePolicy(request);
        String key = keyResolver.resolveKey(request);

        ConsumptionProbe probe = rateLimitService.tryConsume(key, policy);

        response.setHeader("X-Rate-Limit-Limit", String.valueOf(policy.getCapacity()));
        response.setHeader("X-Rate-Limit-Remaining", String.valueOf(probe.getRemainingTokens()));

        if (probe.isConsumed()) {
            filterChain.doFilter(request, response);
            return;
        }

        long retryAfterSeconds = toRetryAfterSeconds(probe.getNanosToWaitForRefill());

        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setHeader("Retry-After", String.valueOf(retryAfterSeconds));
        response.setHeader("X-Rate-Limit-Remaining", "0");

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", LocalDateTime.now().toString());
        body.put("status", HttpStatus.TOO_MANY_REQUESTS.value());
        body.put("error", "Too Many Requests");
        body.put("message", "Too many requests. Please try again later.");
        body.put("retryAfterSeconds", retryAfterSeconds);
        body.put("path", request.getRequestURI());

        objectMapper.writeValue(response.getOutputStream(), body);
    }

    private long toRetryAfterSeconds(long nanosToWait) {
        if (nanosToWait <= 0) {
            return 1;
        }

        return Math.max(1, (nanosToWait + NANOS_IN_SECOND - 1) / NANOS_IN_SECOND);
    }
}