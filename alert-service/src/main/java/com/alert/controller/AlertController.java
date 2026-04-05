package com.alert.controller;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.alert.model.Alert;
import com.alert.repository.AlertRepository;

@RestController
@RequestMapping("/alerts")
public class AlertController {
    @Autowired
	private AlertRepository alertRepository;
    @PostMapping("/send")
    public ResponseEntity<Alert> sendAlert(@RequestBody Alert alert){
    	alert.setCreatedAt(LocalDateTime.now());
    	alert.setRead(false);
    	
    	Alert savedAlert=alertRepository.save(alert);
    	return ResponseEntity.ok(savedAlert);
    	
    }
    @GetMapping("/my-alerts")
    public ResponseEntity<List<Alert>> getMyalerts(Authentication authentication){
    	String name=authentication.getName();
    	List<Alert> myAlerts=alertRepository.findByTargetUsername(name);
    	return ResponseEntity.ok(myAlerts);
    }
}
