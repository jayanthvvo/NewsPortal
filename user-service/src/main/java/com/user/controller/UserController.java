package com.user.controller;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
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
        
        UserProfile profile = userProfileRepository.findByUsername(tokenUsername)
                                .orElse(new UserProfile());

      
        profile.setUsername(tokenUsername);
        profile.setFirstName(updatedProfile.getFirstName());
        profile.setLastName(updatedProfile.getLastName());
        profile.setBio(updatedProfile.getBio());
        profile.setAvatarUrl(updatedProfile.getAvatarUrl());

        UserProfile savedProfile = userProfileRepository.save(profile);
        return ResponseEntity.ok(savedProfile);
    }
}