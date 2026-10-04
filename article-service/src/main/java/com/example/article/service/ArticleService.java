package com.example.article.service;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Objects;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;

import com.example.article.DTO.ArticleLikeResponse;
import com.example.article.client.CategoryClient;
import com.example.article.model.Article;
import com.example.article.model.ArticleLike;
import com.example.article.model.ArticleStatus;
import com.example.article.repository.ArticleRepository;
import com.example.article.client.CommentClient;
import com.example.article.repository.ArticleLikeRepository;
import feign.FeignException;

@Service
public class ArticleService {

    @Autowired
    private ArticleRepository articleRepository;
    @Autowired
    private CategoryClient categoryClient;
    @Autowired
    private CommentClient commentClient;
    
    @Autowired
    private ArticleLikeRepository articleLikeRepository;

    public Article createArticle(Article article, String authorUsername) {
    	
    	if (article.getCategoryId()==null) {
			throw new RuntimeException("Article must be assigned to some category");
		}
    	try {
    		categoryClient.getCategoryById(article.getCategoryId());
    	}catch (FeignException.NotFound e) {
    		throw new RuntimeException("Invalid Category ID: Category does not exist.");
        } catch (Exception e) {
            throw new RuntimeException("Could not verify category. Category Service might be down.");
        }
    	
    	
    	article.setAuthorUsername(authorUsername);
    	if (article.getStatus() == null) {
    	    article.setStatus(ArticleStatus.DRAFT);
    	}
    	return articleRepository.save(article);
    }

    public Article incrementViewCount(Long id) {
        Article article = articleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Article not found"));

        article.incrementViewCount();

        return articleRepository.save(article);
    }
    public List<Article> getAllArticles() {
        return articleRepository.findAll();
    }
    //Users
    public List<Article> getPublishedArticles() {
        return articleRepository.findByStatus(ArticleStatus.PUBLISHED);
    }

    // Authors
    public List<Article> getDraftsForAuthor(String username) {
        return articleRepository.findByAuthorUsernameAndStatus(username, ArticleStatus.DRAFT);
    }

    // Admins 
    public List<Article> getArticlesPendingReview() {
        return articleRepository.findByStatus(ArticleStatus.REVIEW);
    }
    
    public List<Article> getArticlesByAuthor(String username) {
        return articleRepository.findByAuthorUsername(username);
    }
    
    public Article updateArticle(
            Long id,
            ArticleStatus newStatus,
            String username,
            Collection<? extends GrantedAuthority> authorities) {

        Article article = articleRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Article not found"));

        boolean isAdmin = authorities.stream()
                .anyMatch(a ->
                        a.getAuthority().equals("ROLE_ADMIN"));

        boolean isEditor = authorities.stream()
                .anyMatch(a ->
                        a.getAuthority().equals("ROLE_EDITOR"));

        ArticleStatus currentStatus = article.getStatus();


        // ADMIN
        if (isAdmin) {

            if (!isValidAdminTransition(currentStatus, newStatus)) {
                throw new RuntimeException(
                        "Invalid article status transition: "
                        + currentStatus + " -> " + newStatus);
            }

            article.setStatus(newStatus);

            return articleRepository.save(article);
        }


        // EDITOR
        if (isEditor) {

            // Editor can only modify their own article
            if (!article.getAuthorUsername().equals(username)) {
                throw new RuntimeException(
                        "You are not authorized to modify this article");
            }

            // Editor can only submit DRAFT -> REVIEW
            if (currentStatus == ArticleStatus.DRAFT
                    && newStatus == ArticleStatus.REVIEW) {

                article.setStatus(ArticleStatus.REVIEW);

                return articleRepository.save(article);
            }

            throw new RuntimeException(
                    "Editors can only submit draft articles for review");
        }


        throw new RuntimeException(
                "You are not authorized to change article status");
    }
    
    private boolean isValidAdminTransition(
            ArticleStatus currentStatus,
            ArticleStatus newStatus) {

        if (currentStatus == ArticleStatus.DRAFT
                && newStatus == ArticleStatus.REVIEW) {
            return true;
        }

        if (currentStatus == ArticleStatus.REVIEW
                && newStatus == ArticleStatus.PUBLISHED) {
            return true;
        }

        return false;
    }
    
    public boolean deleteArticle(Long id) {

        if (!articleRepository.existsById(id)) {
            return false;
        }

        // Delete associated comments first
        commentClient.deleteCommentsByArticle(id);

        // Delete the article only after comment cleanup succeeds
        articleRepository.deleteById(id);

        return true;
    }

    public long likeArticle(Long articleId, String username) {

        // Make sure article exists
        articleRepository.findById(articleId)
                .orElseThrow(() -> new RuntimeException("Article not found"));

        // Prevent duplicate like
        if (articleLikeRepository.existsByArticleIdAndUsername(articleId, username)) {
            throw new RuntimeException("Article already liked");
        }

        ArticleLike like = new ArticleLike();
        like.setArticleId(articleId);
        like.setUsername(username);

        articleLikeRepository.save(like);

        return articleLikeRepository.countByArticleId(articleId);
    }public long unlikeArticle(Long articleId, String username) {

        ArticleLike like = articleLikeRepository
                .findByArticleIdAndUsername(articleId, username)
                .orElseThrow(() -> new RuntimeException("Article not liked"));

        articleLikeRepository.delete(like);

        return articleLikeRepository.countByArticleId(articleId);
    }
    public Article getArticleById(Long id) {
        return articleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Article not found"));
    }
    public List<Article> searchPublishedArticles(String keyword) {
        return articleRepository.findByTitleContainingIgnoreCaseAndStatus(keyword, ArticleStatus.PUBLISHED);
    }

    public ArticleLikeResponse getLikeStatus(
            Long articleId,
            String username) {

        articleRepository.findById(articleId)
                .orElseThrow(() -> new RuntimeException("Article not found"));

        boolean liked = articleLikeRepository
                .existsByArticleIdAndUsername(articleId, username);

        long likeCount = articleLikeRepository
                .countByArticleId(articleId);

        return new ArticleLikeResponse(
                articleId,
                liked,
                likeCount
        );
    }
   
    public List<Article> filterPublishedArticles(Long categoryId, String authorUsername) {
        return articleRepository.filterArticles(categoryId, authorUsername, ArticleStatus.PUBLISHED);
    }
    
    public boolean hasArticlesForCategory(Long categoryId) {
        return articleRepository.existsByCategoryId(categoryId);
    }
    public List<Article> getLikedArticles(String username) {

        List<ArticleLike> likes =
                articleLikeRepository.findByUsername(username);

        return likes.stream()
                .map(like -> articleRepository.findById(like.getArticleId())
                        .orElse(null))
                .filter(Objects::nonNull)
                .toList();
    }
}