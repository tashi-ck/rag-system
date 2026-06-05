package com.rag.rag_backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
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

    // 20 MB buffer — matches the Python upload limit
    private static final int MAX_BYTES = 20 * 1024 * 1024;

    private WebClient client() {
        ExchangeStrategies strategies = ExchangeStrategies.builder()
                .codecs(configurer -> configurer
                        .defaultCodecs()
                        .maxInMemorySize(MAX_BYTES))
                .build();

        return WebClient.builder()
                .baseUrl(aiBaseUrl)
                .exchangeStrategies(strategies)
                .build();
    }

    public Map<?, ?> uploadDocument(MultipartFile file, String userId) {
        // Read the bytes once — MultipartFile stream can only be read once
        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (Exception e) {
            throw new RuntimeException("Failed to read uploaded file: " + e.getMessage());
        }

        // Wrap in a ByteArrayResource so WebClient knows the filename
        ByteArrayResource fileResource = new ByteArrayResource(bytes) {
            @Override
            public String getFilename() {
                return file.getOriginalFilename();
            }
        };

        MultipartBodyBuilder builder = new MultipartBodyBuilder();
        builder.part("file", fileResource).contentType(
                MediaType.parseMediaType(
                        file.getContentType() != null
                                ? file.getContentType()
                                : "application/octet-stream"
                )
        );
        builder.part("user_id", userId);

        return client().post()
                .uri("/documents/upload")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(BodyInserters.fromMultipartData(builder.build()))
                .retrieve()
                .bodyToMono(Map.class)
                .block();
    }

    public Map<String, Object> askQuestion(String question, String userId) {
        return client().post()
                .uri("/chat/ask")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of("question", question, "user_id", userId))
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

    public void deleteDocument(String documentId, String userId) {
        client().delete()
                .uri(uri -> uri
                        .path("/documents/{id}")
                        .queryParam("user_id", userId)
                        .build(documentId))
                .retrieve()
                .bodyToMono(Void.class)
                .block();
    }
}
