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
	
	public String registerUser(RegisterRequest request) {
		if(userRepository.existsByUsername(request.getUsername())) {
			return "Error: Username is already taken!";
		}
		if(userRepository.existsByEmail(request.getEmail())) {
			return "Error: Email is already in use!";
		}
		Role role = Role.valueOf(request.getRolerequest());
	    
		User user=new User();
	
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword())); // Encrypting the password
        user.setRole(Role.ROLE_USER);
        if(role==Role.ROLE_USER) {
        	user.setStatus(UserStatus.APPROVED);
        }else {
			user.setStatus(UserStatus.PENDING);
		}
        
        userRepository.save(user);
        return  user.getStatus()==UserStatus.PENDING?"Request sent to admin for approval" 
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
