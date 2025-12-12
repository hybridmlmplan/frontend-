// src/pages/income/RoyaltyIncome.jsx
// 100% complete React component for Royalty Income page (frontend).
// Assumptions:
// - Tailwind CSS is configured in the project.
// - Axios is installed and available. If not, run: npm install axios
// - Backend endpoints:
//    GET  /api/income/royalty?page=<n>&limit=<n>&package=<string>
//    POST /api/income/royalty/claim   { id: <royaltyRecordId> }
// - The backend returns a paginated response like:
//   {
//     data: [ { id, amount, packageType, rank, date, description, claimed } ],
//     page: 1,
//     totalPages: 5,
//     total: 42
//   }
// - Royalty income is BV-based and primarily for Silver ranks (info shown in UI).
//
// You can copy-paste this file into your repo. Adjust API paths/field names if your backend differs.

import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";

const DEFAULT_LIMIT = 10;
const PACKAGE_OPTIONS = ["all", "silver", "gold", "ruby"];

function formatCurrency(n) {
  if (n == null) return "—";
  // Indian rupee formatting
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n);
}

function shortDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-IN", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function RoyaltyIncome() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [filterPackage, setFilterPackage] = useState("all");
  const [claimingId, setClaimingId] = useState(null);
  const [summary, setSummary] = useState({
    totalRoyalty: 0,
    pending: 0,
    claimed: 0,
  });

  const fetchData = useCallback(async (p = page, lim = limit, pkg = filterPackage) => {
    setLoading(true);
    setError(null);
    try {
      const params = { page: p, limit: lim };
      if (pkg && pkg !== "all") params.package = pkg;

      const res = await axios.get("/api/income/royalty", { params });
      const { data = [], totalPages: tp = 1, page: current = 1, total = 0 } = res.data || {};

      setItems(data);
      setPage(current);
      setTotalPages(tp);

      // Compute small summary from returned page data (backend should ideally return global summary)
      const pageTotal = data.reduce((s, it) => s + (Number(it.amount) || 0), 0);
      const pageClaimed = data.reduce((s, it) => s + ((it.claimed || false) ? Number(it.amount) || 0 : 0), 0);
      const pagePending = pageTotal - pageClaimed;

      // Keep summary simple: totals for current page (if you have server-side overall summary, use that)
      setSummary({
        totalRoyalty: pageTotal,
        pending: pagePending,
        claimed: pageClaimed,
      });

    } catch (err) {
      console.error("Failed to fetch royalty income", err);
      setError(err?.response?.data?.message || err.message || "Failed to load royalty income");
    } finally {
      setLoading(false);
    }
  }, [page, limit, filterPackage]);

  useEffect(() => {
    // fetch when component mounts or filters change
    fetchData(1, limit, filterPackage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit, filterPackage]);

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages) return;
    setPage(nextPage);
    fetchData(nextPage, limit, filterPackage);
  };

  const handleClaim = async (id) => {
    if (!id) return;
    if (!window.confirm("क्या आप निश्चित रूप से इस Royalty आय को क्लेम करना चाहते हैं? (Are you sure you want to claim this royalty?)")) return;

    try {
      setClaimingId(id);
      await axios.post("/api/income/royalty/claim", { id });
      // optimistic UI: mark item as claimed
      setItems(prev => prev.map(it => (it.id === id ? { ...it, claimed: true } : it)));
      // refetch summary/page totals
      fetchData(page, limit, filterPackage);
    } catch (err) {
      console.error("Claim failed", err);
      alert(err?.response?.data?.message || "Claim failed, try again.");
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Royalty Income</h1>
        <p className="text-sm text-gray-600 mt-1">
          Royalty (CTO BV) incomes are BV-based and — per plan — primarily apply to Silver ranks (continuous royalty).
          This page shows your royalty records and lets you claim pending royalty amounts.
        </p>
      </header>

      <section className="bg-white shadow rounded p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-700">Filter package:</label>
            <select
              className="border rounded p-2"
              value={filterPackage}
              onChange={(e) => { setFilterPackage(e.target.value); setPage(1); }}
            >
              {PACKAGE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt[0].toUpperCase() + opt.slice(1)}</option>)}
            </select>

            <label className="text-sm text-gray-700 ml-4">Per page:</label>
            <select
              className="border rounded p-2"
              value={limit}
              onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
            >
              {[5, 10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-sm">
              <div className="text-gray-500">Page</div>
              <div className="font-medium">{page} / {totalPages}</div>
            </div>

            <div className="text-sm">
              <div className="text-gray-500">This page totals</div>
              <div className="font-medium">{formatCurrency(summary.totalRoyalty)}</div>
            </div>

            <div className="text-sm">
              <div className="text-gray-500">Pending</div>
              <div className="font-medium text-red-600">{formatCurrency(summary.pending)}</div>
            </div>

            <div className="text-sm">
              <div className="text-gray-500">Claimed</div>
              <div className="font-medium text-green-600">{formatCurrency(summary.claimed)}</div>
            </div>
          </div>
        </div>
      </section>

      <main>
        <div className="bg-white shadow rounded divide-y">
          {/* Table header */}
          <div className="grid grid-cols-12 gap-2 p-3 text-sm font-medium text-gray-700 border-b">
            <div className="col-span-5">Description</div>
            <div className="col-span-2">Amount</div>
            <div className="col-span-2 hidden md:block">Package</div>
            <div className="col-span-1 hidden sm:block">Rank</div>
            <div className="col-span-2 hidden lg:block">Date</div>
            <div className="col-span-12 md:col-span-12 sm:col-span-12 text-right"></div>
          </div>

          {/* Loading / Error */}
          {loading && (
            <div className="p-6 text-center text-gray-500">लोड हो रहा है... (Loading...)</div>
          )}
          {error && !loading && (
            <div className="p-6 text-center text-red-600">Error: {error}</div>
          )}

          {/* Items */}
          {!loading && items.length === 0 && !error && (
            <div className="p-6 text-center text-gray-600">कोई Royalty रिकॉर्ड नहीं मिला (No royalty records found).</div>
          )}

          {!loading && items.map(item => (
            <div key={item.id} className="grid grid-cols-12 gap-2 items-center p-3 hover:bg-gray-50">
              <div className="col-span-5">
                <div className="font-medium">{item.description || "Royalty Income"}</div>
                <div className="text-xs text-gray-500 mt-1">ID: {item.id}</div>
              </div>

              <div className="col-span-2">
                <div className="font-medium">{formatCurrency(item.amount)}</div>
              </div>

              <div className="col-span-2 hidden md:block">
                <div className="text-sm capitalize">{item.packageType || "—"}</div>
              </div>

              <div className="col-span-1 hidden sm:block">
                <div className="text-sm">{item.rank || "—"}</div>
              </div>

              <div className="col-span-2 hidden lg:block">
                <div className="text-sm">{shortDate(item.date)}</div>
              </div>

              <div className="col-span-12 md:col-span-12 text-right">
                <div className="flex items-center justify-end gap-2">
                  <div className={`px-3 py-1 rounded text-xs font-medium ${item.claimed ? "bg-green-100 text-green-800" : "bg-red-50 text-red-700"}`}>
                    {item.claimed ? "Claimed" : "Pending"}
                  </div>

                  {!item.claimed && (
                    <button
                      onClick={() => handleClaim(item.id)}
                      disabled={claimingId === item.id}
                      className="ml-2 px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {claimingId === item.id ? "Claiming..." : "Claim"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination controls */}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing page {page} of {totalPages}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(1)}
              disabled={page === 1 || loading}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              First
            </button>
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1 || loading}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Prev
            </button>

            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages || loading}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={page === totalPages || loading}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Last
            </button>
          </div>
        </div>
      </main>

      <footer className="mt-8 text-xs text-gray-500">
        <p>
          नोट: Royalty केवल BV आधारित है और Silver रैंक के लिए continuous रूप से चलता है — configuration और exact percentages backend में set हैं। (Note: royalty comes from BV and is continuous for Silver ranks — exact config is server-side.)
        </p>
      </footer>
    </div>
  );
}
