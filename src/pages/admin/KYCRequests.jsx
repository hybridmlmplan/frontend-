import React, { useEffect, useState } from "react";
import axios from "axios";

// KYCRequests.jsx
// Admin page to manage KYC requests per the Hybrid MLM plan.
// Features:
// - List KYC submissions with search, filters (status: pending/approved/rejected), pagination
// - View KYC details and uploaded documents (images/PDF links) in modal
// - Approve / Reject with optional admin note
// - CSV export, bulk approve/reject for visible items
// - Uses Tailwind CSS and expects admin auth token in localStorage.key 'token'
// - Assumed backend endpoints (adjust if needed):
//   GET  /api/admin/kyc-requests?q=&status=&page=&limit=
//   GET  /api/admin/kyc-requests/:id  (optional)
//   POST /api/admin/kyc-requests/:id/approve  body: { adminNote }
//   POST /api/admin/kyc-requests/:id/reject   body: { adminNote }
//   POST /api/admin/kyc-requests/bulk-approve  body: { filter }
//   POST /api/admin/kyc-requests/bulk-reject   body: { filter }

export default function KYCRequests() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requests, setRequests] = useState([]);
  const [page, setPage] = useState(1);
  const [perPage] = useState(12);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending"); // pending | approved | rejected | all
  const [actionLoading, setActionLoading] = useState(false);

  // modal
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [adminNote, setAdminNote] = useState("");

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter]);

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
      if (statusFilter && statusFilter !== "all") qs.set("status", statusFilter);

      const res = await axios.get(`/api/admin/kyc-requests?${qs.toString()}`, { headers: getAuthHeaders() });
      if (!res.data || !res.data.status) throw new Error(res.data?.message || "Failed to load KYC requests");
      const d = res.data.data || {};
      setRequests(d.docs || []);
      setTotal(d.total || 0);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || "Failed to fetch KYC requests");
    } finally {
      setLoading(false);
    }
  }

  function formatDate(iso) {
    if (!iso) return "-";
    try { return new Date(iso).toLocaleString("en-IN"); } catch { return iso; }
  }

  function exportCSV() {
    if (!requests || requests.length === 0) return alert("No rows to export");
    const header = ["RequestId", "UserId", "UserName", "Status", "SubmittedAt", "DocsCount"];
    const rows = requests.map((r) => [r._id || r.id, r.userId || r.user?.id || "-", r.userName || r.user?.name || "-", r.status || "-", r.createdAt ? formatDate(r.createdAt) : "-", (r.documents || []).length]);
    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `kyc_requests_page_${page}.csv`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  function openModal(req) {
    setSelected(req);
    setAdminNote(req.adminNote || "");
    setShowModal(true);
  }

  function closeModal() {
    setSelected(null);
    setAdminNote("");
    setShowModal(false);
  }

  async function performAction(req, action) {
    // action: approve | reject
    if (!req) return;
    const confirmMsg = action === "approve" ? `Approve KYC for ${req.userName || req.user?.name || req.userId}?` : `Reject KYC for ${req.userName || req.user?.name || req.userId}?`;
    if (!window.confirm(confirmMsg)) return;
    setActionLoading(true);
    try {
      const endpoint = `/api/admin/kyc-requests/${req._id || req.id}/${action}`;
      const body = { adminNote: adminNote || undefined };
      const res = await axios.post(endpoint, body, { headers: getAuthHeaders() });
      if (res.data && res.data.status) {
        alert(res.data.message || `${action} successful`);
        closeModal();
        await fetchList();
      } else throw new Error(res.data?.message || `${action} failed`);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || err.message || "Action failed");
    } finally { setActionLoading(false); }
  }

  async function bulkApproveVisible() {
    if (!window.confirm("Approve ALL visible KYC requests?")) return;
    setActionLoading(true);
    try {
      const res = await axios.post(`/api/admin/kyc-requests/bulk-approve`, { filter: { q: query, status: statusFilter } }, { headers: getAuthHeaders() });
      if (res.data && res.data.status) {
        alert(res.data.message || "Bulk approve successful");
        await fetchList();
      } else throw new Error(res.data?.message || "Bulk approve failed");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || err.message || "Bulk action failed");
    } finally { setActionLoading(false); }
  }

  async function bulkRejectVisible() {
    if (!window.confirm("Reject ALL visible KYC requests?")) return;
    setActionLoading(true);
    try {
      const res = await axios.post(`/api/admin/kyc-requests/bulk-reject`, { filter: { q: query, status: statusFilter } }, { headers: getAuthHeaders() });
      if (res.data && res.data.status) {
        alert(res.data.message || "Bulk reject successful");
        await fetchList();
      } else throw new Error(res.data?.message || "Bulk reject failed");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || err.message || "Bulk action failed");
    } finally { setActionLoading(false); }
  }

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">KYC Requests</h1>
        <div className="flex gap-2">
          <button onClick={fetchList} className="px-3 py-2 border rounded">Refresh</button>
          <button onClick={exportCSV} className="px-3 py-2 bg-indigo-600 text-white rounded">Export CSV</button>
          <button onClick={bulkApproveVisible} disabled={actionLoading} className="px-3 py-2 border rounded text-green-600">Bulk Approve</button>
          <button onClick={bulkRejectVisible} disabled={actionLoading} className="px-3 py-2 border rounded text-red-600">Bulk Reject</button>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search user / id / email" className="w-full border rounded p-2" />
          </div>
          <div>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="w-full border rounded p-2">
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="md:col-span-2 text-right text-sm text-gray-600">Page {page} / {totalPages}</div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded">
        {loading ? (
          <div className="p-6 text-center">Loading KYC requests...</div>
        ) : error ? (
          <div className="p-6 text-center text-red-600">{error}</div>
        ) : requests && requests.length === 0 ? (
          <div className="p-6 text-center">No KYC requests found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="text-left text-sm text-gray-600 border-b">
                  <th className="p-3">Request ID</th>
                  <th className="p-3">User</th>
                  <th className="p-3">Email / Phone</th>
                  <th className className="p-3">Status</th>
                  <th className="p-3">Submitted At</th>
                  <th className="p-3">Docs</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r._id || r.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 text-sm">{r._id || r.id}</td>
                    <td className="p-3 text-sm">{r.userName || r.user?.name || r.userId || "-"}</td>
                    <td className="p-3 text-sm">{r.email || r.user?.email || r.phone || "-"}</td>
                    <td className="p-3 text-sm">{r.status || "-"}</td>
                    <td className="p-3 text-sm">{formatDate(r.createdAt)}</td>
                    <td className="p-3 text-sm">{(r.documents || []).length}</td>
                    <td className="p-3 text-sm space-x-2">
                      <button onClick={() => openModal(r)} className="px-2 py-1 border rounded text-sm">View</button>
                      {r.status === "pending" && (
                        <>
                          <button onClick={() => performAction(r, "approve")} disabled={actionLoading} className="px-2 py-1 border rounded text-sm text-green-600">Approve</button>
                          <button onClick={() => performAction(r, "reject")} disabled={actionLoading} className="px-2 py-1 border rounded text-sm text-red-600">Reject</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">Total: {total} requests</div>
          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage((s) => Math.max(1, s - 1))} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
            <div className="px-3 py-1 border rounded">{page} / {totalPages}</div>
            <button disabled={page >= totalPages} onClick={() => setPage((s) => Math.min(totalPages, s + 1))} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {showModal && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-w-3xl w-full bg-white rounded shadow p-4">
            <h2 className="text-lg font-medium mb-2">KYC Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><strong>Request ID:</strong> {selected._id || selected.id}</div>
              <div><strong>User:</strong> {selected.userName || selected.user?.name || selected.userId}</div>
              <div><strong>Email:</strong> {selected.email || selected.user?.email || "-"}</div>
              <div><strong>Phone:</strong> {selected.phone || selected.user?.phone || "-"}</div>
              <div className="md:col-span-2"><strong>Submitted At:</strong> {formatDate(selected.createdAt)}</div>
              <div className="md:col-span-2"><strong>User Note:</strong>
                <div className="mt-1 p-2 bg-gray-50 rounded">{selected.note || "-"}</div>
              </div>

              <div className="md:col-span-2">
                <strong>Documents</strong>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(selected.documents || []).map((doc, idx) => (
                    <div key={idx} className="border rounded p-2">
                      {doc.type && doc.type.startsWith("image") ? (
                        <img src={doc.url} alt={doc.name || `doc-${idx}`} className="w-full h-40 object-contain" />
                      ) : (
                        <a href={doc.url} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 underline">Open document</a>
                      )}
                      <div className="text-xs text-gray-600 mt-1">{doc.name || "Document"}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm">Admin Note (optional)</label>
                <textarea value={adminNote} onChange={(e) => setAdminNote(e.target.value)} className="mt-1 block w-full border rounded p-2" rows={3} />
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-4">
              <button onClick={closeModal} className="px-3 py-2 border rounded">Close</button>
              {selected.status === "pending" && (
                <>
                  <button disabled={actionLoading} onClick={() => performAction(selected, "reject")} className="px-3 py-2 border rounded text-red-600">Reject</button>
                  <button disabled={actionLoading} onClick={() => performAction(selected, "approve")} className="px-3 py-2 bg-green-600 text-white rounded">Approve</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500 mt-3">Note: KYC approvals must be performed carefully. Server-side should verify documents and update user KYC status before enabling privileged features.</div>
    </div>
  );
}
