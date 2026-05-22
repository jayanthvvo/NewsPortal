package com.example.demo.util;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.util.Date;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;

class JwtUtilsTest {

    private JwtUtils jwtUtils;

    private final String secret =
            "ThisIsASecretKeyForNewsPortalWhichNeedsToBeAtLeast32BytesLong";

    @BeforeEach
    void setUp() {
        jwtUtils = new JwtUtils();
    }

    @Test
    void testValidateValidToken() {

        String token = Jwts.builder()
                .setSubject("jayanth")
                .setIssuedAt(new Date())
                .setExpiration(
                        new Date(System.currentTimeMillis() + 60000))
                .signWith(
                        Keys.hmacShaKeyFor(secret.getBytes()),
                        SignatureAlgorithm.HS256)
                .compact();

        assertDoesNotThrow(() ->
                jwtUtils.validateToken(token));
    }

    @Test
    void testValidateInvalidToken() {

        String invalidToken = "abc.xyz.invalid";

        assertThrows(Exception.class,
                () -> jwtUtils.validateToken(invalidToken));
    }
}