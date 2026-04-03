package com.example.article.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.article.model.Article;

public interface ArticleRepository extends JpaRepository<Article, Long> {

	List<Article> findByAuthorUsername(String authorUsername);
}
