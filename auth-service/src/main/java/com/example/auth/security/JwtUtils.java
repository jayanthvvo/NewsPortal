package com.example.auth.security;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;


import org.springframework.stereotype.Component;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;

@Component
public class JwtUtils {
   
	
	private String jwtsecretkey="ThisIsASecretKeyForNewsPortalWhichNeedsToBeAtLeast32BytesLong";
	
	private int jwtexpirationMs=86400000;
	
	
	
	private Key getSigningKey() {
		return Keys.hmacShaKeyFor(jwtsecretkey.getBytes());
	}
	
	public String generateToken(String username,String role) {
		Map<String, Object> claims=new HashMap<String, Object>();
		claims.put("role", role);
		
		return Jwts.builder()
				.setClaims(claims)
				.setSubject(username)
				.setIssuedAt(new Date())
				.setExpiration(new Date((new Date()).getTime()+jwtexpirationMs))
				.signWith(getSigningKey(),SignatureAlgorithm.HS256)
				.compact();
	}
	
	
	public String getUsernameFromToken(String Token) {
		return Jwts.parserBuilder()
				.setSigningKey(getSigningKey())
				.build()
				.parseClaimsJws(Token)
				.getBody()
				.getSubject();
	}
	public boolean validateToken(String Token) {
		try {
			Jwts.parserBuilder()
			.setSigningKey(getSigningKey())
			.build()
			.parseClaimsJws(Token);
			return true;
		} catch (Exception e) {
			// TODO: handle exception
			System.out.println("Invalid jwt token"+e.getMessage());
		}
		
		return false;
	}
	
	
}
