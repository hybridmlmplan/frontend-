import React, { useEffect, useState } from "react";
import axios from "axios";

// AdminDashboard.jsx
// Complete admin dashboard page tailored to the provided Hybrid MLM plan.
// Features included:
// - Summary cards (users, active packages, PV totals, BV totals, today's sessions)
// - Session engine controls (run now, schedule status, last run info)
// - EPIN generator (generate unlimited EPINs)
// - Pending activations / manual activate list with search & pagination
// - Quick actions: regenerate PV/BV summary, export CSV reports, view user
// - Uses Tailwind CSS for styling and works with typical project layout
// - Assumes backend admin APIs (prefixed with /api/admin/...). Adjust endpoints if needed.

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // dashboard data
  const [summary, setSummary] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalPV: 0,
    totalBV: 0,
    todayPairs: 0,
    pendingActivations: 0,
    epinCount: 0,
    lastSessionRun: null,
    sessionEngineStatus: "unknown",
  });

  // pending activations list
  const [pending, setPending] = useState([]);
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");

  // epin generator
  const [epinQty, setEpinQty] = useState(10);
  const [epinPrefix, setEpinPrefix] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // auth header helper (reads token from localStorage if present)
  function getAuthHeaders() {
    const token = localStorage.getItem("token") || localStorage.getItem("authToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  useEffect(() => {
    fetchDashboard();
    fetchPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  async function fetchDashboard() {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`/api/admin/dashboard`, { headers: getAuthHeaders() });
      if (!res.data || !res.data.status) throw new Error(res.data?.message || "Failed to load dashboard");
      const d = res.data.data || {};
      setSummary((s) => ({
        ...s,
        totalUsers: d.totalUsers || 0,
        activeUsers: d.activeUsers || 0,
        totalPV: d.totalPV || 0,
        totalBV: d.totalBV || 0,
        todayPairs: d.todayPairs || 0,
        pendingActivations: d.pendingActivations || 0,
        epinCount: d.epinCount || 0,
        lastSessionRun: d.lastSessionRun || null,
        sessionEngineStatus: d.sessionEngineStatus || "stopped",
      }));
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }

  async function fetchPending() {
    try {
      const res = await axios.get(`/api/admin/pending-activations?page=${page}&limit=${perPage}`, { headers: getAuthHeaders() });
      if (!res.data || !res.data.status) throw new Error(res.data?.message || "Failed to load pending activations");
      setPending(res.data.data.docs || []);
      setTotal(res.data.data.total || 0);
    } catch (err) {
      console.error(err);
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

  async function runSessionEngineNow() {
    if (!window.confirm("Run session engine now? This will count pairs and attempt red->green releases.")) return;
    setActionLoading(true);
    try {
      const res = await axios.post(`/api/admin/session/run-now`, {}, { headers: getAuthHeaders() });
      if (res.data && res.data.status) {
        alert(res.data.message || "Session engine run triggered");
        await fetchDashboard();
        await fetchPending();
      } else throw new Error(res.data?.message || "Failed to trigger session engine");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || err.message || "Session run failed");
    } finally {
      setActionLoading(false);
    }
  }

  async function toggleSessionEngine(start) {
    setActionLoading(true);
    try {
      const res = await axios.post(`/api/admin/session/${start ? "start" : "stop"}`, {}, { headers: getAuthHeaders() });
      if (res.data && res.data.status) {
        alert(res.data.message || `Session engine ${start ? "started" : "stopped"}`);
        await fetchDashboard();
      } else throw new Error(res.data?.message || "Failed to update session engine");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || err.message || "Session engine action failed");
    } finally {
      setActionLoading(false);
    }
  }

  async function generateEpins() {
    if (!epinQty || isNaN(epinQty) || epinQty <= 0) return alert("Enter a valid quantity");
    setActionLoading(true);
    try {
      const body = { qty: Number(epinQty) }; if (epinPrefix) body.prefix = epinPrefix.trim();
      const res = await axios.post(`/api/admin/epin/generate`, body, { headers: getAuthHeaders() });
      if (res.data && res.data.status) {
        alert(res.data.message || `Generated ${epinQty} EPINs`);
        setEpinQty(10);
        setEpinPrefix("");
        await fetchDashboard();
      } else throw new Error(res.data?.message || "EPIN generation failed");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || err.message || "EPIN error");
    } finally {
      setActionLoading(false);
    }
  }

  async function activatePackageManually(item) {
    if (!window.confirm(`Activate package for user ${item.userName || item.userId}?`)) return;
    setActionLoading(true);
    try {
      const res = await axios.post(`/api/admin/package/activate`, { packageId: item.packageId, userId: item.userId }, { headers: getAuthHeaders() });
      if (res.data && res.data.status) {
        alert(res.data.message || "Package activated");
        await fetchPending();
        await fetchDashboard();
      } else throw new Error(res.data?.message || "Activation failed");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || err.message || "Activation error");
    } finally {
      setActionLoading(false);
    }
  }

  function exportPendingCSV() {
    if (!pending || pending.length === 0) return alert("No rows to export");
    const header = ["OrderId", "UserId", "UserName", "Package", "Price", "EPIN", "RequestedAt"];
    const rows = pending.map((r) => [r.orderId || r._id || "-", r.userId || "-", r.userName || r.user?.name || "-", r.packageName || r.packageType || "-", r.price || "-", r.epin || "-", r.createdAt ? formatDate(r.createdAt) : "-"]);
    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `pending_activations_page_${page}.csv`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <div className="flex gap-2">
          <button onClick={fetchDashboard} className="px-3 py-2 border rounded">Refresh</button>
          <button onClick={() => exportPendingCSV()} className="px-3 py-2 bg-indigo-600 text-white rounded">Export Pending CSV</button>
        </div>
      </div>

      {loading ? (
        <div className="p-6 text-center">Loading dashboard...</div>
      ) : error ? (
        <div className="p-6 text-center text-red-600">{error}</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-white shadow rounded p-4">
              <div className="text-sm text-gray-500">Total Users</div>
              <div className="text-xl font-bold">{summary.totalUsers}</div>
              <div className="text-xs text-gray-500 mt-1">Active: {summary.activeUsers}</div>
            </div>

            <div className="bg-white shadow rounded p-4">
              <div className="text-sm text-gray-500">Total PV</div>
              <div className="text-xl font-bold">{summary.totalPV}</div>
              <div className="text-xs text-gray-500 mt-1">Today's pairs: {summary.todayPairs}</div>
            </div>

            <div className="bg-white shadow rounded p-4">
              <div className="text-sm text-gray-500">Total BV</div>
              <div className="text-xl font-bold">{formatCurrency(summary.totalBV)}</div>
              <div className="text-xs text-gray-500 mt-1">Repurchase BV drives royalty & rank</div>
            </div>

            <div className="bg-white shadow rounded p-4">
              <div className="text-sm text-gray-500">Pending Activations</div>
              <div className="text-xl font-bold">{summary.pendingActivations}</div>
              <div className="text-xs text-gray-500 mt-1">EPINs available: {summary.epinCount}</div>
            </div>
          </div>

          <div className="bg-white shadow rounded p-4 mb-4">
            <h2 className="text-lg font-medium mb-2">Session Engine</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
              <div>
                <div className="text-sm text-gray-600">Engine Status</div>
                <div className="font-medium">{summary.sessionEngineStatus}</div>
                <div className="text-xs text-gray-500">Last run: {summary.lastSessionRun ? formatDate(summary.lastSessionRun) : "Never"}</div>
              </div>

              <div className="flex gap-2">
                <button disabled={actionLoading} onClick={() => runSessionEngineNow()} className="px-3 py-2 bg-green-600 text-white rounded">Run Now</button>
                <button disabled={actionLoading} onClick={() => toggleSessionEngine(true)} className="px-3 py-2 border rounded">Start Engine</button>
                <button disabled={actionLoading} onClick={() => toggleSessionEngine(false)} className="px-3 py-2 border rounded">Stop Engine</button>
              </div>

              <div className="text-sm text-gray-500">
                Note: Engine should run every 2 hours 15 minutes to apply capping and release green pairs. Use "Run Now" for urgent processing or testing.
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded p-4 mb-4">
            <h2 className="text-lg font-medium mb-2">EPIN Generator</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <div>
                <label className="block text-sm">Quantity</label>
                <input type="number" value={epinQty} onChange={(e) => setEpinQty(e.target.value)} className="mt-1 block w-full border rounded p-2" />
              </div>
              <div>
                <label className="block text-sm">Prefix (optional)</label>
                <input value={epinPrefix} onChange={(e) => setEpinPrefix(e.target.value)} placeholder="e.g. SP-" className="mt-1 block w-full border rounded p-2" />
              </div>
              <div className="md:col-span-2 flex gap-2">
                <button disabled={actionLoading} onClick={generateEpins} className="px-4 py-2 bg-indigo-600 text-white rounded">Generate EPINs</button>
                <button disabled={actionLoading} onClick={() => { setEpinQty(10); setEpinPrefix(""); }} className="px-4 py-2 border rounded">Reset</button>
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-2">EPIN rules: Unlimited tokens, no expiry, transferable. Use carefully.</div>
          </div>

          <div className="bg-white shadow rounded p-4 mb-4">
            <h2 className="text-lg font-medium mb-2">Pending Activations</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <div>
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search user / order / epin" className="w-full border rounded p-2" />
              </div>
              <div className="md:col-span-2 text-right text-sm text-gray-500">Total: {total}</div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="text-left text-sm text-gray-600 border-b">
                    <th className="p-3">Order</th>
                    <th className="p-3">User</th>
                    <th className="p-3">Package</th>
                    <th className="p-3">Price</th>
                    <th className="p-3">EPIN</th>
                    <th className="p-3">Requested At</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.filter((r) => {
                    const q = (query || "").trim().toLowerCase();
                    if (!q) return true;
                    return (r.orderId || "").toLowerCase().includes(q) || (r.userName || r.user?.name || "").toLowerCase().includes(q) || (r.epin || "").toLowerCase().includes(q);
                  }).map((r) => (
                    <tr key={r._id || r.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 text-sm">{r.orderId || r._id || "-"}</td>
                      <td className="p-3 text-sm">{r.userName || r.user?.name || r.userId || "-"}</td>
                      <td className="p-3 text-sm">{r.packageName || r.packageType || "-"}</td>
                      <td className="p-3 text-sm">{formatCurrency(r.price || 0)}</td>
                      <td className="p-3 text-sm">{r.epin || "-"}</td>
                      <td className="p-3 text-sm">{formatDate(r.createdAt)}</td>
                      <td className="p-3 text-sm space-x-2">
                        <button disabled={actionLoading} onClick={() => activatePackageManually(r)} className="px-2 py-1 border rounded text-sm">Activate</button>
                        <button onClick={() => navigator.clipboard?.writeText(r.epin || "") } className="px-2 py-1 border rounded text-sm">Copy EPIN</button>
                        <button onClick={() => window.open(`/admin/user/${r.userId}`, "_blank")} className="px-2 py-1 border rounded text-sm">View User</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">Page: {page} / {totalPages}</div>
              <div className="flex items-center gap-2">
                <button disabled={page <= 1} onClick={() => setPage((s) => Math.max(1, s - 1))} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
                <div className="px-3 py-1 border rounded">{page}</div>
                <button disabled={page >= totalPages} onClick={() => setPage((s) => Math.min(totalPages, s + 1))} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-500 mt-3">
            Note: This admin dashboard assumes the backend implements the following admin endpoints: 
            <ul className="list-disc ml-6 mt-1">
              <li><code>GET /api/admin/dashboard</code> — returns summary metrics</li>
              <li><code>GET /api/admin/pending-activations?page=&limit=</code> — pending activation list</li>
              <li><code>POST /api/admin/epin/generate</code> — generate EPINs body { qty, prefix? }</li>
              <li><code>POST /api/admin/session/run-now</code> — trigger session engine run now</li>
              <li><code>POST /api/admin/session/start</code> and <code>/stop</code> — control scheduler</li>
              <li><code>POST /api/admin/package/activate</code> — manual package activation body { packageId, userId }</li>
            </ul>
            Adjust endpoints or field names if your backend uses different routes.
          </div>
        </>
      )}
    </div>
  );
}
