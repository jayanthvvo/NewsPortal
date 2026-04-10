package com.alert.controller;

import com.alert.model.Alert;
import com.alert.repository.AlertRepository;
import com.alert.service.EmailService;
import com.alert.client.UserClient;
import com.alert.dto.UserDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/alerts")
public class AlertController {

    @Autowired
    private AlertRepository alertRepository;

    @Autowired
    private EmailService emailService;
    
    @Autowired
    private UserClient userClient; 

    @PostMapping("/breaking-news")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<String> sendBreakingNewsEmail(@RequestBody Alert alertRequest) {
        
       
        List<UserDto> allUsers = userClient.getAllUsers();
        
       
        for (UserDto user : allUsers) {
            
           
            if (user.getEmail() != null && !user.getEmail().isEmpty()) {
                emailService.sendBreakingNews(user.getEmail(), "Breaking News Alert", alertRequest.getMessage());
            }
            
           
            Alert userAlert = new Alert();
            userAlert.setTargetUsername(user.getUsername());
            userAlert.setMessage(alertRequest.getMessage());
            userAlert.setCreatedAt(LocalDateTime.now());
            userAlert.setRead(false);
            
            alertRepository.save(userAlert);
        }

        return ResponseEntity.ok("Breaking news sent to " + allUsers.size() + " users successfully.");
    }
}