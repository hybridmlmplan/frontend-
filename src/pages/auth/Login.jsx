// src/pages/auth/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Login page: only ID Number + Password (as requested)
 *
 * Expected backend endpoint (example): POST /api/auth/login
 * Body: { idNumber: string, password: string }
 * Response expected: { success: true, token: "...", user: {...} }
 *
 * On success this component stores token and user in localStorage:
 * - localStorage.setItem("authToken", token)
 * - localStorage.setItem("authUser", JSON.stringify(user))
 *
 * Adjust the endpoint URL and response handling to match your backend.
 */

export default function Login() {
  const navigate = useNavigate && useNavigate();
  const [idNumber, setIdNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [remember, setRemember] = useState(true);

  // Simple client-side validations
  function validate() {
    if (!idNumber || idNumber.toString().trim() === "") {
      setErrorMsg("कृपया ID Number डालें।");
      return false;
    }
    // you can enforce numeric-only if ID numbers are numeric:
    // if (!/^\d+$/.test(idNumber)) { setErrorMsg("ID Number केवल अंक होने चाहिए।"); return false; }
    if (!password || password.length < 4) {
      setErrorMsg("कृपया कम से कम 4 अक्षरों का पासवर्ड डालें।");
      return false;
    }
    return true;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");
    if (!validate()) return;

    setLoading(true);
    try {
      // CHANGE THIS URL to match your backend route
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idNumber: idNumber.toString().trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // backend should return helpful message
        setErrorMsg(data?.message || "Login failed. कृपया फिर कोशिश करें।");
        setLoading(false);
        return;
      }

      // Expect token and user in response; adapt if different
      const { token, user } = data;
      if (!token) {
        setErrorMsg("Server response invalid — token नहीं मिला।");
        setLoading(false);
        return;
      }

      // store token and user
      // if remember is true store persistently otherwise store in sessionStorage
      if (remember) {
        localStorage.setItem("authToken", token);
        localStorage.setItem("authUser", JSON.stringify(user ?? {}));
      } else {
        sessionStorage.setItem("authToken", token);
        sessionStorage.setItem("authUser", JSON.stringify(user ?? {}));
      }

      // navigate to dashboard or home (adjust route as needed)
      if (navigate) navigate("/dashboard");
      else window.location.href = "/dashboard";
    } catch (err) {
      console.error("Login error:", err);
      setErrorMsg("Network error. कृपया इंटरनेट कनेक्शन चेक करें।");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white border border-gray-200 rounded-2xl shadow-lg p-6">
        <h1 className="text-2xl font-semibold mb-2 text-center">Login</h1>
        <p className="text-sm text-gray-500 mb-6 text-center">
          ID Number + Password से साइन इन करें
        </p>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded mb-4">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">ID Number</span>
            <input
              type="text"
              inputMode="numeric"
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              placeholder="अपना ID Number डालें"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2"
              aria-label="ID Number"
              required
            />
          </label>

          <label className="block relative">
            <span className="text-sm font-medium text-gray-700">Password</span>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2 pr-10"
              aria-label="Password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-2 top-9 text-sm text-gray-500 hover:text-gray-700"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </label>

          <div className="flex items-center justify-between">
            <label className="inline-flex items-center text-sm">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="ml-2 text-gray-600">Remember me</span>
            </label>

            <a
              href="/auth/forgot"
              className="text-sm text-indigo-600 hover:text-indigo-700"
            >
              Forgot?
            </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-indigo-600 text-white px-4 py-2 font-medium hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  />
                </svg>
                <span>Signing in...</span>
              </>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          Don't have account?{" "}
          <a href="/auth/signup" className="text-indigo-600 hover:text-indigo-700">
            Sign up
          </a>
        </div>
      </div>
    </div>
  );
}
