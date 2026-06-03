import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const linkClass = ({ isActive }) =>
    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
      isActive
        ? "bg-indigo-50 text-indigo-700 font-medium"
        : "text-gray-600 hover:bg-gray-100"
    }`;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-white border-r border-gray-200
                        flex flex-col justify-between py-4 px-3">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-3">
            RAG System
          </p>
          <nav className="space-y-1">
            <NavLink to="/" end className={linkClass}>
              💬 Chat
            </NavLink>
            <NavLink to="/upload" className={linkClass}>
              📄 Upload
            </NavLink>
          </nav>
        </div>
        <div className="border-t border-gray-100 pt-3">
          <p className="text-xs text-gray-500 px-3 mb-2 truncate">{user?.name}</p>
          <button onClick={handleLogout}
            className="w-full text-left text-xs text-gray-400 hover:text-gray-600
                       px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-hidden flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}