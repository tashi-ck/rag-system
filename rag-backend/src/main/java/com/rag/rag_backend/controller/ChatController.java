package com.rag.rag_backend.controller;

import com.rag.rag_backend.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

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
}
