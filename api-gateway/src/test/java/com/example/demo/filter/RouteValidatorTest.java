package com.example.demo.filter;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;

class RouteValidatorTest {

    private final RouteValidator routeValidator =
            new RouteValidator();

    @Test
    void testOpenEndpoint() {

        MockServerHttpRequest request =
                MockServerHttpRequest
                        .get("/auth/login")
                        .build();

        boolean result =
                routeValidator.isSecured().test(request);

        assertFalse(result);
    }

    @Test
    void testSecuredEndpoint() {

        MockServerHttpRequest request =
                MockServerHttpRequest
                        .get("/articles/create")
                        .build();

        boolean result =
                routeValidator.isSecured().test(request);

        assertTrue(result);
    }
}