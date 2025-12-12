import React, { useEffect, useState } from "react";

/**
 * FranchiseOrders.jsx
 *
 * Complete frontend page for franchise order management.
 * - Lists orders (fetched from backend)
 * - Search / filter by status / date range / query
 * - Pagination (simple page size)
 * - View order details in a modal
 * - Change order status (mark shipped, cancel) with optimistic UI
 *
 * Integration notes:
 * - Replace API_BASE with your real backend endpoints.
 * - Component expects auth token at localStorage.getItem("token") — adapt to your auth method.
 * - Backend endpoints used (examples):
 *    GET  /api/franchise/orders?search=&status=&page=1&pageSize=20
 *    GET  /api/franchise/orders/:id
 *    POST /api/franchise/orders/:id/status  { status: "shipped" | "cancelled", note?: string }
 *
 * Styling: Tailwind classes (your project uses Tailwind per plan).
 *
 * Usage: copy-paste into src/pages/franchise/FranchiseOrders.jsx
 */

const API_BASE = "/api/franchise/orders";

export default function FranchiseOrders() {
  const [orders, setOrders] = useState([]); // order summary list
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // filters + pagination
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all, pending, processing, shipped, cancelled
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);

  // details modal
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // status updating
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter]);

  async function fetchOrders() {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({
        search: search || "",
        status: statusFilter === "all" ? "" : statusFilter,
        page,
        pageSize,
      });
      const res = await fetch(`${API_BASE}?${params.toString()}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to fetch orders");
      }
      const data = await res.json();
      // Expecting { orders: [], totalPages: n }
      setOrders(Array.isArray(data.orders) ? data.orders : []);
      setTotalPages(data.totalPages ? Number(data.totalPages) : 1);
    } catch (err) {
      setError(err.message || "Something went wrong while fetching orders.");
    } finally {
      setLoading(false);
    }
  }

  async function openDetails(id) {
    setSelectedOrderId(id);
    setOrderDetails(null);
    setDetailsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/${id}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to fetch order details");
      }
      const data = await res.json();
      setOrderDetails(data.order || data);
    } catch (err) {
      setOrderDetails({ error: err.message || "Failed to load details." });
    } finally {
      setDetailsLoading(false);
    }
  }

  function closeDetails() {
    setSelectedOrderId(null);
    setOrderDetails(null);
    setDetailsLoading(false);
  }

  async function updateStatus(id, newStatus) {
    // optimistic UI: update local list and then call backend
    setError(null);
    setUpdatingId(id);
    try {
      // update local UI immediately
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o)));

      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/${id}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || data?.message || "Failed to update status");

      // refresh details if open
      if (selectedOrderId === id) {
        openDetails(id);
      }
    } catch (err) {
      // rollback UI on error: refetch orders to restore truth
      await fetchOrders();
      setError(err.message || "Status update failed.");
    } finally {
      setUpdatingId(null);
    }
  }

  function prettyDate(ts) {
    if (!ts) return "-";
    try {
      return new Date(ts).toLocaleString();
    } catch {
      return ts;
    }
  }

  function renderStatusBadge(status) {
    const map = {
      pending: "bg-yellow-100 text-yellow-800",
      processing: "bg-blue-100 text-blue-800",
      shipped: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${map[status] || "bg-gray-100 text-gray-800"}`}>
        {status?.toUpperCase?.() ?? status}
      </span>
    );
  }

  // simple CSV export of visible orders
  function exportCSV() {
    if (!orders || orders.length === 0) {
      alert("No orders to export");
      return;
    }
    const headers = ["Order ID", "User", "Amount", "PV", "Status", "Created At"];
    const rows = orders.map((o) => [
      o.id,
      o.userName || o.userLogin || o.user || "-",
      o.amount != null ? o.amount : "-",
      o.totalPV != null ? o.totalPV : "-",
      o.status || "-",
      o.createdAt ? new Date(o.createdAt).toLocaleString() : "-",
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `franchise-orders-page${page}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Franchise Orders</h1>

      <div className="bg-white border rounded p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order id, user, mobile..."
            className="px-3 py-2 border rounded col-span-2"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setPage(1);
                fetchOrders();
              }
            }}
          />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border rounded"
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setPage(1);
                fetchOrders();
              }}
              className="px-3 py-2 bg-indigo-600 text-white rounded"
            >
              Search
            </button>
            <button onClick={() => exportCSV()} className="px-3 py-2 border rounded">
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* messages */}
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded">{error}</div>}

      {/* Orders table */}
      <div className="bg-white border rounded shadow-sm overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">Order ID</th>
              <th className="p-3 text-left">User</th>
              <th className="p-3 text-right">Amount</th>
              <th className="p-3 text-right">PV</th>
              <th className="p-3 text-left">Created</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="p-6 text-center text-gray-500">
                  Loading orders...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-6 text-center text-gray-500">
                  No orders found.
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-mono">{o.id}</td>
                  <td className="p-3">{o.userName || o.userLogin || o.user || "-"}</td>
                  <td className="p-3 text-right">₹{formatNumber(o.amount)}</td>
                  <td className="p-3 text-right">{o.totalPV ?? "-"}</td>
                  <td className="p-3">{prettyDate(o.createdAt)}</td>
                  <td className="p-3">{renderStatusBadge(o.status)}</td>
                  <td className="p-3 text-center space-x-2">
                    <button
                      onClick={() => openDetails(o.id)}
                      className="px-2 py-1 border rounded text-sm"
                      title="View details"
                    >
                      View
                    </button>

                    {/* show mark shipped only for orders not shipped/cancelled */}
                    {o.status !== "shipped" && o.status !== "cancelled" && (
                      <button
                        onClick={() => {
                          if (!confirm(`Mark order ${o.id} as shipped?`)) return;
                          updateStatus(o.id, "shipped");
                        }}
                        disabled={updatingId === o.id}
                        className={`px-2 py-1 rounded text-sm ${updatingId === o.id ? "bg-gray-300" : "bg-green-600 text-white"}`}
                        title="Mark shipped"
                      >
                        {updatingId === o.id ? "..." : "Ship"}
                      </button>
                    )}

                    {o.status !== "cancelled" && (
                      <button
                        onClick={() => {
                          if (!confirm(`Cancel order ${o.id}?`)) return;
                          updateStatus(o.id, "cancelled");
                        }}
                        disabled={updatingId === o.id}
                        className={`px-2 py-1 rounded text-sm ${updatingId === o.id ? "bg-gray-300" : "bg-red-600 text-white"}`}
                        title="Cancel order"
                      >
                        {updatingId === o.id ? "..." : "Cancel"}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-600">
          Page {page} of {totalPages}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className={`px-3 py-1 rounded border ${page === 1 ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            Prev
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className={`px-3 py-1 rounded border ${page === totalPages ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            Next
          </button>
        </div>
      </div>

      {/* Details modal */}
      {selectedOrderId && (
        <Modal onClose={closeDetails} title={`Order ${selectedOrderId} Details`}>
          {detailsLoading ? (
            <div className="p-6 text-center text-gray-500">Loading details...</div>
          ) : orderDetails?.error ? (
            <div className="p-6 text-red-600">{orderDetails.error}</div>
          ) : orderDetails ? (
            <OrderDetailsView order={orderDetails} onStatusChange={updateStatus} updatingId={updatingId} />
          ) : (
            <div className="p-6 text-gray-500">No details available.</div>
          )}
        </Modal>
      )}
    </div>
  );
}

/* -----------------------------
   Helper components & functions
   ----------------------------- */

function Modal({ children, onClose, title }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black opacity-40" onClick={onClose}></div>
      <div className="relative bg-white rounded shadow-lg w-full max-w-3xl z-10 overflow-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="px-2 py-1 border rounded">Close</button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

function OrderDetailsView({ order, onStatusChange, updatingId }) {
  // order expected fields: id, userName, items[], amount, totalPV, shipping, status, createdAt, notes
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-gray-500">Order ID</div>
          <div className="font-mono">{order.id}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Created</div>
          <div>{order.createdAt ? new Date(order.createdAt).toLocaleString() : "-"}</div>
        </div>

        <div>
          <div className="text-sm text-gray-500">Customer</div>
          <div>{order.userName || order.user || order.userLogin || "-"}</div>
        </div>

        <div>
          <div className="text-sm text-gray-500">Status</div>
          <div>{order.status}</div>
        </div>
      </div>

      <div className="border rounded p-3 bg-gray-50">
        <div className="font-medium mb-2">Items</div>
        {Array.isArray(order.items) && order.items.length > 0 ? (
          <div className="space-y-2">
            {order.items.map((it, idx) => (
              <div key={idx} className="flex justify-between">
                <div>
                  <div className="font-medium">{it.name}</div>
                  <div className="text-xs text-gray-600">Qty: {it.qty} • PV: {it.pv ?? "-"}</div>
                </div>
                <div className="text-right">₹{formatNumber(it.price)}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-600">No items information.</div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <div className="text-sm text-gray-500">Total Amount</div>
          <div className="font-semibold">₹{formatNumber(order.amount)}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Total PV</div>
          <div className="font-semibold">{order.totalPV ?? "-"}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Shipping</div>
          <div>{order.shipping?.method || "-"} • {order.shipping?.address || "-"}</div>
        </div>
      </div>

      {order.note && (
        <div>
          <div className="text-sm text-gray-500">Note</div>
          <div className="p-2 bg-white border rounded">{order.note}</div>
        </div>
      )}

      <div className="flex gap-3">
        {order.status !== "shipped" && order.status !== "cancelled" && (
          <button
            onClick={() => {
              if (!confirm(`Mark order ${order.id} as shipped?`)) return;
              onStatusChange(order.id, "shipped");
            }}
            disabled={updatingId === order.id}
            className={`px-4 py-2 rounded ${updatingId === order.id ? "bg-gray-300" : "bg-green-600 text-white"}`}
          >
            {updatingId === order.id ? "..." : "Mark Shipped"}
          </button>
        )}

        {order.status !== "cancelled" && (
          <button
            onClick={() => {
              if (!confirm(`Cancel order ${order.id}?`)) return;
              onStatusChange(order.id, "cancelled");
            }}
            disabled={updatingId === order.id}
            className={`px-4 py-2 rounded ${updatingId === order.id ? "bg-gray-300" : "bg-red-600 text-white"}`}
          >
            {updatingId === order.id ? "..." : "Cancel Order"}
          </button>
        )}
      </div>
    </div>
  );
}

/* small helpers */
function formatNumber(n) {
  if (n == null) return "-";
  try {
    return Number(n).toLocaleString("en-IN");
  } catch {
    return n;
  }
}
