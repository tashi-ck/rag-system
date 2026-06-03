import { useState, useCallback } from "react";
import { askQuestion } from "../services/api";

export function useChat() {
  const [messages, setMessages]           = useState([]);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState(null);
  const [conversationId, setConversationId] = useState(null);

  const sendMessage = useCallback(async (question) => {
    if (!question.trim()) return;

    // Add user message immediately (optimistic UI)
    const userMsg = { role: "user", content: question, id: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    setError(null);

    try {
      const { data } = await askQuestion(question, conversationId);

      if (!conversationId) setConversationId(data.conversation_id);

      const assistantMsg = {
        role:    "assistant",
        content: data.answer,
        sources: data.sources || [],
        id:      Date.now() + 1,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setError(null);
  }, []);

  return { messages, loading, error, sendMessage, clearChat, conversationId };
}