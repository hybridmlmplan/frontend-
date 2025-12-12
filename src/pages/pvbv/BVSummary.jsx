import React, { useEffect, useState } from "react";
import axios from "axios";
import { saveAs } from "file-saver";
import { useNavigate } from "react-router-dom";

// BVSummary.jsx
// 100% complete frontend page to show BV (Business Volume) summary as per Hybrid MLM plan.
// Features:
// - Fetch BV summary totals and BV ledger entries (repurchase BV vs other BV)
// - Date-range filter, type filter (All / Repurchase / PV / Royalty / Fund / Level)
// - Search, pagination, CSV export
// - Summary cards: Total BV, Repurchase BV, PV BV, Royalty BV, Fund BV
// - Tailwind CSS; ready to copy-paste into your repo

export default function BVSummary() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState({
    totalBV: 0,
    repurchaseBV: 0,
    pvBV: 0,
    royaltyBV: 0,
    fundBV: 0,
  });
  const [entries, setEntries] = useState([]);
  const [filterType, setFilterType] = useState("all"); // all | repurchase | pv | royalty | fund | level
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [perPage] = useState(15);
  const [total, setTotal] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filterType, fromDate, toDate]);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      // Expected backend API:
      // GET /api/user/bv-summary?type=&from=&to=&page=&limit=
      const qs = new URLSearchParams();
      if (filterType && filterType !== "all") qs.set("type", filterType);
      if (fromDate) qs.set("from", fromDate);
      if (toDate) qs.set("to", toDate);
      qs.set("page", page);
      qs.set("limit", perPage);

      const res = await axios.get(`/api/user/bv-summary?${qs.toString()}`);
      if (!res.data || !res.data.status) throw new Error(res.data?.message || "Failed to load BV summary");

      const data = res.data.data || {};
      setSummary({
        totalBV: data.totalBV || 0,
        repurchaseBV: data.repurchaseBV || 0,
        pvBV: data.pvBV || 0,
        royaltyBV: data.royaltyBV || 0,
        fundBV: data.fundBV || 0,
      });

      setEntries(data.docs || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || "Failed to fetch BV data");
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
        String(e._id || e.id || "").toLowerCase().includes(q) ||
        (e.note || "").toLowerCase().includes(q)
      );
    });
  }

  function exportCSV() {
    const rows = filteredEntries();
    if (!rows.length) return alert("No rows to export");
    const header = ["Date", "OrderId", "Type", "BV", "Source", "Note"];
    const dataRows = rows.map((r) => [formatDate(r.createdAt || r.date || ""), r.orderId || r._id || "-", (r.type || "").toUpperCase(), r.bv || 0, r.source || "-", r.note || "-"]);
    const csv = [header, ...dataRows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `bv_summary_page_${page}.csv`);
  }

  async function refresh() {
    setPage(1);
    await fetchData();
  }

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">BV Summary</h1>
        <div className="flex gap-2">
          <button onClick={refresh} className="px-3 py-2 border rounded">Refresh</button>
          <button onClick={() => exportCSV()} className="px-3 py-2 bg-indigo-600 text-white rounded">Export CSV</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
        <div className="bg-white shadow rounded p-4">
          <div className="text-sm text-gray-500">Total BV</div>
          <div className="text-xl font-bold">{formatCurrency(summary.totalBV)}</div>
        </div>

        <div className="bg-white shadow rounded p-4">
          <div className="text-sm text-gray-500">Repurchase BV (BV source for rank/royalty)</div>
          <div className="text-xl font-bold">{formatCurrency(summary.repurchaseBV)}</div>
        </div>

        <div className="bg-white shadow rounded p-4">
          <div className="text-sm text-gray-500">PV BV (binary PV only)</div>
          <div className="text-xl font-bold">{formatCurrency(summary.pvBV)}</div>
        </div>

        <div className="bg-white shadow rounded p-4">
          <div className="text-sm text-gray-500">Royalty BV</div>
          <div className="text-xl font-bold">{formatCurrency(summary.royaltyBV)}</div>
        </div>

        <div className="bg-white shadow rounded p-4">
          <div className="text-sm text-gray-500">Fund BV</div>
          <div className="text-xl font-bold">{formatCurrency(summary.fundBV)}</div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Type</label>
            <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setPage(1); }} className="mt-1 block w-full border rounded p-2">
              <option value="all">All</option>
              <option value="repurchase">Repurchase BV</option>
              <option value="pv">PV (binary) BV</option>
              <option value="royalty">Royalty BV</option>
              <option value="fund">Fund BV</option>
              <option value="level">Level BV</option>
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
          <div className="p-6 text-center">Loading BV data...</div>
        ) : error ? (
          <div className="p-6 text-center text-red-600">{error}</div>
        ) : entries && entries.length === 0 ? (
          <div className="p-6 text-center">No BV entries found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="text-left text-sm text-gray-600 border-b">
                  <th className="p-3">Date</th>
                  <th className="p-3">Order / Ref</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">BV</th>
                  <th className="p-3">Source</th>
                  <th className="p-3">Note</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries().map((e) => (
                  <tr key={e._id || e.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 text-sm">{formatDate(e.createdAt || e.date)}</td>
                    <td className="p-3 text-sm">{e.orderId || e._id || "-"}</td>
                    <td className="p-3 text-sm">{(e.type || "-").toUpperCase()}</td>
                    <td className="p-3 text-sm">{e.bv || 0}</td>
                    <td className="p-3 text-sm">{e.source || "-"}</td>
                    <td className="p-3 text-sm">{e.note || "-"}</td>
                    <td className="p-3 text-sm space-x-2">
                      <button onClick={() => navigator.clipboard?.writeText(e._id || e.id || "")} className="px-2 py-1 border rounded text-sm hover:bg-gray-50">Copy ID</button>
                      <button onClick={() => navigate(`/bv/${e._id || e.id}`)} className="px-2 py-1 border rounded text-sm hover:bg-gray-50">View</button>
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
        Note: Per final business plan — <strong>PV</strong> is used only for binary pair calculation (pair income). <strong>Repurchase BV</strong> is used for royalty, rank income and fund distributions. Make sure backend separates PV and BV sources accordingly.
      </div>
    </div>
  );
}
