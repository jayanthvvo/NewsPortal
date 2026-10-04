package com.example.article.controller;

import jakarta.validation.Valid;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.article.DTO.ArticleLikeResponse;
import com.example.article.model.Article;
import com.example.article.model.ArticleStatus;
import com.example.article.service.ArticleService; 

@RestController
@RequestMapping("/articles")
public class ArticleController {
    
    @Autowired
    private ArticleService articleService; 

    @PostMapping("/create")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_EDITOR')") 
    public ResponseEntity<Article> create(@Valid @RequestBody Article article, Authentication authentication){
        String username = authentication.getName();
        Article savedArticle = articleService.createArticle(article, username);
       return ResponseEntity.ok(savedArticle);
    }
    
    @GetMapping("/author/{username}")
    public ResponseEntity<List<Article>> getArticleByAuthor(@PathVariable String username){
        List<Article> articlesByAuthor = articleService.getArticlesByAuthor(username);
        return ResponseEntity.ok(articlesByAuthor);
    }
    
    @PostMapping("/{id}/view")
    public ResponseEntity<Article> incrementViewCount(@PathVariable Long id) {
        return ResponseEntity.ok(articleService.incrementViewCount(id));
    }
    
    @DeleteMapping("/delete/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')") 
    public ResponseEntity<String> deleteArticle(@PathVariable Long id){
        boolean isDeleted = articleService.deleteArticle(id);
        
        if(isDeleted) {
            return ResponseEntity.ok("Deleted Successfully");
        }
        return ResponseEntity.badRequest().body("Error: Article not found!");
    }
    @GetMapping("/all")
    public ResponseEntity<List<Article>> getAllPublishedArticles(){
        return ResponseEntity.ok(articleService.getPublishedArticles());
    }
    
    @PostMapping("/{id}/like")
    public ResponseEntity<Long> likeArticle(
            @PathVariable Long id,
            Authentication authentication) {

        String username = authentication.getName();

        long likeCount = articleService.likeArticle(id, username);

        return ResponseEntity.ok(likeCount);
    }
    @DeleteMapping("/{id}/like")
    public ResponseEntity<Long> unlikeArticle(
            @PathVariable Long id,
            Authentication authentication) {

        String username = authentication.getName();

        long likeCount = articleService.unlikeArticle(id, username);

        return ResponseEntity.ok(likeCount);
    }
    @GetMapping("/my-drafts")
    @PreAuthorize("hasAnyAuthority('ROLE_EDITOR')")
    public ResponseEntity<List<Article>> getMyDrafts(Authentication authentication){
        String username = authentication.getName();
        return ResponseEntity.ok(articleService.getDraftsForAuthor(username));
    }
    @GetMapping("/pending-review")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<List<Article>> getPendingReviews(){
        return ResponseEntity.ok(articleService.getArticlesPendingReview());
    }
    @GetMapping("/{id}/like-status")
    public ResponseEntity<ArticleLikeResponse> getLikeStatus(
            @PathVariable Long id,
            Authentication authentication) {

        String username = authentication.getName();

        return ResponseEntity.ok(
                articleService.getLikeStatus(id, username)
        );
    }
    @PostMapping("/{id}/status")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_EDITOR')")
    public ResponseEntity<Article> updateStatus(
            @PathVariable Long id,
            @RequestParam String status,
            Authentication authentication) {

        ArticleStatus newStatus =
                ArticleStatus.valueOf(status.toUpperCase());

        String username = authentication.getName();

        Article updatedArticle =
                articleService.updateArticle(
                        id,
                        newStatus,
                        username,
                        authentication.getAuthorities()
                );

        return ResponseEntity.ok(updatedArticle);
    }
    
   
    @GetMapping("/search")
    public ResponseEntity<List<Article>> searchArticles(@RequestParam String keyword) {
        List<Article> results = articleService.searchPublishedArticles(keyword);
        return ResponseEntity.ok(results);
    }

    
    @GetMapping("/filter")
    public ResponseEntity<List<Article>> filterArticles(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String author) {
        
        List<Article> results = articleService.filterPublishedArticles(categoryId, author);
        return ResponseEntity.ok(results);
    }
    @GetMapping("/my-articles")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_EDITOR', 'ROLE_AUTHOR')")
    public ResponseEntity<List<Article>> getMyArticles(Authentication authentication) {
        String username = authentication.getName();
        // Assuming your ArticleService has this method already, based on the other endpoints
        List<Article> myArticles = articleService.getArticlesByAuthor(username);
        return ResponseEntity.ok(myArticles);
    }
    @GetMapping("/category/{categoryId}/exists")
    public ResponseEntity<Boolean> categoryHasArticles(
            @PathVariable Long categoryId) {

        return ResponseEntity.ok(
            articleService.hasArticlesForCategory(categoryId)
        );
    }
    @GetMapping("/liked")
    public ResponseEntity<List<Article>> getLikedArticles(
            Authentication authentication) {

        String username = authentication.getName();

        return ResponseEntity.ok(
                articleService.getLikedArticles(username)
        );
    }


    @GetMapping("/{id}")
    public ResponseEntity<?> getArticleById(
            @PathVariable Long id) {

        try {
            Article article =
                    articleService.getArticleById(id);

            return ResponseEntity.ok(article);

        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}