package com.alert.security;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.io.IOException;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.context.SecurityContextHolder;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@ExtendWith(MockitoExtension.class)
public class JwtAuthenticationFilterTest {

    @InjectMocks
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Mock
    private JwtUtils jwtUtils;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private FilterChain filterChain;

    @Mock
    private Claims claims;

    @BeforeEach
    void setUp() {
        // Ensure a clean context before each test
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        // Clean up the context after each test
        SecurityContextHolder.clearContext();
    }

    @Test
    void testDoFilterInternal_ValidTokenWithRolePrefix() throws ServletException, IOException {
        when(request.getHeader("Authorization")).thenReturn("Bearer mock-valid-token");
        when(jwtUtils.getClaims("mock-valid-token")).thenReturn(claims);
        when(claims.getSubject()).thenReturn("testuser");
        when(claims.get("role", String.class)).thenReturn("ROLE_ADMIN");

        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        // Verify that the SecurityContext was populated
        assertNotNull(SecurityContextHolder.getContext().getAuthentication());
        assertEquals("testuser", SecurityContextHolder.getContext().getAuthentication().getName());
        assertEquals("ROLE_ADMIN", SecurityContextHolder.getContext().getAuthentication().getAuthorities().iterator().next().getAuthority());
        
        verify(filterChain, times(1)).doFilter(request, response);
    }

    @Test
    void testDoFilterInternal_ValidTokenWithoutRolePrefix() throws ServletException, IOException {
        when(request.getHeader("Authorization")).thenReturn("Bearer mock-valid-token");
        when(jwtUtils.getClaims("mock-valid-token")).thenReturn(claims);
        when(claims.getSubject()).thenReturn("testuser");
        when(claims.get("role", String.class)).thenReturn("USER"); // No prefix

        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        assertNotNull(SecurityContextHolder.getContext().getAuthentication());
        // Verify the filter correctly added "ROLE_"
        assertEquals("ROLE_USER", SecurityContextHolder.getContext().getAuthentication().getAuthorities().iterator().next().getAuthority());
        
        verify(filterChain, times(1)).doFilter(request, response);
    }

    @Test
    void testDoFilterInternal_InvalidToken() throws ServletException, IOException {
        when(request.getHeader("Authorization")).thenReturn("Bearer invalid-token");
        
        // Simulate exception thrown during token parsing
        when(jwtUtils.getClaims("invalid-token")).thenThrow(new RuntimeException("Token expired or invalid"));

        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        // Context should remain unauthenticated
        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(filterChain, times(1)).doFilter(request, response);
    }

    @Test
    void testDoFilterInternal_NoHeader() throws ServletException, IOException {
        when(request.getHeader("Authorization")).thenReturn(null);

        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        // Context should remain unauthenticated
        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(filterChain, times(1)).doFilter(request, response);
    }
}