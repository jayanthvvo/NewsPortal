package com.example.auth.controller;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.auth.model.User;
import com.example.auth.model.User.UserStatus;
import com.example.auth.repository.UserRepository;

@RestController
@RequestMapping("/admin")
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class AdminController {
    @Autowired
	private UserRepository userRepository;
    
    @GetMapping("/pending-requests")
    public ResponseEntity<List<User>> getPendingRequest(){
    	List<User> pendingrequests=userRepository.findByStatus(UserStatus.PENDING);
    	return ResponseEntity.ok(pendingrequests);
    }
    @PostMapping("/approve/{userID}")
    public ResponseEntity<String> approveUser(@PathVariable Long userId){
    	Optional<User> userOptional=userRepository.findById(userId);
    	
    	if(userOptional.isPresent()) {
    		User user=userOptional.get();
    		user.setStatus(UserStatus.APPROVED);
    		userRepository.save(user);
    		return ResponseEntity.ok("User " + user.getUsername() + " has been approved as " + user.getRole());
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
