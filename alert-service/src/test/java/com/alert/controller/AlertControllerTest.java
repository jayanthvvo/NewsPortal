package com.alert.controller;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import com.alert.client.UserClient;
import com.alert.dto.UserDto;
import com.alert.model.Alert;
import com.alert.repository.AlertRepository;
import com.alert.service.EmailService;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

import java.util.Arrays;
import java.util.List;

@ExtendWith(MockitoExtension.class) 
class AlertControllerTest {

    @Mock
    private AlertRepository alertRepository;

    @Mock
    private EmailService emailService;

    @Mock
    private UserClient userClient;

  
    @InjectMocks
    private AlertController alertController;

    private Alert alertRequest;

    @BeforeEach
    void setUp() {
        alertRequest = new Alert();
        alertRequest.setMessage("BREAKING: Major earthquake reported!");
    }

    @Test
    void testSendBreakingNewsEmail_Success() {
        
        UserDto mockUser1 = new UserDto(); mockUser1.setEmail("user1@example.com");
        UserDto mockUser2 = new UserDto(); mockUser2.setEmail("admin1@example.com");
        List<UserDto> mockUsers = Arrays.asList(mockUser1, mockUser2);
        
        when(userClient.getAllUsers()).thenReturn(mockUsers);

        ResponseEntity<String> response = alertController.sendBreakingNewsEmail(alertRequest);

        
        assertEquals(200, response.getStatusCode().value());
        assertEquals("Breaking news sent to 2 users successfully.", response.getBody());
        
        verify(userClient, times(1)).getAllUsers();
        verify(emailService, times(2)).sendBreakingNews(anyString(), anyString(), anyString());
        verify(alertRepository, times(2)).save(any(Alert.class));
    }
}