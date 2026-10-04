package com.category.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(
        name = "article-service",
        configuration = FeignConfig.class
)
public interface ArticleClient {

    @GetMapping("/articles/category/{categoryId}/exists")
    Boolean categoryHasArticles(@PathVariable("categoryId") Long categoryId);
}