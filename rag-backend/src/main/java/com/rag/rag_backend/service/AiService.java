package com.rag.rag_backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.http.MediaType;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AiService {

    @Value("${ai-service.base-url}")
    private String aiBaseUrl;

    private WebClient client() {
        return WebClient.builder().baseUrl(aiBaseUrl).build();
    }

    public Map<?, ?> uploadDocument(MultipartFile file) {
        MultipartBodyBuilder builder = new MultipartBodyBuilder();
        builder.part("file", file.getResource());

        return client().post().uri("/documents/upload")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .bodyValue(builder.build())
                .retrieve()
                .bodyToMono(Map.class)
                .block();
    }

    public Map<String, Object> askQuestion(String question) {
        return client().post().uri("/chat/ask")
                .bodyValue(Map.of("question", question))
                .retrieve()
                .bodyToMono(Map.class)
                .block();
    }

}
