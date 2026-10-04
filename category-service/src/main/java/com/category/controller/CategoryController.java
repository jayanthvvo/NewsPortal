package com.category.controller;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.category.model.Category;
import com.category.repository.CategoryRepository;
import jakarta.validation.Valid;
import com.category.client.ArticleClient;
import feign.FeignException;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/categories")
public class CategoryController {

    @Autowired
    private CategoryRepository categoryRepository;
    @Autowired
    private ArticleClient articleClient;

    @PostMapping("/create")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')") 
    public ResponseEntity<?> createCategory(@Valid @RequestBody Category category) {
        
       
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
    
    @DeleteMapping("/delete/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<String> deleteCategory(@PathVariable Long id) {

        if (!categoryRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        try {
            Boolean hasArticles = articleClient.categoryHasArticles(id);

            if (Boolean.TRUE.equals(hasArticles)) {
                return ResponseEntity
                        .status(HttpStatus.CONFLICT)
                        .body("Cannot delete category because it is being used by articles.");
            }

        } catch (FeignException e) {
            return ResponseEntity
                    .status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body("Could not verify whether the category is being used by articles.");
        }

        categoryRepository.deleteById(id);

        return ResponseEntity.ok("Category deleted successfully");
    }
}