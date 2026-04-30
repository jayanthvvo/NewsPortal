package com.example.demo.filter;



import java.util.List;
import java.util.function.Predicate;

import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;

@Component
public class RouteValidator {
 
	public static final List<String> openApiEndPoints=List.of("/auth/register",
            "/auth/login",
            "/eureka",
            "/articles/all", "/articles/search", "/articles/filter","/auth/forgot-password", // <-- ADD THIS
            "/auth/reset-password"
			);
	
	public Predicate<ServerHttpRequest> isSecured(){
		return request->openApiEndPoints.stream()
				.noneMatch(uri->request.getURI().getPath().contains(uri));
	}
	
}
