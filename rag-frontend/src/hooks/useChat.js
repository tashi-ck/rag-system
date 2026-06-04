import { useState, useCallback } from "react";
import { askQuestion } from "../services/api";

export function useChat() {
  const [messages, setMessages]             = useState([]);
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState(null);
  const [conversationId, setConversationId] = useState(null);

  const loadMessages = useCallback((history, convId) => {
    // history items come from GET /chat/conversations/:id/messages
    // shape: { question, answer, created_at }
    const restored = history.flatMap((m, i) => [
      { role: "user",      content: m.question, id: `h-u-${i}` },
      { role: "assistant", content: m.answer,   sources: [], id: `h-a-${i}` },
    ]);
    setMessages(restored);
    setConversationId(convId);
    setError(null);
  }, []);

  const sendMessage = useCallback(async (question) => {
    if (!question.trim()) return;
    const userMsg = { role: "user", content: question, id: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    setError(null);
    try {
      const { data } = await askQuestion(question, conversationId);
      if (!conversationId) setConversationId(data.conversation_id);
      setMessages((prev) => [...prev, {
        role:    "assistant",
        content: data.answer,
        sources: data.sources || [],
        id:      Date.now() + 1,
      }]);
    } catch {
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

  return { messages, loading, error, sendMessage, clearChat, loadMessages, conversationId };
}