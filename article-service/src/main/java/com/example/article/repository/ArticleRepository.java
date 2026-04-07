package com.example.article.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.article.model.Article;
import com.example.article.model.ArticleStatus;

public interface ArticleRepository extends JpaRepository<Article, Long> {

	List<Article> findByAuthorUsername(String authorUsername);
    List<Article> findByStatus(ArticleStatus status);
    
    
    List<Article> findByAuthorUsernameAndStatus(String authorUsername, ArticleStatus status);
    
    List<Article> findByTitleContainingIgnoreCaseAndStatus(String keyword, ArticleStatus status);
    
   
    @Query("SELECT a FROM Article a WHERE " +
           "(:categoryId IS NULL OR a.categoryId = :categoryId) AND " +
           "(:authorUsername IS NULL OR a.authorUsername = :authorUsername) AND " +
           "a.status = :status")
    List<Article> filterArticles(@Param("categoryId") Long categoryId, 
                                 @Param("authorUsername") String authorUsername, 
                                 @Param("status") ArticleStatus status);
}

