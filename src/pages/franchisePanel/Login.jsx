import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "@/utils/axiosInstance"; // make sure this exists and is configured
import { Loader2 } from "lucide-react";

/**
 * Franchise Panel Login
 *
 * Uses: ID number (login id) + password
 * - Stores token + franchise info in localStorage on success
 * - Redirects to /franchise/dashboard
 *
 * NOTE: If your backend route differs, update the axios.post URL accordingly.
 */
const FranchiseLogin = () => {
  const navigate = useNavigate();
  const [idNumber, setIdNumber] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // basic client-side validation
  const validate = () => {
    if (!idNumber || idNumber.toString().trim() === "") {
      setErrorMsg("Please enter your login ID number.");
      return false;
    }
    // ensure numeric idNumber (your system uses numeric IDs)
    if (!/^\d+$/.test(idNumber.toString().trim())) {
      setErrorMsg("Login ID should contain only digits.");
      return false;
    }
    if (!password || password.trim().length < 4) {
      setErrorMsg("Please enter a valid password (min 4 characters).");
      return false;
    }
    setErrorMsg("");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrorMsg("");

    try {
      // POST login to franchise auth endpoint
      const resp = await axios.post("/franchise/auth/login", {
        idNumber: idNumber.toString().trim(),
        password: password,
      });

      // expected response: { token: "...", franchise: { id: ..., name: ... }, expiresIn: ... }
      const data = resp.data;

      if (!data || !data.token) {
        throw new Error("Invalid response from server.");
      }

      // Save token & franchise info
      const storageObj = {
        token: data.token,
        franchise: data.franchise || null,
        loggedAt: new Date().toISOString(),
        expiresIn: data.expiresIn || null,
      };

      // If user chose remember, persist longer (localStorage), otherwise sessionStorage
      if (remember) {
        localStorage.setItem("franchiseAuth", JSON.stringify(storageObj));
      } else {
        sessionStorage.setItem("franchiseAuth", JSON.stringify(storageObj));
      }

      // set axios default header for future requests
      axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;

      // redirect to franchise dashboard
      navigate("/franchise/dashboard");
    } catch (err) {
      console.error("franchise login error:", err);
      // friendly message
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Login failed. Please check your credentials.";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white shadow-lg rounded-2xl p-6">
          <h1 className="text-2xl font-semibold mb-1">Franchise Login</h1>
          <p className="text-sm text-gray-500 mb-6">
            Use your login ID number and password to access the franchise panel.
          </p>

          {errorMsg && (
            <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Login ID</span>
              <input
                type="text"
                inputMode="numeric"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                placeholder="Enter your ID number"
                className="mt-1 block w-full rounded-lg border-gray-200 shadow-sm focus:ring-2 focus:ring-blue-300 px-3 py-2"
                autoComplete="username"
                aria-label="Login ID number"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                className="mt-1 block w-full rounded-lg border-gray-200 shadow-sm focus:ring-2 focus:ring-blue-300 px-3 py-2"
                autoComplete="current-password"
                aria-label="Password"
              />
            </label>

            <div className="flex items-center justify-between">
              <label className="inline-flex items-center text-sm">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-gray-700">Remember me</span>
              </label>

              <button
                type="button"
                onClick={() => navigate("/franchise/forgot-password")}
                className="text-sm text-blue-600 hover:underline"
              >
                Forgot?
              </button>
            </div>

            <div>
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium shadow"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin w-4 h-4" />
                    Logging in...
                  </>
                ) : (
                  "Sign in"
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-sm text-center text-gray-500">
            <p>
              Not a franchise user?{" "}
              <button
                onClick={() => navigate("/franchise/register")}
                className="text-blue-600 hover:underline"
              >
                Register
              </button>
            </p>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">
          Powered by your hybrid MLM engine — PV for binary, BV for funds & royalty.
        </p>
      </div>
    </div>
  );
};

export default FranchiseLogin;
