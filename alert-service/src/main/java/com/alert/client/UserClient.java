package com.alert.client;

import com.alert.dto.UserDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.List;


@FeignClient(name = "USER-SERVICE") 
public interface UserClient {
    
    
    @GetMapping("/users/all") 
    List<UserDto> getAllUsers();
}