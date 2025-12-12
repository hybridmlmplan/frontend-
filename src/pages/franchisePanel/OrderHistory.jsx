// src/pages/franchisePanel/OrderHistory.jsx
import React, { useEffect, useState } from "react";
import api from "../../api/axiosConfig";
import { useStore } from "../../store";
import { useNavigate } from "react-router-dom";

/**
 * Franchise Order History
 *
 * Backend endpoints assumed:
 *  GET /franchise/orders?limit=&page=&status=&q=&from=&to=
 *  (returns { items: [...], total })
 *
 * Paste as: src/pages/franchisePanel/OrderHistory.jsx
 */

export default function OrderHistory() {
  const { actions } = useStore();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState(""); // pending, delivered, cancelled, all
  const [query, setQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line
  }, [page, limit, filterStatus]);

  async function fetchOrders(p = page) {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: p,
        limit,
      };
      if (filterStatus) params.status = filterStatus;
      if (query) params.q = query;
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;

      const res = await api.get("/franchise/orders", { params });
      const data = res.data || res;
      const items = Array.isArray(data) ? data : data.items || data.orders || [];
      setOrders(items);
      setTotal(data.total ?? (items.length || 0));
    } catch (err) {
      console.error("Fetch orders error", err);
      const msg = err?.response?.data?.message || err?.message || "Failed to load orders";
      setError(msg);
      actions.addNotification({ type: "error", message: msg });
    } finally {
      setLoading(false);
    }
  }

  function resetFilters() {
    setFilterStatus("");
    setQuery("");
    setFromDate("");
    setToDate("");
    setPage(1);
    fetchOrders(1);
  }

  function fmtCurrency(val) {
    return `₹${Number(val || 0).toLocaleString("en-IN")}`;
  }

  function exportCsv() {
    if (!orders || orders.length === 0) {
      actions.addNotification({ type: "info", message: "No orders to export" });
      return;
    }

    const header = ["Order ID", "Customer", "Phone", "Total", "PV", "BV", "Status", "Date"];
    const rows = orders.map((o) => [
      o.id || o._id || "",
      (o.customer && (o.customer.name || o.customer.phone)) || "-",
      (o.customer && o.customer.phone) || "-",
      o.total ?? 0,
      o.pv ?? 0,
      o.bv ?? 0,
      o.status || "-",
      o.createdAt ? new Date(o.createdAt).toLocaleString() : "-",
    ]);

    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `franchise_orders_page${page}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-6 pt-24">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Order History</h1>
            <p className="text-sm text-gray-500">All orders placed via your franchise panel. Use filters to refine results.</p>
          </div>

          <div className="flex gap-2">
            <button onClick={() => navigate("/franchise/create-order")} className="px-3 py-2 bg-indigo-600 text-white rounded">Create Order</button>
            <button onClick={() => exportCsv()} className="px-3 py-2 border rounded">Export CSV</button>
            <button onClick={() => { resetFilters(); }} className="px-3 py-2 border rounded">Reset Filters</button>
          </div>
        </header>

        {error && <div className="text-sm text-red-600">{error}</div>}

        {/* Filters */}
        <div className="bg-white p-4 rounded shadow">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Search (Order ID / Customer)</label>
              <div className="flex">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Type and press Enter"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setPage(1);
                      fetchOrders(1);
                    }
                  }}
                  className="w-full border px-3 py-2 rounded"
                />
                <button
                  onClick={() => { setPage(1); fetchOrders(1); }}
                  className="ml-2 px-3 py-2 bg-gray-100 rounded"
                >
                  Go
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                className="w-full border px-3 py-2 rounded"
              >
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">From Date</label>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-full border px-3 py-2 rounded" />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">To Date</label>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-full border px-3 py-2 rounded" />
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button onClick={() => { setPage(1); fetchOrders(1); }} className="px-3 py-2 bg-indigo-600 text-white rounded">Apply</button>
            <button onClick={() => { setFromDate(""); setToDate(""); setPage(1); fetchOrders(1); }} className="px-3 py-2 border rounded">Clear Dates</button>
          </div>
        </div>

        {/* Orders list */}
        <div className="bg-white p-4 rounded shadow">
          {loading ? (
            <div className="p-6 text-center text-gray-500">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No orders found.</div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left">Order ID</th>
                    <th className="py-2 text-left">Customer</th>
                    <th className="py-2 text-right">Total</th>
                    <th className="py-2 text-right">PV / BV</th>
                    <th className="py-2 text-left">Status</th>
                    <th className="py-2 text-left">Actions</th>
                    <th className="py-2 text-left">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id || o._id} className="border-b hover:bg-gray-50">
                      <td className="py-2 font-mono">{o.id || o._id}</td>
                      <td className="py-2">
                        <div className="font-medium">{o.customer?.name || "-"}</div>
                        <div className="text-xs text-gray-500">{o.customer?.phone || o.customer?.email || "-"}</div>
                      </td>
                      <td className="py-2 text-right">{fmtCurrency(o.total)}</td>
                      <td className="py-2 text-right">{(o.pv || 0) + " / " + (o.bv || 0)}</td>
                      <td className="py-2">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            o.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                            o.status === "delivered" ? "bg-green-100 text-green-800" :
                            o.status === "cancelled" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {o.status || "unknown"}
                        </span>
                      </td>

                      <td className="py-2">
                        <div className="flex gap-2">
                          <button onClick={() => navigate(`/franchise/orders/${o.id || o._id}`)} className="px-2 py-1 text-xs border rounded">View</button>
                          {o.status === "pending" && (
                            <button onClick={async () => {
                              if (!window.confirm("Mark as delivered?")) return;
                              try {
                                await api.post(`/franchise/orders/${encodeURIComponent(o.id || o._id)}/update-status`, { status: "delivered" });
                                actions.addNotification({ type: "success", message: "Order marked delivered" });
                                fetchOrders(page);
                              } catch (err) {
                                const m = err?.response?.data?.message || err?.message || "Update failed";
                                actions.addNotification({ type: "error", message: m });
                              }
                            }} className="px-2 py-1 text-xs bg-green-50 text-green-700 rounded">Mark Delivered</button>
                          )}
                        </div>
                      </td>

                      <td className="py-2 text-xs text-gray-500">{o.createdAt ? new Date(o.createdAt).toLocaleString() : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">Total Orders: {total}</div>
          <div className="flex items-center gap-2">
            <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }} className="border px-2 py-1 rounded">
              <option value={6}>6</option>
              <option value={12}>12</option>
              <option value={24}>24</option>
              <option value={50}>50</option>
            </select>

            <button disabled={page <= 1} onClick={() => { setPage((p) => Math.max(1, p - 1)); }} className="px-3 py-1 border rounded">Prev</button>
            <div className="px-3 py-1 border rounded">Page {page}</div>
            <button disabled={(page * limit) >= total} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 border rounded">Next</button>
            <button onClick={() => fetchOrders(page)} className="px-3 py-1 border rounded">Refresh</button>
          </div>
        </div>
      </div>
    </div>
  );
}
