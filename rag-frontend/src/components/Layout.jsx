import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import { getConversations } from "../services/api";

export default function Layout() {
  const { user, logout }          = useAuth();
  const navigate                  = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [convsLoading, setConvsLoading]   = useState(true);

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

  function formatDate(iso) {
  const d   = new Date(iso);
  const now = new Date();

  // Compare calendar dates only — strip the time component
  const dDate   = new Date(d.getFullYear(),   d.getMonth(),   d.getDate());
  const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffDays = Math.round((nowDate - dDate) / 86400000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7)  return `${diffDays} days ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

  const activeLinkClass =
    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium " +
    "bg-indigo-50 text-indigo-700";
  const inactiveLinkClass =
    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm " +
    "text-gray-600 hover:bg-gray-100 transition-colors";

  return (
    <div className="flex h-screen bg-gray-50">

      {/* ── Sidebar ─────────────────────────────────────────── */}
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
          <NavLink to="/" end
            className={({ isActive }) =>
              isActive ? activeLinkClass : inactiveLinkClass}>
            💬 Chat
          </NavLink>
          <NavLink to="/upload"
            className={({ isActive }) =>
              isActive ? activeLinkClass : inactiveLinkClass}>
            📄 Upload
          </NavLink>
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
              /* Skeleton */
              [1, 2, 3].map((i) => (
                <div key={i}
                  className="h-10 rounded-lg bg-gray-100 animate-pulse mx-1 mb-1" />
              ))
            ) : conversations.length === 0 ? (
              <p className="text-xs text-gray-400 px-3 py-2">
                No conversations yet.
              </p>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => navigate(`/?conversation=${conv.id}`)}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs
                             text-gray-600 hover:bg-gray-100 transition-colors
                             flex flex-col gap-0.5"
                >
                  <span className="font-medium text-gray-700 truncate w-full">
                    {conv.title || "Conversation"}
                  </span>
                  <span className="text-gray-400">{formatDate(conv.created_at)}</span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Footer — user info + sign out */}
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
          <button
            onClick={handleLogout}
            className="w-full text-left text-xs text-gray-400 hover:text-gray-600
                       px-1 py-1 rounded hover:bg-gray-100 transition-colors">
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────────── */}
      <main className="flex-1 overflow-hidden flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}