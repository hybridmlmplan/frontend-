// src/pages/franchisePanel/EPINTransfer.jsx
import React, { useEffect, useState } from "react";
import api from "../../api/axiosConfig";
import { useStore } from "../../store";
import { useNavigate } from "react-router-dom";

/**
 * EPIN Transfer (Franchise Panel)
 *
 * - Fetches franchise-owned EPINs (GET /franchise/epins)
 * - Transfers selected EPINs to another user/franchise (POST /franchise/epin/transfer)
 * - Supports selecting many EPINs, searching, pagination basic
 * - Uses api (axios instance) and useStore() for notifications
 *
 * Paste as src/pages/franchisePanel/EPINTransfer.jsx
 */

export default function EPINTransfer() {
  const { actions } = useStore();
  const navigate = useNavigate();

  const [epins, setEpins] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [loadingTransfer, setLoadingTransfer] = useState(false);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [recipientId, setRecipientId] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchEpins(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  async function fetchEpins(p = 1) {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/franchise/epins", { params: { page: p, limit, q: query } });
      const data = res.data || res;
      // Expect { items: [...], total }
      const items = Array.isArray(data) ? data : data.items || data.epins || [];
      setEpins(items);
      setTotal(data.total ?? (items.length || 0));
      // clear selection on page change
      setSelected(new Set());
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || err?.message || "Failed to load EPINs");
    } finally {
      setLoading(false);
    }
  }

  function toggleSelect(epin) {
    const next = new Set(selected);
    if (next.has(epin)) next.delete(epin);
    else next.add(epin);
    setSelected(next);
  }

  function selectAllOnPage() {
    const next = new Set(selected);
    epins.forEach((e) => next.add(e.code || e.id || e.epin));
    setSelected(next);
  }

  function clearSelection() {
    setSelected(new Set());
  }

  async function handleTransfer(e) {
    e.preventDefault();
    setError(null);

    if (!recipientId || recipientId.trim().length < 2) {
      setError("Enter valid recipient ID (user ID or sponsor ID).");
      return;
    }
    if (selected.size === 0) {
      setError("Select at least one EPIN to transfer.");
      return;
    }

    const epinList = Array.from(selected);

    if (!window.confirm(`Transfer ${epinList.length} EPIN(s) to ${recipientId}?`)) return;

    setLoadingTransfer(true);
    try {
      const payload = {
        recipientId: recipientId.trim(),
        epins: epinList,
      };
      const res = await api.post("/franchise/epin/transfer", payload);
      const data = res.data || res;
      if (data.success || data.status === true) {
        actions.addNotification({ type: "success", message: `Transferred ${epinList.length} EPIN(s)` });
        // refresh list
        await fetchEpins(page);
        setRecipientId("");
      } else {
        throw new Error(data.message || "Transfer failed");
      }
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.message || err?.message || "Transfer failed";
      setError(msg);
      actions.addNotification({ type: "error", message: msg });
    } finally {
      setLoadingTransfer(false);
    }
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    setPage(1);
    fetchEpins(1);
  }

  function copySelected() {
    if (selected.size === 0) return;
    const text = Array.from(selected).join("\n");
    navigator.clipboard?.writeText(text);
    actions.addNotification({ type: "info", message: "Selected EPINs copied to clipboard" });
  }

  return (
    <div className="p-6 pt-24">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">EPIN Transfer</h1>
            <p className="text-sm text-gray-500">Transfer EPINs you own to another user or franchise. Transfers are recorded.</p>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => navigate("/franchise/epins")} className="px-3 py-2 border rounded text-sm">My EPINs</button>
            <button onClick={() => navigate("/franchise/generate-epin")} className="px-3 py-2 bg-indigo-600 text-white rounded text-sm">Generate EPIN</button>
          </div>
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}

        {/* Search & actions */}
        <div className="bg-white p-3 rounded shadow">
          <form onSubmit={handleSearchSubmit} className="flex gap-2 items-center">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search EPIN or filter..."
              className="flex-1 border px-3 py-2 rounded"
            />
            <button type="submit" className="px-3 py-2 bg-gray-100 rounded">Search</button>
            <button type="button" onClick={() => { setQuery(""); setPage(1); fetchEpins(1); }} className="px-3 py-2 border rounded">Reset</button>
            <button type="button" onClick={selectAllOnPage} className="px-3 py-2 border rounded">Select All</button>
            <button type="button" onClick={clearSelection} className="px-3 py-2 border rounded">Clear</button>
            <button type="button" onClick={copySelected} className="px-3 py-2 bg-green-600 text-white rounded">Copy Selected</button>
          </form>
        </div>

        {/* EPIN list */}
        <div className="bg-white p-4 rounded shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-gray-600">Showing EPINs — page {page} / {Math.max(1, Math.ceil((total || epins.length) / limit))}</div>
            <div className="text-sm text-gray-500">Selected: {selected.size}</div>
          </div>

          {loading ? (
            <div className="p-6 text-center text-gray-500">Loading EPINs...</div>
          ) : epins.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No EPINs on this page.</div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left">Select</th>
                    <th className="py-2 text-left">EPIN</th>
                    <th className="py-2 text-left">Package</th>
                    <th className="py-2 text-left">Status</th>
                    <th className="py-2 text-left">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {epins.map((e) => {
                    const code = e.code || e.epin || e.id;
                    return (
                      <tr key={code} className="border-b hover:bg-gray-50">
                        <td className="py-2">
                          <input
                            type="checkbox"
                            checked={selected.has(code)}
                            onChange={() => toggleSelect(code)}
                          />
                        </td>
                        <td className="py-2 font-mono">{code}</td>
                        <td className="py-2">{e.package || e.packageType || "-"}</td>
                        <td className="py-2">
                          <span className={`px-2 py-1 rounded text-xs ${e.status === "used" ? "bg-gray-100 text-gray-700" : "bg-green-100 text-green-800"}`}>
                            {e.status || "available"}
                          </span>
                        </td>
                        <td className="py-2 text-xs text-gray-500">{new Date(e.createdAt || e.createdAtAt || Date.now()).toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="mt-3 flex items-center justify-between">
            <div className="text-sm text-gray-500">Total: {total || epins.length}</div>
            <div className="flex items-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3 py-2 border rounded">Prev</button>
              <button disabled={(page * limit) >= (total || epins.length)} onClick={() => setPage((p) => p + 1)} className="px-3 py-2 border rounded">Next</button>
            </div>
          </div>
        </div>

        {/* Transfer form */}
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">Transfer Selected EPINs</h3>

          <form onSubmit={handleTransfer} className="space-y-3">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Recipient ID (User ID / Sponsor ID)</label>
              <input
                type="text"
                value={recipientId}
                onChange={(e) => setRecipientId(e.target.value)}
                className="w-full border px-3 py-2 rounded"
                placeholder="Enter recipient ID"
              />
            </div>

            <div className="text-sm text-gray-600">
              EPINs selected: <span className="font-medium">{selected.size}</span>
            </div>

            <div className="flex items-center gap-2">
              <button type="submit" disabled={loadingTransfer || selected.size === 0} className="px-4 py-2 bg-indigo-600 text-white rounded">
                {loadingTransfer ? "Transferring..." : `Transfer ${selected.size > 0 ? selected.size : ""}`}
              </button>

              <button type="button" onClick={() => { setSelected(new Set()); setRecipientId(""); }} className="px-4 py-2 border rounded">Reset</button>
            </div>

            {error && <div className="text-sm text-red-600">{error}</div>}
          </form>
        </div>
      </div>
    </div>
  );
}
