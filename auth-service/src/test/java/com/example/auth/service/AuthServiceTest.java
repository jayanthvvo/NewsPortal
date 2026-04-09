package com.example.auth.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.example.auth.dto.JwtResponse;
import com.example.auth.dto.LoginRequest;
import com.example.auth.dto.RegisterRequest;
import com.example.auth.model.Role;
import com.example.auth.model.User;
import com.example.auth.model.User.UserStatus;
import com.example.auth.repository.UserRepository;
import com.example.auth.security.JwtUtils;

@ExtendWith(MockitoExtension.class)
public class AuthServiceTest {

    @InjectMocks
    private AuthService authService;

    @Mock
    private JwtUtils jwtUtils;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AuthenticationManager authenticationManager;

    private RegisterRequest registerRequest;
    private LoginRequest loginRequest;
    private User testUser;

    @BeforeEach
    void setUp() {
        registerRequest = new RegisterRequest();
        registerRequest.setUsername("testuser");
        registerRequest.setEmail("test@email.com");
        registerRequest.setPassword("password123");
        registerRequest.setRolerequest("ROLE_USER");

        loginRequest = new LoginRequest();
        loginRequest.setUsername("testuser");
        loginRequest.setPassword("password123");

        testUser = new User();
        testUser.setUsername("testuser");
        testUser.setPassword("encodedPassword");
        testUser.setRole(Role.ROLE_USER);
        testUser.setStatus(UserStatus.APPROVED);
    }

    // --- Tests for registerUser ---

    @Test
    void testRegisterUser_UsernameAlreadyExists() {
        when(userRepository.existsByUsername("testuser")).thenReturn(true);

        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            authService.registerUser(registerRequest);
        });

        assertEquals("Username is already taken!", exception.getMessage());
    }

    @Test
    void testRegisterUser_EmailAlreadyExists() {
        when(userRepository.existsByUsername("testuser")).thenReturn(false);
        when(userRepository.existsByEmail("test@email.com")).thenReturn(true);

        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            authService.registerUser(registerRequest);
        });

        assertEquals("Email is already in use!", exception.getMessage());
    }

    @Test
    void testRegisterUser_Success_RoleUser() {
        when(userRepository.existsByUsername("testuser")).thenReturn(false);
        when(userRepository.existsByEmail("test@email.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("encodedPassword");

        String response = authService.registerUser(registerRequest);

        assertEquals("User registered successfully!", response);
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    void testRegisterUser_Success_RoleAdmin_PendingStatus() {
        registerRequest.setRolerequest("ROLE_ADMIN"); // Non-user role
        when(userRepository.existsByUsername("testuser")).thenReturn(false);
        when(userRepository.existsByEmail("test@email.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("encodedPassword");

        String response = authService.registerUser(registerRequest);

        assertEquals("Request sent to admin for approval", response);
        verify(userRepository, times(1)).save(any(User.class));
    }

    // --- Tests for loginuser ---

    @Test
    void testLoginUser_UserNotFound() {
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            authService.loginuser(loginRequest);
        });

        assertEquals("User not found", exception.getMessage());
    }

    @Test
    void testLoginUser_AccountPending() {
        testUser.setStatus(UserStatus.PENDING);
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));

        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            authService.loginuser(loginRequest);
        });

        assertEquals("Your account is pending admin approval.", exception.getMessage());
    }

    @Test
    void testLoginUser_IncorrectPassword() {
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new RuntimeException("Bad credentials"));

        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            authService.loginuser(loginRequest);
        });

        assertEquals("Incorrect password", exception.getMessage());
    }

    @Test
    void testLoginUser_Success() {
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(null); // Assuming it passes without exception
        when(jwtUtils.generateToken("testuser", "ROLE_USER")).thenReturn("mock-jwt-token");

        JwtResponse response = authService.loginuser(loginRequest);

        assertNotNull(response);
        assertEquals("mock-jwt-token", response.getToken());
        assertEquals("testuser", response.getUsername());
    }
}