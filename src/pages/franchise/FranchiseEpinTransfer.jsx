import React, { useEffect, useState } from "react";

/**
 * FranchiseEpinTransfer.jsx
 *
 * Frontend page for franchise EPIN transfer.
 * - Lists available EPINs for the franchise (mocked / fetched)
 * - Allows selecting one or many EPINs to transfer
 * - Enter recipient user id (login id / number) and optional note
 * - Submits transfer to backend endpoint: POST /api/franchise/epin/transfer
 *
 * Assumptions based on your business plan:
 * - EPINs have unlimited transfers and no expiry.
 * - Franchise holders must be able to transfer EPINs to any user by their login id/number.
 * - Backend returns JSON responses and standard error fields.
 *
 * How to integrate:
 * - Replace fetch URLs with your real API routes.
 * - The component expects the franchise auth token to be available via localStorage "token"
 *   or replace with your auth solution.
 *
 * Tailwind CSS classes are used for styling (your project already uses Tailwind per plan).
 */

const API_BASE = "/api/franchise/epin"; // change to your real base URL

function formatDate(ts) {
  if (!ts) return "-";
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
}

export default function FranchiseEpinTransfer() {
  const [epins, setEpins] = useState([]); // { id, code, packageType, pv, bv, createdAt }
  const [selected, setSelected] = useState(new Set());
  const [recipientId, setRecipientId] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [transfering, setTransfering] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState({ q: "", pkg: "all" });

  useEffect(() => {
    fetchEpins();
  }, []);

  async function fetchEpins() {
    setLoading(true);
    setError(null);
    try {
      // Example: GET /api/franchise/epin/list
      const token = localStorage.getItem("token"); // adjust as required
      const res = await fetch(`${API_BASE}/list`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Failed to fetch EPINs");
      }
      const data = await res.json();
      // expect data.epins = []
      setEpins(Array.isArray(data.epins) ? data.epins : []);
    } catch (err) {
      setError(err.message || "Something went wrong while fetching epins.");
    } finally {
      setLoading(false);
    }
  }

  function toggleSelect(id) {
    setSelected((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });
  }

  function toggleSelectAll(visibleList) {
    setSelected((prev) => {
      const s = new Set(prev);
      const allSelected = visibleList.every((e) => s.has(e.id));
      if (allSelected) {
        // unselect visible
        visibleList.forEach((e) => s.delete(e.id));
      } else {
        visibleList.forEach((e) => s.add(e.id));
      }
      return s;
    });
  }

  function filteredEpins() {
    return epins.filter((e) => {
      const q = filter.q.trim().toLowerCase();
      if (filter.pkg !== "all" && e.packageType !== filter.pkg) return false;
      if (!q) return true;
      // match code or package or pv
      return (
        (e.code && e.code.toLowerCase().includes(q)) ||
        (e.packageType && e.packageType.toLowerCase().includes(q)) ||
        (String(e.pv || "").includes(q) || String(e.bv || "").includes(q))
      );
    });
  }

  async function onTransfer(e) {
    e.preventDefault();
    setMessage(null);
    setError(null);

    if (!recipientId.trim()) {
      setError("Recipient login id / number is required.");
      return;
    }

    const selectedIds = Array.from(selected);
    if (selectedIds.length === 0) {
      setError("Please select at least one EPIN to transfer.");
      return;
    }

    // confirm simple validation
    if (!confirm(`Transfer ${selectedIds.length} EPIN(s) to ${recipientId}?`)) return;

    setTransfering(true);
    try {
      const token = localStorage.getItem("token");
      const body = {
        recipientLogin: recipientId.trim(),
        epinIds: selectedIds,
        note: note.trim() || undefined,
      };

      const res = await fetch(`${API_BASE}/transfer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(body),
      });

      const result = await res.json();

      if (!res.ok) {
        // backend should return { error: "..."} ideally
        throw new Error(result?.error || result?.message || "Transfer failed");
      }

      // success: remove transferred epins from list (optimistic)
      const transferred = result?.transferredIds ?? selectedIds;
      setEpins((prev) => prev.filter((p) => !transferred.includes(p.id)));
      setSelected(new Set());
      setMessage(result?.message || `Transferred ${transferred.length} EPIN(s) successfully.`);
      setNote("");
      setRecipientId("");
    } catch (err) {
      setError(err.message || "EPIN transfer failed.");
    } finally {
      setTransfering(false);
    }
  }

  // UI pieces
  const visible = filteredEpins();
  const allVisibleSelected = visible.length > 0 && visible.every((e) => selected.has(e.id));

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">EPIN Transfer (Franchise)</h1>

      <p className="mb-4 text-sm text-gray-600">
        Transfer EPINs to any user's login id / number. EPINs are unlimited transfer & no expiry per plan.
      </p>

      {/* Messages */}
      {message && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-800 rounded">{message}</div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded">{error}</div>
      )}

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Search / Filter</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={filter.q}
              onChange={(e) => setFilter((f) => ({ ...f, q: e.target.value }))}
              placeholder="Search EPIN code, pv, package..."
              className="flex-1 px-3 py-2 border rounded shadow-sm focus:outline-none focus:ring"
            />
            <select
              value={filter.pkg}
              onChange={(e) => setFilter((f) => ({ ...f, pkg: e.target.value }))}
              className="px-3 py-2 border rounded"
            >
              <option value="all">All packages</option>
              <option value="silver">Silver</option>
              <option value="gold">Gold</option>
              <option value="ruby">Ruby</option>
            </select>
            <button
              onClick={() => fetchEpins()}
              className="px-3 py-2 bg-slate-800 text-white rounded"
              title="Reload"
            >
              Reload
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Selected EPINs</label>
          <div className="px-3 py-2 border rounded bg-white">
            <div className="text-lg font-semibold">{selected.size}</div>
            <div className="text-xs text-gray-500">EPINs chosen for transfer</div>
          </div>
        </div>
      </div>

      {/* EPINs Table */}
      <div className="mb-6 bg-white border rounded shadow-sm overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={() => toggleSelectAll(visible)}
                />
              </th>
              <th className="p-3">EPIN Code</th>
              <th className="p-3">Package</th>
              <th className="p-3">PV</th>
              <th className="p-3">BV</th>
              <th className="p-3">Created</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="p-6 text-center text-gray-500">
                  Loading EPINs...
                </td>
              </tr>
            ) : visible.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-6 text-center text-gray-500">
                  No EPINs found.
                </td>
              </tr>
            ) : (
              visible.map((e) => (
                <tr key={e.id} className="border-t">
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selected.has(e.id)}
                      onChange={() => toggleSelect(e.id)}
                    />
                  </td>
                  <td className="p-3 font-mono">{e.code}</td>
                  <td className="p-3">{capitalize(e.packageType)}</td>
                  <td className="p-3">{e.pv ?? "-"}</td>
                  <td className="p-3">{e.bv ?? "-"}</td>
                  <td className="p-3">{formatDate(e.createdAt)}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded text-xs ${e.used ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                        }`}
                    >
                      {e.used ? "Used" : "Available"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Transfer Form */}
      <form onSubmit={onTransfer} className="space-y-4 bg-white border rounded p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Login ID / Number</label>
            <input
              type="text"
              value={recipientId}
              onChange={(e) => setRecipientId(e.target.value)}
              placeholder="Enter recipient's login id (number)"
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring"
              aria-label="Recipient login id"
            />
            <p className="text-xs text-gray-500 mt-1">
              Use the user's login id/number. Per plan, email may be used unlimitedly at signup, but transfers
              require login id/number.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Transfer count</label>
            <div className="px-3 py-2 border rounded">
              {selected.size} EPIN(s)
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Optional Note</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="A short note (optional)"
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={transfering}
            className={`px-4 py-2 rounded text-white ${transfering ? "bg-gray-400" : "bg-indigo-600 hover:bg-indigo-700"}`}
          >
            {transfering ? "Transferring..." : "Transfer EPIN(s)"}
          </button>

          <button
            type="button"
            onClick={() => {
              setSelected(new Set());
              setNote("");
              setRecipientId("");
              setMessage(null);
              setError(null);
            }}
            className="px-4 py-2 rounded border"
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  );
}

/* small helper */
function capitalize(s) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}
