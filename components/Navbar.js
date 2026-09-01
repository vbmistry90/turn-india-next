import { useState } from "react";
import { MdMenu, MdLogout, MdPerson } from "react-icons/md";

export default function Navbar({ title, onMenuClick, user, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-ink-100 h-16 flex items-center justify-between px-4 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-ink-600 hover:text-ink-900"
        >
          <MdMenu size={24} />
        </button>
        <h1 className="text-lg font-semibold text-ink-800">{title}</h1>
      </div>

      <div className="relative">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-ink-50"
        >
          <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold text-sm">
            {(user?.name || "?").charAt(0).toUpperCase()}
          </div>
          <span className="hidden sm:block text-sm font-medium text-ink-700">
            {user?.name || "..."}
          </span>
        </button>

        {menuOpen && (
          <div
            className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-ink-100 py-1"
            onMouseLeave={() => setMenuOpen(false)}
          >
            <div className="px-4 py-2 text-xs text-ink-400 border-b border-ink-100">
              <div className="flex items-center gap-1 text-ink-600">
                <MdPerson size={14} /> {user?.email}
              </div>
            </div>
            <button
              onClick={onLogout}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
            >
              <MdLogout size={16} /> Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
