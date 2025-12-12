import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// PackageHistory.jsx
// 100% complete frontend page for showing user's package purchase history,
// activating packages via EPIN, filtering, searching, exporting CSV, pagination.
// Tailwind CSS classes used (project uses Tailwind per style guide).

export default function PackageHistory() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [packages, setPackages] = useState([]);
  const [filter, setFilter] = useState("all"); // all | active | non-active | silver | gold | ruby
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [showEpinModal, setShowEpinModal] = useState(false);
  const [currentPackage, setCurrentPackage] = useState(null);
  const [epinInput, setEpinInput] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPackages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filter]);

  async function fetchPackages() {
    setLoading(true);
    setError(null);
    try {
      // API contract (example): GET /api/user/packages?filter=...&page=...&limit=...
      const res = await axios.get(
        `/api/user/packages?filter=${encodeURIComponent(filter)}&page=${page}&limit=${perPage}`
      );

      // Expect response { status: true, data: { docs: [...], total: number } }
      const data = res.data;
      if (!data || !data.data) {
        throw new Error("Invalid response from server");
      }
      setPackages(data.data.docs || data.data.docs === 0 ? data.data.docs : []);
      setTotal(data.data.total || 0);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || "Failed to fetch packages");
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

  function openEpinModal(pkg) {
    setCurrentPackage(pkg);
    setEpinInput("");
    setShowEpinModal(true);
  }

  function closeEpinModal() {
    setShowEpinModal(false);
    setCurrentPackage(null);
    setEpinInput("");
  }

  async function activateWithEpin() {
    if (!epinInput || !currentPackage) return;
    setActionLoading(true);
    try {
      // API contract: POST /api/package/activate  body: { epin, packageId }
      const res = await axios.post(`/api/package/activate`, {
        epin: epinInput.trim(),
        packageId: currentPackage._id || currentPackage.id,
      });

      if (res.data && res.data.status) {
        // success
        await fetchPackages();
        closeEpinModal();
        alert(res.data.message || "Package activated successfully");
      } else {
        throw new Error(res.data?.message || "Activation failed");
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || err.message || "Activation error");
    } finally {
      setActionLoading(false);
    }
  }

  function filterAndSearchItems() {
    const q = (query || "").trim().toLowerCase();
    if (!q) return packages;
    return packages.filter((p) => {
      return (
        (p.packageType && p.packageType.toLowerCase().includes(q)) ||
        (p.epin && p.epin.toLowerCase().includes(q)) ||
        (p.orderId && p.orderId.toLowerCase().includes(q)) ||
        (p.sponsorId && String(p.sponsorId).toLowerCase().includes(q)) ||
        (p._id && String(p._id).toLowerCase().includes(q))
      );
    });
  }

  function exportCSV() {
    const items = filterAndSearchItems();
    if (!items || items.length === 0) {
      alert("No rows to export");
      return;
    }
    const header = [
      "Order ID",
      "Package",
      "Price",
      "PV",
      "Pair Income",
      "Session Progress",
      "Status",
      "Activated On",
      "EPIN",
    ];
    const rows = items.map((r) => [
      r.orderId || r._id || "-",
      r.packageType || r.packageName || "-",
      r.price || "-",
      r.pv || "-",
      r.pairIncome || "-",
      `${r.sessionsCompleted || 0}/8`,
      r.isActive ? "Active" : "Non Active",
      r.activatedAt ? formatDate(r.activatedAt) : "-",
      r.epin || "-",
    ]);
    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `package_history_page_${page}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // pagination helpers
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Package History</h1>
        <div className="flex gap-2">
          <button
            onClick={() => exportCSV()}
            className="px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Export CSV
          </button>
          <button
            onClick={() => navigate(-1)}
            className="px-3 py-2 border rounded hover:bg-gray-50"
          >
            Back
          </button>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Filter</label>
            <select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setPage(1);
              }}
              className="mt-1 block w-full border rounded p-2"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="non-active">Non Active</option>
              <option value="silver">Silver</option>
              <option value="gold">Gold</option>
              <option value="ruby">Ruby</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Search</label>
            <div className="flex mt-1">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by package / order id / epin / sponsor id"
                className="flex-1 border rounded-l p-2"
              />
              <button
                onClick={() => setQuery("")}
                className="px-3 border rounded-r bg-gray-50"
                title="Clear"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="flex items-end justify-end">
            <div className="text-sm text-gray-600">Showing page {page} of {totalPages}</div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded">
        {loading ? (
          <div className="p-6 text-center">Loading packages...</div>
        ) : error ? (
          <div className="p-6 text-center text-red-600">{error}</div>
        ) : packages && packages.length === 0 ? (
          <div className="p-6 text-center">No package history found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="text-left text-sm text-gray-600 border-b">
                  <th className="p-3">Order ID</th>
                  <th className="p-3">Package</th>
                  <th className="p-3">Price / PV</th>
                  <th className="p-3">Pair Income</th>
                  <th className="p-3">Sessions</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Activated At</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filterAndSearchItems().map((p) => (
                  <tr key={p._id || p.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 text-sm">{p.orderId || p._id || "-"}</td>
                    <td className="p-3 text-sm">{p.packageType || p.packageName || "-"}</td>
                    <td className="p-3 text-sm">{formatCurrency(p.price || 0)} / {p.pv || "-"}</td>
                    <td className="p-3 text-sm">{formatCurrency(p.pairIncome || 0)}</td>
                    <td className="p-3 text-sm">
                      <div className="w-44">
                        <div className="text-xs mb-1">{(p.sessionsCompleted || 0)}/8 sessions</div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${((p.sessionsCompleted || 0) / 8) * 100}%` }}
                            className="h-full rounded-full bg-green-500"
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-sm">
                      {p.isActive ? (
                        <span className="inline-block px-2 py-1 rounded bg-green-100 text-green-800 text-xs">Active</span>
                      ) : (
                        <span className="inline-block px-2 py-1 rounded bg-red-100 text-red-800 text-xs">Non Active</span>
                      )}
                    </td>
                    <td className="p-3 text-sm">{p.activatedAt ? formatDate(p.activatedAt) : "-"}</td>
                    <td className="p-3 text-sm space-x-2">
                      {!p.isActive && (
                        <button
                          onClick={() => openEpinModal(p)}
                          className="px-2 py-1 border rounded text-sm hover:bg-gray-50"
                        >
                          Activate (EPIN)
                        </button>
                      )}

                      <button
                        onClick={() => navigate(`/package/${p._id || p.id}`)}
                        className="px-2 py-1 border rounded text-sm hover:bg-gray-50"
                      >
                        View
                      </button>

                      <button
                        onClick={() => {
                          navigator.clipboard?.writeText(p.epin || "");
                          alert("EPIN copied to clipboard");
                        }}
                        className="px-2 py-1 border rounded text-sm hover:bg-gray-50"
                      >
                        Copy EPIN
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination footer */}
        <div className="p-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">Total: {total} records</div>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((s) => Math.max(1, s - 1))}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Prev
            </button>
            <div className="px-3 py-1 border rounded">{page}</div>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((s) => Math.min(totalPages, s + 1))}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* EPIN modal */}
      {showEpinModal && currentPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-w-xl w-full bg-white rounded shadow p-4">
            <h2 className="text-lg font-medium mb-2">Activate Package</h2>
            <p className="text-sm text-gray-600 mb-4">Package: {currentPackage.packageType || currentPackage.packageName}</p>
            <div className="grid gap-2">
              <label className="text-sm">Enter EPIN</label>
              <input
                value={epinInput}
                onChange={(e) => setEpinInput(e.target.value)}
                className="border rounded p-2 w-full"
                placeholder="Enter EPIN to activate package"
              />

              <div className="flex gap-2 justify-end mt-3">
                <button onClick={closeEpinModal} className="px-3 py-2 border rounded">Cancel</button>
                <button
                  onClick={activateWithEpin}
                  disabled={!epinInput || actionLoading}
                  className="px-3 py-2 bg-indigo-600 text-white rounded disabled:opacity-60"
                >
                  {actionLoading ? "Activating..." : "Activate"}
                </button>
              </div>

              <div className="text-xs text-gray-500 mt-2">
                Tip: EPIN tokens are unlimited and can be used to activate packages. If the response says "invalid," please confirm the EPIN or contact support.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
