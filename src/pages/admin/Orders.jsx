import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
// shadcn-ui & lucide-react components (project convention)
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Download, Eye, CheckCircle, XCircle } from "lucide-react";

/**
 * Admin Orders Page
 * -----------------
 * - Designed to be a single-file, drop-in React page for admin order management.
 * - Uses Tailwind CSS + shadcn/ui components project conventions (adjust imports if your project differs).
 * - Features:
 *    • Fetch orders with pagination
 *    • Filter by status / package / session
 *    • Search by order id / user name / mobile
 *    • View order details in a dialog
 *    • Mark shipped / cancel
 *    • Export visible orders to CSV
 * - Backend endpoints assumed:
 *    GET  /api/admin/orders?page=&limit=&search=&status=&package=
 *    GET  /api/admin/orders/:id
 *    PATCH /api/admin/orders/:id  (body { status })
 *
 * Adjust API URLs and auth token retrieval to match your backend.
 */

const DEFAULT_LIMIT = 20;

export default function OrdersAdmin() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [packageFilter, setPackageFilter] = useState("");

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // small debounce for search
  useEffect(() => {
    const t = setTimeout(() => {
      fetchOrders(1);
    }, 450);
    return () => clearTimeout(t);
  }, [search, statusFilter, packageFilter]);

  useEffect(() => {
    fetchOrders(page);
  }, [page]);

  const getAuthHeaders = () => {
    // adjust token storage as per your auth
    const token = localStorage.getItem("token") || "";
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  async function fetchOrders(p = 1) {
    setLoading(true);
    try {
      const params = {
        page: p,
        limit,
      };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (packageFilter) params.package = packageFilter;

      const { data } = await axios.get("/api/admin/orders", {
        params,
        headers: getAuthHeaders(),
      });

      // expected response shape: { orders: [], total: 0 }
      setOrders(data.orders || []);
      setTotal(data.total || 0);
      setPage(p);
    } catch (err) {
      console.error("fetchOrders error", err?.response || err);
      // Optionally show toast here
    } finally {
      setLoading(false);
    }
  }

  async function openOrderDetails(id) {
    setDialogOpen(true);
    setSelectedOrder(null);
    try {
      const { data } = await axios.get(`/api/admin/orders/${id}`, {
        headers: getAuthHeaders(),
      });
      setSelectedOrder(data.order || data);
    } catch (err) {
      console.error("openOrderDetails", err?.response || err);
      setDialogOpen(false);
    }
  }

  async function updateOrderStatus(id, status) {
    setActionLoading(true);
    try {
      await axios.patch(`/api/admin/orders/${id}`, { status }, { headers: getAuthHeaders() });
      // optimistic refresh
      setOrders((prev) => prev.map((o) => (o._id === id ? { ...o, status } : o)));
      if (selectedOrder && selectedOrder._id === id) {
        setSelectedOrder({ ...selectedOrder, status });
      }
    } catch (err) {
      console.error("updateOrderStatus", err?.response || err);
    } finally {
      setActionLoading(false);
    }
  }

  function formatDate(d) {
    if (!d) return "-";
    try {
      return new Date(d).toLocaleString();
    } catch {
      return d;
    }
  }

  function exportCSV(rows) {
    const header = [
      "Order ID",
      "User",
      "Mobile",
      "Package",
      "Amount",
      "PV",
      "Status",
      "Created At",
    ];
    const csv = [header.join(",")];
    for (const r of rows) {
      const line = [
        `"${r._id || r.id || "-"}"`,
        `"${(r.userName || r.user?.name || "-").replace(/"/g, "'")}"`,
        `"${r.mobile || r.user?.mobile || "-"}"`,
        `"${r.package || r.pkg || "-"}"`,
        `${r.amount || r.price || 0}`,
        `${r.pv || r.PV || 0}`,
        `${r.status || "-"}`,
        `"${formatDate(r.createdAt || r.created)}"`,
      ];
      csv.push(line.join(","));
    }

    const blob = new Blob([csv.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders_export_page_${page}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const totalPages = useMemo(() => Math.ceil(total / limit) || 1, [total, limit]);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Admin — Orders</h1>
        <div className="flex gap-2 items-center">
          <Button onClick={() => fetchOrders(1)} disabled={loading}>
            Refresh
          </Button>
          <Button variant="ghost" onClick={() => exportCSV(orders)}>
            <Download className="mr-2 h-4 w-4 inline" /> Export CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Input
              placeholder="Search by order id / user / mobile"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </Select>

            <Select value={packageFilter} onChange={(e) => setPackageFilter(e.target.value)}>
              <option value="">All Packages</option>
              <option value="silver">Silver</option>
              <option value="gold">Gold</option>
              <option value="ruby">Ruby</option>
            </Select>

            <div className="flex gap-2">
              <Select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); fetchOrders(1); }}>
                <option value={10}>10 / page</option>
                <option value={20}>20 / page</option>
                <option value={50}>50 / page</option>
              </Select>
              <Button onClick={() => { setSearch(""); setStatusFilter(""); setPackageFilter(""); fetchOrders(1); }}>
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Spinner />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <THead>
                    <TR>
                      <TH>Order ID</TH>
                      <TH>User</TH>
                      <TH>Package</TH>
                      <TH>Amount</TH>
                      <TH>PV</TH>
                      <TH>Status</TH>
                      <TH>Created</TH>
                      <TH>Action</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {orders.length === 0 ? (
                      <TR>
                        <TD colSpan={8} className="text-center py-8">
                          No orders found
                        </TD>
                      </TR>
                    ) : (
                      orders.map((o) => (
                        <TR key={o._id || o.id}>
                          <TD className="font-mono text-sm">{o._id || o.id}</TD>
                          <TD>
                            <div className="text-sm font-medium">{o.userName || o.user?.name || "-"}</div>
                            <div className="text-xs text-muted-foreground">{o.user?.mobile || o.mobile || "-"}</div>
                          </TD>
                          <TD className="uppercase">{(o.package || o.pkg || "-").toString()}</TD>
                          <TD>₹{o.amount || o.price || 0}</TD>
                          <TD>{o.pv || o.PV || 0}</TD>
                          <TD>
                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(o.status)}`}>
                              {o.status}
                            </span>
                          </TD>
                          <TD className="text-xs">{formatDate(o.createdAt || o.created)}</TD>
                          <TD>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => openOrderDetails(o._id || o.id)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              {o.status !== "shipped" && o.status !== "cancelled" && (
                                <Button size="sm" onClick={() => updateOrderStatus(o._id || o.id, "shipped")}>
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              )}
                              {o.status !== "cancelled" && (
                                <Button size="sm" variant="destructive" onClick={() => updateOrderStatus(o._id || o.id, "cancelled")}>
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TD>
                        </TR>
                      ))
                    )}
                  </TBody>
                </Table>
              </div>
            )}

            <div className="flex items-center justify-between mt-4">
              <div>
                Showing page {page} of {totalPages} — {total} orders
              </div>
              <div className="flex gap-2 items-center">
                <Button onClick={() => fetchOrders(1)} disabled={page === 1}>First</Button>
                <Button onClick={() => fetchOrders(Math.max(1, page - 1))} disabled={page === 1}>Prev</Button>
                <div>Page</div>
                <Input value={page} onChange={(e) => setPage(Number(e.target.value || 1))} className="w-20" />
                <Button onClick={() => fetchOrders(page)}>Go</Button>
                <Button onClick={() => fetchOrders(Math.min(totalPages, page + 1))} disabled={page === totalPages}>Next</Button>
                <Button onClick={() => fetchOrders(totalPages)} disabled={page === totalPages}>Last</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order details dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>

          {!selectedOrder ? (
            <div className="py-8 flex items-center justify-center">
              <Spinner />
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-medium">Order</h3>
                  <div className="text-sm">ID: <span className="font-mono">{selectedOrder._id}</span></div>
                  <div className="text-sm">Package: {selectedOrder.package || selectedOrder.pkg}</div>
                  <div className="text-sm">Amount: ₹{selectedOrder.amount || selectedOrder.price}</div>
                  <div className="text-sm">PV: {selectedOrder.pv || selectedOrder.PV}</div>
                  <div className="text-sm">Status: {selectedOrder.status}</div>
                  <div className="text-sm">Created: {formatDate(selectedOrder.createdAt || selectedOrder.created)}</div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium">User</h3>
                  <div className="text-sm">Name: {selectedOrder.userName || selectedOrder.user?.name}</div>
                  <div className="text-sm">Mobile: {selectedOrder.user?.mobile || selectedOrder.mobile}</div>
                  <div className="text-sm">Email: {selectedOrder.user?.email || selectedOrder.email}</div>
                  <div className="text-sm">Sponsor: {selectedOrder.sponsorId || selectedOrder.sponser}</div>
                  <div className="text-sm">Placement: {selectedOrder.placementId || selectedOrder.placement}</div>
                </div>
              </div>

              {selectedOrder.items && (
                <div className="mt-4">
                  <h4 className="font-medium">Items</h4>
                  <div className="border rounded overflow-auto max-h-44 mt-2">
                    <table className="w-full text-sm">
                      <thead className="bg-muted p-2 sticky top-0">
                        <tr>
                          <th className="text-left p-2">Title</th>
                          <th className="p-2">Qty</th>
                          <th className="p-2">Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrder.items.map((it, i) => (
                          <tr key={i} className="border-t">
                            <td className="p-2">{it.title}</td>
                            <td className="p-2 text-center">{it.qty}</td>
                            <td className="p-2 text-right">₹{it.price}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex gap-2 mt-4">
                <Button onClick={() => updateOrderStatus(selectedOrder._id, "processing")} disabled={actionLoading}>
                  Set Processing
                </Button>
                <Button onClick={() => updateOrderStatus(selectedOrder._id, "shipped")} disabled={actionLoading}>
                  Mark Shipped
                </Button>
                <Button variant="destructive" onClick={() => updateOrderStatus(selectedOrder._id, "cancelled")} disabled={actionLoading}>
                  Cancel
                </Button>
                <div className="ml-auto">
                  <Button onClick={() => { exportCSV([selectedOrder]); }}>
                    <Download className="inline mr-2 h-4 w-4" /> Export Order
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// helper UI badge class mapper
function getStatusBadgeClass(status) {
  const s = (status || "").toString().toLowerCase();
  switch (s) {
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "processing":
      return "bg-blue-100 text-blue-800";
    case "shipped":
      return "bg-green-100 text-green-800";
    case "completed":
      return "bg-emerald-100 text-emerald-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-slate-100 text-slate-800";
  }
}
