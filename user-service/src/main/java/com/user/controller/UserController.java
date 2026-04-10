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

  
    @GetMapping("/all")
    public ResponseEntity<List<UserProfile>> getAllUsers() {
        List<UserProfile> users = userProfileRepository.findAll();
        return ResponseEntity.ok(users);
    }
    
    @GetMapping("/{username}")
    public ResponseEntity<?> getProfile(@PathVariable String username) {
        Optional<UserProfile> profile = userProfileRepository.findByUsername(username);
        
        if (profile.isPresent()) {
            return ResponseEntity.ok(profile.get());
        } else {
            return ResponseEntity.notFound().build();
        }
    }

   
    @PostMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody UserProfile updatedProfile, Authentication authentication) {
        
        String tokenUsername = authentication.getName();
        
       
        Optional<UserProfile> profileOptional = userProfileRepository.findByUsername(tokenUsername);

        
        if (profileOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Error: User profile for '" + tokenUsername + "' not found. Cannot update.");
        }

       
        UserProfile profile = profileOptional.get();
        
       
        profile.setFirstName(updatedProfile.getFirstName());
        profile.setLastName(updatedProfile.getLastName());
        profile.setBio(updatedProfile.getBio());
        profile.setAvatarUrl(updatedProfile.getAvatarUrl());

        UserProfile savedProfile = userProfileRepository.save(profile);
        return ResponseEntity.ok(savedProfile);
    }
    @PostMapping("/create")
    public ResponseEntity<?> createInitialProfile(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        
        // Check if it already exists to avoid duplicates
        if (userProfileRepository.findByUsername(username).isPresent()) {
            return ResponseEntity.badRequest().body("Profile already exists");
        }

        UserProfile newProfile = new UserProfile();
        newProfile.setUsername(username);
        // Note: The rest of the fields (firstName, lastName, etc.) remain null 
        // until the user updates them later via your existing updateProfile endpoint.

        userProfileRepository.save(newProfile);
        return ResponseEntity.ok("Profile created successfully");
    }
}