package com.example.article.security;

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
        String token = Jwts.builder()
                .setSubject("testeditor")
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 1000 * 60 * 10)) 
                .signWith(jwtUtils.getSigningKey(), SignatureAlgorithm.HS256)
                .compact();

        Claims claims = jwtUtils.getClaims(token);

        assertNotNull(claims);
        assertEquals("testeditor", claims.getSubject());
    }
}