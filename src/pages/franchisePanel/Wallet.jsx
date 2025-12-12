import React, { useEffect, useState } from "react";
import axios from "@/utils/axiosInstance";
import { Loader2 } from "lucide-react";

/**
 * Franchise Wallet Page
 *
 * Expected backend routes & response shapes (adjust if needed):
 * GET  /franchise/wallet                 -> { wallet: { balance, bvBalance, pvBalance }, transactions: [ ... ], meta: { page, totalPages } }
 * POST /franchise/wallet/withdraw        -> { success: true, message: "...", withdrawal: { id, amount, status } }
 * POST /franchise/wallet/transfer        -> { success: true, message: "...", transfer: { id, amount, toUser } }
 *
 * Make sure axiosInstance sets Authorization header: axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
 */

const Wallet = () => {
  const [wallet, setWallet] = useState({
    balance: 0,
    bvBalance: 0,
    pvBalance: 0,
  });
  const [transactions, setTransactions] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [txLoading, setTxLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Withdraw form state
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState("bank"); // bank / wallet-transfer / cheque (example)
  const [withdrawNote, setWithdrawNote] = useState("");

  // Transfer form state
  const [transferAmount, setTransferAmount] = useState("");
  const [transferTo, setTransferTo] = useState("");
  const [transferNote, setTransferNote] = useState("");

  useEffect(() => {
    fetchWallet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchWallet(page = 1) {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get("/franchise/wallet", { params: { page } });
      const data = res.data;

      // defensive checks
      setWallet({
        balance: data?.wallet?.balance ?? 0,
        bvBalance: data?.wallet?.bvBalance ?? 0,
        pvBalance: data?.wallet?.pvBalance ?? 0,
      });

      setTransactions(Array.isArray(data?.transactions) ? data.transactions : []);
      setMeta({
        page: data?.meta?.page ?? page,
        totalPages: data?.meta?.totalPages ?? 1,
      });
    } catch (err) {
      console.error("fetchWallet error:", err);
      setError(
        err?.response?.data?.message ||
          "Unable to fetch wallet. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  }

  // simple client-side validation for withdraw
  const validateWithdraw = () => {
    const amt = parseFloat(withdrawAmount);
    if (Number.isNaN(amt) || amt <= 0) {
      setError("Enter a valid withdraw amount.");
      return false;
    }
    if (amt > wallet.balance) {
      setError("Withdraw amount cannot exceed available wallet balance.");
      return false;
    }
    // (Optional) set minimum withdraw limit example: ₹50
    if (amt < 50) {
      setError("Minimum withdraw amount is ₹50.");
      return false;
    }
    return true;
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!validateWithdraw()) return;

    setTxLoading(true);
    try {
      const res = await axios.post("/franchise/wallet/withdraw", {
        amount: parseFloat(withdrawAmount),
        method: withdrawMethod,
        note: withdrawNote,
      });
      const data = res.data;
      if (data?.success) {
        setSuccessMsg(data.message || "Withdrawal requested successfully.");
        // refresh wallet + transactions
        await fetchWallet(1);
        // reset form
        setWithdrawAmount("");
        setWithdrawNote("");
      } else {
        setError(data?.message || "Withdrawal failed.");
      }
    } catch (err) {
      console.error("withdraw error:", err);
      setError(
        err?.response?.data?.message ||
          "Withdrawal failed. Please try again or contact support."
      );
    } finally {
      setTxLoading(false);
    }
  };

  const validateTransfer = () => {
    const amt = parseFloat(transferAmount);
    if (!transferTo || transferTo.trim() === "") {
      setError("Enter recipient ID or login.");
      return false;
    }
    if (Number.isNaN(amt) || amt <= 0) {
      setError("Enter a valid transfer amount.");
      return false;
    }
    if (amt > wallet.bvBalance && amt > wallet.balance) {
      // you may choose which balance to use — for now require <= wallet.balance
      setError("Transfer amount exceeds available balance.");
      return false;
    }
    return true;
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!validateTransfer()) return;

    setTxLoading(true);
    try {
      const res = await axios.post("/franchise/wallet/transfer", {
        amount: parseFloat(transferAmount),
        to: transferTo.trim(),
        note: transferNote,
      });
      const data = res.data;
      if (data?.success) {
        setSuccessMsg(data.message || "Transfer completed successfully.");
        await fetchWallet(1);
        setTransferAmount("");
        setTransferTo("");
        setTransferNote("");
      } else {
        setError(data?.message || "Transfer failed.");
      }
    } catch (err) {
      console.error("transfer error:", err);
      setError(
        err?.response?.data?.message ||
          "Transfer failed. Please verify recipient and try again."
      );
    } finally {
      setTxLoading(false);
    }
  };

  const handlePage = (newPage) => {
    if (newPage < 1 || newPage > meta.totalPages) return;
    fetchWallet(newPage);
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Franchise Wallet</h2>

      {loading ? (
        <div className="flex items-center gap-2">
          <Loader2 className="animate-spin w-5 h-5 text-gray-600" />
          <span>Loading wallet...</span>
        </div>
      ) : (
        <>
          {error && (
            <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="mb-4 rounded-md bg-green-50 border border-green-200 px-4 py-2 text-sm text-green-700">
              {successMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-500">Wallet Balance</div>
              <div className="mt-2 text-2xl font-medium">₹{wallet.balance.toFixed(2)}</div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-500">BV Balance</div>
              <div className="mt-2 text-2xl font-medium">₹{wallet.bvBalance.toFixed(2)}</div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-500">PV Balance</div>
              <div className="mt-2 text-2xl font-medium">{wallet.pvBalance.toFixed(2)} PV</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Withdraw card */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-medium mb-3">Request Withdrawal</h3>
              <form onSubmit={handleWithdraw} className="space-y-3">
                <div>
                  <label className="text-sm text-gray-700">Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-200 px-3 py-2 focus:ring-2 focus:ring-blue-200"
                    placeholder="Enter amount"
                    min="1"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-700">Method</label>
                  <select
                    value={withdrawMethod}
                    onChange={(e) => setWithdrawMethod(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-200 px-3 py-2 focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="bank">Bank Transfer</option>
                    <option value="wallet">Internal Wallet Transfer</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm text-gray-700">Note (optional)</label>
                  <input
                    type="text"
                    value={withdrawNote}
                    onChange={(e) => setWithdrawNote(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-200 px-3 py-2 focus:ring-2 focus:ring-blue-200"
                    placeholder="Any note for admin"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-md bg-blue-600 text-white px-4 py-2 text-sm font-medium shadow disabled:opacity-60"
                    disabled={txLoading}
                  >
                    {txLoading ? <Loader2 className="animate-spin w-4 h-4" /> : "Request Withdraw"}
                  </button>

                  <button
                    type="button"
                    className="text-sm text-gray-600 underline"
                    onClick={() => {
                      // quick-fill max
                      setWithdrawAmount(wallet.balance.toFixed(2));
                    }}
                  >
                    Use max
                  </button>
                </div>
              </form>
            </div>

            {/* Transfer card */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-medium mb-3">Transfer to User / Franchise</h3>
              <form onSubmit={handleTransfer} className="space-y-3">
                <div>
                  <label className="text-sm text-gray-700">Recipient (ID / Login)</label>
                  <input
                    type="text"
                    value={transferTo}
                    onChange={(e) => setTransferTo(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-200 px-3 py-2 focus:ring-2 focus:ring-blue-200"
                    placeholder="Enter recipient id/login"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-700">Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-200 px-3 py-2 focus:ring-2 focus:ring-blue-200"
                    placeholder="Enter amount"
                    min="1"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-700">Note (optional)</label>
                  <input
                    type="text"
                    value={transferNote}
                    onChange={(e) => setTransferNote(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-200 px-3 py-2 focus:ring-2 focus:ring-blue-200"
                    placeholder="Reason / note"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-md bg-green-600 text-white px-4 py-2 text-sm font-medium shadow disabled:opacity-60"
                    disabled={txLoading}
                  >
                    {txLoading ? <Loader2 className="animate-spin w-4 h-4" /> : "Transfer"}
                  </button>

                  <button
                    onClick={() => {
                      setTransferTo("");
                      setTransferAmount("");
                      setTransferNote("");
                    }}
                    type="button"
                    className="text-sm text-gray-600 underline"
                  >
                    Reset
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Transactions table */}
          <div className="mt-6 bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-3">Recent Transactions</h3>
            {transactions.length === 0 ? (
              <div className="text-sm text-gray-500">No transactions yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-xs text-gray-500">
                      <th className="py-2">Date</th>
                      <th className="py-2">Type</th>
                      <th className="py-2">Amount</th>
                      <th className="py-2">Balance After</th>
                      <th className="py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="border-t">
                        <td className="py-2">{new Date(tx.createdAt).toLocaleString()}</td>
                        <td className="py-2">{tx.type || "—"}</td>
                        <td className="py-2">₹{(tx.amount ?? 0).toFixed(2)}</td>
                        <td className="py-2">₹{(tx.balanceAfter ?? 0).toFixed(2)}</td>
                        <td className="py-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              tx.status === "success"
                                ? "bg-green-100 text-green-800"
                                : tx.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {tx.status ?? "—"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* pagination */}
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Page {meta.page} of {meta.totalPages}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePage(meta.page - 1)}
                  className="px-3 py-1 rounded-md border text-sm"
                  disabled={meta.page <= 1}
                >
                  Prev
                </button>
                <button
                  onClick={() => handlePage(meta.page + 1)}
                  className="px-3 py-1 rounded-md border text-sm"
                  disabled={meta.page >= meta.totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Wallet;
