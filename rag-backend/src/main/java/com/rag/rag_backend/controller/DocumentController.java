package com.rag.rag_backend.controller;

import com.rag.rag_backend.entity.User;
import com.rag.rag_backend.repo.UserRepository;
import com.rag.rag_backend.service.AiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final AiService aiService;
    private final UserRepository userRepo;

    @PostMapping("/upload")
    public ResponseEntity<?> upload(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal String email) {

        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return ResponseEntity.ok(
                aiService.uploadDocument(file, user.getId().toString()));
    }

    @GetMapping                                          // ✅ List return type
    public ResponseEntity<List<Map<String, Object>>> listDocuments(
            @AuthenticationPrincipal String email) {

        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return ResponseEntity.ok(
                aiService.listDocuments(user.getId().toString()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDocument(
            @PathVariable String id,
            @AuthenticationPrincipal String email) {

        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Tell Python to delete the document and its chunks
        aiService.deleteDocument(id, user.getId().toString());

        return ResponseEntity.noContent().build();
    }
}
