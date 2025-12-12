import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Eye, Edit, UserPlus, Download, Lock, Unlock, Trash } from "lucide-react";

/**
 * Admin — User List
 * -----------------
 * - List users with pagination
 * - Filters: search (name/id/mobile), package (silver/gold/ruby), status (active/blocked), kyc status
 * - View user details / wallet / KYC
 * - Edit user basic fields and KYC remark
 * - Quick actions: block/unblock, reset password, delete
 * - Export visible users to CSV
 *
 * Expected endpoints:
 *  GET  /api/admin/users?page=&limit=&search=&package=&status=&kyc=
 *  GET  /api/admin/users/:id
 *  PATCH /api/admin/users/:id
 *  POST  /api/admin/users/:id/reset-password  (optional)
 *  DELETE /api/admin/users/:id
 */

const DEFAULT_LIMIT = 25;

const emptyUser = {
  name: "",
  mobile: "",
  email: "",
  package: "",
  sponsorId: "",
  placementId: "",
  status: "active",
  kyc: { status: "pending", remark: "" },
  wallet: 0,
};

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState("");
  const [packageFilter, setPackageFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [kycFilter, setKycFilter] = useState("");

  const [selectedUser, setSelectedUser] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => fetchUsers(1), 400);
    return () => clearTimeout(t);
  }, [search, packageFilter, statusFilter, kycFilter]);

  useEffect(() => {
    fetchUsers(page);
  }, [page]);

  function getAuthHeaders() {
    const token = localStorage.getItem("token") || "";
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async function fetchUsers(p = 1) {
    setLoading(true);
    try {
      const params = { page: p, limit };
      if (search) params.search = search;
      if (packageFilter) params.package = packageFilter;
      if (statusFilter) params.status = statusFilter;
      if (kycFilter) params.kyc = kycFilter;

      const { data } = await axios.get("/api/admin/users", { params, headers: getAuthHeaders() });
      setUsers(data.users || data.items || []);
      setTotal(data.total || data.count || 0);
      setPage(p);
    } catch (err) {
      console.error("fetchUsers", err?.response || err);
    } finally {
      setLoading(false);
    }
  }

  async function openUser(id) {
    setDialogOpen(true);
    setSelectedUser(null);
    try {
      const { data } = await axios.get(`/api/admin/users/${id}`, { headers: getAuthHeaders() });
      setSelectedUser(data.user || data);
    } catch (err) {
      console.error("openUser", err?.response || err);
      setDialogOpen(false);
    }
  }

  async function saveUser(payload) {
    setActionLoading(true);
    try {
      const id = payload._id || payload.id;
      const { data } = await axios.patch(`/api/admin/users/${id}`, payload, { headers: getAuthHeaders() });
      setUsers((prev) => prev.map((u) => (u._id === id || u.id === id ? (data.user || payload) : u)));
      setSelectedUser(data.user || payload);
    } catch (err) {
      console.error("saveUser", err?.response || err);
      alert("Save failed. See console.");
    } finally {
      setActionLoading(false);
    }
  }

  async function toggleBlock(id, block) {
    setActionLoading(true);
    try {
      const { data } = await axios.patch(`/api/admin/users/${id}`, { status: block ? "blocked" : "active" }, { headers: getAuthHeaders() });
      setUsers((prev) => prev.map((u) => (u._id === id || u.id === id ? (data.user || { ...u, status: block ? "blocked" : "active" }) : u)));
      if (selectedUser && (selectedUser._id === id || selectedUser.id === id)) setSelectedUser((s) => ({ ...s, status: block ? "blocked" : "active" }));
    } catch (err) {
      console.error("toggleBlock", err?.response || err);
    } finally {
      setActionLoading(false);
    }
  }

  async function resetPassword(id) {
    if (!confirm("Reset password for this user? A temporary password will be generated.")) return;
    setActionLoading(true);
    try {
      await axios.post(`/api/admin/users/${id}/reset-password`, {}, { headers: getAuthHeaders() });
      alert("Password reset requested. User will receive temporary password as per backend flow.");
    } catch (err) {
      console.error("resetPassword", err?.response || err);
      alert("Reset failed. See console.");
    } finally {
      setActionLoading(false);
    }
  }

  async function deleteUser(id) {
    if (!confirm("Delete user? This action cannot be undone.")) return;
    setActionLoading(true);
    try {
      await axios.delete(`/api/admin/users/${id}`, { headers: getAuthHeaders() });
      setUsers((prev) => prev.filter((u) => u._id !== id && u.id !== id));
    } catch (err) {
      console.error("deleteUser", err?.response || err);
      alert("Delete failed. See console.");
    } finally {
      setActionLoading(false);
    }
  }

  function exportCSV(rows) {
    const header = ["User ID", "Name", "Mobile", "Email", "Package", "Sponsor", "Placement", "Status", "KYC", "Wallet", "CreatedAt"];
    const csv = [header.join(",")];
    for (const u of rows) {
      const line = [
        `"${u._id || u.id || "-"}"`,
        `"${(u.name || "-").replace(/"/g, "'")}"`,
        `"${u.mobile || "-"}"`,
        `"${u.email || "-"}"`,
        `"${u.package || u.pkg || "-"}"`,
        `"${u.sponsorId || u.sponser || "-"}"`,
        `"${u.placementId || u.placement || "-"}"`,
        `"${u.status || "-"}"`,
        `"${(u.kyc?.status || "-")}"`,
        `${u.wallet || 0}`,
        `"${new Date(u.createdAt || u.created).toLocaleString()}"`,
      ];
      csv.push(line.join(","));
    }

    const blob = new Blob([csv.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users_export_page_${page}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const totalPages = useMemo(() => Math.ceil(total / limit) || 1, [total, limit]);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Admin — Users</h1>
        <div className="flex gap-2 items-center">
          <Button onClick={() => fetchUsers(1)} disabled={loading}>Refresh</Button>
          <Button variant="ghost" onClick={() => exportCSV(users)}>
            <Download className="mr-2 h-4 w-4 inline" /> Export CSV
          </Button>
          <Button onClick={() => { setSelectedUser(emptyUser); setDialogOpen(true); }}>
            <UserPlus className="mr-2 h-4 w-4 inline" /> New User
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <Input placeholder="Search by id / name / mobile" value={search} onChange={(e) => setSearch(e.target.value)} />

            <Select value={packageFilter} onChange={(e) => setPackageFilter(e.target.value)}>
              <option value="">All Packages</option>
              <option value="silver">Silver</option>
              <option value="gold">Gold</option>
              <option value="ruby">Ruby</option>
            </Select>

            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">Any Status</option>
              <option value="active">Active</option>
              <option value="blocked">Blocked</option>
            </Select>

            <Select value={kycFilter} onChange={(e) => setKycFilter(e.target.value)}>
              <option value="">Any KYC</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </Select>

            <div className="flex gap-2">
              <Select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); fetchUsers(1); }}>
                <option value={10}>10 / page</option>
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
              </Select>
              <Button onClick={() => { setSearch(""); setPackageFilter(""); setStatusFilter(""); setKycFilter(""); fetchUsers(1); }}>Clear</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>User Directory</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-12 flex items-center justify-center"><Spinner /></div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <THead>
                    <TR>
                      <TH>User</TH>
                      <TH>Package</TH>
                      <TH>KYC</TH>
                      <TH>Wallet</TH>
                      <TH>Status</TH>
                      <TH>Joined</TH>
                      <TH>Action</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {users.length === 0 ? (
                      <TR><TD colSpan={7} className="text-center py-8">No users found</TD></TR>
                    ) : (
                      users.map((u) => (
                        <TR key={u._id || u.id}>
                          <TD>
                            <div className="text-sm font-medium">{u.name || "-"}</div>
                            <div className="text-xs text-muted-foreground">{u._id || u.id} • {u.mobile || "-"}</div>
                          </TD>
                          <TD className="uppercase">{u.package || u.pkg || "-"}</TD>
                          <TD className="text-xs">{u.kyc?.status || "-"}{u.kyc?.remark ? ` — ${u.kyc.remark}` : ""}</TD>
                          <TD>₹{u.wallet || 0}</TD>
                          <TD><span className={`px-2 py-1 rounded-full text-xs ${u.status === "blocked" ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"}`}>{u.status}</span></TD>
                          <TD className="text-xs">{new Date(u.createdAt || u.created).toLocaleString()}</TD>
                          <TD>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => openUser(u._id || u.id)}><Eye className="h-4 w-4" /></Button>
                              <Button size="sm" onClick={() => { setSelectedUser(u); setDialogOpen(true); }}><Edit className="h-4 w-4" /></Button>
                              {u.status === "blocked" ? (
                                <Button size="sm" onClick={() => toggleBlock(u._id || u.id, false)}><Unlock className="h-4 w-4" /></Button>
                              ) : (
                                <Button size="sm" variant="destructive" onClick={() => toggleBlock(u._id || u.id, true)}><Lock className="h-4 w-4" /></Button>
                              )}
                              <Button size="sm" onClick={() => resetPassword(u._id || u.id)}><Download className="h-4 w-4" /></Button>
                              <Button size="sm" variant="destructive" onClick={() => deleteUser(u._id || u.id)}><Trash className="h-4 w-4" /></Button>
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
              <div>Showing page {page} of {totalPages} — {total} users</div>
              <div className="flex gap-2 items-center">
                <Button onClick={() => fetchUsers(1)} disabled={page === 1}>First</Button>
                <Button onClick={() => fetchUsers(Math.max(1, page - 1))} disabled={page === 1}>Prev</Button>
                <div>Page</div>
                <Input value={page} onChange={(e) => setPage(Number(e.target.value || 1))} className="w-20" />
                <Button onClick={() => fetchUsers(page)}>Go</Button>
                <Button onClick={() => fetchUsers(Math.min(totalPages, page + 1))} disabled={page === totalPages}>Next</Button>
                <Button onClick={() => fetchUsers(totalPages)} disabled={page === totalPages}>Last</Button>
              </div>
            </div>

          </CardContent>
        </Card>
      </div>

      {/* User dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedUser && (selectedUser._id || selectedUser.id) ? "Edit User" : "New User"}</DialogTitle>
          </DialogHeader>

          {!selectedUser ? (
            <div className="py-8 flex items-center justify-center"><Spinner /></div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <Input value={selectedUser.name} placeholder="Name" onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })} />
                <Input value={selectedUser.mobile} placeholder="Mobile" onChange={(e) => setSelectedUser({ ...selectedUser, mobile: e.target.value })} />
                <Input value={selectedUser.email} placeholder="Email" onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })} />
                <Select value={selectedUser.package} onChange={(e) => setSelectedUser({ ...selectedUser, package: e.target.value })}>
                  <option value="">Select package</option>
                  <option value="silver">Silver</option>
                  <option value="gold">Gold</option>
                  <option value="ruby">Ruby</option>
                </Select>
                <Input value={selectedUser.sponsorId} placeholder="Sponsor ID" onChange={(e) => setSelectedUser({ ...selectedUser, sponsorId: e.target.value })} />
                <Input value={selectedUser.placementId} placeholder="Placement ID" onChange={(e) => setSelectedUser({ ...selectedUser, placementId: e.target.value })} />
                <Input type="number" value={selectedUser.wallet || 0} placeholder="Wallet" onChange={(e) => setSelectedUser({ ...selectedUser, wallet: Number(e.target.value || 0) })} />
                <Select value={selectedUser.status} onChange={(e) => setSelectedUser({ ...selectedUser, status: e.target.value })}>
                  <option value="active">Active</option>
                  <option value="blocked">Blocked</option>
                </Select>
              </div>

              <div>
                <label className="text-sm">KYC Status</label>
                <Select value={selectedUser.kyc?.status || "pending"} onChange={(e) => setSelectedUser({ ...selectedUser, kyc: { ...(selectedUser.kyc || {}), status: e.target.value } })}>
                  <option value="pending">Pending</option>
                  <option value="verified">Verified</option>
                  <option value="rejected">Rejected</option>
                </Select>
                <Input value={selectedUser.kyc?.remark || ""} placeholder="KYC remark" onChange={(e) => setSelectedUser({ ...selectedUser, kyc: { ...(selectedUser.kyc || {}), remark: e.target.value } })} />
              </div>

              <div className="flex gap-2">
                <Button onClick={() => {
                  // create or update
                  if (selectedUser._id || selectedUser.id) saveUser(selectedUser);
                  else saveUser(selectedUser);
                }} disabled={actionLoading}>{selectedUser._id || selectedUser.id ? "Save" : "Create"}</Button>
                <Button variant="ghost" onClick={() => { setDialogOpen(false); setSelectedUser(null); }}>Cancel</Button>
                <div className="ml-auto">
                  {selectedUser._id && <Button variant="destructive" onClick={() => deleteUser(selectedUser._id)} disabled={actionLoading}>Delete</Button>}
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
