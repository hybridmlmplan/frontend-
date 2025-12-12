import React, { useEffect, useState } from "react";
import axios from "axios";
import { saveAs } from "file-saver";
import { useNavigate } from "react-router-dom";

// PVSummary.jsx
// 100% complete frontend page for showing PV (binary) summary and PV ledger
// according to the Hybrid MLM plan you provided.
// Features:
// - Summary cards: Total PV, Left PV, Right PV, Pending RED Pairs, Green Released Pairs
// - Today's session-wise pair counts (8 sessions)
// - PV ledger table (type: pair/red/green) with search, date-range, pagination
// - CSV export, copy ID, view entry
// - Tailwind CSS; ready to copy-paste into your repo

export default function PVSummary() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [summary, setSummary] = useState({
    totalPV: 0,
    leftPV: 0,
    rightPV: 0,
    pendingRedPairs: 0,
    greenReleasedPairs: 0,
    todaySessions: Array(8).fill(0), // counts per session
  });

  const [entries, setEntries] = useState([]);
  const [typeFilter, setTypeFilter] = useState("all"); // all | pair | red | green
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
  }, [page, typeFilter, fromDate, toDate]);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      // Expected backend API: GET /api/user/pv-summary?type=&from=&to=&page=&limit=
      const qs = new URLSearchParams();
      if (typeFilter && typeFilter !== "all") qs.set("type", typeFilter);
      if (fromDate) qs.set("from", fromDate);
      if (toDate) qs.set("to", toDate);
      qs.set("page", page);
      qs.set("limit", perPage);

      const res = await axios.get(`/api/user/pv-summary?${qs.toString()}`);
      if (!res.data || !res.data.status) throw new Error(res.data?.message || "Failed to load PV summary");

      const data = res.data.data || {};

      setSummary({
        totalPV: data.totalPV || 0,
        leftPV: data.leftPV || 0,
        rightPV: data.rightPV || 0,
        pendingRedPairs: data.pendingRedPairs || 0,
        greenReleasedPairs: data.greenReleasedPairs || 0,
        todaySessions: data.todaySessions && data.todaySessions.length === 8 ? data.todaySessions : Array(8).fill(0),
      });

      setEntries(data.docs || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || "Failed to fetch PV data");
    } finally {
      setLoading(false);
    }
  }

  function formatNumber(n) {
    if (typeof n !== "number") return n;
    return n.toLocaleString("en-IN");
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
    const header = ["Date", "OrderId", "Type", "PV", "Side", "Session", "Note"];
    const dataRows = rows.map((r) => [formatDate(r.createdAt || r.date || ""), r.orderId || r._id || "-", (r.type || "").toUpperCase(), r.pv || 0, r.side || "-", r.sessionIndex !== undefined ? r.sessionIndex + 1 : "-", r.note || "-"]);
    const csv = [header, ...dataRows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `pv_summary_page_${page}.csv`);
  }

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">PV Summary</h1>
        <div className="flex gap-2">
          <button onClick={() => fetchData()} className="px-3 py-2 border rounded">Refresh</button>
          <button onClick={() => exportCSV()} className="px-3 py-2 bg-indigo-600 text-white rounded">Export CSV</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
        <div className="bg-white shadow rounded p-4">
          <div className="text-sm text-gray-500">Total PV (sum of all PV)</div>
          <div className="text-xl font-bold">{formatNumber(summary.totalPV)}</div>
        </div>

        <div className="bg-white shadow rounded p-4">
          <div className="text-sm text-gray-500">Left PV</div>
          <div className="text-xl font-bold">{formatNumber(summary.leftPV)}</div>
        </div>

        <div className="bg-white shadow rounded p-4">
          <div className="text-sm text-gray-500">Right PV</div>
          <div className="text-xl font-bold">{formatNumber(summary.rightPV)}</div>
        </div>

        <div className="bg-white shadow rounded p-4">
          <div className="text-sm text-gray-500">Pending RED Pairs</div>
          <div className="text-xl font-bold">{formatNumber(summary.pendingRedPairs)}</div>
        </div>

        <div className="bg-white shadow rounded p-4">
          <div className="text-sm text-gray-500">Green Released Pairs</div>
          <div className="text-xl font-bold">{formatNumber(summary.greenReleasedPairs)}</div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded p-4 mb-4">
        <h2 className="text-md font-medium mb-2">Today's Session Pair Counts (8 sessions)</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {summary.todaySessions.map((c, i) => (
            <div key={i} className="bg-white p-3 rounded shadow">
              <div className="text-xs text-gray-500">Session {i + 1}</div>
              <div className="font-medium text-lg">{formatNumber(c)}</div>
            </div>
          ))}
        </div>
        <div className="text-xs text-gray-500 mt-2">Session timings: 06:00–08:15, 08:15–10:30, 10:30–12:45, 12:45–15:00, 15:00–17:15, 17:15–19:30, 19:30–21:45, 21:45–00:00</div>
      </div>

      <div className="bg-white shadow-sm rounded p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Type</label>
            <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} className="mt-1 block w-full border rounded p-2">
              <option value="all">All</option>
              <option value="pair">Pair</option>
              <option value="red">Red</option>
              <option value="green">Green</option>
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
          <div className="p-6 text-center">Loading PV data...</div>
        ) : error ? (
          <div className="p-6 text-center text-red-600">{error}</div>
        ) : entries && entries.length === 0 ? (
          <div className="p-6 text-center">No PV ledger entries found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="text-left text-sm text-gray-600 border-b">
                  <th className="p-3">Date</th>
                  <th className="p-3">Order / Ref</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">PV</th>
                  <th className="p-3">Side</th>
                  <th className="p-3">Session</th>
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
                    <td className="p-3 text-sm">{e.pv || 0}</td>
                    <td className="p-3 text-sm">{e.side || "-"}</td>
                    <td className="p-3 text-sm">{e.sessionIndex !== undefined ? e.sessionIndex + 1 : "-"}</td>
                    <td className="p-3 text-sm">{e.note || "-"}</td>
                    <td className="p-3 text-sm space-x-2">
                      <button onClick={() => navigator.clipboard?.writeText(e._id || e.id || "")} className="px-2 py-1 border rounded text-sm hover:bg-gray-50">Copy ID</button>
                      <button onClick={() => navigate(`/pv/${e._id || e.id}`)} className="px-2 py-1 border rounded text-sm hover:bg-gray-50">View</button>
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
        Note: Per final business plan — <strong>PV</strong> is used only for binary pair calculation (pair income). PV entries shown here are the ones used by the session engine to form RED nodes and GREEN payouts. Backend must separate PV and BV sources as per plan.
      </div>
    </div>
  );
}
