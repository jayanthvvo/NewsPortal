package com.example.auth.service;

import java.security.SecureRandom;
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
import com.example.auth.model.PasswordResetToken;
import com.example.auth.model.Role;
import com.example.auth.model.User;
import com.example.auth.model.User.UserStatus;
import com.example.auth.repository.PasswordResetTokenRepository;
import com.example.auth.repository.UserRepository;
import com.example.auth.security.JwtUtils;

@Service
public class AuthService {

	private static final SecureRandom SECURE_RANDOM = new SecureRandom();

	@Autowired
	private JwtUtils jwtUtils;

	@Autowired
	private PasswordEncoder passwordEncoder;

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private PasswordResetTokenRepository passwordResetTokenRepository;

	@Autowired
	private AuthenticationManager authenticationManager;

	@Autowired
	private UserClient userClient;

	@Autowired
	private RestTemplate restTemplate;

	// =========================================================
	// REGISTER USER
	// =========================================================

	public String registerUser(RegisterRequest request) {

		if (userRepository.existsByUsername(request.getUsername())) {
			throw new RuntimeException("Username is already taken!");
		}

		if (userRepository.existsByEmail(request.getEmail())) {
			throw new RuntimeException("Email is already in use!");
		}

		Role role = Role.valueOf(request.getRolerequest());

		User user = new User();

		user.setUsername(request.getUsername());
		user.setEmail(request.getEmail());
		user.setPassword(passwordEncoder.encode(request.getPassword()));
		user.setRole(role);

		if (role == Role.ROLE_USER) {

			user.setStatus(UserStatus.APPROVED);

			// Create profile in User Service
			Map<String, String> profileRequest = new HashMap<>();

			profileRequest.put("username", user.getUsername());

			profileRequest.put("email", user.getEmail());

			try {

				userClient.createUserProfile(profileRequest);

			} catch (Exception e) {

				throw new RuntimeException(
						"Registration aborted! Failed to connect to user-service: " + e.getMessage());
			}

		} else {

			user.setStatus(UserStatus.PENDING);
		}

		// Save user after successful profile creation
		userRepository.save(user);

		if (user.getStatus() == UserStatus.PENDING) {

			return "Request sent to admin for approval";

		} else {

			return "User registered successfully and profile created!";
		}
	}

	// =========================================================
	// LOGIN
	// =========================================================

	public JwtResponse loginuser(LoginRequest request) {

		User user = userRepository.findByUsername(request.getUsername())
				.orElseThrow(() -> new RuntimeException("User not found"));

		// Check account approval
		if (user.getStatus() != UserStatus.APPROVED) {

			throw new RuntimeException("Your account is pending admin approval.");
		}

		try {

			authenticationManager.authenticate(
					new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));

		} catch (Exception e) {

			throw new RuntimeException("Incorrect password");
		}

		String token = jwtUtils.generateToken(user.getUsername(), user.getRole().name());

		return new JwtResponse(token, user.getUsername(), user.getRole().name());
	}

	// =========================================================
	// GENERATE OTP
	// =========================================================

	public void generateAndSendOtp(String email) {

		// Find user
		User user = userRepository.findByEmail(email)
				.orElseThrow(() -> new RuntimeException("User with this email not found"));

		// Generate 6 digit OTP
		String otp = String.format("%06d", SECURE_RANDOM.nextInt(1000000));

		// Create password reset token record
		PasswordResetToken resetToken = new PasswordResetToken();

		resetToken.setUser(user);

		resetToken.setOtp(otp);

		resetToken.setExpiresAt(LocalDateTime.now().plusMinutes(10));

		resetToken.setCreatedAt(LocalDateTime.now());

		// Save OTP in password_reset_tokens table
		passwordResetTokenRepository.save(resetToken);

		// =====================================================
		// Prepare email
		// =====================================================

		Map<String, String> emailRequest = new HashMap<>();

		emailRequest.put("to", email);

		emailRequest.put("subject", "Password Reset Request");

		emailRequest.put("message",
				"Your 6-digit OTP to reset your password is: " + otp + ". This code expires in 10 minutes.");

		// =====================================================
		// Call Alert Service
		// =====================================================

		try {

			String alertServiceUrl = "http://alert-service/alerts/send-email";

			ResponseEntity<String> response = restTemplate.postForEntity(alertServiceUrl, emailRequest, String.class);

			System.out.println("Successfully told Alert Service to send email. Response: " + response.getBody());

		} catch (Exception e) {

			System.err.println("Failed to reach Alert Service: " + e.getMessage());

			throw new RuntimeException("Failed to send OTP email. Please try again later.");
		}
	}

	// =========================================================
	// RESET PASSWORD
	// =========================================================

	public void resetPassword(String email, String otp, String newPassword) {

		// Find user
		User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));

		// Find latest OTP for this user
		PasswordResetToken resetToken = passwordResetTokenRepository.findTopByUserOrderByCreatedAtDesc(user)
				.orElseThrow(() -> new RuntimeException("No OTP found"));

		// Check if OTP has already been used
		if (resetToken.getUsedAt() != null) {

			throw new RuntimeException("OTP has already been used");
		}

		// Check OTP
		if (!resetToken.getOtp().equals(otp)) {

			throw new RuntimeException("Invalid OTP");
		}

		// Check expiry
		if (resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {

			throw new RuntimeException("OTP has expired. Please request a new one.");
		}

		// Change password
		user.setPassword(passwordEncoder.encode(newPassword));

		// Mark OTP as used
		resetToken.setUsedAt(LocalDateTime.now());

		// Save changes
		userRepository.save(user);

		passwordResetTokenRepository.save(resetToken);
	}
}