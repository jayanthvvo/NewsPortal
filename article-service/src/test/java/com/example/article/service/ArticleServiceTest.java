package com.example.article.service;

import static org.junit.jupiter.api.Assertions.*;
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

import com.example.article.client.CategoryClient;
import com.example.article.model.Article;
import com.example.article.model.ArticleStatus;
import com.example.article.repository.ArticleRepository;

import feign.FeignException;

@ExtendWith(MockitoExtension.class)
public class ArticleServiceTest {

    @InjectMocks
    private ArticleService articleService;

    @Mock
    private ArticleRepository articleRepository;

    @Mock
    private CategoryClient categoryClient;

    private Article article;

    @BeforeEach
    void setUp() {
        article = new Article();
        article.setId(1L);
        article.setTitle("Test Title");
        article.setContent("Test Content");
        article.setCategoryId(100L);
        // Do not set status here to test default setting behavior
    }

    // --- Tests for createArticle ---

    @Test
    void testCreateArticle_Success_StatusWasNull() {
        when(categoryClient.getCategoryById(100L)).thenReturn(null); // Assuming client returns something or void
        when(articleRepository.save(any(Article.class))).thenReturn(article);

        Article savedArticle = articleService.createArticle(article, "testauthor");

        assertNotNull(savedArticle);
        assertEquals("testauthor", article.getAuthorUsername());
        assertEquals(ArticleStatus.DRAFT, article.getStatus()); // Verify it defaults to DRAFT
        assertNotNull(article.getCreatedAt());
        verify(articleRepository, times(1)).save(article);
    }

    @Test
    void testCreateArticle_Success_StatusAlreadySet() {
        article.setStatus(ArticleStatus.PUBLISHED);
        when(categoryClient.getCategoryById(100L)).thenReturn(null);
        when(articleRepository.save(any(Article.class))).thenReturn(article);

        Article savedArticle = articleService.createArticle(article, "testauthor");

        assertEquals(ArticleStatus.PUBLISHED, savedArticle.getStatus()); // Verify it doesn't overwrite
    }

    @Test
    void testCreateArticle_NullCategory() {
        article.setCategoryId(null);

        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            articleService.createArticle(article, "testauthor");
        });
        assertEquals("Article must be assigned to some category", ex.getMessage());
    }

    @Test
    void testCreateArticle_CategoryNotFound() {
        FeignException.NotFound notFoundEx = mock(FeignException.NotFound.class);
        when(categoryClient.getCategoryById(100L)).thenThrow(notFoundEx);

        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            articleService.createArticle(article, "testauthor");
        });
        assertEquals("Invalid Category ID: Category does not exist.", ex.getMessage());
    }

    @Test
    void testCreateArticle_CategoryServiceDown() {
        when(categoryClient.getCategoryById(100L)).thenThrow(new RuntimeException("Connection Refused"));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            articleService.createArticle(article, "testauthor");
        });
        assertEquals("Could not verify category. Category Service might be down.", ex.getMessage());
    }

    // --- Tests for simple fetch methods ---

    @Test
    void testGetAllArticles() {
        when(articleRepository.findAll()).thenReturn(Arrays.asList(article));
        List<Article> list = articleService.getAllArticles();
        assertEquals(1, list.size());
    }

    @Test
    void testGetPublishedArticles() {
        when(articleRepository.findByStatus(ArticleStatus.PUBLISHED)).thenReturn(Arrays.asList(article));
        List<Article> list = articleService.getPublishedArticles();
        assertEquals(1, list.size());
    }

    @Test
    void testGetDraftsForAuthor() {
        when(articleRepository.findByAuthorUsernameAndStatus("testauthor", ArticleStatus.DRAFT))
                .thenReturn(Arrays.asList(article));
        List<Article> list = articleService.getDraftsForAuthor("testauthor");
        assertEquals(1, list.size());
    }

    @Test
    void testGetArticlesPendingReview() {
        when(articleRepository.findByStatus(ArticleStatus.REVIEW)).thenReturn(Arrays.asList(article));
        List<Article> list = articleService.getArticlesPendingReview();
        assertEquals(1, list.size());
    }

    @Test
    void testGetArticlesByAuthor() {
        when(articleRepository.findByAuthorUsername("testauthor")).thenReturn(Arrays.asList(article));
        List<Article> list = articleService.getArticlesByAuthor("testauthor");
        assertEquals(1, list.size());
    }

    // --- Tests for updateArticle ---

    @Test
    void testUpdateArticle_Success() {
        when(articleRepository.findById(1L)).thenReturn(Optional.of(article));
        when(articleRepository.save(any(Article.class))).thenReturn(article);

        Article updated = articleService.updateArticle(1L, ArticleStatus.PUBLISHED);

        assertEquals(ArticleStatus.PUBLISHED, updated.getStatus());
        verify(articleRepository, times(1)).save(article);
    }

    @Test
    void testUpdateArticle_NotFound() {
        when(articleRepository.findById(1L)).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            articleService.updateArticle(1L, ArticleStatus.PUBLISHED);
        });
        assertEquals("Article not found", ex.getMessage());
    }

    // --- Tests for deleteArticle ---

    @Test
    void testDeleteArticle_Success() {
        when(articleRepository.existsById(1L)).thenReturn(true);

        boolean result = articleService.deleteArticle(1L);

        assertTrue(result);
        verify(articleRepository, times(1)).deleteById(1L);
    }

    @Test
    void testDeleteArticle_NotFound() {
        when(articleRepository.existsById(1L)).thenReturn(false);

        boolean result = articleService.deleteArticle(1L);

        assertFalse(result);
        verify(articleRepository, never()).deleteById(anyLong());
    }

    // --- Tests for getArticleById ---

    @Test
    void testGetArticleById_Found() {
        when(articleRepository.findById(1L)).thenReturn(Optional.of(article));
        Article found = articleService.getArticleById(1L);
        assertEquals(article, found);
    }

    @Test
    void testGetArticleById_NotFound() {
        when(articleRepository.findById(1L)).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            articleService.getArticleById(1L);
        });
        assertEquals("Article not found", ex.getMessage());
    }

    // --- Tests for search and filter ---

    @Test
    void testSearchPublishedArticles() {
        when(articleRepository.findByTitleContainingIgnoreCaseAndStatus("test", ArticleStatus.PUBLISHED))
                .thenReturn(Arrays.asList(article));
        List<Article> list = articleService.searchPublishedArticles("test");
        assertEquals(1, list.size());
    }

    @Test
    void testFilterPublishedArticles() {
        when(articleRepository.filterArticles(100L, "testauthor", ArticleStatus.PUBLISHED))
                .thenReturn(Arrays.asList(article));
        List<Article> list = articleService.filterPublishedArticles(100L, "testauthor");
        assertEquals(1, list.size());
    }
}