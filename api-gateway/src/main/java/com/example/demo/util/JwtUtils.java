package com.example.demo.util;

import java.security.Key;

import org.springframework.stereotype.Component;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Component
public class JwtUtils {

	private String jwtSecretKey="ThisIsASecretKeyForNewsPortalWhichNeedsToBeAtLeast32BytesLong";
	
	private Key getSigningKey() {
		return Keys.hmacShaKeyFor(jwtSecretKey.getBytes());
	}
	
	public void validateToken(final String Token) {
		Jwts.parserBuilder().setSigningKey(getSigningKey())
		.build().parseClaimsJws(Token);
	}
	
}
