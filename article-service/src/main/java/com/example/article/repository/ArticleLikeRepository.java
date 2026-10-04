package com.example.article.repository;

import com.example.article.model.ArticleLike;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ArticleLikeRepository extends JpaRepository<ArticleLike, Long> {

    Optional<ArticleLike> findByArticleIdAndUsername(
            Long articleId,
            String username
    );

    boolean existsByArticleIdAndUsername(
            Long articleId,
            String username
    );

    List<ArticleLike> findByUsername(String username);

    long countByArticleId(Long articleId);
}