import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { CheckCircle, XCircle, Download, Eye, DollarSign } from "lucide-react";

/**
 * Admin — Payout Requests Page
 * ----------------------------
 * Features:
 *  - List payout requests with filters & pagination
 *  - Search by request id / user id / name / mobile
 *  - Filter by status (pending, approved, paid, rejected)
 *  - View payout detail in dialog
 *  - Approve / Reject / Mark as Paid actions
 *  - Export visible items to CSV
 *
 * Expected backend endpoints (adjust if different):
 *  GET  /api/admin/payouts?page=&limit=&search=&status=&from=&to=&minAmount=&maxAmount=
 *  GET  /api/admin/payouts/:id
 *  PATCH /api/admin/payouts/:id   (body { status, remark, transactionId })
 *  POST  /api/admin/payouts/bulk    (not implemented here)
 */

const DEFAULT_LIMIT = 20;

export default function PayoutRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");

  const [selectedReq, setSelectedReq] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => fetchRequests(1), 400);
    return () => clearTimeout(t);
  }, [search, statusFilter, fromDate, toDate, minAmount, maxAmount]);

  useEffect(() => {
    fetchRequests(page);
  }, [page]);

  function getAuthHeaders() {
    const token = localStorage.getItem("token") || "";
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async function fetchRequests(p = 1) {
    setLoading(true);
    try {
      const params = { page: p, limit };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;
      if (minAmount) params.minAmount = minAmount;
      if (maxAmount) params.maxAmount = maxAmount;

      const { data } = await axios.get("/api/admin/payouts", { params, headers: getAuthHeaders() });
      setRequests(data.requests || data.items || []);
      setTotal(data.total || data.count || 0);
      setPage(p);
    } catch (err) {
      console.error("fetchRequests", err?.response || err);
    } finally {
      setLoading(false);
    }
  }

  async function openRequest(id) {
    setDialogOpen(true);
    setSelectedReq(null);
    try {
      const { data } = await axios.get(`/api/admin/payouts/${id}`, { headers: getAuthHeaders() });
      setSelectedReq(data.request || data);
    } catch (err) {
      console.error("openRequest", err?.response || err);
      setDialogOpen(false);
    }
  }

  async function updateStatus(id, status, extra = {}) {
    setActionLoading(true);
    try {
      const payload = { status, ...extra };
      const { data } = await axios.patch(`/api/admin/payouts/${id}`, payload, { headers: getAuthHeaders() });
      // Update locally
      setRequests((prev) => prev.map((r) => (r._id === id || r.id === id ? { ...r, ...(data.request || payload) } : r)));
      if (selectedReq && (selectedReq._id === id || selectedReq.id === id)) {
        setSelectedReq((prev) => ({ ...prev, ...(data.request || payload) }));
      }
    } catch (err) {
      console.error("updateStatus", err?.response || err);
    } finally {
      setActionLoading(false);
    }
  }

  function exportCSV(rows) {
    const header = ["Request ID", "User ID", "User Name", "Mobile", "Amount", "Method", "Status", "Requested At", "Remark", "Transaction ID"];
    const csv = [header.join(",")];
    for (const r of rows) {
      const line = [
        `"${r._id || r.id || "-"}"`,
        `"${r.userId || r.user?._id || "-"}"`,
        `"${(r.user?.name || r.userName || "-").replace(/"/g, "'")}"`,
        `"${r.user?.mobile || r.mobile || "-"}"`,
        `${r.amount || 0}`,
        `"${r.method || r.paymentMethod || "-"}"` ,
        `"${r.status || "-"}"`,
        `"${new Date(r.createdAt || r.requestedAt || r.created).toLocaleString()}"`,
        `"${(r.remark || "").replace(/"/g, "'")}"`,
        `"${r.transactionId || r.txn || "-"}"`,
      ];
      csv.push(line.join(","));
    }

    const blob = new Blob([csv.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payouts_export_page_${page}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const totalPages = useMemo(() => Math.ceil(total / limit) || 1, [total, limit]);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Admin — Payout Requests</h1>
        <div className="flex gap-2 items-center">
          <Button onClick={() => fetchRequests(1)} disabled={loading}>Refresh</Button>
          <Button variant="ghost" onClick={() => exportCSV(requests)}>
            <Download className="mr-2 h-4 w-4 inline" /> Export CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <div className="col-span-2">
              <Input placeholder="Search by request id / user id / name / mobile" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="paid">Paid</option>
              <option value="rejected">Rejected</option>
            </Select>

            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />

            <div className="flex gap-2">
              <Input placeholder="Min amount" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} type="number" />
              <Input placeholder="Max amount" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} type="number" />
            </div>

            <div className="flex gap-2">
              <Select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); fetchRequests(1); }}>
                <option value={10}>10 / page</option>
                <option value={20}>20 / page</option>
                <option value={50}>50 / page</option>
              </Select>
              <Button onClick={() => { setSearch(""); setStatusFilter(""); setFromDate(""); setToDate(""); setMinAmount(""); setMaxAmount(""); fetchRequests(1); }}>Clear</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-12 flex items-center justify-center"><Spinner /></div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <THead>
                    <TR>
                      <TH>Request ID</TH>
                      <TH>User</TH>
                      <TH>Amount</TH>
                      <TH>Method</TH>
                      <TH>Status</TH>
                      <TH>Requested At</TH>
                      <TH>Action</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {requests.length === 0 ? (
                      <TR><TD colSpan={7} className="text-center py-8">No payout requests found</TD></TR>
                    ) : (
                      requests.map((r) => (
                        <TR key={r._id || r.id}>
                          <TD className="font-mono text-sm">{r._id || r.id}</TD>
                          <TD>
                            <div className="text-sm font-medium">{r.user?.name || r.userName || "-"}</div>
                            <div className="text-xs text-muted-foreground">{r.user?._id || r.userId} • {r.user?.mobile || r.mobile || "-"}</div>
                          </TD>
                          <TD>₹{r.amount || 0}</TD>
                          <TD>{r.method || r.paymentMethod || "-"}</TD>
                          <TD><span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(r.status)}`}>{r.status}</span></TD>
                          <TD className="text-xs">{new Date(r.createdAt || r.requestedAt || r.created).toLocaleString()}</TD>
                          <TD>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => openRequest(r._id || r.id)}>
                                <Eye className="h-4 w-4" />
                              </Button>

                              {r.status === "pending" && (
                                <>
                                  <Button size="sm" onClick={() => updateStatus(r._id || r.id, "approved")}>
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                  <Button size="sm" variant="destructive" onClick={() => updateStatus(r._id || r.id, "rejected")}>
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </>
                              )}

                              {r.status === "approved" && (
                                <Button size="sm" onClick={() => updateStatus(r._id || r.id, "paid", { transactionId: `txn_${Date.now()}` })}>
                                  <DollarSign className="h-4 w-4" />
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
              <div>Showing page {page} of {totalPages} — {total} requests</div>
              <div className="flex gap-2 items-center">
                <Button onClick={() => fetchRequests(1)} disabled={page === 1}>First</Button>
                <Button onClick={() => fetchRequests(Math.max(1, page - 1))} disabled={page === 1}>Prev</Button>
                <div>Page</div>
                <Input value={page} onChange={(e) => setPage(Number(e.target.value || 1))} className="w-20" />
                <Button onClick={() => fetchRequests(page)}>Go</Button>
                <Button onClick={() => fetchRequests(Math.min(totalPages, page + 1))} disabled={page === totalPages}>Next</Button>
                <Button onClick={() => fetchRequests(totalPages)} disabled={page === totalPages}>Last</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detail dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payout Request Details</DialogTitle>
          </DialogHeader>

          {!selectedReq ? (
            <div className="py-8 flex items-center justify-center"><Spinner /></div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <h3 className="font-medium">Request</h3>
                  <div className="text-sm">ID: <span className="font-mono">{selectedReq._id}</span></div>
                  <div className="text-sm">Amount: ₹{selectedReq.amount}</div>
                  <div className="text-sm">Method: {selectedReq.method || selectedReq.paymentMethod}</div>
                  <div className="text-sm">Status: {selectedReq.status}</div>
                  <div className="text-sm">Requested: {new Date(selectedReq.createdAt || selectedReq.requestedAt || selectedReq.created).toLocaleString()}</div>
                </div>

                <div>
                  <h3 className="font-medium">User</h3>
                  <div className="text-sm">Name: {selectedReq.user?.name || selectedReq.userName}</div>
                  <div className="text-sm">User ID: {selectedReq.user?._id || selectedReq.userId}</div>
                  <div className="text-sm">Mobile: {selectedReq.user?.mobile || selectedReq.mobile}</div>
                  <div className="text-sm">Wallet Balance: ₹{selectedReq.user?.wallet || selectedReq.wallet || 0}</div>
                </div>
              </div>

              <div className="flex gap-2">
                {selectedReq.status === "pending" && (
                  <>
                    <Button onClick={() => updateStatus(selectedReq._id || selectedReq.id, "approved")} disabled={actionLoading}>Approve</Button>
                    <Button variant="destructive" onClick={() => updateStatus(selectedReq._id || selectedReq.id, "rejected")} disabled={actionLoading}>Reject</Button>
                  </>
                )}

                {selectedReq.status === "approved" && (
                  <Button onClick={() => updateStatus(selectedReq._id || selectedReq.id, "paid", { transactionId: `txn_${Date.now()}` })} disabled={actionLoading}>Mark Paid</Button>
                )}

                <div className="ml-auto">
                  <Button variant="ghost" onClick={() => exportCSV([selectedReq])}><Download className="mr-2 h-4 w-4 inline" /> Export</Button>
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

function getStatusBadgeClass(status) {
  const s = (status || "").toLowerCase();
  switch (s) {
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "approved":
      return "bg-blue-100 text-blue-800";
    case "paid":
      return "bg-green-100 text-green-800";
    case "rejected":
      return "bg-red-100 text-red-800";
    default:
      return "bg-slate-100 text-slate-800";
  }
}
