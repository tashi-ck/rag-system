package com.rag.rag_backend.service;

import com.rag.rag_backend.entity.*;
import com.rag.rag_backend.repo.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final AiService aiService;
    private final ConversationRepository conversationRepo;
    private final MessageRepository messageRepo;
    private final UserRepository userRepo;

    public Map<String, Object> ask(String question, String conversationId, String email) {
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Call the Python AI service
        Map<String, Object> aiResponse = aiService.askQuestion(question);
        String answer = (String) aiResponse.get("answer");

        // Find or create conversation
        Conversation conversation;
        if (conversationId != null) {
            conversation = conversationRepo.findById(UUID.fromString(conversationId))
                    .orElseGet(() -> conversationRepo.save(
                            Conversation.builder().user(user).build()));
        } else {
            conversation = conversationRepo.save(
                    Conversation.builder().user(user).build());
        }

        // Save this turn
        messageRepo.save(Message.builder()
                .conversation(conversation)
                .question(question)
                .answer(answer)
                .build());

        Map<String, Object> result = new HashMap<>(aiResponse);
        result.put("conversation_id", conversation.getId().toString());
        return result;
    }

    public List<Map<String, Object>> getHistory(String conversationId) {
        Conversation conv = conversationRepo.findById(UUID.fromString(conversationId))
                .orElseThrow(() -> new RuntimeException("Conversation not found"));

        return messageRepo.findByConversationOrderByCreatedAtAsc(conv)
                .stream()
                .map(m -> Map.<String, Object>of(
                        "question",   m.getQuestion(),
                        "answer",     m.getAnswer(),
                        "created_at", m.getCreatedAt().toString()
                ))
                .toList();
    }

    public List<Map<String, Object>> getConversations(String email) {
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return conversationRepo.findByUserOrderByCreatedAtDesc(user)
                .stream()
                .map(c -> Map.<String, Object>of(
                        "id",         c.getId().toString(),
                        "created_at", c.getCreatedAt().toString()
                ))
                .toList();
    }
}
