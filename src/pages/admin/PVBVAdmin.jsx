import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Edit, Download, PlusCircle, Search } from "lucide-react";

/**
 * Admin — PV / BV Management Page
 * --------------------------------
 * Responsibilities:
 *  - Show PV/BV ledger entries with pagination
 *  - Filter by type (PV or BV), user, date range and package
 *  - Search by user id / name / mobile
 *  - Edit specific ledger entry (adjust points or remark)
 *  - Bulk adjust (credit/debit) via admin action
 *  - Export visible entries to CSV
 *
 * Expected backend endpoints (adjust to your API):
 *  GET  /api/admin/pv-bv?page=&limit=&search=&type=&package=&from=&to=
 *  GET  /api/admin/pv-bv/:id
 *  PATCH /api/admin/pv-bv/:id   (body { amount, type, remark })
 *  POST  /api/admin/pv-bv/bulk  (body { entries: [{ userId, amount, type, remark }] })
 *
 * Use localStorage token or change getAuthHeaders() to match your auth.
 */

const DEFAULT_LIMIT = 25;

export default function PVBVAdmin() {
  const [ledgers, setLedgers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState(""); // pv | bv | ""
  const [packageFilter, setPackageFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [selectedLedger, setSelectedLedger] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkEntries, setBulkEntries] = useState("userId,amount,type,remark\n");

  useEffect(() => {
    const t = setTimeout(() => fetchLedgers(1), 400);
    return () => clearTimeout(t);
  }, [search, typeFilter, packageFilter, fromDate, toDate]);

  useEffect(() => {
    fetchLedgers(page);
  }, [page]);

  function getAuthHeaders() {
    const token = localStorage.getItem("token") || "";
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async function fetchLedgers(p = 1) {
    setLoading(true);
    try {
      const params = { page: p, limit };
      if (search) params.search = search;
      if (typeFilter) params.type = typeFilter;
      if (packageFilter) params.package = packageFilter;
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;

      const { data } = await axios.get("/api/admin/pv-bv", { params, headers: getAuthHeaders() });
      setLedgers(data.entries || []);
      setTotal(data.total || 0);
      setPage(p);
    } catch (err) {
      console.error("fetchLedgers", err?.response || err);
    } finally {
      setLoading(false);
    }
  }

  async function openLedger(id) {
    setDialogOpen(true);
    setSelectedLedger(null);
    try {
      const { data } = await axios.get(`/api/admin/pv-bv/${id}`, { headers: getAuthHeaders() });
      setSelectedLedger(data.entry || data);
    } catch (err) {
      console.error("openLedger", err?.response || err);
      setDialogOpen(false);
    }
  }

  async function saveLedgerPatch(id, payload) {
    setActionLoading(true);
    try {
      const { data } = await axios.patch(`/api/admin/pv-bv/${id}`, payload, { headers: getAuthHeaders() });
      // update locally
      setLedgers((prev) => prev.map((e) => (e._id === id ? { ...e, ...data.entry } : e)));
      setSelectedLedger(data.entry || { ...selectedLedger, ...payload });
    } catch (err) {
      console.error("saveLedgerPatch", err?.response || err);
    } finally {
      setActionLoading(false);
    }
  }

  async function submitBulkAdjust() {
    /*
      Expect CSV-like lines: userId,amount,type,remark
      Example line: 6312ab... , 100 , pv , "test credit"
    */
    setActionLoading(true);
    try {
      const lines = bulkEntries.split(/\n/).map((l) => l.trim()).filter(Boolean);
      const entries = lines.map((ln) => {
        const parts = ln.split(",").map((p) => p.trim());
        return { userId: parts[0], amount: Number(parts[1] || 0), type: (parts[2] || "pv").toLowerCase(), remark: parts.slice(3).join(",") };
      });
      const { data } = await axios.post("/api/admin/pv-bv/bulk", { entries }, { headers: getAuthHeaders() });
      // After bulk succeed, refresh
      fetchLedgers(1);
      setBulkOpen(false);
      setBulkEntries("userId,amount,type,remark\n");
    } catch (err) {
      console.error("submitBulkAdjust", err?.response || err);
    } finally {
      setActionLoading(false);
    }
  }

  function exportCSV(rows) {
    const header = ["Entry ID", "User ID", "User Name", "Mobile", "Type", "Amount", "Package", "Remark", "Created At"];
    const csv = [header.join(",")];
    for (const r of rows) {
      const line = [
        `"${r._id || r.id || "-"}"`,
        `"${r.userId || r.user?._id || "-"}"`,
        `"${(r.user?.name || r.userName || "-").replace(/"/g, "'")}"`,
        `"${r.user?.mobile || r.mobile || "-"}"`,
        `"${(r.type || "").toUpperCase()}"`,
        `${r.amount || 0}`,
        `"${r.package || r.pkg || "-"}"`,
        `"${(r.remark || "").replace(/"/g, "'")}"`,
        `"${new Date(r.createdAt || r.created).toLocaleString()}"`,
      ];
      csv.push(line.join(","));
    }

    const blob = new Blob([csv.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pvbv_export_page_${page}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const totalPages = useMemo(() => Math.ceil(total / limit) || 1, [total, limit]);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Admin — PV / BV Ledger</h1>
        <div className="flex gap-2 items-center">
          <Button onClick={() => fetchLedgers(1)} disabled={loading}>Refresh</Button>
          <Button variant="ghost" onClick={() => exportCSV(ledgers)}>
            <Download className="mr-2 h-4 w-4 inline" /> Export CSV
          </Button>
          <Button onClick={() => setBulkOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4 inline" /> Bulk Adjust
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
              <div className="relative">
                <Input placeholder="Search by user id / name / mobile" value={search} onChange={(e) => setSearch(e.target.value)} />
                <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="">All Types</option>
              <option value="pv">PV</option>
              <option value="bv">BV</option>
            </Select>

            <Select value={packageFilter} onChange={(e) => setPackageFilter(e.target.value)}>
              <option value="">All Packages</option>
              <option value="silver">Silver</option>
              <option value="gold">Gold</option>
              <option value="ruby">Ruby</option>
            </Select>

            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />

            <div className="flex gap-2">
              <Select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); fetchLedgers(1); }}>
                <option value={10}>10 / page</option>
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
                <option value={100}>100 / page</option>
              </Select>
              <Button onClick={() => { setSearch(""); setTypeFilter(""); setPackageFilter(""); setFromDate(""); setToDate(""); fetchLedgers(1); }}>Clear</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Ledger Entries</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-12 flex items-center justify-center"><Spinner /></div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <THead>
                    <TR>
                      <TH>Entry ID</TH>
                      <TH>User</TH>
                      <TH>Type</TH>
                      <TH>Amount</TH>
                      <TH>Package</TH>
                      <TH>Remark</TH>
                      <TH>Created</TH>
                      <TH>Action</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {ledgers.length === 0 ? (
                      <TR><TD colSpan={8} className="text-center py-8">No entries found</TD></TR>
                    ) : (
                      ledgers.map((e) => (
                        <TR key={e._id || e.id}>
                          <TD className="font-mono text-sm">{e._id || e.id}</TD>
                          <TD>
                            <div className="text-sm font-medium">{e.user?.name || e.userName || "-"}</div>
                            <div className="text-xs text-muted-foreground">{e.user?._id || e.userId} • {e.user?.mobile || e.mobile || "-"}</div>
                          </TD>
                          <TD className="uppercase">{(e.type || "").toString()}</TD>
                          <TD>₹{e.amount || 0}</TD>
                          <TD className="uppercase">{e.package || e.pkg || "-"}</TD>
                          <TD className="max-w-sm truncate">{e.remark || "-"}</TD>
                          <TD className="text-xs">{new Date(e.createdAt || e.created).toLocaleString()}</TD>
                          <TD>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => openLedger(e._id || e.id)}>
                                <Edit className="h-4 w-4" />
                              </Button>
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
              <div>Showing page {page} of {totalPages} — {total} entries</div>
              <div className="flex gap-2 items-center">
                <Button onClick={() => fetchLedgers(1)} disabled={page === 1}>First</Button>
                <Button onClick={() => fetchLedgers(Math.max(1, page - 1))} disabled={page === 1}>Prev</Button>
                <div>Page</div>
                <Input value={page} onChange={(e) => setPage(Number(e.target.value || 1))} className="w-20" />
                <Button onClick={() => fetchLedgers(page)}>Go</Button>
                <Button onClick={() => fetchLedgers(Math.min(totalPages, page + 1))} disabled={page === totalPages}>Next</Button>
                <Button onClick={() => fetchLedgers(totalPages)} disabled={page === totalPages}>Last</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Ledger Entry</DialogTitle>
          </DialogHeader>

          {!selectedLedger ? (
            <div className="py-8 flex items-center justify-center"><Spinner /></div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <Input value={selectedLedger.user?.name || selectedLedger.userName || "-"} disabled />
                <Input value={selectedLedger.user?._id || selectedLedger.userId || "-"} disabled />
                <Input value={selectedLedger.type || "pv"} onChange={(e) => setSelectedLedger({ ...selectedLedger, type: e.target.value })} />
                <Input value={selectedLedger.amount || 0} type="number" onChange={(e) => setSelectedLedger({ ...selectedLedger, amount: Number(e.target.value) })} />
              </div>
              <Input value={selectedLedger.package || selectedLedger.pkg || ""} onChange={(e) => setSelectedLedger({ ...selectedLedger, package: e.target.value })} placeholder="package (silver/gold/ruby)" />
              <Input value={selectedLedger.remark || ""} onChange={(e) => setSelectedLedger({ ...selectedLedger, remark: e.target.value })} placeholder="remark" />

              <div className="flex gap-2">
                <Button onClick={() => saveLedgerPatch(selectedLedger._id || selectedLedger.id, { amount: selectedLedger.amount, type: selectedLedger.type, package: selectedLedger.package, remark: selectedLedger.remark })} disabled={actionLoading}>
                  Save
                </Button>
                <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk dialog */}
      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Adjust — CSV lines</DialogTitle>
          </DialogHeader>

          <div>
            <div className="text-sm mb-2">Paste CSV lines: <code>userId,amount,type,remark</code></div>
            <textarea className="w-full h-48 p-2 border rounded" value={bulkEntries} onChange={(e) => setBulkEntries(e.target.value)} />

            <div className="flex gap-2 mt-3">
              <Button onClick={submitBulkAdjust} disabled={actionLoading}>Submit</Button>
              <Button variant="ghost" onClick={() => setBulkOpen(false)}>Cancel</Button>
            </div>
          </div>

          <DialogFooter />
        </DialogContent>
      </Dialog>
    </div>
  );
}
