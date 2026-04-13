package com.comment.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Entity
@Table(name = "comments")
public class Comment {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;
	
	@NotNull(message = "Article ID is required")
	@Column(nullable = false)
	private Long articleId;
	
	@NotBlank(message = "Comment content cannot be empty")
	@Size(max = 1000, message = "Comment content cannot exceed 1000 characters")
	@Column(nullable = false, length = 1000)
	private String content;
	
	private String authorUsername;

    private LocalDateTime createdAt;
    
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getArticleId() { return articleId; }
    public void setArticleId(Long articleId) { this.articleId = articleId; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getAuthorUsername() { return authorUsername; }
    public void setAuthorUsername(String authorUsername) { this.authorUsername = authorUsername; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}