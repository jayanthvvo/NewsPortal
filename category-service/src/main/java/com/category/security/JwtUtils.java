package com.category.security;

import java.security.Key;

import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Component
public class JwtUtils {

	private String jwtSecretKey = "ThisIsASecretKeyForNewsPortalWhichNeedsToBeAtLeast32BytesLong";
	public Key getSigningKey() {
	       return Keys.hmacShaKeyFor(jwtSecretKey.getBytes());
	      
	}
	
	       public Claims getClaims(String Token) {
	   		return Jwts.parserBuilder().setSigningKey(getSigningKey())
	   				.build().parseClaimsJws(Token).getBody();
	   		
	   	}
	
}
