package com.example.auth.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.auth.dto.JwtResponse;
import com.example.auth.dto.LoginRequest;
import com.example.auth.dto.RegisterRequest;
import com.example.auth.service.AuthService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<String> register(@Valid @RequestBody RegisterRequest request){
        String result = authService.registerUser(request);
        // Returns a String, so we use ResponseEntity<String>
        return ResponseEntity.ok(result);
    }

    @PostMapping("/login")
    public ResponseEntity<Object> login(@RequestBody LoginRequest request){
        try {
            JwtResponse response = authService.loginuser(request);
            // Returns a JwtResponse on success
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            // Returns a String on error. Because it returns two different types, we use ResponseEntity<Object>
            return ResponseEntity.status(401).body(e.getMessage());
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@RequestBody Map<String, String> request) {
        try {
            authService.generateAndSendOtp(request.get("email"));
            // Returns a Map, so we use ResponseEntity<Map<String, String>>
            return ResponseEntity.ok(Map.of("message", "OTP sent to email"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@RequestBody Map<String, String> request) {
        try {
            authService.resetPassword(request.get("email"), request.get("otp"), request.get("newPassword"));
            // Returns a Map, so we use ResponseEntity<Map<String, String>>
            return ResponseEntity.ok(Map.of("message", "Password successfully reset"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}