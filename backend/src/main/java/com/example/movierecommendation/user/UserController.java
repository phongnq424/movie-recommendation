package com.example.movierecommendation.user;

import com.example.movierecommendation.user.dto.UserResponse;
import com.example.movierecommendation.user.dto.UserStatusUpdateRequest;
import com.example.movierecommendation.user.dto.UserUpdateRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@CrossOrigin("*")
public class UserController {

    private final UserService userService;

    @GetMapping
    public List<UserResponse> getAllUsers() {
        return userService.getAllUsers();
    }

    @GetMapping("/{publicId}")
    public UserResponse getUserByPublicId(@PathVariable UUID publicId) {
        return userService.getUserByPublicId(publicId);
    }

    @GetMapping("/search")
    public List<UserResponse> searchUsers(@RequestParam String keyword) {
        return userService.searchUsers(keyword);
    }

    @GetMapping("/status/{status}")
    public List<UserResponse> getUsersByStatus(@PathVariable String status) {
        return userService.getUsersByStatus(status);
    }

    @GetMapping("/role/{role}")
    public List<UserResponse> getUsersByRole(@PathVariable String role) {
        return userService.getUsersByRole(role);
    }

    @PutMapping("/{publicId}/profile")
    public UserResponse updateUserProfile(
            @PathVariable UUID publicId,
            @Valid @RequestBody UserUpdateRequest request
    ) {
        return userService.updateUserProfile(publicId, request);
    }

    @PutMapping("/{publicId}/status")
    public UserResponse updateUserStatus(
            @PathVariable UUID publicId,
            @Valid @RequestBody UserStatusUpdateRequest request
    ) {
        return userService.updateUserStatus(publicId, request);
    }

    @DeleteMapping("/{publicId}")
    public String deleteUser(@PathVariable UUID publicId) {
        userService.deleteUser(publicId);
        return "User deleted successfully";
    }
}