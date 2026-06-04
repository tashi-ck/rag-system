package com.rag.rag_backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.http.MediaType;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AiService {

    @Value("${ai-service.base-url}")
    private String aiBaseUrl;

    private WebClient client() {
        return WebClient.builder().baseUrl(aiBaseUrl).build();
    }

    public Map<?, ?> uploadDocument(MultipartFile file, String userId) {
        MultipartBodyBuilder builder = new MultipartBodyBuilder();
        builder.part("file", file.getResource());
        builder.part("user_id", userId);          // ← forward user ID

        return client().post().uri("/documents/upload")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .bodyValue(builder.build())
                .retrieve()
                .bodyToMono(Map.class)
                .block();
    }

    public Map<String, Object> askQuestion(String question, String userId) {
        return client().post().uri("/chat/ask")
                .bodyValue(Map.of("question", question, "user_id", userId))  // ← forward user ID
                .retrieve()
                .bodyToMono(Map.class)
                .block();
    }

    public List<Map<String, Object>> listDocuments(String userId) {
        return client().get()
                .uri(uri -> uri
                        .path("/documents/")
                        .queryParam("user_id", userId)
                        .build())
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<List<Map<String, Object>>>() {})
                .block();
    }
}
