import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE } from "../constants";

const Navbar = ({ user, logout }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-gray-900 text-white shadow-md px-4 py-3 fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* LOGO */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
          <img
            src="/logo.png"
            alt="Logo"
            className="w-9 h-9 rounded-full border border-gray-600"
          />
          <h1 className="text-xl font-semibold tracking-wide">Hybrid MLM</h1>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
          {!user ? (
            <>
              <Link to="/login" className="hover:text-yellow-400">Login</Link>
              <Link to="/signup" className="hover:text-yellow-400">Signup</Link>
            </>
          ) : (
            <>
              <Link to="/dashboard" className="hover:text-yellow-400">Dashboard</Link>
              <Link to="/package" className="hover:text-yellow-400">Package</Link>
              <Link to="/genealogy" className="hover:text-yellow-400">Genealogy</Link>
              <Link to="/income" className="hover:text-yellow-400">Incomes</Link>
              <Link to="/wallet" className="hover:text-yellow-400">Wallet</Link>

              {/* Admin Panel */}
              {user.role === "admin" && (
                <Link to="/admin" className="hover:text-red-400">Admin Panel</Link>
              )}

              {/* Franchise Panel */}
              {user.role === "franchise" && (
                <Link to="/franchise" className="hover:text-green-400">Franchise</Link>
              )}

              <Link to="/profile" className="hover:text-yellow-400">Profile</Link>

              <button
                onClick={handleLogout}
                className="px-3 py-1 bg-red-600 rounded-md hover:bg-red-700">
                Logout
              </button>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-2xl"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          ☰
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-gray-800 mt-3 p-4 rounded-lg shadow-lg text-sm">
          {!user ? (
            <>
              <Link to="/login" className="block py-2 hover:text-yellow-400">Login</Link>
              <Link to="/signup" className="block py-2 hover:text-yellow-400">Signup</Link>
            </>
          ) : (
            <>
              <Link to="/dashboard" className="block py-2 hover:text-yellow-400">Dashboard</Link>
              <Link to="/package" className="block py-2 hover:text-yellow-400">Package</Link>
              <Link to="/genealogy" className="block py-2 hover:text-yellow-400">Genealogy</Link>
              <Link to="/income" className="block py-2 hover:text-yellow-400">Incomes</Link>
              <Link to="/wallet" className="block py-2 hover:text-yellow-400">Wallet</Link>

              {/* Admin */}
              {user.role === "admin" && (
                <Link to="/admin" className="block py-2 text-red-400">Admin Panel</Link>
              )}

              {/* Franchise */}
              {user.role === "franchise" && (
                <Link to="/franchise" className="block py-2 text-green-400">Franchise</Link>
              )}

              <Link to="/profile" className="block py-2 hover:text-yellow-400">Profile</Link>

              <button
                onClick={handleLogout}
                className="w-full text-left py-2 text-red-400 hover:text-red-500"
              >
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
