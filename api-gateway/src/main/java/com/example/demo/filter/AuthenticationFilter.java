package com.example.demo.filter;

import com.example.demo.util.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class AuthenticationFilter
        extends AbstractGatewayFilterFactory<AuthenticationFilter.Config> {

    @Autowired
    private RouteValidator validator;

    @Autowired
    private JwtUtils jwtUtils;

    public AuthenticationFilter() {
        super(Config.class);
    }

    @Override
    public GatewayFilter apply(Config config) {

        return (exchange, chain) -> {

            // Check whether this route requires authentication
            if (validator.isSecured().test(exchange.getRequest())) {

                // 1. Authorization header missing
                String authHeader = exchange.getRequest()
                        .getHeaders()
                        .getFirst(HttpHeaders.AUTHORIZATION);

                if (authHeader == null) {
                    exchange.getResponse()
                            .setStatusCode(HttpStatus.UNAUTHORIZED);

                    return exchange.getResponse().setComplete();
                }

                // 2. Authorization header is not Bearer
                if (!authHeader.startsWith("Bearer ")) {
                    exchange.getResponse()
                            .setStatusCode(HttpStatus.UNAUTHORIZED);

                    return exchange.getResponse().setComplete();
                }

                // Remove "Bearer " and get only the JWT
                String token = authHeader.substring(7);

                // 3. Validate JWT
                try {
                    jwtUtils.validateToken(token);
                } catch (Exception e) {

                    exchange.getResponse()
                            .setStatusCode(HttpStatus.UNAUTHORIZED);

                    return exchange.getResponse().setComplete();
                }
            }

            // 4. Authentication successful → continue to service
            return chain.filter(exchange);
        };
    }

    public static class Config {
    }
}