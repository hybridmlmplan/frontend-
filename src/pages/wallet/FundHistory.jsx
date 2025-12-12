// src/pages/wallet/FundHistory.jsx
import React, { useEffect, useState, useMemo } from "react";

/**
 * FundHistory Page
 *
 * Features:
 * - Fetches wallet/fund history from backend: GET /api/wallet/history
 *   (supports query params: page, limit, purpose, q, from, to)
 * - Client-side filters: purpose, search (txn id / note / mobile), date range
 * - Pagination controls (prev/next + page numbers)
 * - Export currently displayed rows to CSV
 * - Shows loading / empty / error states
 *
 * Backend contract (expected):
 * GET /api/wallet/history?page=1&limit=20&purpose=pv_purchase&q=abc&from=2025-01-01&to=2025-12-01
 * returns { success: true, data: { items: [...], total: 123, page: 1, limit: 20 } }
 *
 * Adjust endpoint, token retrieval, and response shape to match your backend.
 */

const PURPOSES = [
  { id: "", label: "All Purposes" },
  { id: "wallet_topup", label: "Wallet Top-up" },
  { id: "pv_purchase", label: "PV Purchase" },
  { id: "bv_purchase", label: "BV Purchase / Fund" },
  { id: "epin_transfer", label: "EPIN Transfer" },
];

const DEFAULT_LIMIT = 12;

function formatINR(n) {
  if (n === null || n === undefined) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n);
}

function formatDateTime(iso) {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-IN");
  } catch {
    return iso;
  }
}

