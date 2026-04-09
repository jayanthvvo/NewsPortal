package com.comment.controller;

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
import org.springframework.security.core.Authentication;

import com.comment.client.ArticleClient;
import com.comment.model.Articledto;
import com.comment.model.Comment;
import com.comment.repository.CommentRepository;

import feign.FeignException;

@ExtendWith(MockitoExtension.class)
public class CommentControllerTest {

    @InjectMocks
    private CommentController commentController;

    @Mock
    private CommentRepository commentRepository;

    @Mock
    private ArticleClient articleClient;

    @Mock
    private Authentication authentication;

    private Comment comment;
    private Articledto articleDto;

    @BeforeEach
    void setUp() {
        // Only using the actual fields present in Comment.java
        comment = new Comment();
        comment.setId(1L);
        comment.setArticleId(100L);
        comment.setContent("This is a great article!");

        // Only using the actual fields present in Articledto.java
        articleDto = new Articledto();
        articleDto.setStatus("PUBLISHED");
    }

    // --- Tests for createComment ---

    @Test
    void testCreateComment_Success() {
        when(articleClient.getArticleById(100L)).thenReturn(articleDto);
        when(authentication.getName()).thenReturn("testuser");
        when(commentRepository.save(comment)).thenReturn(comment);

        ResponseEntity<?> response = commentController.createComment(comment, authentication);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("testuser", comment.getAuthorUsername()); // Verifies the username was set from Authentication
        assertEquals(comment, response.getBody());
    }

    @Test
    void testCreateComment_MissingArticleId() {
        comment.setArticleId(null);
        
        ResponseEntity<?> response = commentController.createComment(comment, authentication);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("Error: Article ID is required.", response.getBody());
    }

    @Test
    void testCreateComment_ArticleNotPublished() {
        articleDto.setStatus("DRAFT");
        when(articleClient.getArticleById(100L)).thenReturn(articleDto);

        ResponseEntity<?> response = commentController.createComment(comment, authentication);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("Error: You can only comment on published articles.", response.getBody());
    }

    @Test
    void testCreateComment_ArticleNotFound() {
        // Mocking the specific FeignException.NotFound your catch block is looking for
        FeignException.NotFound feignException = mock(FeignException.NotFound.class);
        when(articleClient.getArticleById(100L)).thenThrow(feignException);

        ResponseEntity<?> response = commentController.createComment(comment, authentication);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("Error: Article does not exist.", response.getBody());
    }

    @Test
    void testCreateComment_InternalServerError() {
        // Mocking a generic exception to hit the second catch block
        when(articleClient.getArticleById(100L)).thenThrow(new RuntimeException("Connection error"));

        ResponseEntity<?> response = commentController.createComment(comment, authentication);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertEquals("Error: Could not verify article status.", response.getBody());
    }

    // --- Test for getCommentByArticleId ---

    @Test
    void testGetCommentByArticleId() {
        when(commentRepository.findByArticleId(100L)).thenReturn(Arrays.asList(comment));

        ResponseEntity<List<Comment>> response = commentController.getCommentByArticleId(100L);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(1, response.getBody().size());
        assertEquals(100L, response.getBody().get(0).getArticleId());
    }

    // --- Tests for deleteComment ---

    @Test
    void testDeleteComment_Success() {
        when(commentRepository.existsById(1L)).thenReturn(true);

        ResponseEntity<String> response = commentController.deleteComment(1L);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("Comment deleted successfully", response.getBody());
        verify(commentRepository, times(1)).deleteById(1L); // Verifies the delete operation occurred
    }

    @Test
    void testDeleteComment_NotFound() {
        when(commentRepository.existsById(1L)).thenReturn(false);

        ResponseEntity<String> response = commentController.deleteComment(1L);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("Error: Comment not found.", response.getBody());
        verify(commentRepository, never()).deleteById(anyLong()); // Verifies nothing was deleted
    }
}