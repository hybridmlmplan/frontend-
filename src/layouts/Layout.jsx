import { Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Layout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-gray-100">

      {/* SIDEBAR */}
      <div
        className={`bg-white shadow-md w-64 fixed h-full z-20 transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "-translate-x-64"} md:translate-x-0`}
      >
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-blue-600">Hybrid MLM</h1>
        </div>

        <div className="p-4 space-y-3">

          <button
            onClick={() => navigate("/dashboard")}
            className="w-full text-left py-2 px-3 rounded hover:bg-blue-100"
          >
            Dashboard
          </button>

          <button
            onClick={() => navigate("/profile")}
            className="w-full text-left py-2 px-3 rounded hover:bg-blue-100"
          >
            Profile
          </button>

          <button
            onClick={() => navigate("/package")}
            className="w-full text-left py-2 px-3 rounded hover:bg-blue-100"
          >
            Package
          </button>

          <button
            onClick={() => navigate("/wallet")}
            className="w-full text-left py-2 px-3 rounded hover:bg-blue-100"
          >
            Wallet
          </button>

          <button
            onClick={() => navigate("/epin")}
            className="w-full text-left py-2 px-3 rounded hover:bg-blue-100"
          >
            EPIN
          </button>

          <button
            onClick={() => navigate("/genealogy")}
            className="w-full text-left py-2 px-3 rounded hover:bg-blue-100"
          >
            Genealogy
          </button>

          <button
            onClick={() => navigate("/team")}
            className="w-full text-left py-2 px-3 rounded hover:bg-blue-100"
          >
            Team / Downline
          </button>

          <button
            onClick={() => navigate("/income")}
            className="w-full text-left py-2 px-3 rounded hover:bg-blue-100"
          >
            Income
          </button>

          <button
            onClick={logout}
            className="w-full text-left py-2 px-3 rounded bg-red-100 text-red-700 hover:bg-red-200"
          >
            Logout
          </button>

        </div>
      </div>

      {/* MAIN AREA */}
      <div className="flex-1 md:ml-64 flex flex-col">

        {/* TOPBAR */}
        <div className="bg-white shadow px-4 py-3 flex justify-between items-center">
          
          {/* MOBILE MENU BUTTON */}
          <button
            className="md:hidden text-2xl"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            ☰
          </button>

          <h2 className="text-lg font-semibold">Hybrid MLM Dashboard</h2>

          <button
            className="hidden md:block bg-red-500 text-white px-3 py-1 rounded"
            onClick={logout}
          >
            Logout
          </button>
        </div>

        {/* ALL PAGES WILL LOAD HERE */}
        <div className="p-4 overflow-y-auto h-full">
          <Outlet />
        </div>

      </div>
    </div>
  );
}
