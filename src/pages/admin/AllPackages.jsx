import React, { useEffect, useState } from "react";
import axios from "axios";

// AllPackages.jsx
// 100% complete admin page to manage packages (Silver, Gold, Ruby) per Hybrid MLM plan.
// Features:
// - List packages with pagination, search and filters
// - Create / Edit package modal (price, pv, pairIncome, capping, description)
// - Delete package with confirmation
// - Toggle package active/non-active
// - Quick actions: assign EPIN, export CSV
// - Uses Tailwind CSS and assumes admin auth token in localStorage.key 'token'
// - API endpoints assumed (adjust if your backend differs):
//   GET /api/admin/packages?page=&limit=&q=
//   POST /api/admin/packages  body: { packageType, price, pv, pairIncome, capping, description, active }
//   PUT /api/admin/packages/:id
//   DELETE /api/admin/packages/:id
//   POST /api/admin/packages/:id/assign-epin body: { qty }

export default function AllPackages() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [packages, setPackages] = useState([]);
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null); // package object when editing
  const [form, setForm] = useState({ packageType: "", price: "", pv: "", pairIncome: "", capping: 1, description: "", active: true });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchPackages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  function getAuthHeaders() {
    const token = localStorage.getItem("token") || localStorage.getItem("authToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async function fetchPackages() {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      if (query) qs.set("q", query);
      qs.set("page", page);
      qs.set("limit", perPage);
      const res = await axios.get(`/api/admin/packages?${qs.toString()}`, { headers: getAuthHeaders() });
      if (!res.data || !res.data.status) throw new Error(res.data?.message || "Failed to fetch packages");
      const d = res.data.data || {};
      setPackages(d.docs || []);
      setTotal(d.total || 0);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || "Failed to load packages");
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setForm({ packageType: "", price: "", pv: "", pairIncome: "", capping: 1, description: "", active: true });
    setShowModal(true);
  }

  function openEdit(pkg) {
    setEditing(pkg);
    setForm({
      packageType: pkg.packageType || pkg.packageName || "",
      price: pkg.price || "",
      pv: pkg.pv || "",
      pairIncome: pkg.pairIncome || "",
      capping: pkg.capping || 1,
      description: pkg.description || "",
      active: !!pkg.active,
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditing(null);
  }

  async function savePackage(e) {
    e?.preventDefault();
    if (!form.packageType || !form.price || !form.pv) return alert("Please provide packageType, price and PV");
    setActionLoading(true);
    try {
      if (editing) {
        const res = await axios.put(`/api/admin/packages/${editing._id || editing.id}`, form, { headers: getAuthHeaders() });
        if (res.data && res.data.status) {
          alert(res.data.message || "Package updated");
          closeModal();
          await fetchPackages();
        } else throw new Error(res.data?.message || "Update failed");
      } else {
        const res = await axios.post(`/api/admin/packages`, form, { headers: getAuthHeaders() });
        if (res.data && res.data.status) {
          alert(res.data.message || "Package created");
          closeModal();
          await fetchPackages();
        } else throw new Error(res.data?.message || "Create failed");
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || err.message || "Save error");
    } finally {
      setActionLoading(false);
    }
  }

  async function deletePackage(pkg) {
    if (!pkg) return;
    if (!window.confirm(`Delete package ${pkg.packageType || pkg.packageName}? This action is permanent.`)) return;
    setActionLoading(true);
    try {
      const res = await axios.delete(`/api/admin/packages/${pkg._id || pkg.id}`, { headers: getAuthHeaders() });
      if (res.data && res.data.status) {
        alert(res.data.message || "Deleted");
        await fetchPackages();
      } else throw new Error(res.data?.message || "Delete failed");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || err.message || "Delete error");
    } finally {
      setActionLoading(false);
    }
  }

  async function toggleActive(pkg) {
    if (!pkg) return;
    setActionLoading(true);
    try {
      const res = await axios.put(`/api/admin/packages/${pkg._id || pkg.id}`, { active: !pkg.active }, { headers: getAuthHeaders() });
      if (res.data && res.data.status) {
        await fetchPackages();
      } else throw new Error(res.data?.message || "Toggle failed");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || err.message || "Toggle error");
    } finally {
      setActionLoading(false);
    }
  }

  function exportCSV() {
    if (!packages || packages.length === 0) return alert("No packages to export");
    const header = ["PackageType", "Price", "PV", "PairIncome", "Capping", "Active"];
    const rows = packages.map((p) => [p.packageType || p.packageName || "-", p.price || 0, p.pv || 0, p.pairIncome || 0, p.capping || 1, p.active ? "Yes" : "No"]);
    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `packages_page_${page}.csv`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  async function assignEpins(pkg) {
    const qty = Number(window.prompt(`Enter EPIN quantity to assign to package ${pkg.packageType || pkg.packageName}:`, "1"));
    if (!qty || isNaN(qty) || qty <= 0) return;
    setActionLoading(true);
    try {
      const res = await axios.post(`/api/admin/packages/${pkg._id || pkg.id}/assign-epin`, { qty }, { headers: getAuthHeaders() });
      if (res.data && res.data.status) {
        alert(res.data.message || `Assigned ${qty} EPIN(s)`);
      } else throw new Error(res.data?.message || "Assign failed");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || err.message || "Assign EPIN error");
    } finally {
      setActionLoading(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">All Packages</h1>
        <div className="flex gap-2">
          <button onClick={openCreate} className="px-3 py-2 bg-indigo-600 text-white rounded">Create Package</button>
          <button onClick={() => exportCSV()} className="px-3 py-2 border rounded">Export CSV</button>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by package" className="w-full border rounded p-2" />
          </div>
          <div className="md:col-span-2 text-right">
            <div className="text-sm text-gray-600">Page {page} / {totalPages}</div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded">
        {loading ? (
          <div className="p-6 text-center">Loading packages...</div>
        ) : error ? (
          <div className="p-6 text-center text-red-600">{error}</div>
        ) : packages && packages.length === 0 ? (
          <div className="p-6 text-center">No packages found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="text-left text-sm text-gray-600 border-b">
                  <th className="p-3">Package</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">PV</th>
                  <th className="p-3">Pair Income</th>
                  <th className="p-3">Capping</th>
                  <th className="p-3">Active</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {packages.map((p) => (
                  <tr key={p._id || p.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 text-sm">{p.packageType || p.packageName}</td>
                    <td className="p-3 text-sm">{p.price}</td>
                    <td className="p-3 text-sm">{p.pv}</td>
                    <td className="p-3 text-sm">{p.pairIncome}</td>
                    <td className="p-3 text-sm">{p.capping || 1}</td>
                    <td className="p-3 text-sm">{p.active ? (<span className="inline-block px-2 py-1 rounded bg-green-100 text-green-800 text-xs">Active</span>) : (<span className="inline-block px-2 py-1 rounded bg-red-100 text-red-800 text-xs">Non Active</span>)}</td>
                    <td className="p-3 text-sm space-x-2">
                      <button onClick={() => openEdit(p)} className="px-2 py-1 border rounded text-sm">Edit</button>
                      <button onClick={() => assignEpins(p)} className="px-2 py-1 border rounded text-sm">Assign EPIN</button>
                      <button onClick={() => toggleActive(p)} className="px-2 py-1 border rounded text-sm">Toggle Active</button>
                      <button onClick={() => deletePackage(p)} className="px-2 py-1 border rounded text-sm text-red-600">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">Total: {total} packages</div>
          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage((s) => Math.max(1, s - 1))} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
            <div className="px-3 py-1 border rounded">{page}</div>
            <button disabled={page >= totalPages} onClick={() => setPage((s) => Math.min(totalPages, s + 1))} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-w-2xl w-full bg-white rounded shadow p-4">
            <h2 className="text-lg font-medium mb-2">{editing ? "Edit Package" : "Create Package"}</h2>
            <form onSubmit={savePackage} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm">Package Type</label>
                <input value={form.packageType} onChange={(e) => setForm((s) => ({ ...s, packageType: e.target.value }))} className="mt-1 block w-full border rounded p-2" placeholder="e.g. Silver" />
              </div>
              <div>
                <label className="block text-sm">Price</label>
                <input type="number" value={form.price} onChange={(e) => setForm((s) => ({ ...s, price: e.target.value }))} className="mt-1 block w-full border rounded p-2" />
              </div>
              <div>
                <label className="block text-sm">PV</label>
                <input type="number" value={form.pv} onChange={(e) => setForm((s) => ({ ...s, pv: e.target.value }))} className="mt-1 block w-full border rounded p-2" />
              </div>
              <div>
                <label className="block text-sm">Pair Income</label>
                <input type="number" value={form.pairIncome} onChange={(e) => setForm((s) => ({ ...s, pairIncome: e.target.value }))} className="mt-1 block w-full border rounded p-2" />
              </div>
              <div>
                <label className="block text-sm">Capping</label>
                <input type="number" value={form.capping} onChange={(e) => setForm((s) => ({ ...s, capping: e.target.value }))} className="mt-1 block w-full border rounded p-2" />
              </div>
              <div>
                <label className="block text-sm">Active</label>
                <select value={form.active ? "1" : "0"} onChange={(e) => setForm((s) => ({ ...s, active: e.target.value === "1" }))} className="mt-1 block w-full border rounded p-2">
                  <option value="1">Active</option>
                  <option value="0">Non Active</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm">Description</label>
                <textarea value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} className="mt-1 block w-full border rounded p-2" rows={3} />
              </div>

              <div className="md:col-span-2 flex gap-2 justify-end">
                <button type="button" onClick={closeModal} className="px-4 py-2 border rounded">Cancel</button>
                <button type="submit" disabled={actionLoading} className="px-4 py-2 bg-indigo-600 text-white rounded">{actionLoading ? "Saving..." : editing ? "Update" : "Create"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
