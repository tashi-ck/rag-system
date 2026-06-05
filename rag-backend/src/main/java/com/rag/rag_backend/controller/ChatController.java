package com.rag.rag_backend.controller;

import com.rag.rag_backend.entity.Conversation;
import com.rag.rag_backend.repo.ConversationRepository;
import com.rag.rag_backend.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    @Autowired
    private ConversationRepository conversationRepo;

    private final ChatService chatService;

    @PostMapping("/ask")
    public ResponseEntity<?> ask(
            @RequestBody AskRequest req,
            @AuthenticationPrincipal String email) {
        return ResponseEntity.ok(
                chatService.ask(req.question(), req.conversationId(), email));
    }

    @GetMapping("/conversations")
    public ResponseEntity<?> conversations(@AuthenticationPrincipal String email) {
        return ResponseEntity.ok(chatService.getConversations(email));
    }

    @GetMapping("/conversations/{id}/messages")
    public ResponseEntity<?> messages(@PathVariable String id) {
        return ResponseEntity.ok(chatService.getHistory(id));
    }

    record AskRequest(String question, String conversationId) {}

    @DeleteMapping("/conversations/{id}")
    public ResponseEntity<?> deleteConversation(
            @PathVariable String id,
            @AuthenticationPrincipal String email) {

        Conversation conv = conversationRepo.findById(UUID.fromString(id))
                .orElseThrow(() -> new RuntimeException("Conversation not found"));

        // Ensure the conversation belongs to the requesting user
        if (!conv.getUser().getEmail().equals(email)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        conversationRepo.deleteById(UUID.fromString(id));
        return ResponseEntity.noContent().build();
    }
}
