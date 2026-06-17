package com.example.movierecommendation.user;

import com.example.movierecommendation.user.dto.UserResponse;
import com.example.movierecommendation.user.dto.UserStatusUpdateRequest;
import com.example.movierecommendation.user.dto.UserUpdateRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private static final String STATUS_ACTIVE = "ACTIVE";
    private static final String STATUS_INACTIVE = "INACTIVE";
    private static final String STATUS_BANNED = "BANNED";
    private static final String STATUS_DELETED = "DELETED";

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(UserResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public UserResponse getUserByPublicId(UUID publicId) {
        User user = getUserEntityWithRolesByPublicId(publicId);
        return UserResponse.from(user);
    }

    @Transactional(readOnly = true)
    public List<UserResponse> searchUsers(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return getAllUsers();
        }

        String normalizedKeyword = keyword.trim();

        return userRepository
                .findByFullNameContainingIgnoreCaseOrEmailContainingIgnoreCase(
                        normalizedKeyword,
                        normalizedKeyword
                )
                .stream()
                .map(UserResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getUsersByStatus(String status) {
        validateStatus(status);

        return userRepository.findByStatus(status.trim().toUpperCase())
                .stream()
                .map(UserResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getUsersByRole(String role) {
        if (role == null || role.isBlank()) {
            throw new RuntimeException("Role is required");
        }

        return userRepository.findDistinctByRoles_Name(role.trim().toUpperCase())
                .stream()
                .map(UserResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getRecentlyActiveUsers(int days) {
        int safeDays = days <= 0 ? 7 : Math.min(days, 90);

        LocalDateTime fromTime = LocalDateTime.now().minusDays(safeDays);

        return userRepository
                .findByStatusAndLastLoginAtAfter(STATUS_ACTIVE, fromTime)
                .stream()
                .map(UserResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<User> getRecentlyActiveUserEntities(int days) {
        int safeDays = days <= 0 ? 7 : Math.min(days, 90);

        LocalDateTime fromTime = LocalDateTime.now().minusDays(safeDays);

        return userRepository.findByStatusAndLastLoginAtAfter(
                STATUS_ACTIVE,
                fromTime
        );
    }

    @Transactional
    public UserResponse updateUserProfile(UUID publicId, UserUpdateRequest request) {
        User user = getUserEntityByPublicId(publicId);

        if (request.getFullName() == null || request.getFullName().isBlank()) {
            throw new RuntimeException("Full name is required");
        }

        user.setFullName(request.getFullName().trim());
        user.setAvatarUrl(request.getAvatarUrl());

        userRepository.save(user);

        User userWithRoles = getUserEntityWithRolesByPublicId(publicId);
        return UserResponse.from(userWithRoles);
    }

    @Transactional
    public UserResponse updateUserStatus(UUID publicId, UserStatusUpdateRequest request) {
        User user = getUserEntityByPublicId(publicId);

        validateStatus(request.getStatus());

        String status = request.getStatus().trim().toUpperCase();
        user.setStatus(status);

        userRepository.save(user);

        User userWithRoles = getUserEntityWithRolesByPublicId(publicId);
        return UserResponse.from(userWithRoles);
    }

    @Transactional
    public void deleteUser(UUID publicId) {
        User user = getUserEntityByPublicId(publicId);
        user.setStatus(STATUS_DELETED);
        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public User getUserEntityByPublicId(UUID publicId) {
        if (publicId == null) {
            throw new RuntimeException("User public ID is required");
        }

        return userRepository.findByPublicId(publicId)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Transactional(readOnly = true)
    public User getUserEntityWithRolesByPublicId(UUID publicId) {
        if (publicId == null) {
            throw new RuntimeException("User public ID is required");
        }

        return userRepository.findWithRolesByPublicId(publicId)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private void validateStatus(String status) {
        if (status == null || status.isBlank()) {
            throw new RuntimeException("Status is required");
        }

        String normalizedStatus = status.trim().toUpperCase();

        if (!normalizedStatus.equals(STATUS_ACTIVE)
                && !normalizedStatus.equals(STATUS_INACTIVE)
                && !normalizedStatus.equals(STATUS_BANNED)
                && !normalizedStatus.equals(STATUS_DELETED)) {
            throw new RuntimeException("Status must be ACTIVE, INACTIVE, BANNED, or DELETED");
        }
    }
}