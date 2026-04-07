package com.example.article.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.article.model.Article;
import com.example.article.model.ArticleStatus;

public interface ArticleRepository extends JpaRepository<Article, Long> {

	List<Article> findByAuthorUsername(String authorUsername);
    List<Article> findByStatus(ArticleStatus status);
    
    
    List<Article> findByAuthorUsernameAndStatus(String authorUsername, ArticleStatus status);
}
