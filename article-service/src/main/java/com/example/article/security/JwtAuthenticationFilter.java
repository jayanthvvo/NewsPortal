package com.example.article.security;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    @Autowired
	private JwtUtils jwtUtils;
	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
			throws ServletException, IOException {
		// TODO Auto-generated method stub

		String authHeader=request.getHeader("Authorization");
		
		if(authHeader!=null && authHeader.startsWith("Bearer ")) {
			String Token=authHeader.substring(7);
			try {
				Claims claims=jwtUtils.getClaims(Token);
				String username=claims.getSubject();
				String role=claims.get("role",String.class);
				if(username!=null) {
					
					List<GrantedAuthority> authorities= Collections.singletonList(new SimpleGrantedAuthority(role));
				    
					UsernamePasswordAuthenticationToken auth=
							new UsernamePasswordAuthenticationToken(username,null,authorities);
					SecurityContextHolder.getContext().setAuthentication(auth);
				}
				
				
			} catch (Exception e) {
				// TODO: handle exception
			
			}
			
		}
		filterChain.doFilter(request, response);
	}

	
}
