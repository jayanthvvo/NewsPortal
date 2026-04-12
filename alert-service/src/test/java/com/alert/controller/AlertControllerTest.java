package com.alert.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Arrays;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import com.alert.client.UserClient;
import com.alert.dto.UserDto;
import com.alert.model.Alert;
import com.alert.repository.AlertRepository;
import com.alert.security.JwtUtils;
import com.alert.service.EmailService;
import com.fasterxml.jackson.databind.ObjectMapper;

@WebMvcTest(AlertController.class)
class AlertControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper; // Used to convert objects to JSON

    // --- Mock all the external dependencies the controller relies on ---
    
    @MockBean
    private AlertRepository alertRepository;

    @MockBean
    private EmailService emailService;

    @MockBean
    private UserClient userClient;

    // Mocked because your SecurityConfig and JwtAuthenticationFilter need it to load
    @MockBean
    private JwtUtils jwtUtils; 

    private Alert alertRequest;
    private UserDto mockUser1;
    private UserDto mockUser2;

    @BeforeEach
    void setUp() {
        // Prepare the request payload
        alertRequest = new Alert();
        alertRequest.setMessage("BREAKING: Major earthquake reported!");

        // Prepare mock data that the Feign Client would normally return
        mockUser1 = new UserDto();
        mockUser1.setUsername("user1");
        mockUser1.setEmail("user1@example.com");

        mockUser2 = new UserDto();
        mockUser2.setUsername("admin1");
        mockUser2.setEmail("admin1@example.com");
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN") 
    void testSendBreakingNewsEmail_Success() throws Exception {
       
        List<UserDto> mockUsers = Arrays.asList(mockUser1, mockUser2);
        when(userClient.getAllUsers()).thenReturn(mockUsers);
        when(alertRepository.save(any(Alert.class))).thenReturn(new Alert());
        doNothing().when(emailService).sendBreakingNews(anyString(), anyString(), anyString());

      
        mockMvc.perform(post("/alerts/breaking-news")
                        .with(csrf()) // Bypass CSRF protection for testing
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(alertRequest)))
                .andExpect(status().isOk())
                .andExpect(content().string("Breaking news sent to 2 users successfully."));

       
        verify(userClient, times(1)).getAllUsers();
        verify(emailService, times(2)).sendBreakingNews(anyString(), anyString(), anyString());
        verify(alertRepository, times(2)).save(any(Alert.class));
    }
}
 