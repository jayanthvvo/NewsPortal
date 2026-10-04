package com.example.demo.filter;

import java.util.List;
import java.util.function.Predicate;

import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;

@Component
public class RouteValidator {

    public static final List<String> openApiEndPoints = List.of(
            "/auth/register",
            "/auth/login",
            "/eureka",
            "/articles/all",
            "/articles/search",
            "/articles/filter",
            "/auth/forgot-password",
            "/auth/reset-password"
    );

    public Predicate<ServerHttpRequest> isSecured() {
        return request -> {
            String path = request.getURI().getPath();

            return openApiEndPoints.stream()
                    .noneMatch(path::equals);
        };
    }
}