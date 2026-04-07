package com.example.article.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.article.client.CategoryClient;
import com.example.article.model.Article;
import com.example.article.model.ArticleStatus;
import com.example.article.repository.ArticleRepository;

import feign.FeignException;

@Service
public class ArticleService {

    @Autowired
    private ArticleRepository articleRepository;
    @Autowired
    private CategoryClient categoryClient;

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
        article.setCreatedAt(LocalDateTime.now());
        if (article.getStatus() == null) {
            article.setStatus(ArticleStatus.DRAFT);
        }
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
    
    public Article updateArticle(Long id,ArticleStatus articleStatus) {
    	
    	Article article=articleRepository.findById(id)
    			.orElseThrow(()->new RuntimeException("Article not found"));
    	
    	article.setStatus(articleStatus);
    	
    	return articleRepository.save(article);
    }

    public boolean deleteArticle(Long id) {
     
        if(articleRepository.existsById(id)) {
            articleRepository.deleteById(id);
            return true;
        }
        return false;
    }
}