package com.category.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableMethodSecurity
@EnableWebSecurity
public class SecurityConfig {
    @Autowired
	public JwtAuthenticationFilter jwtAuthenticationFilter;
    
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception{
    	http.csrf(csrf->csrf.disable())
    	.sessionManagement(s->s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
    	.authorizeHttpRequests(auth->auth.requestMatchers(HttpMethod.GET,"/categories/all").permitAll()
    			.anyRequest().authenticated())
    	.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
    	
    	
    	return http.build();
    }
}
