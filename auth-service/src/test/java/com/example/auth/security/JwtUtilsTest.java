package com.example.auth.security;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

public class JwtUtilsTest {

    private JwtUtils jwtUtils;

    @BeforeEach
    void setUp() {
        jwtUtils = new JwtUtils();
    }

    @Test
    void testGenerateAndValidateToken() {
        String token = jwtUtils.generateToken("testuser", "ROLE_USER");
        
        assertNotNull(token);
        assertTrue(jwtUtils.validateToken(token));
        
        String username1 = jwtUtils.getUsernameFromToken(token);
        String username2 = jwtUtils.extractUsername(token);
        
        assertEquals("testuser", username1);
        assertEquals("testuser", username2);
    }

    @Test
    void testValidateToken_InvalidToken() {
        // Test with a completely invalid string to trigger the catch block
        boolean isValid = jwtUtils.validateToken("invalid.jwt.token");
        assertFalse(isValid);
    }
}