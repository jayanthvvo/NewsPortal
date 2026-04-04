package com.comment.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.comment.model.Comment;
import java.util.List;


@Repository
public interface CommentRepository extends JpaRepository<Comment, Long>{

	List<Comment> findByArticleId(Long articleId);
}
