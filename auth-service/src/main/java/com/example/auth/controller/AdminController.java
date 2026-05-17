package com.example.auth.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.auth.service.UserEventProducer; 
import com.example.auth.model.User;
import com.example.auth.model.User.UserStatus;
import com.example.auth.repository.UserRepository;

import lombok.RequiredArgsConstructor; // 1. IMPORT LOMBOK

@RestController
@RequestMapping("/admin")
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
@RequiredArgsConstructor 
public class AdminController {

    
    private final UserRepository userRepository;
    private final UserEventProducer userEventProducer; 

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
            
            if (user.getStatus() != UserStatus.APPROVED) {
                
                
                Map<String, String> profileRequest = new HashMap<>();
                profileRequest.put("username", user.getUsername());
                profileRequest.put("email", user.getEmail()); 
                
                try {
                   
                    userEventProducer.sendUserApprovedEvent(profileRequest);
                } catch (Exception e) {
                    e.printStackTrace();
                    return ResponseEntity.status(500).body("Approval failed! Could not connect to RabbitMQ broker: " + e.getMessage());
                }
                
                
                user.setStatus(UserStatus.APPROVED);
                userRepository.save(user);
                
                return ResponseEntity.ok("User " + user.getUsername() + " has been approved. Profile creation triggered in the background.");
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