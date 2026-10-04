package com.user.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.user.model.UserProfile;

@Repository
public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {

    Optional<UserProfile> findByUsername(String username);

    Optional<UserProfile> findByEmail(String email);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);
}