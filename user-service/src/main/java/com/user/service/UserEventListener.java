package com.user.service;

import com.user.config.RabbitMQConfig;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;
import java.util.Map;

@Service
public class UserEventListener {

    // Assuming you have a UserService, inject it here
    // private final UserService userService;

    @RabbitListener(queues = RabbitMQConfig.QUEUE)
    public void handleUserApprovedEvent(Map<String, String> profileData) {
        System.out.println("Received from RabbitMQ: " + profileData);
        
        String username = profileData.get("username");
        String email = profileData.get("email");
        
        // TODO: Call your actual database save logic here!
        // userService.createUserProfile(username, email);
    }
}