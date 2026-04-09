package com.example.article.controller;

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

import com.example.article.model.Article;
import com.example.article.model.ArticleStatus;
import com.example.article.service.ArticleService;

@ExtendWith(MockitoExtension.class)
public class ArticleControllerTest {

    @InjectMocks
    private ArticleController articleController;

    @Mock
    private ArticleService articleService;

    @Mock
    private Authentication authentication;

    private Article article;

    @BeforeEach
    void setUp() {
        article = new Article();
        article.setId(1L);
        article.setTitle("Test Article");
        article.setContent("Test Content");
        article.setAuthorUsername("testauthor");
        article.setCategoryId(100L);
        article.setStatus(ArticleStatus.DRAFT);
    }

    @Test
    void testCreate() {
        when(authentication.getName()).thenReturn("testauthor");
        when(articleService.createArticle(article, "testauthor")).thenReturn(article);

        ResponseEntity<Article> response = articleController.create(article, authentication);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(article, response.getBody());
    }

    @Test
    void testGetArticleByAuthor() {
        when(articleService.getArticlesByAuthor("testauthor")).thenReturn(Arrays.asList(article));

        ResponseEntity<List<Article>> response = articleController.getArticleByAuthor("testauthor");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(1, response.getBody().size());
    }

    @Test
    void testDeleteArticle_Success() {
        when(articleService.deleteArticle(1L)).thenReturn(true);

        ResponseEntity<String> response = articleController.deleteArticle(1L);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("Deleted Successfully", response.getBody());
    }

    @Test
    void testDeleteArticle_NotFound() {
        when(articleService.deleteArticle(1L)).thenReturn(false);

        ResponseEntity<String> response = articleController.deleteArticle(1L);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("Error: Article not found!", response.getBody());
    }

    @Test
    void testGetAllPublishedArticles() {
        article.setStatus(ArticleStatus.PUBLISHED);
        when(articleService.getPublishedArticles()).thenReturn(Arrays.asList(article));

        ResponseEntity<List<Article>> response = articleController.getAllPublishedArticles();

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(1, response.getBody().size());
    }

    @Test
    void testGetMyDrafts() {
        when(authentication.getName()).thenReturn("testauthor");
        when(articleService.getDraftsForAuthor("testauthor")).thenReturn(Arrays.asList(article));

        ResponseEntity<List<Article>> response = articleController.getMyDrafts(authentication);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(1, response.getBody().size());
    }

    @Test
    void testGetPendingReviews() {
        article.setStatus(ArticleStatus.REVIEW);
        when(articleService.getArticlesPendingReview()).thenReturn(Arrays.asList(article));

        ResponseEntity<List<Article>> response = articleController.getPendingReviews();

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(1, response.getBody().size());
    }

    @Test
    void testUpdateStatus() {
        article.setStatus(ArticleStatus.PUBLISHED);
        when(articleService.updateArticle(1L, ArticleStatus.PUBLISHED)).thenReturn(article);

        ResponseEntity<Article> response = articleController.updateStatus(1L, "PUBLISHED");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(ArticleStatus.PUBLISHED, response.getBody().getStatus());
    }

    @Test
    void testGetArticleById_Found() {
        when(articleService.getArticleById(1L)).thenReturn(article);

        ResponseEntity<?> response = articleController.getArticleById(1L);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(article, response.getBody());
    }

    @Test
    void testGetArticleById_NotFound() {
        when(articleService.getArticleById(1L)).thenThrow(new RuntimeException("Not found"));

        ResponseEntity<?> response = articleController.getArticleById(1L);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }

    @Test
    void testSearchArticles() {
        when(articleService.searchPublishedArticles("Test")).thenReturn(Arrays.asList(article));

        ResponseEntity<List<Article>> response = articleController.searchArticles("Test");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(1, response.getBody().size());
    }

    @Test
    void testFilterArticles() {
        when(articleService.filterPublishedArticles(100L, "testauthor")).thenReturn(Arrays.asList(article));

        ResponseEntity<List<Article>> response = articleController.filterArticles(100L, "testauthor");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(1, response.getBody().size());
    }
}