function downloadCSV(filename, rows) {
  if (!rows || rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((r) =>
      headers
        .map((h) => {
          const v = r[h] === null || r[h] === undefined ? "" : String(r[h]);
          // escape quotes & commas
          const escaped = v.replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(",")
    ),
  ].join("\r\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function FundHistory() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [total, setTotal] = useState(0);

  const [purpose, setPurpose] = useState("");
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // small debounce for search to avoid too many requests
  const [searchTerm, setSearchTerm] = useState(q);
  useEffect(() => {
    const t = setTimeout(() => setQ(searchTerm), 450);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    fetchPage(page, limit, purpose, q, from, to);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, purpose, q, from, to]);

  async function fetchPage(p = 1, lim = limit, purp = purpose, search = q, f = from, t = to) {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("auth_token"); // adjust if different
      const params = new URLSearchParams();
      params.set("page", String(p));
      params.set("limit", String(lim));
      if (purp) params.set("purpose", purp);
      if (search) params.set("q", search);
      if (f) params.set("from", f);
      if (t) params.set("to", t);

      const res = await fetch(`/api/wallet/history?${params.toString()}`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to fetch fund history");

      // expected shape: data.data.items, data.data.total, data.data.page, data.data.limit
      const payload = data?.data || {};
      setItems(payload.items || []);
      setTotal(payload.total || 0);
      setPage(payload.page || p);
      setLimit(payload.limit || lim);
    } catch (err) {
      console.error("FundHistory fetch error:", err);
      setError(err?.message || "कुछ गलती हुई (Something went wrong)");
    } finally {
      setLoading(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil((total || 0) / limit));

  const tableRows = useMemo(
    () =>
      items.map((it) => ({
        txnId: it.transactionId || it.id || "-",
        date: formatDateTime(it.createdAt || it.date),
        amount: it.amount != null ? formatINR(it.amount) : "-",
        type: it.type || it.purpose || "-",
        purpose: it.purposeLabel || it.purpose || "-",
        status: it.status || "-",
        mobile: it.mobile || "-",
        note: it.note || "-",
        balanceAfter: it.balanceAfter != null ? formatINR(it.balanceAfter) : "-",
      })),
    [items]
  );

  function handleExport() {
    const rows = items.map((it) => ({
      transactionId: it.transactionId || it.id || "",
      date: it.createdAt || it.date || "",
      amount: it.amount != null ? Number(it.amount) : "",
      purpose: it.purpose || "",
      status: it.status || "",
      mobile: it.mobile || "",
      note: it.note || "",
      balanceAfter: it.balanceAfter != null ? Number(it.balanceAfter) : "",
    }));
    downloadCSV(`fund-history-page${page}.csv`, rows);
  }

  function resetFilters() {
    setPurpose("");
    setSearchTerm("");
    setFrom("");
    setTo("");
    setPage(1);
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Fund / Wallet History</h1>

      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4 md:gap-4">
          {/* Purpose */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Purpose</label>
            <select
              className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2"
              value={purpose}
              onChange={(e) => {
                setPurpose(e.target.value);
                setPage(1);
              }}
            >
              {PURPOSES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Search (txn / note / mobile)</label>
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder="Transaction ID, note, mobile..."
              className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2"
            />
          </div>

          {/* From */}
          <div>
            <label className="block text-sm font-medium text-gray-700">From</label>
            <input
              type="date"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                setPage(1);
              }}
              className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2"
            />
          </div>

          {/* To */}
          <div>
            <label className="block text-sm font-medium text-gray-700">To</label>
            <input
              type="date"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setPage(1);
              }}
              className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2"
            />
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                resetFilters();
                fetchPage(1);
              }}
              className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm bg-white hover:bg-gray-50"
            >
              Reset Filters
            </button>

            <button
              onClick={() => {
                setPage(1);
                fetchPage(1);
              }}
              className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-700"
            >
              Apply
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-600">Rows per page:</div>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="rounded-md border-gray-300 px-2 py-1"
            >
              {[6, 12, 24, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>

            <button
              onClick={handleExport}
              disabled={items.length === 0}
              className={`ml-4 inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm ${
                items.length === 0 ? "bg-gray-200 text-gray-600 cursor-not-allowed" : "bg-white border"
              }`}
            >
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Table / states */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        {loading ? (
          <div className="py-12 text-center text-gray-600">Loading fund history...</div>
        ) : error ? (
          <div className="py-8 text-center text-red-600">{error}</div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-gray-600">No records found for selected filters.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Txn / ID</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Amount</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Purpose</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Mobile</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Note</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Balance After</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {items.map((it) => (
                    <tr key={it.transactionId || it.id || Math.random()}>
                      <td className="px-3 py-3 text-sm text-gray-700">{it.transactionId || it.id || "-"}</td>
                      <td className="px-3 py-3 text-sm text-gray-600">{formatDateTime(it.createdAt || it.date)}</td>
                      <td className="px-3 py-3 text-sm text-right font-medium">{formatINR(it.amount)}</td>
                      <td className="px-3 py-3 text-sm text-gray-700">{it.purposeLabel || it.purpose || "-"}</td>
                      <td className="px-3 py-3 text-sm text-gray-700">{it.mobile || "-"}</td>
                      <td className="px-3 py-3 text-sm text-gray-600">{it.note || "-"}</td>
                      <td className="px-3 py-3 text-sm text-right">{it.balanceAfter != null ? formatINR(it.balanceAfter) : "-"}</td>
                      <td className="px-3 py-3 text-sm">
                        <StatusBadge status={it.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing <span className="font-medium">{items.length}</span> of <span className="font-medium">{total}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className={`px-3 py-1 rounded-md text-sm ${page <= 1 ? "bg-gray-200 text-gray-500" : "bg-white border"}`}
                >
                  Prev
                </button>

                {/* page numbers (simple window) */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .slice(Math.max(0, page - 3), Math.min(totalPages, page + 2))
                  .map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`px-3 py-1 rounded-md text-sm ${p === page ? "bg-indigo-600 text-white" : "bg-white border"}`}
                    >
                      {p}
                    </button>
                  ))}

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className={`px-3 py-1 rounded-md text-sm ${page >= totalPages ? "bg-gray-200 text-gray-500" : "bg-white border"}`}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/** small presentational badge for status */
function StatusBadge({ status }) {
  const s = (status || "").toString().toLowerCase();
  const map = {
    success: { bg: "bg-green-100", text: "text-green-800", label: "Success" },
    completed: { bg: "bg-green-100", text: "text-green-800", label: "Completed" },
    pending: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Pending" },
    failed: { bg: "bg-red-100", text: "text-red-800", label: "Failed" },
    cancelled: { bg: "bg-red-100", text: "text-red-800", label: "Cancelled" },
  };
  const info = map[s] || { bg: "bg-gray-100", text: "text-gray-700", label: status || "N/A" };

  return <span className={`${info.bg} ${info.text} px-2 py-1 rounded-full text-xs font-medium`}>{info.label}</span>;
}
