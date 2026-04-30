package com.alert.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendBreakingNews(String toEmail, String subject, String message) {
        SimpleMailMessage mailMessage = new SimpleMailMessage();
        mailMessage.setTo(toEmail);
        mailMessage.setSubject("BREAKING NEWS: " + subject);
        mailMessage.setText(message);
        mailMessage.setFrom("newsportal-admin@example.com");
        
        mailSender.send(mailMessage);
    }
    @Value("${spring.mail.username}")
    private String senderEmail;

    public void sendEmail(String to, String subject, String text) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(senderEmail); // Who the email is from
            message.setTo(to);            // Who the email is going to
            message.setSubject(subject);  // The subject line
            message.setText(text);        // The actual message body

            mailSender.send(message);
            System.out.println("✅ SUCCESS: Email sent to " + to);
            
        } catch (Exception e) {
            System.err.println("❌ ERROR: Failed to send email to " + to);
            e.printStackTrace();
            throw new RuntimeException("Email failed to send", e);
        }
    }
}