package com.example.article.client;

import java.util.List;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "CATEGORY-SERVICE")
public interface CategoryClient {

	@GetMapping("/categories/all")
    List<Object> getAllCategories(); 
    
	@GetMapping("/categories/{id}")
    Object getCategoryById(@PathVariable("id") Long id);
}
