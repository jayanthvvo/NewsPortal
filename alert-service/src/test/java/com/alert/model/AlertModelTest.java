package com.alert.model;

import static org.junit.jupiter.api.Assertions.*;

import java.time.LocalDateTime;

import org.junit.jupiter.api.Test;

public class AlertModelTest {

    @Test
    void testAlertGettersAndSetters() {
        Alert alert = new Alert();
        LocalDateTime now = LocalDateTime.now();

        alert.setId(10L);
        alert.setTargetUsername("johndoe");
        alert.setMessage("System maintenance at midnight.");
        alert.setRead(true);
        alert.setCreatedAt(now);

        assertEquals(10L, alert.getId());
        assertEquals("johndoe", alert.getTargetUsername());
        assertEquals("System maintenance at midnight.", alert.getMessage());
        assertTrue(alert.isRead());
        assertEquals(now, alert.getCreatedAt());
    }
}