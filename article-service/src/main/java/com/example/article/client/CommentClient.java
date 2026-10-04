package com.example.article.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "comment-service")
public interface CommentClient {

    @DeleteMapping("/comments/article/{articleId}")
    void deleteCommentsByArticle(@PathVariable("articleId") Long articleId);
}