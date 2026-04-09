package com.alert.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.*;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

@ExtendWith(MockitoExtension.class)
public class EmailServiceTest {

    @InjectMocks
    private EmailService emailService;

    @Mock
    private JavaMailSender mailSender;

    @Test
    void testSendBreakingNews() {
        String toEmail = "subscriber@example.com";
        String subject = "Market Crash";
        String message = "Stock markets are down today.";

        // Execute service call
        emailService.sendBreakingNews(toEmail, subject, message);

        // Capture the message object that gets passed to JavaMailSender
        ArgumentCaptor<SimpleMailMessage> messageCaptor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender, times(1)).send(messageCaptor.capture());

        SimpleMailMessage capturedMessage = messageCaptor.getValue();
        
        // Assert the configuration of the captured mail message
        assertNotNull(capturedMessage);
        assertNotNull(capturedMessage.getTo());
        assertEquals(toEmail, capturedMessage.getTo()[0]);
        assertEquals("BREAKING NEWS: Market Crash", capturedMessage.getSubject());
        assertEquals(message, capturedMessage.getText());
        assertEquals("newsportal-admin@example.com", capturedMessage.getFrom());
    }
}