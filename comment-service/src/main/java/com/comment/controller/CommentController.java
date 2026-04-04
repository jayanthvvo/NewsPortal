package com.comment.controller;


import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.comment.model.Comment;
import com.comment.repository.CommentRepository;

@RestController
@RequestMapping("/comments")
public class CommentController {

	@Autowired
	private CommentRepository commentRepository;
	@PostMapping("/create")
	public ResponseEntity<Comment> addComment(@RequestBody Comment comment,Authentication authentication){
		
		 String username= authentication.getName();
		 comment.setAuthorUsername(username);
		comment.setCreatedAt(LocalDateTime.now());
		Comment savedcomment=commentRepository.save(comment);
		return ResponseEntity.ok(savedcomment);
	}
	
	@GetMapping("/article/{articleId}")
	public ResponseEntity<List<Comment>> getCommentByArticleId(@PathVariable Long articleId){
		List<Comment> comments=commentRepository.findByArticleId(articleId);
		return ResponseEntity.ok(comments);
		
	}
}
