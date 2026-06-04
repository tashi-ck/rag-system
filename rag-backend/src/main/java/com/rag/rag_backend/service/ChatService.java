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

    public Map<?, ?> ask(String question, String conversationId, String email) {
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Pass the user's UUID so Python scopes the search to their documents
        Map<String, Object> aiResponse = aiService.askQuestion(question, user.getId().toString());
        String answer = (String) aiResponse.get("answer");

        Conversation conversation;
        if (conversationId != null) {
            conversation = conversationRepo.findById(UUID.fromString(conversationId))
                    .orElseGet(() -> conversationRepo.save(
                            Conversation.builder().user(user).build()));
        } else {
            conversation = conversationRepo.save(Conversation.builder().user(user).build());
        }

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
                .map(c -> {
                    // Use the first question of the conversation as the title
                    String title = messageRepo.findByConversationOrderByCreatedAtAsc(c)
                            .stream().findFirst()
                            .map(m -> m.getQuestion().length() > 40
                                    ? m.getQuestion().substring(0, 40) + "…"
                                    : m.getQuestion())
                            .orElse("New conversation");
                    return Map.<String, Object>of(
                            "id",         c.getId().toString(),
                            "title",      title,
                            "created_at", c.getCreatedAt().toString()
                    );
                })
                .toList();
    }
}
