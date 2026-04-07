package com.comment.controller;



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

import com.comment.client.ArticleClient;
import com.comment.model.Articledto;
import com.comment.model.Comment;
import com.comment.repository.CommentRepository;

import feign.FeignException;

@RestController
@RequestMapping("/comments")
public class CommentController {

	@Autowired
	private CommentRepository commentRepository;
	@Autowired
    private ArticleClient articleClient; // Inject your new Feign Client

    @PostMapping("/create")
    @PreAuthorize("hasAnyAuthority('ROLE_USER', 'ROLE_EDITOR', 'ROLE_ADMIN')")
    public ResponseEntity<?> createComment(@RequestBody Comment comment, Authentication authentication) {
        
        if (comment.getArticleId() == null) {
            return ResponseEntity.badRequest().body("Error: Article ID is required.");
        }
       try {
            Articledto article = articleClient.getArticleById(comment.getArticleId());
            if (!"PUBLISHED".equals(article.getStatus())) {
                return ResponseEntity.badRequest().body("Error: You can only comment on published articles.");
            }
            
        } catch (FeignException.NotFound e) {
            return ResponseEntity.badRequest().body("Error: Article does not exist.");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error: Could not verify article status.");
        }

       
        comment.setAuthorUsername(authentication.getName());
        Comment savedComment = commentRepository.save(comment);
        
        return ResponseEntity.ok(savedComment);
    }
	
	@GetMapping("/article/{articleId}")
	public ResponseEntity<List<Comment>> getCommentByArticleId(@PathVariable Long articleId){
		List<Comment> comments=commentRepository.findByArticleId(articleId);
		return ResponseEntity.ok(comments);
		
	}
	@DeleteMapping("/delete/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<String> deleteComment(@PathVariable Long id) {
        
        if (commentRepository.existsById(id)) {
            commentRepository.deleteById(id);
            return ResponseEntity.ok("Comment deleted successfully");
        }
        
        return ResponseEntity.badRequest().body("Error: Comment not found.");
    }
}
