package com.user.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import com.user.model.UserProfile;
import com.user.repository.UserProfileRepository;

@ExtendWith(MockitoExtension.class)
public class UserControllerTest {

    @InjectMocks
    private UserController userController;

    @Mock
    private UserProfileRepository userProfileRepository;

    @Mock
    private Authentication authentication;

    private UserProfile existingProfile;
    private UserProfile updatedProfile;

    @BeforeEach
    void setUp() {
        existingProfile = new UserProfile();
        existingProfile.setId(1L);
        existingProfile.setUsername("testuser");
        existingProfile.setFirstName("Old");
        existingProfile.setLastName("Name");
        existingProfile.setBio("Old bio");
        existingProfile.setAvatarUrl("old-url");

        updatedProfile = new UserProfile();
        updatedProfile.setFirstName("New");
        updatedProfile.setLastName("Name");
        updatedProfile.setBio("New bio");
        updatedProfile.setAvatarUrl("new-url");
    }

    @Test
    void testGetProfile_Found() {
        when(userProfileRepository.findByUsername("testuser")).thenReturn(Optional.of(existingProfile));

        ResponseEntity<?> response = userController.getProfile("testuser");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(existingProfile, response.getBody());
    }

    @Test
    void testGetProfile_NotFound() {
        when(userProfileRepository.findByUsername("unknown")).thenReturn(Optional.empty());

        ResponseEntity<?> response = userController.getProfile("unknown");

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }

    @Test
    void testUpdateProfile_Success() {
        when(authentication.getName()).thenReturn("testuser");
        when(userProfileRepository.findByUsername("testuser")).thenReturn(Optional.of(existingProfile));
        when(userProfileRepository.save(any(UserProfile.class))).thenReturn(existingProfile);

        ResponseEntity<?> response = userController.updateProfile(updatedProfile, authentication);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        UserProfile savedProfile = (UserProfile) response.getBody();
        
        // Verify fields were actually updated
        assertEquals("New", savedProfile.getFirstName());
        assertEquals("New bio", savedProfile.getBio());
        assertEquals("new-url", savedProfile.getAvatarUrl());
        verify(userProfileRepository, times(1)).save(existingProfile);
    }

    @Test
    void testUpdateProfile_ProfileNotFound() {
        when(authentication.getName()).thenReturn("testuser");
        when(userProfileRepository.findByUsername("testuser")).thenReturn(Optional.empty());

        ResponseEntity<?> response = userController.updateProfile(updatedProfile, authentication);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertEquals("Error: User profile for 'testuser' not found. Cannot update.", response.getBody());
        verify(userProfileRepository, never()).save(any());
    }
}