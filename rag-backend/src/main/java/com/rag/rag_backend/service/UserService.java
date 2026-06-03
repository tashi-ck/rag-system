package com.rag.rag_backend.service;

import com.rag.rag_backend.entity.User;
import com.rag.rag_backend.repo.UserRepository;
import com.rag.rag_backend.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public Map<String, String> register(String name, String email, String password) {
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email already registered.");
        }
        User user = User.builder()
                .name(name)
                .email(email)
                .password(passwordEncoder.encode(password))
                .build();
        userRepository.save(user);
        String token = jwtUtil.generateToken(email, user.getRole());
        return Map.of("token", token, "name", name, "role", user.getRole());
    }

    public Map<String, String> login(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Invalid credentials."));
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new IllegalArgumentException("Invalid credentials.");
        }
        String token = jwtUtil.generateToken(email, user.getRole());
        return Map.of("token", token, "name", user.getName(), "role", user.getRole());
    }

}
