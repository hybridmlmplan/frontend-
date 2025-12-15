import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Navbar = ({ user, logout }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout && logout();
    navigate("/login");
  };

  const go = (path) => {
    setMobileOpen(false);
    navigate(path);
  };

  return (
    <nav className="bg-gray-900 text-white px-4 py-3 fixed w-full top-0 z-[9999]">
      <div className="max-w-7xl mx-auto flex items-center justify-between">

        {/* LOGO */}
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => go("/")}
        >
          <img
            src="/logo.png"
            alt="Logo"
            className="w-9 h-9 rounded-full border border-gray-600"
          />
          <h1 className="text-xl font-semibold">Hybrid MLM</h1>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
          {!user ? (
            <>
              <button onClick={() => go("/login")} className="hover:text-yellow-400">
                Login
              </button>
              <button onClick={() => go("/signup")} className="hover:text-yellow-400">
                Signup
              </button>
            </>
          ) : (
            <>
              <button onClick={() => go("/dashboard")}>Dashboard</button>
              <button onClick={() => go("/package")}>Package</button>
              <button onClick={() => go("/genealogy")}>Genealogy</button>
              <button onClick={() => go("/income")}>Incomes</button>
              <button onClick={() => go("/wallet")}>Wallet</button>

              {user.role === "admin" && (
                <button onClick={() => go("/admin")} className="text-red-400">
                  Admin Panel
                </button>
              )}

              {user.role === "franchise" && (
                <button onClick={() => go("/franchise")} className="text-green-400">
                  Franchise
                </button>
              )}

              <button onClick={() => go("/profile")}>Profile</button>

              <button
                onClick={handleLogout}
                className="px-3 py-1 bg-red-600 rounded hover:bg-red-700"
              >
                Logout
              </button>
            </>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-2xl"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          ☰
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-gray-800 mt-3 p-4 rounded shadow text-sm">
          {!user ? (
            <>
              <button onClick={() => go("/login")} className="block py-2">
                Login
              </button>
              <button onClick={() => go("/signup")} className="block py-2">
                Signup
              </button>
            </>
          ) : (
            <>
              <button onClick={() => go("/dashboard")} className="block py-2">Dashboard</button>
              <button onClick={() => go("/package")} className="block py-2">Package</button>
              <button onClick={() => go("/genealogy")} className="block py-2">Genealogy</button>
              <button onClick={() => go("/income")} className="block py-2">Incomes</button>
              <button onClick={() => go("/wallet")} className="block py-2">Wallet</button>
              <button onClick={() => go("/profile")} className="block py-2">Profile</button>
              <button onClick={handleLogout} className="block py-2 text-red-400">
                Logout
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
