package com.comment.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {
    @Autowired
	private JwtAuthenticationFilter authenticationFilter;
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http)throws Exception {
    	
    	http.csrf(csrf->csrf.disable())
    	.sessionManagement(s->s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
    	.authorizeHttpRequests(auth->auth.anyRequest().authenticated())
    	.addFilterBefore(authenticationFilter, UsernamePasswordAuthenticationFilter.class);
    	
    	return http.build();
    }
    
}
