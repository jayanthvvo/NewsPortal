package com.user.service;

import com.user.config.RabbitMQConfig;
import com.user.model.UserProfile;
import com.user.repository.UserProfileRepository;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UserEventListener {

    @Autowired
    private UserProfileRepository userProfileRepository;

    @RabbitListener(queues = RabbitMQConfig.QUEUE)
    public void handleUserApprovedEvent(
            java.util.Map<String, String> profileData) {

        String username = profileData.get("username");
        String email = profileData.get("email");

        if (username == null || email == null) {
            System.out.println(
                "Invalid user event received: " + profileData
            );
            return;
        }

        if (userProfileRepository.existsByUsername(username)) {

            System.out.println(
                "User profile already exists: " + username
            );

            return;
        }

        if (userProfileRepository.existsByEmail(email)) {

            System.out.println(
                "Email already belongs to a profile: " + email
            );

            return;
        }

        UserProfile profile = new UserProfile();

        profile.setUsername(username);
        profile.setEmail(email);
        profile.setBio(
            "Hello! I am a new user on the News Portal."
        );

        userProfileRepository.save(profile);

        System.out.println(
            "Created user profile for: " + username
        );
    }
}