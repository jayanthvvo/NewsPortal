package com.example.auth.contoller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.example.auth.controller.AdminController;
import com.example.auth.model.Role;
import com.example.auth.model.User;
import com.example.auth.model.User.UserStatus;
import com.example.auth.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
public class AdminControllerTest {

    @InjectMocks
    private AdminController adminController;

    @Mock
    private UserRepository userRepository;

    private User pendingUser;

    @BeforeEach
    void setUp() {
        pendingUser = new User();
        pendingUser.setUsername("testadmin");
        pendingUser.setRole(Role.ROLE_ADMIN);
        pendingUser.setStatus(UserStatus.PENDING);
    }

    @Test
    void testGetPendingRequest() {
        when(userRepository.findByStatus(UserStatus.PENDING)).thenReturn(Arrays.asList(pendingUser));

        ResponseEntity<List<User>> response = adminController.getPendingRequest();

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(1, response.getBody().size());
        assertEquals("testadmin", response.getBody().get(0).getUsername());
    }

    @Test
    void testApproveUser_Success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(pendingUser));

        ResponseEntity<String> response = adminController.approveUser(1L);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("User testadmin has been approved as ROLE_ADMIN", response.getBody());
        assertEquals(UserStatus.APPROVED, pendingUser.getStatus());
        verify(userRepository, times(1)).save(pendingUser);
    }

    @Test
    void testApproveUser_NotFound() {
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        ResponseEntity<String> response = adminController.approveUser(1L);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("User not found.", response.getBody());
    }

    @Test
    void testRejectUser_Success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(pendingUser));

        ResponseEntity<String> response = adminController.rejectUser(1L);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("User testadmin has been rejected.", response.getBody());
        assertEquals(UserStatus.REJECTED, pendingUser.getStatus());
        verify(userRepository, times(1)).save(pendingUser);
    }

    @Test
    void testRejectUser_NotFound() {
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        ResponseEntity<String> response = adminController.rejectUser(1L);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("User not found.", response.getBody());
    }
}