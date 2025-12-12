import React, { useEffect, useState } from "react";
import axios from "axios";

// FundRequests.jsx
// Admin page to view and manage fund requests (Car Fund / House Fund / Travel Fund)
// according to the Hybrid MLM plan.
// Features:
// - List fund requests with search, filters (status, fundType), pagination
// - View request details in a modal
// - Approve / Reject requests with optional admin note
// - Export CSV, bulk approve/reject (careful)
// - Auth header helper reads token from localStorage
// - Tailwind CSS ready

export default function FundRequests() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requests, setRequests] = useState([]);
  const [page, setPage] = useState(1);
  const [perPage] = useState(12);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending"); // pending | approved | rejected | all
  const [fundTypeFilter, setFundTypeFilter] = useState("all"); // car | house | travel | all
  const [actionLoading, setActionLoading] = useState(false);

  const [selected, setSelected] = useState(null); // selected request to view
  const [showModal, setShowModal] = useState(false);
  const [adminNote, setAdminNote] = useState("");

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, fundTypeFilter]);

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
      if (fundTypeFilter && fundTypeFilter !== "all") qs.set("fundType", fundTypeFilter);

      const res = await axios.get(`/api/admin/fund-requests?${qs.toString()}`, { headers: getAuthHeaders() });
      if (!res.data || !res.data.status) throw new Error(res.data?.message || "Failed to load requests");
      const d = res.data.data || {};
      setRequests(d.docs || []);
      setTotal(d.total || 0);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || "Failed to fetch fund requests");
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
    const header = ["RequestId", "UserId", "UserName", "FundType", "Amount", "Status", "RequestedAt", "Note"];
    const rows = requests.map((r) => [r._id || r.id, r.userId || r.user?.id || "-", r.userName || r.user?.name || "-", r.fundType || "-", r.amount || 0, r.status || "-", r.createdAt ? formatDate(r.createdAt) : "-", r.note || "-"]);
    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `fund_requests_page_${page}.csv`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
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
    const confirmMsg = action === "approve" ? `Approve request ${req._id || req.id}?` : `Reject request ${req._id || req.id}?`;
    if (!window.confirm(confirmMsg)) return;
    setActionLoading(true);
    try {
      const endpoint = `/api/admin/fund-requests/${req._id || req.id}/${action}`;
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
    if (!window.confirm("Approve ALL visible requests? Make sure you reviewed them.")) return;
    setActionLoading(true);
    try {
      const res = await axios.post(`/api/admin/fund-requests/bulk-approve`, { filter: { q: query, status: statusFilter, fundType: fundTypeFilter } }, { headers: getAuthHeaders() });
      if (res.data && res.data.status) {
        alert(res.data.message || "Bulk approve successful");
        await fetchList();
      } else throw new Error(res.data?.message || "Bulk approve failed");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || err.message || "Bulk action failed");
    } finally { setActionLoading(false); }
  }

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Fund Requests</h1>
        <div className="flex gap-2">
          <button onClick={fetchList} className="px-3 py-2 border rounded">Refresh</button>
          <button onClick={exportCSV} className="px-3 py-2 bg-indigo-600 text-white rounded">Export CSV</button>
          <button onClick={bulkApproveVisible} disabled={actionLoading} className="px-3 py-2 border rounded text-green-600">Bulk Approve Visible</button>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search user / order / remark" className="w-full border rounded p-2" />
          </div>
          <div>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="w-full border rounded p-2">
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div>
            <select value={fundTypeFilter} onChange={(e) => { setFundTypeFilter(e.target.value); setPage(1); }} className="w-full border rounded p-2">
              <option value="all">All Funds</option>
              <option value="car">Car Fund</option>
              <option value="house">House Fund</option>
              <option value="travel">Travel Fund</option>
            </select>
          </div>
          <div className="text-right text-sm text-gray-600">Page {page} / {totalPages}</div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded">
        {loading ? (
          <div className="p-6 text-center">Loading requests...</div>
        ) : error ? (
          <div className="p-6 text-center text-red-600">{error}</div>
        ) : requests && requests.length === 0 ? (
          <div className="p-6 text-center">No fund requests found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="text-left text-sm text-gray-600 border-b">
                  <th className="p-3">Request ID</th>
                  <th className="p-3">User</th>
                  <th className="p-3">Fund Type</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Requested At</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r._id || r.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 text-sm">{r._id || r.id}</td>
                    <td className="p-3 text-sm">{r.userName || r.user?.name || r.userId || "-"}</td>
                    <td className="p-3 text-sm">{r.fundType || "-"}</td>
                    <td className="p-3 text-sm">{r.amount || 0}</td>
                    <td className="p-3 text-sm">{r.status || "-"}</td>
                    <td className="p-3 text-sm">{formatDate(r.createdAt)}</td>
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
            <div className="px-3 py-1 border rounded">{page}</div>
            <button disabled={page >= totalPages} onClick={() => setPage((s) => Math.min(totalPages, s + 1))} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {showModal && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-w-2xl w-full bg-white rounded shadow p-4">
            <h2 className="text-lg font-medium mb-2">Fund Request Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><strong>Request ID:</strong> {selected._id || selected.id}</div>
              <div><strong>User:</strong> {selected.userName || selected.user?.name || selected.userId}</div>
              <div><strong>Fund Type:</strong> {selected.fundType}</div>
              <div><strong>Amount:</strong> {selected.amount}</div>
              <div className="md:col-span-2"><strong>Submitted At:</strong> {formatDate(selected.createdAt)}</div>
              <div className="md:col-span-2"><strong>User Note:</strong> <div className="mt-1 p-2 bg-gray-50 rounded">{selected.note || "-"}</div></div>
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

      <div className="text-xs text-gray-500 mt-3">Note: Car Fund → monthly pool for Ruby Star+, House Fund → monthly pool for Diamond+; Travel fund approvals may be restricted by tier. Fund payouts and eligibility checks should be validated server-side before approval.</div>
    </div>
  );
}
