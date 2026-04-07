package com.category.controller;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.category.model.Category;
import com.category.repository.CategoryRepository;

@RestController
@RequestMapping("/categories")
public class CategoryController {

    @Autowired
    private CategoryRepository categoryRepository;

    @PostMapping("/create")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')") 
    public ResponseEntity<?> createCategory(@RequestBody Category category) {
        
       
        if (categoryRepository.existsByName(category.getName())) {
            return ResponseEntity.badRequest().body("Error: Category already exists!");
        }
        
        Category savedCategory = categoryRepository.save(category);
        return ResponseEntity.ok(savedCategory);
    }

    @GetMapping("/all")
    public ResponseEntity<List<Category>> getAllCategories() {
        List<Category> categories = categoryRepository.findAll();
        return ResponseEntity.ok(categories);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<?> getCategoryById(@PathVariable Long id) {
        Optional<Category> category = categoryRepository.findById(id);
        
        if(category.isPresent()) {
            return ResponseEntity.ok(category.get());
        }
        
        return ResponseEntity.notFound().build(); 
    }
}