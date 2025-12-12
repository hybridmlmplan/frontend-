import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// AdminLogin.jsx
// 100% complete admin login page tailored to the Hybrid MLM plan project.
// - POST /api/admin/login  body: { usernameOrEmail, password }
// - On success expects { status: true, data: { token, admin: { name, email, ... } } }
// - Saves token to localStorage key 'token' (used by admin components)
// - Handles loading / error states, simple validation, show/hide password, remember-me

export default function AdminLogin() {
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPass, setShowPass] = useState(false);
  const navigate = useNavigate();

  function validate() {
    if (!usernameOrEmail.trim()) return "Enter username or email";
    if (!password) return "Enter password";
    return null;
  }

  async function handleLogin(e) {
    e?.preventDefault();
    setError(null);
    const v = validate();
    if (v) return setError(v);
    setLoading(true);
    try {
      // API contract: POST /api/admin/login  { usernameOrEmail, password }
      const res = await axios.post("/api/admin/login", { usernameOrEmail: usernameOrEmail.trim(), password });
      if (!res.data) throw new Error("Invalid server response");
      if (res.data.status && res.data.data && res.data.data.token) {
        const token = res.data.data.token;
        // Save token
        localStorage.setItem("token", token);
        if (remember) localStorage.setItem("adminRemember", "1"); else localStorage.removeItem("adminRemember");
        // Optionally save admin basic info
        try { localStorage.setItem("admin", JSON.stringify(res.data.data.admin || {})); } catch (e) { /* ignore */ }
        // Redirect to admin dashboard
        navigate("/admin/dashboard");
      } else {
        throw new Error(res.data.message || "Login failed");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || "Login error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded shadow p-6">
        <h1 className="text-2xl font-semibold mb-2">Admin Login</h1>
        <p className="text-sm text-gray-500 mb-4">Enter your admin credentials to access the control panel.</p>

        {error && (
          <div className="mb-4 text-sm text-red-700 bg-red-100 p-2 rounded">{error}</div>
        )}

        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700">Username or Email</label>
            <input
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              className="mt-1 block w-full border rounded p-2"
              placeholder="admin@mail.com or admin_username"
              autoComplete="username"
            />
          </div>

          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full border rounded p-2 pr-10"
                placeholder="Enter password"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPass((s) => !s)}
                className="absolute right-2 top-2 text-sm text-gray-600"
                aria-label={showPass ? "Hide password" : "Show password"}
              >
                {showPass ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <label className="inline-flex items-center text-sm">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="mr-2" />
              Remember me
            </label>
            <button type="button" onClick={() => navigate("/admin/forgot-password")} className="text-sm text-indigo-600 hover:underline">Forgot?</button>
          </div>

          <div className="flex items-center gap-2">
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded disabled:opacity-60">{loading ? "Signing in..." : "Sign in"}</button>
            <button type="button" onClick={() => { setUsernameOrEmail(""); setPassword(""); setError(null); }} className="px-4 py-2 border rounded">Clear</button>
          </div>
        </form>

        <div className="text-xs text-gray-500 mt-4">
          Note: Admin endpoints assumed: <code>POST /api/admin/login</code>. The token is stored in <code>localStorage.token</code> and used by admin pages for Authorization header.
        </div>
      </div>
    </div>
  );
}
