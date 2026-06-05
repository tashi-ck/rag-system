import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("rag_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Auth ────────────────────────────────────────────────────────────────────

export const register = (name, email, password) =>
  api.post("/auth/register", { name, email, password });

export const login = (email, password) =>
  api.post("/auth/login", { email, password });

// ─── Documents ───────────────────────────────────────────────────────────────

export const uploadDocument = (file) => {
  const form = new FormData();
  form.append("file", file);
  return api.post("/documents/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const getMyDocuments = () =>
  api.get("/documents");

// ─── Chat ─────────────────────────────────────────────────────────────────────

export const askQuestion = (question, conversationId = null) =>
  api.post("/chat/ask", { question, conversationId });

export const getConversations = () =>
  api.get("/chat/conversations");

export const getMessages = (conversationId) =>
  api.get(`/chat/conversations/${conversationId}/messages`);

// ─── Conversations ────────────────────────────────────────────────────────────
export const deleteConversation = (conversationId) =>
  api.delete(`/chat/conversations/${conversationId}`);

// ─── Documents ───────────────────────────────────────────────────────────────
export const deleteDocument = (documentId) =>
  api.delete(`/documents/${documentId}`);