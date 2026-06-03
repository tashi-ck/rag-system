import MessageList from "../components/MessageList";
import ChatInput   from "../components/ChatInput";
import { useChat } from "../hooks/useChat";

export default function ChatPage() {
  const { messages, loading, error, sendMessage, clearChat } = useChat();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3
                      border-b border-gray-200 bg-white shrink-0">
        <h1 className="text-sm font-semibold text-gray-800">Chat with your documents</h1>
        <button onClick={clearChat}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
          New chat
        </button>
      </div>

      {/* Messages */}
      <MessageList messages={messages} loading={loading} />

      {/* Error banner */}
      {error && (
        <div className="mx-4 mb-2 text-xs text-red-600 bg-red-50
                        border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {/* Input */}
      <ChatInput onSend={sendMessage} disabled={loading} />
    </div>
  );
}