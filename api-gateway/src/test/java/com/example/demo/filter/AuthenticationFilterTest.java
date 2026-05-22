package com.example.demo.filter;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

import java.lang.reflect.Field;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.http.HttpHeaders;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;

import com.example.demo.util.JwtUtils;

import reactor.core.publisher.Mono;

class AuthenticationFilterTest {

    private AuthenticationFilter authenticationFilter;
    private RouteValidator validator;
    private JwtUtils jwtUtils;

    @BeforeEach
    void setUp() throws Exception {

        validator = mock(RouteValidator.class);
        jwtUtils = mock(JwtUtils.class);

        authenticationFilter = new AuthenticationFilter();

        // Inject validator using reflection
        Field validatorField =
                AuthenticationFilter.class
                        .getDeclaredField("validator");

        validatorField.setAccessible(true);
        validatorField.set(authenticationFilter, validator);

        // Inject jwtUtils using reflection
        Field jwtField =
                AuthenticationFilter.class
                        .getDeclaredField("jwtUtils");

        jwtField.setAccessible(true);
        jwtField.set(authenticationFilter, jwtUtils);
    }

    @Test
    void testMissingAuthorizationHeader() {

        MockServerHttpRequest request =
                MockServerHttpRequest
                        .get("/articles/create")
                        .build();

        MockServerWebExchange exchange =
                MockServerWebExchange.from(request);

        GatewayFilterChain chain =
                mock(GatewayFilterChain.class);

        when(validator.isSecured())
                .thenReturn(req -> true);

        GatewayFilter filter =
                authenticationFilter.apply(
                        new AuthenticationFilter.Config());

        assertThrows(RuntimeException.class,
                () -> filter.filter(exchange, chain).block());
    }

    @Test
    void testInvalidToken() {

        MockServerHttpRequest request =
                MockServerHttpRequest
                        .get("/articles/create")
                        .header(HttpHeaders.AUTHORIZATION,
                                "Bearer invalidtoken")
                        .build();

        MockServerWebExchange exchange =
                MockServerWebExchange.from(request);

        GatewayFilterChain chain =
                mock(GatewayFilterChain.class);

        when(validator.isSecured())
                .thenReturn(req -> true);

        doThrow(new RuntimeException("Invalid Token"))
                .when(jwtUtils)
                .validateToken(anyString());

        GatewayFilter filter =
                authenticationFilter.apply(
                        new AuthenticationFilter.Config());

        assertThrows(RuntimeException.class,
                () -> filter.filter(exchange, chain).block());
    }

    @Test
    void testValidToken() {

        MockServerHttpRequest request =
                MockServerHttpRequest
                        .get("/articles/create")
                        .header(HttpHeaders.AUTHORIZATION,
                                "Bearer validtoken")
                        .build();

        MockServerWebExchange exchange =
                MockServerWebExchange.from(request);

        GatewayFilterChain chain =
                mock(GatewayFilterChain.class);

        when(chain.filter(exchange))
                .thenReturn(Mono.empty());

        when(validator.isSecured())
                .thenReturn(req -> true);

        GatewayFilter filter =
                authenticationFilter.apply(
                        new AuthenticationFilter.Config());

        filter.filter(exchange, chain).block();

        verify(jwtUtils, times(1))
                .validateToken("validtoken");
    }
}