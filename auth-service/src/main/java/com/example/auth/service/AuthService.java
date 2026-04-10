package com.example.auth.service;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.auth.client.UserClient;
import com.example.auth.dto.JwtResponse;
import com.example.auth.dto.LoginRequest;
import com.example.auth.dto.RegisterRequest;
import com.example.auth.model.Role;
import com.example.auth.model.User;
import com.example.auth.model.User.UserStatus;
import com.example.auth.repository.UserRepository;
import com.example.auth.security.JwtUtils;


@Service
public class AuthService {
    @Autowired
	private JwtUtils jwtUtils;
	@Autowired
    private PasswordEncoder passwordEncoder;
	@Autowired
	private UserRepository userRepository;
	@Autowired
	private AuthenticationManager authenticationManager;
	
	
	
	@Autowired
    private UserClient userClient; // Inject the client

    public String registerUser(RegisterRequest request) {
        if(userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username is already taken!");
        }
        if(userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email is already in use!");
        }
        Role role = Role.valueOf(request.getRolerequest());
        
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword())); 
        user.setRole(role);
        
        if(role == Role.ROLE_USER) {
            user.setStatus(UserStatus.APPROVED);
        } else {
            user.setStatus(UserStatus.PENDING);
        }
        
        // 1. Save user to Auth DB
        userRepository.save(user);
        
        // 2. Synchronously create the profile in User Service
        // We only create it immediately if they are approved. 
        // (If pending, you might want an Admin to trigger this later upon approval)
        if (user.getStatus() == UserStatus.APPROVED) {
            Map<String, String> profileRequest = new HashMap<>();
            profileRequest.put("username", user.getUsername());
            
            try {
                userClient.createUserProfile(profileRequest);
            } catch (Exception e) {
                // Log the error. In a production app, you might want to handle distributed 
                // transaction fallbacks here (e.g., deleting the user if profile creation fails).
                System.err.println("Failed to create profile in user-service: " + e.getMessage());
            }
        }

        return user.getStatus() == UserStatus.PENDING ? "Request sent to admin for approval" 
                : "User registered successfully!";
    }
    
	public JwtResponse loginuser(LoginRequest request) {
		
		User user=userRepository.findByUsername(request.getUsername())
				.orElseThrow(()->new RuntimeException("User not found"));
		if (user.getStatus() != UserStatus.APPROVED) {
	        throw new RuntimeException("Your account is pending admin approval.");
	    }
		try {
	        authenticationManager.authenticate(
	            new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));
	    } catch (Exception e) {
	        throw new RuntimeException("Incorrect password"); // Specific error
	    }
		String Token=jwtUtils.generateToken(user.getUsername(), user.getRole().name());
		
		return new JwtResponse(Token, user.getUsername(), user.getRole().name());
	}
	
}
