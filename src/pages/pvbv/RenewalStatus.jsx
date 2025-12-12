import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// RenewalStatus.jsx
// Shows renewal / renewal-PV status for user's packages.
// Note: Per business plan, packages are "no-expiry" by default. This page
// supports showing renewal-related metadata if the backend stores it
// (for example: renewalPV counters, renewDate for legacy flows, or manual renewals).

export default function RenewalStatus() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  async function fetchStatus() {
    setLoading(true);
    setError(null);
    try {
      // API contract: GET /api/user/packages/renewal-status?page=&limit=&q=
      const res = await axios.get(`/api/user/packages/renewal-status?page=${page}&limit=${perPage}`);
      if (!res.data || !res.data.status) throw new Error(res.data?.message || "Failed to load");
      const data = res.data.data || {};
      setItems(data.docs || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || "Failed to fetch renewal status");
    } finally {
      setLoading(false);
    }
  }

  function formatDate(iso) {
    if (!iso) return "-";
    try {
      return new Date(iso).toLocaleString("en-IN");
    } catch {
      return iso;
    }
  }

  function formatCurrency(n) {
    if (typeof n !== "number") return n;
    return n.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
  }

  function filteredItems() {
    const q = (query || "").trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => {
      return (
        (it.packageType || it.packageName || "").toLowerCase().includes(q) ||
        (it.orderId || "").toLowerCase().includes(q) ||
        (it.epin || "").toLowerCase().includes(q) ||
        String(it._id || it.id || "").toLowerCase().includes(q)
      );
    });
  }

  function exportCSV() {
    const rows = filteredItems();
    if (!rows.length) return alert("No rows to export");
    const header = ["OrderId", "Package", "Price", "PV", "RenewalPV", "RenewalDate", "IsRenewalRequired", "Status", "EPIN"];
    const dataRows = rows.map((r) => [
      r.orderId || r._id || "-",
      r.packageType || r.packageName || "-",
      r.price || "-",
      r.pv || "-",
      r.renewalPV || 0,
      r.renewalDate ? formatDate(r.renewalDate) : "-",
      r.isRenewalRequired ? "Yes" : "No",
      r.isActive ? "Active" : "Non Active",
      r.epin || "-",
    ]);

    const csv = [header, ...dataRows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `renewal_status_page_${page}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function manualRenew(item) {
    if (!item) return;
    // Per your plan, packages are "no-expiry" — but we provide this action for
    // edge-cases where admin/legacy flows require a manual renewal.
    if (!window.confirm(`Proceed to renew package ${item.packageType || item.packageName}?`)) return;
    setActionLoading(true);
    try {
      // POST /api/package/renew body: { packageId }
      const res = await axios.post(`/api/package/renew`, { packageId: item._id || item.id });
      if (res.data && res.data.status) {
        alert(res.data.message || "Package renewed");
        await fetchStatus();
      } else {
        throw new Error(res.data?.message || "Renew failed");
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || err.message || "Renewal failed");
    } finally {
      setActionLoading(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Renewal Status</h1>
        <div className="flex gap-2">
          <button onClick={() => exportCSV()} className="px-3 py-2 bg-indigo-600 text-white rounded">Export CSV</button>
          <button onClick={() => navigate(-1)} className="px-3 py-2 border rounded">Back</button>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Search</label>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search package / orderId / epin" className="mt-1 block w-full border rounded p-2" />
          </div>

          <div className="md:col-span-2 text-sm text-gray-600 flex items-end justify-end">
            <div>
              <div><strong>Note:</strong> As per the final business plan, packages are "no-expiry". Renewal actions are provided for legacy or admin-managed flows only.</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded">
        {loading ? (
          <div className="p-6 text-center">Loading...</div>
        ) : error ? (
          <div className="p-6 text-center text-red-600">{error}</div>
        ) : items && items.length === 0 ? (
          <div className="p-6 text-center">No packages found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="text-left text-sm text-gray-600 border-b">
                  <th className="p-3">Order ID</th>
                  <th className="p-3">Package</th>
                  <th className="p-3">Price / PV</th>
                  <th className="p-3">Renewal PV</th>
                  <th className="p3">Renewal Date</th>
                  <th className="p-3">Is Renewal Required</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems().map((it) => (
                  <tr key={it._id || it.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 text-sm">{it.orderId || it._id || "-"}</td>
                    <td className="p-3 text-sm">{it.packageType || it.packageName || "-"}</td>
                    <td className="p-3 text-sm">{formatCurrency(it.price || 0)} / {it.pv || "-"}</td>
                    <td className="p-3 text-sm">{it.renewalPV || 0}</td>
                    <td className="p-3 text-sm">{it.renewalDate ? formatDate(it.renewalDate) : "-"}</td>
                    <td className="p-3 text-sm">{it.isRenewalRequired ? (<span className="inline-block px-2 py-1 rounded bg-yellow-100 text-yellow-800 text-xs">Yes</span>) : (<span className="inline-block px-2 py-1 rounded bg-green-100 text-green-800 text-xs">No</span>)}</td>
                    <td className="p-3 text-sm">{it.isActive ? (<span className="inline-block px-2 py-1 rounded bg-green-100 text-green-800 text-xs">Active</span>) : (<span className="inline-block px-2 py-1 rounded bg-red-100 text-red-800 text-xs">Non Active</span>)}</td>
                    <td className="p-3 text-sm space-x-2">
                      {it.isRenewalRequired && (
                        <button disabled={actionLoading} onClick={() => manualRenew(it)} className="px-2 py-1 border rounded text-sm hover:bg-gray-50">{actionLoading ? 'Processing...' : 'Renew'}</button>
                      )}

                      <button onClick={() => navigator.clipboard?.writeText(it.epin || "")}
                        className="px-2 py-1 border rounded text-sm hover:bg-gray-50">Copy EPIN</button>

                      <button onClick={() => navigate(`/package/${it._id || it.id}`)} className="px-2 py-1 border rounded text-sm hover:bg-gray-50">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">Total: {total} records</div>
          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage((s) => Math.max(1, s - 1))} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
            <div className="px-3 py-1 border rounded">{page}</div>
            <button disabled={page >= totalPages} onClick={() => setPage((s) => Math.min(totalPages, s + 1))} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
