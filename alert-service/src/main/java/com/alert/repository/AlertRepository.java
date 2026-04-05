package com.alert.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.alert.model.Alert;

@Repository
public interface AlertRepository extends JpaRepository<Alert, Long> {
    
   
    List<Alert> findByTargetUsername(String targetUsername);
}