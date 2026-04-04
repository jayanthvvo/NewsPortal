package com.example.article.controller;



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
import org.springframework.web.bind.annotation.RestController;

import com.example.article.model.Article;
import com.example.article.repository.ArticleRepository;

@RestController
@RequestMapping("/articles")
public class ArticleController {
    @Autowired
	private ArticleRepository articleRepository;
    @PostMapping("/create")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Article> create(@RequestBody Article article,Authentication authentication){
    	String username=authentication.getName();
    	article.setAuthorUsername(username);
    	article.setCreatedAt(java.time.LocalDateTime.now());
    	Article savedArticle=articleRepository.save(article);
    	return ResponseEntity.ok(savedArticle);
    }
    
    @GetMapping("/all")
    public ResponseEntity<List<Article>> getAllArticle(){
    	List<Article> articles=articleRepository.findAll();
    	return ResponseEntity.ok(articles);
    }
    @GetMapping("/author/{username}")
    public ResponseEntity<List<Article>> getArticleByAuthor(@PathVariable String username){
    	List<Article> articlesByAuthor=articleRepository.findByAuthorUsername(username);
        return ResponseEntity.ok(articlesByAuthor);
    }
    
    @DeleteMapping("/delete/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> deleteArticle(@PathVariable Long id){
    	if(articleRepository.existsById(id)) {
    		articleRepository.deleteById(id);
    		return ResponseEntity.ok("Deleted Succesfully");
    	}
    	return ResponseEntity.badRequest().body("Error: Article not found!");
    }
}
