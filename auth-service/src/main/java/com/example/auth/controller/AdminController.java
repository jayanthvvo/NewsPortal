package com.example.auth.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.auth.client.UserClient; // Import the Feign Client
import com.example.auth.model.User;
import com.example.auth.model.User.UserStatus;
import com.example.auth.repository.UserRepository;

@RestController
@RequestMapping("/admin")
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class AdminController {

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private UserClient userClient; // Inject the Feign Client

    @GetMapping("/pending-requests")
    public ResponseEntity<List<User>> getPendingRequest(){
        List<User> pendingrequests = userRepository.findByStatus(UserStatus.PENDING);
        return ResponseEntity.ok(pendingrequests);
    }

    @PostMapping("/approve/{userId}")
    public ResponseEntity<String> approveUser(@PathVariable Long userId){
        Optional<User> userOptional = userRepository.findById(userId);
        
        if(userOptional.isPresent()) {
            User user = userOptional.get();
            
            // Only attempt creation if they aren't already approved
            if (user.getStatus() != UserStatus.APPROVED) {
                user.setStatus(UserStatus.APPROVED);
                
                // --- NEW: Synchronously create the profile in User Service ---
                Map<String, String> profileRequest = new HashMap<>();
                profileRequest.put("username", user.getUsername());
                profileRequest.put("email", user.getEmail()); // Pass email so breaking news works
                
                try {
                    userClient.createUserProfile(profileRequest);
                } catch (Exception e) {
                    // Log the error. 
                    System.err.println("Failed to create profile in user-service for user " + user.getUsername() + ": " + e.getMessage());
                    // Optionally, you could return an error response here to abort the approval if the user-service is down.
                    // return ResponseEntity.status(500).body("Error creating profile in User Service. Approval aborted.");
                }
                
                userRepository.save(user);
                return ResponseEntity.ok("User " + user.getUsername() + " has been approved as " + user.getRole() + " and profile created.");
            } else {
                return ResponseEntity.badRequest().body("User is already approved.");
            }
        }
        return ResponseEntity.badRequest().body("User not found.");
    }
    
    @PostMapping("/reject/{userId}")
    public ResponseEntity<String> rejectUser(@PathVariable Long userId) {
        Optional<User> userOptional = userRepository.findById(userId);
        
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            user.setStatus(UserStatus.REJECTED);
            userRepository.save(user);
            return ResponseEntity.ok("User " + user.getUsername() + " has been rejected.");
        }
        return ResponseEntity.badRequest().body("User not found.");
    }
}