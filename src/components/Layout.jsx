// frontend/src/components/Layout.jsx
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function Layout({ children }) {
  const navigate = useNavigate();

  // Authentication Check
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="h-screen flex bg-gray-100">
      {/* --------------------------- Sidebar --------------------------- */}
      <aside className="w-64 bg-white shadow-lg p-4 flex flex-col">
        <h2 className="text-xl font-bold text-center mb-6">Hybrid MLM Plan</h2>

        <nav className="flex flex-col gap-3">
          <button
            onClick={() => navigate("/dashboard")}
            className="text-left px-3 py-2 rounded hover:bg-gray-200"
          >
            Dashboard
          </button>

          <button
            onClick={() => navigate("/profile")}
            className="text-left px-3 py-2 rounded hover:bg-gray-200"
          >
            Profile
          </button>

          <button
            onClick={() => navigate("/genealogy")}
            className="text-left px-3 py-2 rounded hover:bg-gray-200"
          >
            Genealogy
          </button>

          <button
            onClick={() => navigate("/income")}
            className="text-left px-3 py-2 rounded hover:bg-gray-200"
          >
            Income
          </button>

          <button
            onClick={() => navigate("/purchase")}
            className="text-left px-3 py-2 rounded hover:bg-gray-200"
          >
            Purchase History
          </button>

          <button
            onClick={handleLogout}
            className="mt-auto text-left px-3 py-2 rounded bg-red-500 text-white hover:bg-red-600"
          >
            Logout
          </button>
        </nav>
      </aside>

      {/* --------------------------- Main Content --------------------------- */}
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}
