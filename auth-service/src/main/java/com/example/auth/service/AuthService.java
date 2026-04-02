package com.example.auth.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.auth.dto.JwtResponse;
import com.example.auth.dto.LoginRequest;
import com.example.auth.dto.RegisterRequest;
import com.example.auth.model.Role;
import com.example.auth.model.User;
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
	
	public String registerUser(RegisterRequest request) {
		if(userRepository.existsByUsername(request.getUsername())) {
			return "Error: Username is already taken!";
		}
		if(userRepository.existsByEmail(request.getEmail())) {
			return "Error: Email is already in use!";
		}
		User user=new User();
	
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword())); // Encrypting the password
        user.setRole(Role.ROLE_USER);
        
        userRepository.save(user);
        return "User registered successfully!";
		
	}
	public JwtResponse loginuser(LoginRequest request) {
		Authentication authentication=authenticationManager.authenticate(
				new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));
		
		User user=userRepository.findByUsername(request.getUsername())
				.orElseThrow(()->new RuntimeException("User not found"));
		
		String Token=jwtUtils.generateToken(user.getUsername(), user.getRole().name());
		
		return new JwtResponse(Token, user.getUsername(), user.getRole().name());
	}
	
}
