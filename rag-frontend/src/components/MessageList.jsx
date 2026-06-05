import { useEffect, useRef } from "react";
import SourceBadge from "./SourceBadge";

function UserBubble({ content }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[75%] bg-indigo-600 text-white rounded-2xl
                      rounded-tr-sm px-4 py-3 text-sm leading-relaxed">
        {content}
      </div>
    </div>
  );
}

// Inside AssistantBubble:
function AssistantBubble({ content, sources }) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[75%]">
        <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm
                        px-4 py-3 text-sm leading-relaxed text-gray-800 shadow-sm">
          {content}
        </div>
        <SourceBadge sources={sources} answer={content} />  {/* pass answer */}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm
                      px-4 py-3 shadow-sm">
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function MessageList({ messages, loading }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  if (messages.length === 0 && !loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-center px-8">
        <div>
          <div className="text-4xl mb-4">💬</div>
          <p className="text-gray-500 text-sm">
            Upload a document then ask a question about it.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
      {messages.map((msg) =>
        msg.role === "user" ? (
          <UserBubble key={msg.id} content={msg.content} />
        ) : (
          <AssistantBubble key={msg.id} content={msg.content} sources={msg.sources} />
        )
      )}
      {loading && <TypingIndicator />}
      <div ref={bottomRef} />
    </div>
  );
}