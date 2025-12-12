// src/pages/auth/ForgotPassword.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * ForgotPassword.jsx
 *
 * Flow:
 * 1) User provides ID Number + Email -> POST /api/auth/forgot-password
 *    server should send OTP to email (or provide token flow)
 * 2) User enters OTP -> POST /api/auth/verify-reset-otp
 *    (server verifies OTP)
 * 3) User sets new password -> POST /api/auth/reset-password
 *
 * NOTE: Adjust endpoint URLs / response fields to match your backend.
 */

export default function ForgotPassword() {
  const navigate = useNavigate && useNavigate();
  const [step, setStep] = useState(1); // 1 = request, 2 = verify OTP, 3 = reset pwd
  const [idNumber, setIdNumber] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(""); // success/info
  const [error, setError] = useState("");

  // If your API returns a temporary token on OTP verification, store it here.
  const [resetToken, setResetToken] = useState(null);

  function validateRequest() {
    setError("");
    if (!idNumber || idNumber.toString().trim() === "") {
      setError("कृपया ID Number डालें।");
      return false;
    }
    if (!email || email.trim() === "") {
      setError("कृपया Email डालें।");
      return false;
    }
    // Basic email format check (loose)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("कृपया वैध Email डालें।");
      return false;
    }
    return true;
  }

  function validateOtp() {
    setError("");
    if (!otp || otp.trim().length < 3) {
      setError("कृपया सही OTP डालें।");
      return false;
    }
    return true;
  }

  function validateNewPassword() {
    setError("");
    if (!newPassword || newPassword.length < 6) {
      setError("पासवर्ड कम से कम 6 अक्षर का होना चाहिए।");
      return false;
    }
    if (newPassword !== confirmPassword) {
      setError("New password और Confirm password match नहीं कर रहे।");
      return false;
    }
    return true;
  }

  // Step 1: request OTP / reset initiation
  async function handleRequestOtp(e) {
    e.preventDefault();
    setMessage("");
    setError("");
    if (!validateRequest()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idNumber: idNumber.toString().trim(),
          email: email.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.message || "Request failed. कृपया पुनः प्रयास करें।");
        setLoading(false);
        return;
      }

      // server should indicate OTP sent
      setMessage(
        data?.message ||
          "OTP भेज दिया गया है। अपने ईमेल की जाँच करें और OTP डालें।"
      );
      setStep(2);
    } catch (err) {
      console.error(err);
      setError("Network error. कृपया इंटरनेट कनेक्शन चेक करें।");
    } finally {
      setLoading(false);
    }
  }

  // Step 2: verify OTP
  async function handleVerifyOtp(e) {
    e.preventDefault();
    setMessage("");
    setError("");
    if (!validateOtp()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-reset-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idNumber: idNumber.toString().trim(),
          email: email.trim(),
          otp: otp.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.message || "OTP verification failed.");
        setLoading(false);
        return;
      }

      // If backend returns a short-lived reset token, store it for final step
      if (data?.resetToken) setResetToken(data.resetToken);

      setMessage(data?.message || "OTP verified. अब नया पासवर्ड सेट करें।");
      setStep(3);
    } catch (err) {
      console.error(err);
      setError("Network error. कृपया इंटरनेट कनेक्शन चेक करें।");
    } finally {
      setLoading(false);
    }
  }

  // Step 3: reset password
  async function handleResetPassword(e) {
    e.preventDefault();
    setMessage("");
    setError("");
    if (!validateNewPassword()) return;

    setLoading(true);
    try {
      const payload = {
        idNumber: idNumber.toString().trim(),
        email: email.trim(),
        otp: otp.trim(),
        newPassword,
      };

      // if resetToken exists prefer that
      if (resetToken) payload.resetToken = resetToken;

      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.message || "Password reset failed.");
        setLoading(false);
        return;
      }

      setMessage(data?.message || "पासवर्ड बदल दिया गया है। आप लॉगिन कर सकते हैं।");

      // Optionally redirect to login after short timeout
      setTimeout(() => {
        if (navigate) navigate("/auth/login");
        else window.location.href = "/auth/login";
      }, 1200);
    } catch (err) {
      console.error(err);
      setError("Network error. कृपया इंटरनेट कनेक्शन चेक करें।");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl border shadow p-6">
        <h2 className="text-2xl font-semibold mb-2 text-center">Forgot Password</h2>
        <p className="text-sm text-gray-500 mb-4 text-center">
          ID Number + Email डालकर जारी रखें — OTP से verify कर के नया पासवर्ड सेट करें।
        </p>

        {error && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-100 p-3 rounded">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 text-sm text-green-800 bg-green-50 border border-green-100 p-3 rounded">
            {message}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">ID Number</label>
              <input
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 p-2"
                placeholder="अपना ID Number डालें"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                className="mt-1 block w-full rounded-md border-gray-300 p-2"
                placeholder="Email address"
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-60"
              >
                {loading ? "Sending..." : "Send OTP"}
              </button>

              <a href="/auth/login" className="text-sm text-indigo-600 hover:text-indigo-800">
                Back to login
              </a>
            </div>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">ID Number</label>
              <input
                value={idNumber}
                readOnly
                className="mt-1 block w-full rounded-md border-gray-200 p-2 bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                value={email}
                readOnly
                className="mt-1 block w-full rounded-md border-gray-200 p-2 bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">OTP</label>
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 p-2"
                placeholder="Email में आया OTP डालें"
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-60"
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Edit details
              </button>
            </div>

            <div className="text-sm text-gray-500">
              अगर OTP नहीं मिला तो अपने ईमेल का spam folder चेक करें या फिर फिर से Send OTP करिए।
              <div className="mt-2">
                <button
                  type="button"
                  onClick={handleRequestOtp}
                  disabled={loading}
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  Resend OTP
                </button>
              </div>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">New Password</label>
              <input
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                type="password"
                className="mt-1 block w-full rounded-md border-gray-300 p-2"
                placeholder="नया पासवर्ड डालें (min 6 char)"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
              <input
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                type="password"
                className="mt-1 block w-full rounded-md border-gray-300 p-2"
                placeholder="Confirm password"
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-60"
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setOtp("");
                  setNewPassword("");
                  setConfirmPassword("");
                  setMessage("");
                  setError("");
                }}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Start over
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
