import React, { useEffect, useState } from "react";
import axios from "axios";

// EPINAdmin.jsx
// Admin page to manage EPINs according to the Hybrid MLM plan.
// Features:
// - List EPINs with search, filters (used/unused/assigned), pagination
// - Generate unlimited EPINs (qty + optional prefix)
// - Assign EPIN to user, transfer EPIN, revoke EPIN
// - Export EPIN list to CSV
// - Bulk actions: bulk assign, bulk delete (admin only)
// - Auth header helper reads token from localStorage
// - Tailwind CSS — ready to copy-paste into your repo

export default function EPINAdmin() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [epins, setEpins] = useState([]);
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all"); // all | unused | used | assigned
  const [actionLoading, setActionLoading] = useState(false);

  // generator form
  const [genQty, setGenQty] = useState(50);
  const [genPrefix, setGenPrefix] = useState("");
  const [genNote, setGenNote] = useState("");

  // assign / transfer modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedEpin, setSelectedEpin] = useState(null);
  const [assignToUserId, setAssignToUserId] = useState("");

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
      if (filter && filter !== "all") qs.set("filter", filter);
      const res = await axios.get(`/api/admin/epins?${qs.toString()}`, { headers: getAuthHeaders() });
      if (!res.data || !res.data.status) throw new Error(res.data?.message || "Failed to load EPINs");
      const d = res.data.data || {};
      setEpins(d.docs || []);
      setTotal(d.total || 0);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || "Failed to fetch EPINs");
    } finally {
      setLoading(false);
    }
  }

  async function generateEpins() {
    if (!genQty || isNaN(genQty) || genQty <= 0) return alert("Enter valid quantity");
    setActionLoading(true);
    try {
      const body = { qty: Number(genQty), prefix: genPrefix || undefined, note: genNote || undefined };
      const res = await axios.post(`/api/admin/epins/generate`, body, { headers: getAuthHeaders() });
      if (res.data && res.data.status) {
        alert(res.data.message || `Generated ${genQty} EPIN(s)`);
        setGenQty(50);
        setGenPrefix("");
        setGenNote("");
        await fetchList();
      } else throw new Error(res.data?.message || "Generation failed");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || err.message || "EPIN generation error");
    } finally {
      setActionLoading(false);
    }
  }

  function formatDate(iso) {
    if (!iso) return "-";
    try { return new Date(iso).toLocaleString("en-IN"); } catch { return iso; }
  }

  function exportCSV() {
    if (!epins || epins.length === 0) return alert("No EPINs to export");
    const header = ["EPIN", "Status", "AssignedTo", "AssignedAt", "Note"];
    const rows = epins.map((e) => [e.epin || e.code || e._id || "-", e.status || (e.assignedTo ? "Assigned" : "Unused"), e.assignedTo || "-", e.assignedAt ? formatDate(e.assignedAt) : "-", e.note || "-"]);
    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `epins_page_${page}.csv`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  function openAssignModal(epin) {
    setSelectedEpin(epin);
    setAssignToUserId("");
    setShowAssignModal(true);
  }

  function closeAssignModal() {
    setShowAssignModal(false);
    setSelectedEpin(null);
    setAssignToUserId("");
  }

  async function assignEpin() {
    if (!selectedEpin) return;
    if (!assignToUserId.trim()) return alert("Enter userId to assign");
    setActionLoading(true);
    try {
      const res = await axios.post(`/api/admin/epins/assign`, { epinId: selectedEpin._id || selectedEpin.id, userId: assignToUserId.trim() }, { headers: getAuthHeaders() });
      if (res.data && res.data.status) {
        alert(res.data.message || "EPIN assigned");
        closeAssignModal();
        await fetchList();
      } else throw new Error(res.data?.message || "Assign failed");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || err.message || "Assign error");
    } finally { setActionLoading(false); }
  }

  async function transferEpin(epin) {
    const toUser = window.prompt("Enter userId to transfer EPIN to:");
    if (!toUser) return;
    setActionLoading(true);
    try {
      const res = await axios.post(`/api/admin/epins/transfer`, { epinId: epin._id || epin.id, toUserId: toUser.trim() }, { headers: getAuthHeaders() });
      if (res.data && res.data.status) {
        alert(res.data.message || "EPIN transferred");
        await fetchList();
      } else throw new Error(res.data?.message || "Transfer failed");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || err.message || "Transfer error");
    } finally { setActionLoading(false); }
  }

  async function revokeEpin(epin) {
    if (!window.confirm(`Revoke EPIN ${epin.epin || epin.code || epin._id}? This will unassign it.`)) return;
    setActionLoading(true);
    try {
      const res = await axios.post(`/api/admin/epins/revoke`, { epinId: epin._id || epin.id }, { headers: getAuthHeaders() });
      if (res.data && res.data.status) {
        alert(res.data.message || "EPIN revoked");
        await fetchList();
      } else throw new Error(res.data?.message || "Revoke failed");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || err.message || "Revoke error");
    } finally { setActionLoading(false); }
  }

  async function bulkDelete() {
    if (!window.confirm("Delete ALL filtered EPINs? This is permanent.")) return;
    setActionLoading(true);
    try {
      const res = await axios.delete(`/api/admin/epins`, { headers: getAuthHeaders(), data: { filter: { q: query, status: filter } } });
      if (res.data && res.data.status) {
        alert(res.data.message || "EPINs deleted");
        await fetchList();
      } else throw new Error(res.data?.message || "Bulk delete failed");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || err.message || "Bulk delete error");
    } finally { setActionLoading(false); }
  }

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">EPIN Management</h1>
        <div className="flex gap-2">
          <button onClick={generateEpins} disabled={actionLoading} className="px-3 py-2 bg-indigo-600 text-white rounded">Generate EPINs</button>
          <button onClick={exportCSV} className="px-3 py-2 border rounded">Export CSV</button>
          <button onClick={bulkDelete} disabled={actionLoading} className="px-3 py-2 border rounded text-red-600">Bulk Delete</button>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <label className="block text-sm">Quantity</label>
            <input type="number" value={genQty} onChange={(e) => setGenQty(Number(e.target.value))} className="mt-1 block w-full border rounded p-2" />
          </div>
          <div>
            <label className="block text-sm">Prefix</label>
            <input value={genPrefix} onChange={(e) => setGenPrefix(e.target.value)} className="mt-1 block w-full border rounded p-2" placeholder="e.g. SP-" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm">Note</label>
            <input value={genNote} onChange={(e) => setGenNote(e.target.value)} className="mt-1 block w-full border rounded p-2" placeholder="Optional note for EPIN batch" />
          </div>
          <div className="flex items-end">
            <div className="text-xs text-gray-500">Unlimited tokens, no expiry. Use with care.</div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search epin / user id" className="w-full border rounded p-2" />
          </div>
          <div>
            <select value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }} className="w-full border rounded p-2">
              <option value="all">All</option>
              <option value="unused">Unused</option>
              <option value="assigned">Assigned</option>
              <option value="used">Used</option>
            </select>
          </div>
          <div className="md:col-span-2 text-right text-sm text-gray-600">Page {page} / {totalPages}</div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded">
        {loading ? (
          <div className="p-6 text-center">Loading EPINs...</div>
        ) : error ? (
          <div className="p-6 text-center text-red-600">{error}</div>
        ) : epins && epins.length === 0 ? (
          <div className="p-6 text-center">No EPINs found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="text-left text-sm text-gray-600 border-b">
                  <th className="p-3">EPIN</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Assigned To</th>
                  <th className className="p-3">Assigned At</th>
                  <th className="p-3">Note</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {epins.map((e) => (
                  <tr key={e._id || e.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 text-sm">{e.epin || e.code || e._id}</td>
                    <td className="p-3 text-sm">{e.status || (e.assignedTo ? "Assigned" : "Unused")}</td>
                    <td className="p-3 text-sm">{e.assignedTo || "-"}</td>
                    <td className="p-3 text-sm">{e.assignedAt ? formatDate(e.assignedAt) : "-"}</td>
                    <td className="p-3 text-sm">{e.note || "-"}</td>
                    <td className="p-3 text-sm space-x-2">
                      <button onClick={() => openAssignModal(e)} className="px-2 py-1 border rounded text-sm">Assign</button>
                      <button onClick={() => transferEpin(e)} className="px-2 py-1 border rounded text-sm">Transfer</button>
                      <button onClick={() => revokeEpin(e)} className="px-2 py-1 border rounded text-sm text-red-600">Revoke</button>
                      <button onClick={() => navigator.clipboard?.writeText(e.epin || e.code || e._id || "")} className="px-2 py-1 border rounded text-sm">Copy</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">Total: {total} EPINs</div>
          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage((s) => Math.max(1, s - 1))} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
            <div className="px-3 py-1 border rounded">{page} / {totalPages}</div>
            <button disabled={page >= totalPages} onClick={() => setPage((s) => Math.min(totalPages, s + 1))} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>

      {/* Assign modal */}
      {showAssignModal && selectedEpin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-w-md w-full bg-white rounded shadow p-4">
            <h2 className="text-lg font-medium mb-2">Assign EPIN</h2>
            <div className="mb-3 text-sm">EPIN: <strong>{selectedEpin.epin || selectedEpin.code || selectedEpin._id}</strong></div>
            <div className="mb-3">
              <label className="block text-sm">Assign to User ID</label>
              <input value={assignToUserId} onChange={(e) => setAssignToUserId(e.target.value)} className="mt-1 block w-full border rounded p-2" placeholder="Enter user id to assign EPIN" />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={closeAssignModal} className="px-3 py-2 border rounded">Cancel</button>
              <button onClick={assignEpin} disabled={actionLoading} className="px-3 py-2 bg-indigo-600 text-white rounded">{actionLoading ? "Assigning..." : "Assign"}</button>
            </div>
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500 mt-3">Note: EPIN tokens are unlimited, non-expiring, and transferable as per plan. Use admin tools carefully.</div>
    </div>
  );
}
