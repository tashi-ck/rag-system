import { useState } from "react";

export default function ChatInput({ onSend, disabled }) {
  const [value, setValue] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!value.trim() || disabled) return;
    onSend(value.trim());
    setValue("");
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-gray-200 bg-white px-4 py-3"
    >
      <div className="flex items-end gap-2 bg-gray-100 rounded-xl px-3 py-2">
        <textarea
          rows={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about your documents…"
          disabled={disabled}
          className="flex-1 resize-none bg-transparent text-sm text-gray-800
                     placeholder-gray-400 focus:outline-none min-h-[24px] max-h-[120px]
                     leading-6 disabled:opacity-50"
          style={{ height: "24px" }}
          onInput={(e) => {
            e.target.style.height = "24px";
            e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
          }}
        />
        <button
          type="submit"
          disabled={!value.trim() || disabled}
          className="shrink-0 w-8 h-8 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300
                     text-white rounded-lg flex items-center justify-center transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
          </svg>
        </button>
      </div>
      <p className="text-xs text-gray-400 mt-1 px-1">
        Enter to send · Shift+Enter for new line
      </p>
    </form>
  );
}