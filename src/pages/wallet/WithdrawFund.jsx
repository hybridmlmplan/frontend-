// src/pages/wallet/WithdrawFund.jsx
import React, { useEffect, useState } from "react";

/**
 * WithdrawFund.jsx
 * Safe UI-only withdraw form.
 *
 * - Fetches (dummy) withdrawable balance
 * - Validates user input (amount <= withdrawable, min amount, required fields)
 * - Sends a POST to a placeholder endpoint /api/wallet/withdraw
 * - Does NOT implement any server-side transfer or payout logic
 *
 * Usage: place in src/pages/wallet and route it in your app.
 */

const WithdrawFund = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const [walletSummary, setWalletSummary] = useState({
    withdrawable: 0,
    currency: "INR",
  });

  // Form state
  const [method, setMethod] = useState("bank"); // bank | upi
  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [upi, setUpi] = useState("");
  const [remark, setRemark] = useState("");

  useEffect(() => {
    // SAFE: Dummy fetch to load withdrawable balance.
    // Replace with your backend endpoint /api/wallet/summary
    const fetchSummary = async () => {
      setLoading(true);
      try {
        // Example: const res = await fetch("/api/wallet/summary");
        // const data = await res.json();

        // -- DUMMY DATA (safe) --
        const data = {
          withdrawable: 0, // default 0 to prevent accidental actions
          currency: "INR",
        };

        setWalletSummary(data);
      } catch (err) {
        console.error("Failed to fetch wallet summary:", err);
        setMessage({ type: "error", text: "Wallet summary load failed." });
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  const minWithdrawAmount = 50; // UI-side minimum (example)

  const validate = () => {
    setMessage(null);
    const amt = Number(amount);
    if (!amount || Number.isNaN(amt)) {
      setMessage({ type: "error", text: "कृपया सही रकम दर्ज करें।" });
      return false;
    }
    if (amt <= 0) {
      setMessage({ type: "error", text: "रकम शून्य से अधिक होनी चाहिए।" });
      return false;
    }
    if (amt < minWithdrawAmount) {
      setMessage({
        type: "error",
        text: `न्यूनतम निकासी राशि ₹${minWithdrawAmount} है।`,
      });
      return false;
    }
    if (amt > walletSummary.withdrawable) {
      setMessage({ type: "error", text: "राशि आपके उपलब्ध बैलेंस से अधिक है।" });
      return false;
    }

    if (method === "bank") {
      if (!bankName.trim() || !accountNumber.trim() || !ifsc.trim()) {
        setMessage({
          type: "error",
          text: "कृपया बैंक का नाम, अकाउंट नंबर और IFSC भरें।",
        });
        return false;
      }
      // basic account number check
      if (accountNumber.trim().length < 6) {
        setMessage({ type: "error", text: "अमान्य अकाउंट नंबर।" });
        return false;
      }
      if (!/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/.test(ifsc.trim()) && ifsc.trim().length < 8) {
        // not strict; just basic check
        // many IFSC are 11 chars; we just warn if very short
        // don't block heavy validation here
      }
    } else {
      // UPI
      if (!upi.trim()) {
        setMessage({ type: "error", text: "कृपया UPI ID दर्ज करें।" });
        return false;
      }
      if (!/@/.test(upi.trim())) {
        setMessage({ type: "error", text: "अमान्य UPI ID।" });
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setMessage(null);

    try {
      // Prepare payload
      const payload = {
        amount: Number(amount),
        method,
        bankDetails:
          method === "bank"
            ? {
                bankName: bankName.trim(),
                accountNumber: accountNumber.trim(),
                ifsc: ifsc.trim(),
              }
            : null,
        upi: method === "upi" ? upi.trim() : null,
        remark: remark.trim() || null,
      };

      // SAFE placeholder request:
      // Replace "/api/wallet/withdraw" with your backend endpoint.
      // Backend should perform all auth/validation/server-side checks.
      const res = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Server error");
      }

      const result = await res.json();

      // Example expected response: { success: true, message: "...", newWithdrawable: 0 }
      setMessage({
        type: "success",
        text: result?.message || "Withdraw request submitted successfully.",
      });

      // Update withdrawable if backend returned new balance (safe; no client-side calc)
      if (typeof result?.newWithdrawable === "number") {
        setWalletSummary((s) => ({ ...s, withdrawable: result.newWithdrawable }));
      }

      // clear amount & sensitive fields after success
      setAmount("");
      setBankName("");
      setAccountNumber("");
      setIfsc("");
      setUpi("");
      setRemark("");
    } catch (err) {
      console.error("Withdraw request failed:", err);
      setMessage({
        type: "error",
        text:
          err?.message ||
          "Withdraw request failed. Backend should validate and process the request safely.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Withdraw Funds</h1>

      <div className="mb-4">
        <h2 className="text-sm text-gray-600">Available Withdrawable Balance</h2>
        {loading ? (
          <div className="mt-2 text-gray-500">Loading...</div>
        ) : (
          <div className="mt-2 text-3xl font-semibold">₹{walletSummary.withdrawable}</div>
        )}
        <p className="text-xs text-gray-500 mt-1">
          Currency: {walletSummary.currency}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 border rounded">
        <div>
          <label className="block text-sm font-medium mb-1">Amount (₹)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            placeholder={`Min ₹${minWithdrawAmount}`}
            disabled={loading || submitting}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Withdrawal Method</label>
          <div className="flex gap-3">
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="method"
                value="bank"
                checked={method === "bank"}
                onChange={() => setMethod("bank")}
                disabled={submitting}
                className="mr-2"
              />
              Bank Transfer
            </label>

            <label className="inline-flex items-center">
              <input
                type="radio"
                name="method"
                value="upi"
                checked={method === "upi"}
                onChange={() => setMethod("upi")}
                disabled={submitting}
                className="mr-2"
              />
              UPI
            </label>
          </div>
        </div>

        {method === "bank" ? (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Bank Name</label>
              <input
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full border px-3 py-2 rounded"
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Account Number</label>
              <input
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full border px-3 py-2 rounded"
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">IFSC</label>
              <input
                value={ifsc}
                onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                className="w-full border px-3 py-2 rounded"
                disabled={submitting}
                placeholder="EX: SBIN0000001"
              />
            </div>
          </>
        ) : (
          <div>
            <label className="block text-sm font-medium mb-1">UPI ID (eg. name@bank)</label>
            <input
              value={upi}
              onChange={(e) => setUpi(e.target.value)}
              className="w-full border px-3 py-2 rounded"
              disabled={submitting}
              placeholder="name@bank"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Remark (optional)</label>
          <input
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            disabled={submitting}
          />
        </div>

        {message && (
          <div
            className={`p-3 rounded ${
              message.type === "error" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={submitting || loading}
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Request Withdraw"}
          </button>

          <button
            type="button"
            onClick={() => {
              // reset
              setAmount("");
              setBankName("");
              setAccountNumber("");
              setIfsc("");
              setUpi("");
              setRemark("");
              setMessage(null);
            }}
            className="px-4 py-2 border rounded"
            disabled={submitting}
          >
            Reset
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-2">
          Note: This is a frontend form. Actual withdraw processing must be handled securely on the server.
        </p>
      </form>
    </div>
  );
};

export default WithdrawFund;
