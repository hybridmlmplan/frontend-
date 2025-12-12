// src/pages/wallet/AddFund.jsx
import React, { useState } from "react";

/**
 * AddFund Page
 *
 * Purpose:
 * - Allow users (franchise/user) to add money to their wallet.
 * - Supports different "purposes" (PV / BV / Wallet) per your business plan.
 * - Posts to backend endpoint: POST /api/wallet/add-fund
 *
 * Notes:
 * - Backend must validate amounts, convert to PV/BV if needed and return
 *   { success: true, data: { transactionId, newBalance } } or appropriate error.
 * - Adjust API endpoint, headers, or token retrieval as per your auth strategy.
 */

const PAYMENT_METHODS = [
  { id: "upi", label: "UPI" },
  { id: "netbanking", label: "Net Banking" },
  { id: "card", label: "Card (Visa/Master/Amex)" },
  { id: "wallet", label: "Internal Wallet / Transfer" },
];

const PURPOSES = [
  { id: "wallet_topup", label: "Wallet Top-up (general)" },
  { id: "pv_purchase", label: "PV (Binary) Purchase" },
  { id: "bv_purchase", label: "BV (Repurchase / Funds)" },
];

export default function AddFund() {
  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("wallet_topup");
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [mobile, setMobile] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [validationErrors, setValidationErrors] = useState({});

  // Helper: format INR
  const formatINR = (n) => {
    if (!n && n !== 0) return "₹0";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(n);
  };

  // Business rule: show PV conversion (in this plan PV ~= ₹1)
  const pvEquivalent = () => {
    const num = Number(amount);
    if (!num || num <= 0) return 0;
    // As per plan: PV is 1 PV per ₹ (Silver 35 PV for ₹35 etc.)
    return Math.floor(num);
  };

  // Basic front-end validation
  function validate() {
    const errs = {};
    const num = Number(amount);

    if (!amount) errs.amount = "राशि दर्ज करें (Enter an amount).";
    else if (Number.isNaN(num) || num <= 0) errs.amount = "मान्य संख्या डालें (Enter a valid positive number).";

    // Optional: enforce minimum top-up (for example ₹35)
    if (num && num < 1) errs.amount = "न्यूनतम राशि ₹1 है (Minimum amount ₹1).";

    // Mobile optional, but if provided validate basic pattern
    if (mobile) {
      const m = mobile.replace(/\s+/g, "");
      if (!/^[6-9]\d{9}$/.test(m)) errs.mobile = "सही 10 अंकीय मोबाइल नंबर डालें (Enter valid 10-digit mobile).";
    }

    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");

    if (!validate()) return;

    setLoading(true);
    try {
      // Prepare payload
      const payload = {
        amount: Number(amount),
        purpose, // wallet_topup | pv_purchase | bv_purchase
        paymentMethod,
        mobile: mobile || null,
        note: note || null,
        // pvEquivalent: pvEquivalent(), // optionally send PV computed value
      };

      // Get auth token if your app uses it (adjust key as needed)
      const token = localStorage.getItem("auth_token");

      const res = await fetch("/api/wallet/add-fund", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        // backend should return helpful message in data.message
        throw new Error(data?.message || "Add fund failed");
      }

      // success
      setSuccessMsg(
        data?.message ||
          `राशि सफलतापूर्वक जोड़ी गई (Amount added successfully). Transaction ID: ${data?.data?.transactionId || "N/A"}`
      );
      // optionally clear form
      setAmount("");
      setNote("");
      setMobile("");
      setValidationErrors({});
    } catch (err) {
      console.error("AddFund error:", err);
      setErrorMsg(err?.message || "कुछ गलती हुई (Something went wrong).");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl md:text-3xl font-semibold mb-4">Wallet — Add Funds</h1>

      <p className="text-sm text-gray-600 mb-6">
        यहाँ आप अपनी वॉलेट/पीवी/बीवी के लिए फंड जोड़ सकते हैं। (Use this form to top-up your wallet, purchase PV/BV.)
      </p>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-lg shadow-sm p-6">
        {/* Amount */}
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
            Amount (INR) / राशि (₹)
          </label>
          <div className="mt-1 flex">
            <input
              id="amount"
              name="amount"
              type="number"
              step="1"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount in INR"
              className={`flex-1 block w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                validationErrors.amount ? "border-red-500" : "border-gray-300"
              }`}
              aria-invalid={!!validationErrors.amount}
              aria-describedby={validationErrors.amount ? "amount-error" : undefined}
            />
            <span className="ml-3 inline-flex items-center px-3 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded">
              {amount ? formatINR(Number(amount)) : "₹0"}
            </span>
          </div>
          {validationErrors.amount && (
            <p id="amount-error" className="mt-1 text-xs text-red-600">
              {validationErrors.amount}
            </p>
          )}
        </div>

        {/* Purpose */}
        <div>
          <label htmlFor="purpose" className="block text-sm font-medium text-gray-700">
            Purpose / उद्देश्य
          </label>
          <select
            id="purpose"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {PURPOSES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            नोट: PV खरीदने के लिए PV (Binary) purpose चुनें। BV (funds/repurchase) के लिए BV चुनें।
          </p>
        </div>

        {/* Payment Method */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Payment Method</label>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {PAYMENT_METHODS.map((m) => (
              <label
                key={m.id}
                className={`flex items-center gap-2 cursor-pointer rounded-md border px-3 py-2 ${
                  paymentMethod === m.id ? "border-indigo-500 bg-indigo-50" : "border-gray-200 bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={m.id}
                  checked={paymentMethod === m.id}
                  onChange={() => setPaymentMethod(m.id)}
                  className="form-radio h-4 w-4 text-indigo-600"
                />
                <span className="text-sm">{m.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Mobile (optional) */}
        <div>
          <label htmlFor="mobile" className="block text-sm font-medium text-gray-700">
            Mobile (optional) — मोबाइल (वैकल्पिक)
          </label>
          <input
            id="mobile"
            type="tel"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            placeholder="10-digit mobile (optional)"
            className={`mt-1 block w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              validationErrors.mobile ? "border-red-500" : "border-gray-300"
            }`}
            aria-invalid={!!validationErrors.mobile}
            aria-describedby={validationErrors.mobile ? "mobile-error" : undefined}
          />
          {validationErrors.mobile && (
            <p id="mobile-error" className="mt-1 text-xs text-red-600">
              {validationErrors.mobile}
            </p>
          )}
        </div>

        {/* Note */}
        <div>
          <label htmlFor="note" className="block text-sm font-medium text-gray-700">
            Note (optional)
          </label>
          <textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows="3"
            placeholder="Optional note (e.g., EPIN transfer, order id, sponsor id...)"
            className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* PV Summary */}
        <div className="rounded-md bg-gray-50 border border-gray-100 p-3">
          <p className="text-sm text-gray-700">
            PV Equivalent: <span className="font-medium">{pvEquivalent()}</span> PV
          </p>
          <p className="text-xs text-gray-500 mt-1">
            (As per plan PV ~ ₹1. If your backend uses a different conversion, server will apply it.)
          </p>
        </div>

        {/* Buttons + messages */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <button
              type="submit"
              disabled={loading}
              className={`inline-flex items-center justify-center rounded-md px-4 py-2 font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                loading ? "bg-indigo-300 cursor-wait" : "bg-indigo-600 hover:bg-indigo-700 text-white"
              }`}
            >
              {loading ? "Processing..." : "Add Funds"}
            </button>

            <button
              type="button"
              onClick={() => {
                setAmount("");
                setPurpose("wallet_topup");
                setPaymentMethod("upi");
                setMobile("");
                setNote("");
                setValidationErrors({});
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className="ml-3 inline-flex items-center justify-center rounded-md px-4 py-2 border border-gray-300 bg-white text-sm"
            >
              Reset
            </button>
          </div>

          <div className="text-right min-w-[180px]">
            {successMsg && <p className="text-sm text-green-700">{successMsg}</p>}
            {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}
          </div>
        </div>
      </form>

      {/* Helpful tips */}
      <div className="mt-6 bg-white rounded-lg shadow-sm p-4">
        <h3 className="text-sm font-semibold mb-2">Tips / जानकारी</h3>
        <ul className="list-disc ml-5 text-sm space-y-1 text-gray-600">
          <li>EPIN/Package activation will be separate — this only adds funds (or requests purchase of PV/BV based on purpose).</li>
          <li>Admin will validate large top-ups & may require KYC for high amounts.</li>
          <li>If backend supports instant gateway, after a successful response you can redirect user to payment gateway page.</li>
        </ul>
      </div>
    </div>
  );
}
