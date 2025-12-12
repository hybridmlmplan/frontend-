import React, { useEffect, useState } from "react";
import axios from "axios";

// AllIncomes.jsx
// 100% complete page to view all income types (binary, royalty, rank, fund, level) as per Hybrid MLM plan.
// Features:
// - Summary cards for totals by income type
// - Date-range filter, type filter, search, pagination
// - CSV export for the visible ledger
// - Detail view navigation hooks (navigate to income details)
// - Auth header helper reads token from localStorage
// - Tailwind CSS utility classes

export default function AllIncomes() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // summary totals
  const [summary, setSummary] = useState({
    totalBinary: 0,
    totalRoyalty: 0,
    totalRank: 0,
    totalFund: 0,
    totalLevel: 0,
    totalAll: 0,
  });

  // ledger entries
  const [entries, setEntries] = useState([]);
  const [typeFilter, setTypeFilter] = useState("all"); // all | binary | royalty | rank | fund | level
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [perPage] = useState(15);
  const [total, setTotal] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, typeFilter, fromDate, toDate]);

  function getAuthHeaders() {
    const token = localStorage.getItem("token") || localStorage.getItem("authToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      if (typeFilter && typeFilter !== "all") qs.set("type", typeFilter);
      if (fromDate) qs.set("from", fromDate);
      if (toDate) qs.set("to", toDate);
      qs.set("page", page);
      qs.set("limit", perPage);

      // API contract assumed: GET /api/user/incomes?type=&from=&to=&page=&limit=
      const res = await axios.get(`/api/user/incomes?${qs.toString()}`, { headers: getAuthHeaders() });
      if (!res.data || !res.data.status) throw new Error(res.data?.message || "Failed to load incomes");
      const data = res.data.data || {};

      setSummary({
        totalBinary: data.totalBinary || 0,
        totalRoyalty: data.totalRoyalty || 0,
        totalRank: data.totalRank || 0,
        totalFund: data.totalFund || 0,
        totalLevel: data.totalLevel || 0,
        totalAll: data.totalAll || 0,
      });

      setEntries(data.docs || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || "Failed to fetch incomes");
    } finally {
      setLoading(false);
    }
  }

  function formatCurrency(n) {
    if (typeof n !== "number") return n;
    return n.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
  }

  function formatDate(iso) {
    if (!iso) return "-";
    try {
      return new Date(iso).toLocaleString("en-IN");
    } catch {
      return iso;
    }
  }

  function filteredEntries() {
    const q = (query || "").trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) => {
      return (
        (e.orderId || "").toLowerCase().includes(q) ||
        (e.type || "").toLowerCase().includes(q) ||
        (e.note || "").toLowerCase().includes(q) ||
        String(e._id || e.id || "").toLowerCase().includes(q)
      );
    });
  }

  function exportCSV() {
    const rows = filteredEntries();
    if (!rows.length) return alert("No rows to export");
    const header = ["Date", "Type", "Amount", "Source", "Order/Ref", "Note"];
    const dataRows = rows.map((r) => [formatDate(r.createdAt || r.date || r.time), (r.type || "-").toUpperCase(), r.amount || 0, r.source || "-", r.orderId || r._id || "-", r.note || "-"]);
    const csv = [header, ...dataRows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `all_incomes_page_${page}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function refresh() {
    setPage(1);
    await fetchData();
  }

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">All Incomes</h1>
        <div className="flex gap-2">
          <button onClick={refresh} className="px-3 py-2 border rounded">Refresh</button>
          <button onClick={() => exportCSV()} className="px-3 py-2 bg-indigo-600 text-white rounded">Export CSV</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-4">
        <div className="bg-white shadow rounded p-4">
          <div className="text-sm text-gray-500">Binary Income (PV)</div>
          <div className="text-xl font-bold">{formatCurrency(summary.totalBinary)}</div>
        </div>

        <div className="bg-white shadow rounded p-4">
          <div className="text-sm text-gray-500">Royalty Income (BV)</div>
          <div className="text-xl font-bold">{formatCurrency(summary.totalRoyalty)}</div>
        </div>

        <div className="bg-white shadow rounded p-4">
          <div className="text-sm text-gray-500">Rank Income</div>
          <div className="text-xl font-bold">{formatCurrency(summary.totalRank)}</div>
        </div>

        <div className="bg-white shadow rounded p-4">
          <div className="text-sm text-gray-500">Fund Income</div>
          <div className="text-xl font-bold">{formatCurrency(summary.totalFund)}</div>
        </div>

        <div className="bg-white shadow rounded p-4">
          <div className="text-sm text-gray-500">Level Income</div>
          <div className="text-xl font-bold">{formatCurrency(summary.totalLevel)}</div>
        </div>

        <div className="bg-white shadow rounded p-4">
          <div className="text-sm text-gray-500">Total Income</div>
          <div className="text-xl font-bold">{formatCurrency(summary.totalAll)}</div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Type</label>
            <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} className="mt-1 block w-full border rounded p-2">
              <option value="all">All</option>
              <option value="binary">Binary (PV)</option>
              <option value="royalty">Royalty (BV)</option>
              <option value="rank">Rank</option>
              <option value="fund">Fund</option>
              <option value="level">Level</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">From</label>
            <input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(1); }} className="mt-1 block w-full border rounded p-2" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">To</label>
            <input type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(1); }} className="mt-1 block w-full border rounded p-2" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Search</label>
            <div className="flex mt-1">
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="OrderId / Note / Type" className="flex-1 border rounded-l p-2" />
              <button onClick={() => setQuery("")} className="px-3 border rounded-r bg-gray-50">Clear</button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded">
        {loading ? (
          <div className="p-6 text-center">Loading incomes...</div>
        ) : error ? (
          <div className="p-6 text-center text-red-600">{error}</div>
        ) : entries && entries.length === 0 ? (
          <div className="p-6 text-center">No income records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="text-left text-sm text-gray-600 border-b">
                  <th className="p-3">Date</th>
                  <th className="p-3">Type</th>
                  <th className className="p-3">Amount</th>
                  <th className="p-3">Source</th>
                  <th className="p-3">Order/Ref</th>
                  <th className="p-3">Note</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries().map((e) => (
                  <tr key={e._id || e.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 text-sm">{formatDate(e.createdAt || e.date)}</td>
                    <td className="p-3 text-sm">{(e.type || "-").toUpperCase()}</td>
                    <td className="p-3 text-sm">{formatCurrency(e.amount || 0)}</td>
                    <td className="p-3 text-sm">{e.source || "-"}</td>
                    <td className="p-3 text-sm">{e.orderId || e._id || "-"}</td>
                    <td className="p-3 text-sm">{e.note || "-"}</td>
                    <td className="p-3 text-sm space-x-2">
                      <button onClick={() => navigator.clipboard?.writeText(e._id || e.id || "")} className="px-2 py-1 border rounded text-sm hover:bg-gray-50">Copy ID</button>
                      <button onClick={() => window.open(`/income/${e._id || e.id}`, "_blank")} className="px-2 py-1 border rounded text-sm hover:bg-gray-50">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">Total records: {total}</div>
          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage((s) => Math.max(1, s - 1))} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
            <div className="px-3 py-1 border rounded">{page} / {totalPages}</div>
            <button disabled={page >= totalPages} onClick={() => setPage((s) => Math.min(totalPages, s + 1))} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-500 mt-3">
        Note: Incomes are split by source per the final plan — <strong>Binary (PV)</strong> incomes come from the session engine and red→green payouts; <strong>Royalty/Rank/Fund/Level</strong> incomes are calculated from repurchase BV and service/product BV. Ensure backend separates these sources accordingly.
      </div>
    </div>
  );
}
