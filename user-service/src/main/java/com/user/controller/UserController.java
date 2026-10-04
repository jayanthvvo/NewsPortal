package com.user.controller;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.user.model.UserProfile;
import com.user.repository.UserProfileRepository;

@RestController
@RequestMapping("/users")
public class UserController {

    @Autowired
    private UserProfileRepository userProfileRepository;


    // Get all profiles
    @GetMapping("/all")
    public ResponseEntity<List<UserProfile>> getAllUsers() {

        List<UserProfile> users = userProfileRepository.findAll();

        return ResponseEntity.ok(users);
    }


    // Get profile by username
    @GetMapping("/{username}")
    public ResponseEntity<?> getProfile(
            @PathVariable String username) {

        Optional<UserProfile> profile =
                userProfileRepository.findByUsername(username);

        if (profile.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(profile.get());
    }


    // Update logged-in user's profile
    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(
            @RequestBody UserProfile updatedProfile,
            Authentication authentication) {

        String username = authentication.getName();

        Optional<UserProfile> profileOptional =
                userProfileRepository.findByUsername(username);

        if (profileOptional.isEmpty()) {

            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body("User profile not found");
        }

        UserProfile profile = profileOptional.get();

        profile.setFirstName(updatedProfile.getFirstName());
        profile.setLastName(updatedProfile.getLastName());
        profile.setBio(updatedProfile.getBio());
        profile.setAvatarUrl(updatedProfile.getAvatarUrl());

        /*
         * Do NOT update username or email here.
         *
         * Those belong to the authentication identity
         * managed by Auth Service.
         */

        UserProfile savedProfile =
                userProfileRepository.save(profile);

        return ResponseEntity.ok(savedProfile);
    }


    // Create initial profile
    @PostMapping("/create")
    public ResponseEntity<?> createInitialProfile(
            @RequestBody Map<String, String> request) {

        String username = request.get("username");
        String email = request.get("email");

        if (username == null || username.isBlank()) {

            return ResponseEntity
                    .badRequest()
                    .body("Username is required");
        }

        if (email == null || email.isBlank()) {

            return ResponseEntity
                    .badRequest()
                    .body("Email is required");
        }


        if (userProfileRepository.existsByUsername(username)) {

            return ResponseEntity
                    .badRequest()
                    .body("Username already exists");
        }


        if (userProfileRepository.existsByEmail(email)) {

            return ResponseEntity
                    .badRequest()
                    .body("Email already exists");
        }


        UserProfile newProfile = new UserProfile();

        newProfile.setUsername(username);
        newProfile.setEmail(email);

        UserProfile savedProfile =
                userProfileRepository.save(newProfile);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(savedProfile);
    }
}