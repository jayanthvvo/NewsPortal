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
import java.util.Map;

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

        String headline = (alertRequest.getHeadline() != null && !alertRequest.getHeadline().isBlank())
                ? alertRequest.getHeadline()
                : (alertRequest.getArticleTitle() != null && !alertRequest.getArticleTitle().isBlank() 
                    ? alertRequest.getArticleTitle() 
                    : "Breaking News Alert");
        
        for (UserDto user : allUsers) {
            
            if (user.getEmail() != null && !user.getEmail().isEmpty()) {
                if (alertRequest.getArticleId() != null || alertRequest.getArticleTitle() != null) {
                    emailService.sendBreakingNews(
                        user.getEmail(),
                        headline,
                        alertRequest.getMessage(),
                        alertRequest.getArticleId(),
                        alertRequest.getArticleTitle(),
                        alertRequest.getPriority()
                    );
                } else {
                    emailService.sendBreakingNews(user.getEmail(), headline, alertRequest.getMessage());
                }
            }
            
            Alert userAlert = new Alert();
            userAlert.setTargetUsername(user.getUsername());
            userAlert.setHeadline(headline);
            userAlert.setMessage(alertRequest.getMessage());
            userAlert.setArticleId(alertRequest.getArticleId());
            userAlert.setArticleTitle(alertRequest.getArticleTitle());
            userAlert.setPriority(alertRequest.getPriority() != null ? alertRequest.getPriority() : "BREAKING");
            userAlert.setCategory(alertRequest.getCategory());
            userAlert.setCreatedAt(LocalDateTime.now());
            userAlert.setRead(false);
            
            alertRepository.save(userAlert);
        }

        return ResponseEntity.ok("Breaking news sent to " + allUsers.size() + " users successfully.");
    }
    
    @GetMapping("/latest-breaking")
    public ResponseEntity<Alert> getLatestBreakingNews() {
        return alertRepository.findTopByOrderByCreatedAtDesc()
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }
    
    @PostMapping("/send-email")
    public ResponseEntity<String> sendSingleEmail(@RequestBody Map<String, String> request) {
        try {
            String to = request.get("to");
            String subject = request.get("subject");
            String message = request.get("message");
            
            emailService.sendEmail(to, subject, message); 
            
            return ResponseEntity.ok("Email sent successfully to " + to);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to send email: " + e.getMessage());
        }
    }
}
