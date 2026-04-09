package com.category.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import java.util.Date;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;

public class JwtUtilsTest {

    private JwtUtils jwtUtils;

    @BeforeEach
    void setUp() {
        jwtUtils = new JwtUtils();
    }

    @Test
    void testGetClaims() {
        // Build a mock token manually to test the parser
        String token = Jwts.builder()
                .setSubject("testadmin")
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 1000 * 60 * 10)) // 10 minutes
                .signWith(jwtUtils.getSigningKey(), SignatureAlgorithm.HS256)
                .compact();

        Claims claims = jwtUtils.getClaims(token);

        assertNotNull(claims);
        assertEquals("testadmin", claims.getSubject());
    }
}