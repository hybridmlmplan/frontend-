import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// FranchiseList.jsx
// Admin page to list and manage franchises (read-only list + quick actions).
// Features:
// - List franchises with search, filter (active/non-active), pagination
// - View franchise details, open Edit (navigates to CreateFranchise or modal), Delete
// - Export CSV
// - Auth header helper reads token from localStorage
// - Tailwind CSS

export default function FranchiseList() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [franchises, setFranchises] = useState([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filter]);

  function getAuthHeaders() {
    const token = localStorage.getItem("token") || localStorage.getItem("authToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async function fetchList() {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      qs.set("page", page);
      qs.set("limit", perPage);
      if (query) qs.set("q", query);
      if (filter && filter !== "all") qs.set("status", filter);
      const res = await axios.get(`/api/admin/franchises?${qs.toString()}`, { headers: getAuthHeaders() });
      if (!res.data || !res.data.status) throw new Error(res.data?.message || "Failed to fetch franchises");
      const d = res.data.data || {};
      setFranchises(d.docs || []);
      setTotal(d.total || 0);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || "Failed to load franchises");
    } finally {
      setLoading(false);
    }
  }

  function exportCSV() {
    if (!franchises || franchises.length === 0) return alert("No franchises to export");
    const header = ["Title", "HolderUserId", "HolderName", "ReferrerPercent", "HolderPercent", "Active", "Notes"];
    const rows = franchises.map((f) => [f.title || "-", f.holderUserId || f.userId || "-", f.holderName || f.holder?.name || "-", f.referrerPercent || 0, f.holderPercent || 0, f.active ? "Yes" : "No", f.notes || "-"]);
    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `franchises_page_${page}.csv`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  function viewDetails(f) {
    // navigate to franchise detail page (implement route if needed)
    navigate(`/admin/franchise/${f._id || f.id}`);
  }

  function editFranchise(f) {
    // redirect to CreateFranchise with id param or open modal (app specific)
    navigate(`/admin/franchise/edit/${f._id || f.id}`);
  }

  async function deleteFranchise(f) {
    if (!f) return;
    if (!window.confirm(`Delete franchise ${f.title || f._id}? This is permanent.`)) return;
    setActionLoading(true);
    try {
      const res = await axios.delete(`/api/admin/franchises/${f._id || f.id}`, { headers: getAuthHeaders() });
      if (res.data && res.data.status) {
        alert(res.data.message || "Deleted");
        await fetchList();
      } else throw new Error(res.data?.message || "Delete failed");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || err.message || "Delete error");
    } finally {
      setActionLoading(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Franchise List</h1>
        <div className="flex gap-2">
          <button onClick={() => navigate('/admin/franchise/create')} className="px-3 py-2 bg-indigo-600 text-white rounded">Create Franchise</button>
          <button onClick={exportCSV} className="px-3 py-2 border rounded">Export CSV</button>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search title / holder" className="w-full border rounded p-2" />
          </div>
          <div>
            <select value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }} className="w-full border rounded p-2">
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Non Active</option>
            </select>
          </div>
          <div className="md:col-span-2 text-right text-sm text-gray-600">Page {page} / {totalPages}</div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded">
        {loading ? (
          <div className="p-6 text-center">Loading franchises...</div>
        ) : error ? (
          <div className="p-6 text-center text-red-600">{error}</div>
        ) : franchises && franchises.length === 0 ? (
          <div className="p-6 text-center">No franchises found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="text-left text-sm text-gray-600 border-b">
                  <th className="p-3">Title</th>
                  <th className="p-3">Holder</th>
                  <th className="p-3">Referrer %</th>
                  <th className="p-3">Holder %</th>
                  <th className="p-3">Products Config</th>
                  <th className="p-3">Active</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {franchises.map((f) => (
                  <tr key={f._id || f.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 text-sm">{f.title}</td>
                    <td className="p-3 text-sm">{f.holderName || f.holder?.name || f.holderUserId || "-"}</td>
                    <td className="p-3 text-sm">{f.referrerPercent ?? 0}%</td>
                    <td className="p-3 text-sm">{f.holderPercent ?? 0}%</td>
                    <td className="p-3 text-sm">{(f.productPercents || []).length}</td>
                    <td className="p-3 text-sm">{f.active ? (<span className="inline-block px-2 py-1 rounded bg-green-100 text-green-800 text-xs">Active</span>) : (<span className="inline-block px-2 py-1 rounded bg-red-100 text-red-800 text-xs">Non Active</span>)}</td>
                    <td className="p-3 text-sm space-x-2">
                      <button onClick={() => viewDetails(f)} className="px-2 py-1 border rounded text-sm">View</button>
                      <button onClick={() => editFranchise(f)} className="px-2 py-1 border rounded text-sm">Edit</button>
                      <button onClick={() => deleteFranchise(f)} disabled={actionLoading} className="px-2 py-1 border rounded text-sm text-red-600">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">Total: {total} franchises</div>
          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage((s) => Math.max(1, s - 1))} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
            <div className="px-3 py-1 border rounded">{page}</div>
            <button disabled={page >= totalPages} onClick={() => setPage((s) => Math.min(totalPages, s + 1))} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-500 mt-3">Note: Franchise rules — referrer 1% BV; holder minimum 5% selling price. Product-wise % configurable per franchise.</div>
    </div>
  );
}
