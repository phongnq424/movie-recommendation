package com.example.movierecommendation.user;

import com.example.movierecommendation.user.dto.UserResponse;
import com.example.movierecommendation.user.dto.UserStatusUpdateRequest;
import com.example.movierecommendation.user.dto.UserUpdateRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

import static com.example.movierecommendation.rbac.PermissionCode.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PreAuthorize("hasAuthority('" + USER_READ + "')")
    @GetMapping
    public List<UserResponse> getAllUsers() {
        return userService.getAllUsers();
    }

    @PreAuthorize("hasAuthority('" + USER_READ + "')")
    @GetMapping("/search")
    public List<UserResponse> searchUsers(@RequestParam String keyword) {
        return userService.searchUsers(keyword);
    }

    @PreAuthorize("hasAuthority('" + USER_READ + "')")
    @GetMapping("/status/{status}")
    public List<UserResponse> getUsersByStatus(@PathVariable String status) {
        return userService.getUsersByStatus(status);
    }

    @PreAuthorize("hasAuthority('" + USER_READ + "')")
    @GetMapping("/role/{role}")
    public List<UserResponse> getUsersByRole(@PathVariable String role) {
        return userService.getUsersByRole(role);
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/me")
    public UserResponse getCurrentUser(Authentication authentication) {
        UUID currentUserPublicId = UUID.fromString(authentication.getName());
        return userService.getUserByPublicId(currentUserPublicId);
    }

    @PreAuthorize("isAuthenticated()")
    @PutMapping("/me/profile")
    public UserResponse updateCurrentUserProfile(
            Authentication authentication,
            @Valid @RequestBody UserUpdateRequest request
    ) {
        UUID currentUserPublicId = UUID.fromString(authentication.getName());
        return userService.updateUserProfile(currentUserPublicId, request);
    }

    @PreAuthorize("hasAuthority('" + USER_READ + "')")
    @GetMapping("/{publicId}")
    public UserResponse getUserByPublicId(@PathVariable UUID publicId) {
        return userService.getUserByPublicId(publicId);
    }

    @PreAuthorize("hasAuthority('" + USER_UPDATE + "')")
    @PutMapping("/{publicId}/profile")
    public UserResponse updateUserProfile(
            @PathVariable UUID publicId,
            @Valid @RequestBody UserUpdateRequest request
    ) {
        return userService.updateUserProfile(publicId, request);
    }

    @PreAuthorize("hasAuthority('" + USER_CHANGE_STATUS + "')")
    @PutMapping("/{publicId}/status")
    public UserResponse updateUserStatus(
            @PathVariable UUID publicId,
            @Valid @RequestBody UserStatusUpdateRequest request
    ) {
        return userService.updateUserStatus(publicId, request);
    }

    @PreAuthorize("hasAuthority('" + USER_DELETE + "')")
    @DeleteMapping("/{publicId}")
    public String deleteUser(@PathVariable UUID publicId) {
        userService.deleteUser(publicId);
        return "User deleted successfully";
    }
}