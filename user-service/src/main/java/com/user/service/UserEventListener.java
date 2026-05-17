package com.user.service;

import com.user.config.RabbitMQConfig;
import com.user.model.UserProfile;
import com.user.repository.UserProfileRepository;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;

@Service
public class UserEventListener {

    
    @Autowired
    private UserProfileRepository userProfileRepository;

    @RabbitListener(queues = RabbitMQConfig.QUEUE)
    public void handleUserApprovedEvent(Map<String, String> profileData) {
        System.out.println("Received from RabbitMQ: " + profileData);
        
        
        String username = profileData.get("username");
        String email = profileData.get("email");
        
        
        Optional<UserProfile> existingProfile = userProfileRepository.findByUsername(username);
        
        if (existingProfile.isEmpty()) {
            
            UserProfile newProfile = new UserProfile();
            newProfile.setUsername(username);
            newProfile.setEmail(email);
            
            
            newProfile.setBio("Hello! I am a new user on the News Portal.");
            
           
            userProfileRepository.save(newProfile);
            System.out.println("Successfully created and saved User Profile for: " + username);
        } else {
            System.out.println("User Profile already exists for: " + username + ". Skipping creation.");
        }
    }
}