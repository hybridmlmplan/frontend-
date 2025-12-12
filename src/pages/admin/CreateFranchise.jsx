import React, { useEffect, useState } from "react";
import axios from "axios";

// CreateFranchise.jsx
// Admin page to create and manage franchise holders according to the Hybrid MLM plan.
// Features:
// - Create franchise (name, holder userId, referrer percent (default 1%), holder commission % (min 5%))
// - List & search franchises, pagination
// - Edit / Delete franchise
// - Assign products and configure product-wise percentages (optional)
// - Export CSV of franchises
// - Auth helper reads token from localStorage
// - Tailwind CSS. Adjust API endpoints if backend differs.

export default function CreateFranchise() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [franchises, setFranchises] = useState([]);
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    title: "",
    holderUserId: "",
    holderName: "",
    referrerPercent: 1, // default
    holderPercent: 5, // min 5
    notes: "",
    productPercents: [], // [{ productId, productName, percent }]
    active: true,
  });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  function getAuthHeaders() {
    const token = localStorage.getItem("token") || localStorage.getItem("authToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async function fetchList() {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      if (query) qs.set("q", query);
      qs.set("page", page);
      qs.set("limit", perPage);
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

  function openCreate() {
    setEditing(null);
    setForm({ title: "", holderUserId: "", holderName: "", referrerPercent: 1, holderPercent: 5, notes: "", productPercents: [], active: true });
    setShowModal(true);
  }

  function openEdit(f) {
    setEditing(f);
    setForm({
      title: f.title || "",
      holderUserId: f.holderUserId || f.userId || "",
      holderName: f.holderName || f.holder?.name || "",
      referrerPercent: f.referrerPercent ?? 1,
      holderPercent: f.holderPercent ?? 5,
      notes: f.notes || "",
      productPercents: f.productPercents || [],
      active: !!f.active,
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditing(null);
  }

  function validateForm() {
    if (!form.title.trim()) return "Enter franchise title";
    if (!form.holderUserId.trim() && !form.holderName.trim()) return "Provide holder user id or name";
    if (isNaN(Number(form.referrerPercent)) || Number(form.referrerPercent) < 0) return "Invalid referrer percent";
    if (isNaN(Number(form.holderPercent)) || Number(form.holderPercent) < 5) return "Holder percent must be at least 5%";
    // productPercents percent validation
    for (let pp of form.productPercents || []) {
      if (!pp.productId || isNaN(Number(pp.percent)) || Number(pp.percent) < 0) return "Invalid product percent entries";
    }
    return null;
  }

  async function saveFranchise(e) {
    e?.preventDefault();
    const v = validateForm();
    if (v) return alert(v);
    setActionLoading(true);
    try {
      if (editing) {
        const res = await axios.put(`/api/admin/franchises/${editing._id || editing.id}`, form, { headers: getAuthHeaders() });
        if (res.data && res.data.status) {
          alert(res.data.message || "Franchise updated");
          closeModal();
          await fetchList();
        } else throw new Error(res.data?.message || "Update failed");
      } else {
        const res = await axios.post(`/api/admin/franchises`, form, { headers: getAuthHeaders() });
        if (res.data && res.data.status) {
          alert(res.data.message || "Franchise created");
          closeModal();
          await fetchList();
        } else throw new Error(res.data?.message || "Create failed");
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || err.message || "Save error");
    } finally {
      setActionLoading(false);
    }
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

  function exportCSV() {
    if (!franchises || franchises.length === 0) return alert("No franchises to export");
    const header = ["Title", "HolderUserId", "HolderName", "ReferrerPercent", "HolderPercent", "Active", "Notes"];
    const rows = franchises.map((f) => [f.title || "-", f.holderUserId || f.userId || "-", f.holderName || f.holder?.name || "-", f.referrerPercent || 0, f.holderPercent || 0, f.active ? "Yes" : "No", f.notes || "-"]);
    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `franchises_page_${page}.csv`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  function addProductPercent() {
    setForm((s) => ({ ...s, productPercents: [...(s.productPercents || []), { productId: "", productName: "", percent: 0 }] }));
  }

  function updateProductPercent(idx, key, value) {
    setForm((s) => {
      const arr = (s.productPercents || []).slice();
      arr[idx] = { ...arr[idx], [key]: value };
      return { ...s, productPercents: arr };
    });
  }

  function removeProductPercent(idx) {
    setForm((s) => ({ ...s, productPercents: (s.productPercents || []).filter((_, i) => i !== idx) }));
  }

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Franchise Management</h1>
        <div className="flex gap-2">
          <button onClick={openCreate} className="px-3 py-2 bg-indigo-600 text-white rounded">Create Franchise</button>
          <button onClick={() => exportCSV()} className="px-3 py-2 border rounded">Export CSV</button>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search title / holder" className="w-full border rounded p-2" />
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
                      <button onClick={() => openEdit(f)} className="px-2 py-1 border rounded text-sm">Edit</button>
                      <button onClick={() => deleteFranchise(f)} className="px-2 py-1 border rounded text-sm text-red-600">Delete</button>
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-w-2xl w-full bg-white rounded shadow p-4">
            <h2 className="text-lg font-medium mb-2">{editing ? "Edit Franchise" : "Create Franchise"}</h2>
            <form onSubmit={saveFranchise} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm">Title</label>
                <input value={form.title} onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))} className="mt-1 block w-full border rounded p-2" />
              </div>

              <div>
                <label className="block text-sm">Holder User ID</label>
                <input value={form.holderUserId} onChange={(e) => setForm((s) => ({ ...s, holderUserId: e.target.value }))} className="mt-1 block w-full border rounded p-2" placeholder="user id for holder (optional)" />
              </div>

              <div>
                <label className="block text-sm">Holder Name</label>
                <input value={form.holderName} onChange={(e) => setForm((s) => ({ ...s, holderName: e.target.value }))} className="mt-1 block w-full border rounded p-2" placeholder="Name for display" />
              </div>

              <div>
                <label className="block text-sm">Referrer Percent (default 1%)</label>
                <input type="number" value={form.referrerPercent} onChange={(e) => setForm((s) => ({ ...s, referrerPercent: Number(e.target.value) }))} className="mt-1 block w-full border rounded p-2" />
              </div>

              <div>
                <label className="block text-sm">Holder Percent (min 5%)</label>
                <input type="number" value={form.holderPercent} onChange={(e) => setForm((s) => ({ ...s, holderPercent: Number(e.target.value) }))} className="mt-1 block w-full border rounded p-2" />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))} className="mt-1 block w-full border rounded p-2" rows={2} />
              </div>

              <div className="md:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm">Product-wise Percents (optional)</label>
                  <button type="button" onClick={addProductPercent} className="px-2 py-1 border rounded text-sm">Add</button>
                </div>

                {(form.productPercents || []).map((pp, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center mt-2">
                    <input value={pp.productName} onChange={(e) => updateProductPercent(idx, "productName", e.target.value)} placeholder="Product name" className="col-span-5 border rounded p-2" />
                    <input value={pp.productId} onChange={(e) => updateProductPercent(idx, "productId", e.target.value)} placeholder="Product id" className="col-span-4 border rounded p-2" />
                    <input type="number" value={pp.percent} onChange={(e) => updateProductPercent(idx, "percent", Number(e.target.value))} placeholder="Percent" className="col-span-2 border rounded p-2" />
                    <button type="button" onClick={() => removeProductPercent(idx)} className="col-span-1 px-2 py-1 border rounded text-sm">X</button>
                  </div>
                ))}
              </div>

              <div className="md:col-span-2 flex gap-2 justify-end">
                <button type="button" onClick={closeModal} className="px-4 py-2 border rounded">Cancel</button>
                <button type="submit" disabled={actionLoading} className="px-4 py-2 bg-indigo-600 text-white rounded">{actionLoading ? "Saving..." : editing ? "Update" : "Create"}</button>
              </div>
            </form>

            <div className="text-xs text-gray-500 mt-3">Note: Referrer gets 1% BV by default (configurable per franchise). Franchise holder must have minimum 5% commission on selling price. Product-wise percents can override defaults for specific products.</div>
          </div>
        </div>
      )}
    </div>
  );
}
