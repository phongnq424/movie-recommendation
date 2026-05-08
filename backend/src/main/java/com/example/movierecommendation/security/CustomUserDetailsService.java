package com.example.movierecommendation.security;

import com.example.movierecommendation.user.User;
import com.example.movierecommendation.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String publicId) throws UsernameNotFoundException {
        User user = userRepository.findByPublicId(UUID.fromString(publicId))
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        String role = user.getRole();

        return new org.springframework.security.core.userdetails.User(
                user.getPublicId().toString(),
                user.getPassword(),
                "ACTIVE".equals(user.getStatus()),
                true,
                true,
                true,
                List.of(new SimpleGrantedAuthority("ROLE_" + role))
        );
    }
}