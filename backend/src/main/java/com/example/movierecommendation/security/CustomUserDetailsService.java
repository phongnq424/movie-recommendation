package com.example.movierecommendation.security;

import com.example.movierecommendation.rbac.Permission;
import com.example.movierecommendation.rbac.Role;
import com.example.movierecommendation.user.User;
import com.example.movierecommendation.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String publicId) throws UsernameNotFoundException {
        User user = userRepository.findWithRolesByPublicId(UUID.fromString(publicId))
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        Set<SimpleGrantedAuthority> authorities = new HashSet<>();

        for (Role role : user.getRoles()) {
            if (Boolean.TRUE.equals(role.getActive())) {
                authorities.add(new SimpleGrantedAuthority("ROLE_" + role.getName()));

                for (Permission permission : role.getPermissions()) {
                    if (Boolean.TRUE.equals(permission.getActive())) {
                        authorities.add(new SimpleGrantedAuthority(permission.getCode()));
                    }
                }
            }
        }

        return new org.springframework.security.core.userdetails.User(
                user.getPublicId().toString(),
                user.getPassword(),
                "ACTIVE".equals(user.getStatus()),
                true,
                true,
                true,
                authorities
        );
    }
}