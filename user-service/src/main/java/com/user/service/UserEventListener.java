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

    // 1. Inject your repository here
    @Autowired
    private UserProfileRepository userProfileRepository;

    @RabbitListener(queues = RabbitMQConfig.QUEUE)
    public void handleUserApprovedEvent(Map<String, String> profileData) {
        System.out.println("Received from RabbitMQ: " + profileData);
        
        // 2. Extract the data sent by auth-service
        String username = profileData.get("username");
        String email = profileData.get("email");
        
        // 3. Check if the user already exists (to prevent duplicate errors)
        Optional<UserProfile> existingProfile = userProfileRepository.findByUsername(username);
        
        if (existingProfile.isEmpty()) {
            // 4. Create the new profile entity
            UserProfile newProfile = new UserProfile();
            newProfile.setUsername(username);
            newProfile.setEmail(email);
            
            // You can set default values for the other fields if you want!
            newProfile.setBio("Hello! I am a new user on the News Portal.");
            
            // 5. Save to the news_user_db!
            userProfileRepository.save(newProfile);
            System.out.println("Successfully created and saved User Profile for: " + username);
        } else {
            System.out.println("User Profile already exists for: " + username + ". Skipping creation.");
        }
    }
}