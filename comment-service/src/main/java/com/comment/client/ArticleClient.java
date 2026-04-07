package com.comment.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import com.comment.model.Articledto;

@FeignClient(name = "ARTICLE-SERVICE")
public interface ArticleClient {
    
    @GetMapping("/articles/{id}")
    Articledto getArticleById(@PathVariable("id") Long id);
}