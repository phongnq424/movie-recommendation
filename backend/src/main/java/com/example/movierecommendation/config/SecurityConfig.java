package com.example.movierecommendation.config;

import com.example.movierecommendation.security.CustomAccessDeniedHandler;
import com.example.movierecommendation.security.CustomAuthenticationEntryPoint;
import com.example.movierecommendation.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final UserDetailsService userDetailsService;
    private final CustomAuthenticationEntryPoint authenticationEntryPoint;
    private final CustomAccessDeniedHandler accessDeniedHandler;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> {})
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint(authenticationEntryPoint)
                        .accessDeniedHandler(accessDeniedHandler)
                )
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers(
                                "/swagger-ui/**",
                                "/v3/api-docs/**"
                        ).permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/movies/published").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/movies/slug/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/genres/active").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/actors/active").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/actors/featured").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/reviews/movie/*").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/reviews/user/*").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/users/me").hasAnyRole("USER", "ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/users/me/profile").hasAnyRole("USER", "ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/reviews/movie/*/all").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/reviews/user/*/all").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/reviews/*/status").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/reviews").hasAnyRole("USER", "ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/reviews/me").hasAnyRole("USER", "ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/reviews/*").hasAnyRole("USER", "ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/reviews/*").hasAnyRole("USER", "ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/reviews/*").hasAnyRole("USER", "ADMIN")
                        // PUBLIC RATINGS
                        .requestMatchers(HttpMethod.GET, "/api/ratings/movie/**").permitAll()

                        // USER RATING ACTIONS
                        .requestMatchers(HttpMethod.POST, "/api/ratings").hasAnyRole("USER", "ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/ratings/me").hasAnyRole("USER", "ADMIN")

                        .requestMatchers(HttpMethod.GET, "/api/ratings/user/**").hasRole("ADMIN")

                        // ADMIN MANAGEMENT
                        .requestMatchers("/api/users/**").hasRole("ADMIN")
                        .requestMatchers("/api/movies/**").hasRole("ADMIN")
                        .requestMatchers("/api/genres/**").hasRole("ADMIN")
                        .requestMatchers("/api/actors/**").hasRole("ADMIN")
                        .requestMatchers("/api/movie-genres/**").hasRole("ADMIN")
                        .requestMatchers("/api/movie-actors/**").hasRole("ADMIN")

                        .anyRequest().authenticated()
                )
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                )
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable);

        return http.build();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}