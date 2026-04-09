package com.alert.controller;

import com.alert.model.Alert;
import com.alert.repository.AlertRepository;
import com.alert.service.EmailService;
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

    
    @PostMapping("/breaking-news")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<String> sendBreakingNewsEmail(@RequestBody Alert alert, @RequestParam List<String> userEmails) {
        
        for (String email : userEmails) {
            emailService.sendBreakingNews(email, "Breaking News Alert", alert.getMessage());
        }
        
        alert.setCreatedAt(LocalDateTime.now());
        alert.setRead(false);
        alertRepository.save(alert);

        return ResponseEntity.ok("Breaking news sent via email successfully.");
    }
}