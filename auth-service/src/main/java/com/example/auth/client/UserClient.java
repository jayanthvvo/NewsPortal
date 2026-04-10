package com.example.auth.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.Map;

@FeignClient(name = "USER-SERVICE")
public interface UserClient {
    
    @PostMapping("/users/create")
    void createUserProfile(@RequestBody Map<String, String> request);
}