// src/pages/auth/Signup.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

/**
 * Signup form aligned with the provided Hybrid-MLM business plan.
 *
 * Expected backend: POST /api/auth/signup
 * Payload example:
 * {
 *   name, mobile, email, sponsorId, placementId, placementSide,
 *   packageKey, epin, loginId, password
 * }
 *
 * Adjust SIGNUP_URL or payload shape as per your backend.
 */

const SIGNUP_URL = "/api/auth/signup"; // change if your API path differs

const PACKAGE_OPTIONS = [
  { key: "silver", label: "Silver - ₹35 (PV:35) - Pair income ₹10", pv: 35 },
  { key: "gold", label: "Gold - ₹155 (PV:155) - Pair income ₹50", pv: 155 },
  { key: "ruby", label: "Ruby - ₹1250 (PV:1250) - Pair income ₹500", pv: 1250 },
];

export default function Signup({ onSuccess }) {
  const navigate = useNavigate?.() ?? (() => {});
  const [form, setForm] = useState({
    name: "",
    mobile: "",
    email: "",
    sponsorId: "",
    placementId: "",
    placementSide: "left", // left or right (optional)
    packageKey: "silver",
    epin: "",
    loginId: "",
    password: "",
    acceptTnC: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // simple validators
  const validators = {
    name: (v) => v.trim().length >= 2 || "Name must be at least 2 characters",
    mobile: (v) =>
      /^[6-9]\d{9}$/.test(v) || "Mobile must be a valid 10-digit Indian number",
    email: (v) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || "Enter a valid email address",
    sponsorId: (v) => v.trim().length > 0 || "Sponsor ID is required",
    loginId: (v) => v.trim().length >= 4 || "Login ID must be at least 4 chars",
    password: (v) => v.length >= 6 || "Password must be at least 6 chars",
    acceptTnC: (v) => v === true || "You must accept Terms & Conditions",
  };

  function validateAll() {
    const errors = [];
    // required checks according to plan: sponsor id required, placement optional
    for (const key of ["name", "mobile", "email", "sponsorId", "loginId", "password"]) {
      const rule = validators[key];
      if (rule) {
        const res = rule(form[key]);
        if (res !== true) errors.push(res);
      }
    }
    // TnC
    if (validators.acceptTnC(form.acceptTnC) !== true) errors.push(validators.acceptTnC(form.acceptTnC));
    return errors;
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((s) => ({ ...s, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const errors = validateAll();
    if (errors.length) {
      setError(errors.join(". "));
      return;
    }

    setLoading(true);
    try {
      // build payload for backend
      const payload = {
        name: form.name.trim(),
        mobile: form.mobile.trim(),
        email: form.email.trim().toLowerCase(),
        sponsorId: form.sponsorId.trim(),
        placementId: form.placementId?.trim() || null,
        placementSide: form.placementId ? form.placementSide : null, // only relevant if placementId provided
        packageKey: form.packageKey,
        epin: form.epin?.trim() || null, // optional - if provided, will activate package server-side
        loginId: form.loginId.trim(),
        password: form.password,
        // optionally: additional metadata (PV/BV) can be set server-side based on packageKey
      };

      const res = await axios.post(SIGNUP_URL, payload, {
        headers: { "Content-Type": "application/json" },
        timeout: 20000,
      });

      // expect successful signup response
      if (res?.data?.success) {
        setSuccessMessage(res.data.message || "Signup successful!");
        // call callback or redirect to login/dashboard
        if (typeof onSuccess === "function") onSuccess(res.data);
        // small delay then navigate to login or dashboard
        setTimeout(() => {
          navigate("/auth/login");
        }, 1000);
      } else {
        // backend returned success:false or missing structure
        const msg = res?.data?.message || "Unable to complete signup. Try again.";
        setError(msg);
      }
    } catch (err) {
      // network or server error
      if (err.response?.data?.message) setError(err.response.data.message);
      else setError(err.message || "Network error, please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl bg-white shadow-lg rounded-2xl p-6 md:p-10"
      >
        <h2 className="text-2xl md:text-3xl font-semibold mb-4">Signup</h2>

        {/* name + mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex flex-col">
            <span className="text-sm font-medium mb-2">Full Name</span>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Example: Rajesh Kumar"
              className="input"
              required
            />
          </label>

          <label className="flex flex-col">
            <span className="text-sm font-medium mb-2">Mobile (10 digits)</span>
            <input
              name="mobile"
              value={form.mobile}
              onChange={handleChange}
              placeholder="9876543210"
              className="input"
              inputMode="numeric"
              required
            />
          </label>

          <label className="flex flex-col">
            <span className="text-sm font-medium mb-2">Email</span>
            <input
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className="input"
              type="email"
              required
            />
            <small className="text-xs text-gray-500 mt-1">
              Use email multiple times allowed (per plan)
            </small>
          </label>

          <label className="flex flex-col">
            <span className="text-sm font-medium mb-2">Login ID</span>
            <input
              name="loginId"
              value={form.loginId}
              onChange={handleChange}
              placeholder="login id (numeric or text)"
              className="input"
              required
            />
          </label>

          <label className="flex flex-col">
            <span className="text-sm font-medium mb-2">Password</span>
            <input
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="At least 6 characters"
              className="input"
              type="password"
              required
            />
          </label>
        </div>

        {/* sponsor + placement */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="flex flex-col col-span-1 md:col-span-1">
            <span className="text-sm font-medium mb-2">Sponsor ID (required)</span>
            <input
              name="sponsorId"
              value={form.sponsorId}
              onChange={handleChange}
              placeholder="Sponsor user id"
              className="input"
              required
            />
          </label>

          <label className="flex flex-col">
            <span className="text-sm font-medium mb-2">Placement ID (optional)</span>
            <input
              name="placementId"
              value={form.placementId}
              onChange={handleChange}
              placeholder="Placement id (optional)"
              className="input"
            />
          </label>

          <label className="flex flex-col">
            <span className="text-sm font-medium mb-2">Placement Side</span>
            <select
              name="placementSide"
              value={form.placementSide}
              onChange={handleChange}
              className="input"
            >
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
            <small className="text-xs text-gray-500 mt-1">
              Placement is optional — only used if Placement ID is provided.
            </small>
          </label>
        </div>

        {/* package + epin */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex flex-col">
            <span className="text-sm font-medium mb-2">Choose Package</span>
            <select
              name="packageKey"
              value={form.packageKey}
              onChange={handleChange}
              className="input"
            >
              {PACKAGE_OPTIONS.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </select>
            <small className="text-xs text-gray-500 mt-1">
              Packages are one-time purchase — activate by EPIN (if provided).
            </small>
          </label>

          <label className="flex flex-col">
            <span className="text-sm font-medium mb-2">EPIN (optional)</span>
            <input
              name="epin"
              value={form.epin}
              onChange={handleChange}
              placeholder="Enter EPIN to activate package"
              className="input"
            />
            <small className="text-xs text-gray-500 mt-1">
              If EPIN provided, backend will activate the selected package.
            </small>
          </label>
        </div>

        {/* t&c and submit */}
        <div className="mt-6 flex items-start gap-3">
          <input
            id="tnc"
            name="acceptTnC"
            type="checkbox"
            checked={form.acceptTnC}
            onChange={handleChange}
            className="h-5 w-5 rounded"
          />
          <label htmlFor="tnc" className="text-sm">
            I accept the <span className="font-semibold">Terms & Conditions</span> and agree that
            information provided is correct.
          </label>
        </div>

        {error && (
          <div className="mt-4 text-sm text-red-700 bg-red-50 p-3 rounded">{error}</div>
        )}
        {successMessage && (
          <div className="mt-4 text-sm text-green-800 bg-green-50 p-3 rounded">
            {successMessage}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between gap-4">
          <button
            type="submit"
            className={`px-6 py-2 rounded-full font-medium shadow-sm ${
              loading ? "opacity-60 cursor-wait" : "hover:shadow-md"
            } bg-gradient-to-r from-indigo-600 to-indigo-400 text-white`}
            disabled={loading}
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/auth/login")}
            className="text-sm text-gray-600 underline"
          >
            Already have account? Login
          </button>
        </div>

        <div className="mt-4 text-xs text-gray-500">
          <strong>Note:</strong> PV (Package Value) is used for binary pairing; BV is used for rank,
          royalty & fund logic on server-side. This form only registers user and optionally
          activates package via EPIN — all income rules are processed on backend per plan.
        </div>
      </form>
    </div>
  );
}

/* Tailwind helper classes used here expect:
   .input => "border rounded p-2 focus:ring-2 focus:ring-indigo-200"
   If not defined globally, you can replace "input" with full tailwind classes:
   "border border-gray-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
*/
