import { NavLink, Outlet, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import { getConversations, deleteConversation } from "../services/api";
import ConfirmDialog from "./ConfirmDialog";

export default function Layout() {
  const { user, logout }                    = useAuth();
  const navigate                            = useNavigate();
  const [searchParams]                      = useSearchParams();
  const [conversations, setConversations]   = useState([]);
  const [convsLoading, setConvsLoading]     = useState(true);
  const [deleteTarget, setDeleteTarget]     = useState(null); // {id, title}

  useEffect(() => {
    getConversations()
      .then(({ data }) => setConversations(data))
      .catch(() => setConversations([]))
      .finally(() => setConvsLoading(false));
  }, []);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  async function handleDeleteConversation() {
    if (!deleteTarget) return;
    try {
      await deleteConversation(deleteTarget.id);
      setConversations((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      // If user is currently viewing the deleted conversation, clear the chat
      if (searchParams.get("conversation") === deleteTarget.id) {
        navigate("/", { replace: true });
      }
    } catch {
      // Could add a toast here in future
    } finally {
      setDeleteTarget(null);
    }
  }

  function formatDate(iso) {
    const d       = new Date(iso);
    const now     = new Date();
    const dDate   = new Date(d.getFullYear(),   d.getMonth(),   d.getDate());
    const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diff    = Math.round((nowDate - dDate) / 86400000);
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    if (diff < 7)   return `${diff} days ago`;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  const linkClass = ({ isActive }) =>
    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
      isActive
        ? "bg-indigo-50 text-indigo-700 font-medium"
        : "text-gray-600 hover:bg-gray-100"
    }`;

  return (
    <div className="flex h-screen bg-gray-50">

      <aside className="w-56 shrink-0 bg-white border-r border-gray-200
                        flex flex-col overflow-hidden">
        {/* Brand */}
        <div className="px-4 py-4 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            RAG System
          </p>
        </div>

        {/* Main nav */}
        <nav className="px-2 pt-3 space-y-1 shrink-0">
          <NavLink to="/" end className={linkClass}>💬 Chat</NavLink>
          <NavLink to="/upload" className={linkClass}>📄 Upload</NavLink>
        </nav>

        {/* Conversation history */}
        <div className="flex flex-col flex-1 overflow-hidden mt-4">
          <div className="px-3 mb-2 flex items-center justify-between shrink-0">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              History
            </p>
            {conversations.length > 0 && (
              <span className="text-xs text-gray-400">{conversations.length}</span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
            {convsLoading ? (
              [1, 2, 3].map((i) => (
                <div key={i}
                  className="h-10 rounded-lg bg-gray-100 animate-pulse mx-1 mb-1"/>
              ))
            ) : conversations.length === 0 ? (
              <p className="text-xs text-gray-400 px-3 py-2">No conversations yet.</p>
            ) : (
              conversations.map((conv) => (
                <div key={conv.id}
                  className="group flex items-center gap-1 rounded-lg
                             hover:bg-gray-100 transition-colors px-1">
                  {/* Conversation button */}
                  <button
                    onClick={() => navigate(`/?conversation=${conv.id}`)}
                    className="flex-1 min-w-0 text-left px-2 py-2 text-xs
                               flex flex-col gap-0.5"
                  >
                    <span className="font-medium text-gray-700 truncate block">
                      {conv.title || "Conversation"}
                    </span>
                    <span className="text-gray-400">{formatDate(conv.created_at)}</span>
                  </button>

                  {/* Delete button — visible on hover */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget({ id: conv.id, title: conv.title || "this conversation" });
                    }}
                    className="opacity-0 group-hover:opacity-100 shrink-0 w-6 h-6
                               rounded flex items-center justify-center
                               text-gray-400 hover:text-red-600 hover:bg-red-50
                               transition-all"
                    aria-label="Delete conversation"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"
                         stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858
                           L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-3 py-3 shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700
                            flex items-center justify-center text-xs font-semibold shrink-0">
              {user?.name?.[0]?.toUpperCase() ?? "U"}
            </div>
            <span className="text-sm font-medium text-gray-700 truncate">
              {user?.name}
            </span>
          </div>
          <button onClick={handleLogout}
            className="w-full text-left text-xs text-gray-400 hover:text-gray-600
                       px-1 py-1 rounded hover:bg-gray-100 transition-colors">
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-hidden flex flex-col">
        <Outlet />
      </main>

      {/* Confirmation dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete conversation?"
        message={`This will permanently delete all messages in "${deleteTarget?.title}". This cannot be undone.`}
        onConfirm={handleDeleteConversation}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}