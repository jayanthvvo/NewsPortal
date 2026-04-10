package com.alert.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

import java.util.Arrays;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.alert.model.Alert;
import com.alert.repository.AlertRepository;
import com.alert.service.EmailService;

@ExtendWith(MockitoExtension.class)
public class AlertControllerTest {

    @InjectMocks
    private AlertController alertController;

    @Mock
    private AlertRepository alertRepository;

    @Mock
    private EmailService emailService;

    private Alert alert;

    @BeforeEach
    void setUp() {
        alert = new Alert();
        alert.setTargetUsername("all_users");
        alert.setMessage("Major breaking news event occurred!");
    }

//    @Test
//    void testSendBreakingNewsEmail() {
//        // Mock list of user emails
//        List<String> emails = Arrays.asList("user1@example.com", "user2@example.com");
//
//        // Execute the controller method
////        ResponseEntity<String> response = alertController.sendBreakingNewsEmail(alert, emails);
//
//        // Verify HTTP Response
//        assertEquals(HttpStatus.OK, response.getStatusCode());
//        assertEquals("Breaking news sent via email successfully.", response.getBody());
//        
//        // Verify Repository was called to save the alert
//        verify(alertRepository, times(1)).save(alert);
//        
//        // Verify Email Service was called exactly once for EACH email in the list
//        verify(emailService, times(1)).sendBreakingNews("user1@example.com", "Breaking News Alert", "Major breaking news event occurred!");
//        verify(emailService, times(1)).sendBreakingNews("user2@example.com", "Breaking News Alert", "Major breaking news event occurred!");
//    }
}