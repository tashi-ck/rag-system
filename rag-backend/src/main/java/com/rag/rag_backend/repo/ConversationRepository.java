package com.rag.rag_backend.repo;

import com.rag.rag_backend.entity.Conversation;
import com.rag.rag_backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ConversationRepository extends JpaRepository<Conversation, UUID> {
    List<Conversation> findByUserOrderByCreatedAtDesc(User user);
}
