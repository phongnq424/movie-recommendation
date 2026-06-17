package com.example.movierecommendation.auth;

import com.example.movierecommendation.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserLoginAuditRepository extends JpaRepository<UserLoginAudit, Long> {

    List<UserLoginAudit> findTop20ByUserOrderByLoginAtDesc(User user);
}