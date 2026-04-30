package com.example.auth.service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

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
    private UserClient userClient; 
    @Autowired
    private RestTemplate restTemplate;

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
            
            // Attempt to create the profile immediately for normal users
            Map<String, String> profileRequest = new HashMap<>();
            profileRequest.put("username", user.getUsername());
            profileRequest.put("email", user.getEmail());
            
            try {
                userClient.createUserProfile(profileRequest);
            } catch (Exception e) {
                // Throw exception to completely abort the registration
                throw new RuntimeException("Registration aborted! Failed to connect to user-service: " + e.getMessage());
            }
        } else {
            user.setStatus(UserStatus.PENDING);
        }
        
        // Save user to Auth DB LAST, ensuring the Feign call (if applicable) succeeded first.
        userRepository.save(user);

        return user.getStatus() == UserStatus.PENDING ? "Request sent to admin for approval" 
                : "User registered successfully and profile created!";
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
            throw new RuntimeException("Incorrect password"); 
        }
        String Token=jwtUtils.generateToken(user.getUsername(), user.getRole().name());
        
        return new JwtResponse(Token, user.getUsername(), user.getRole().name());
    }

    
    public void generateAndSendOtp(String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User with this email not found"));
            
        // Generate a 6-digit OTP
        String otp = String.format("%06d", new java.util.Random().nextInt(999999));
        
       
        user.setOtp(otp);
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(10));
        userRepository.save(user);
        
        // Prepare the email payload (Keys must match what AlertController expects)
        Map<String, String> emailRequest = new HashMap<>();
        emailRequest.put("to", email); 
        emailRequest.put("subject", "Password Reset Request");
        emailRequest.put("message", "Your 6-digit OTP to reset your password is: " + otp + ". This code expires in 10 minutes.");

        // Call the Alert Service via RestTemplate
        try {
            // Note: If you don't use Eureka, change this to "http://localhost:808X/alerts/send-email"
            String alertServiceUrl = "http://ALERT-SERVICE/alerts/send-email"; 
            
            ResponseEntity<String> response = restTemplate.postForEntity(
                alertServiceUrl, 
                emailRequest, 
                String.class
            );
            System.out.println("Successfully told Alert Service to send email. Response: " + response.getBody());
            
        } catch (Exception e) {
            System.err.println("Failed to reach Alert Service: " + e.getMessage());
        }

        // Keep this for testing in your console just in case the email fails to deliver!
        System.out.println("DEBUG - OTP for " + email + " is " + otp); 
    }

    public void resetPassword(String email, String otp, String newPassword) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
            
        if (user.getOtp() == null || !user.getOtp().equals(otp)) {
            throw new RuntimeException("Invalid OTP");
        }
        if (user.getOtpExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("OTP has expired. Please request a new one.");
        }
        
        // Update password and clear the OTP
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setOtp(null);
        user.setOtpExpiry(null);
        userRepository.save(user);
    }
}
