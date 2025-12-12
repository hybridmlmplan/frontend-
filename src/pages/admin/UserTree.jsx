import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { Tree } from "@/components/ui/tree"; // optional: replace if your project uses a different tree component
import { Download, Search, Eye, Plus, ChevronDown, ChevronRight } from "lucide-react";

/**
 * Admin — UserTree (Genealogy)
 * ---------------------------
 * - Shows a collapsible genealogy tree for a given user
 * - Lazy-loads children on expand to avoid fetching entire DB
 * - Search by user id / name and center the tree on that user (requires backend support)
 * - View user details in a dialog
 * - Export visible nodes to CSV
 *
 * Backend endpoints (adjust if needed):
 *  GET  /api/admin/genealogy?userId=&depth=&limit=
 *    -> returns { root: { _id, name, mobile, package, childrenCount }, children: [...] }
 *  GET  /api/admin/users/:id
 *    -> returns full user object
 *  GET  /api/admin/genealogy/node/:id/children
 *    -> returns children array for node (used for lazy load)
 *
 * This component purposely keeps logic self-contained for easy copy/paste into your repo.
 */

const DEFAULT_ROOT = "root"; // default root id or admin id

function getAuthHeaders() {
  const token = localStorage.getItem("token") || "";
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function formatNodeLabel(node) {
  return `${node.name || "-"} (${node._id?.toString?.().slice(0, 6) || "-"}) — ${node.package || node.pkg || "-"}`;
}

export default function UserTree() {
  const [rootId, setRootId] = useState(DEFAULT_ROOT);
  const [treeData, setTreeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);

  // fetch initial root
  useEffect(() => {
    fetchRoot(rootId);
  }, [rootId]);

  async function fetchRoot(id) {
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/admin/genealogy`, { params: { userId: id, depth: 1 }, headers: getAuthHeaders() });
      // Expect shape: { root: {...}, children: [...] }
      const root = data.root || data;
      const children = data.children || [];
      setTreeData({ ...root, children: children.map((c) => ({ ...c, _hasMore: c.childrenCount > 0 })) });
    } catch (err) {
      console.error("fetchRoot", err?.response || err);
      setTreeData(null);
    } finally {
      setLoading(false);
    }
  }

  async function loadChildren(node) {
    // if already loaded, skip
    if (node.children && node.children.length > 0) return node.children;
    try {
      const { data } = await axios.get(`/api/admin/genealogy/node/${node._id}/children`, { headers: getAuthHeaders() });
      const children = data.children || [];
      return children.map((c) => ({ ...c, _hasMore: c.childrenCount > 0 }));
    } catch (err) {
      console.error("loadChildren", err?.response || err);
      return [];
    }
  }

  async function onExpand(nodePath) {
    // nodePath is array of node ids from root to expanded node
    // find the node reference in treeData and load its children
    const id = nodePath[nodePath.length - 1];
    const update = (n) => {
      if (!n) return n;
      if (n._id === id) {
        return { ...n, _loadingChildren: true };
      }
      if (!n.children) return n;
      return { ...n, children: n.children.map((ch) => update(ch)) };
    };

    setTreeData((t) => update(t));

    // load children
    try {
      const node = findNodeById(treeData, id);
      if (!node) return;
      const children = await loadChildren(node);

      const applyChildren = (n) => {
        if (!n) return n;
        if (n._id === id) {
          return { ...n, children, _hasMore: children.length > 0 };
        }
        if (!n.children) return n;
        return { ...n, children: n.children.map((c) => applyChildren(c)) };
      };

      setTreeData((t) => applyChildren(t));
    } catch (err) {
      console.error("onExpand error", err);
    }
  }

  function findNodeById(node, id) {
    if (!node) return null;
    if (node._id === id) return node;
    if (!node.children) return null;
    for (const c of node.children) {
      const r = findNodeById(c, id);
      if (r) return r;
    }
    return null;
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

  function flattenVisibleNodes(node, list = []) {
    if (!node) return list;
    list.push(node);
    if (!node.children) return list;
    for (const c of node.children) flattenVisibleNodes(c, list);
    return list;
  }

  function exportVisibleCSV() {
    const rows = flattenVisibleNodes(treeData, []);
    const header = ["User ID", "Name", "Mobile", "Package", "ChildrenCount", "JoinedAt"];
    const csv = [header.join(",")];
    for (const r of rows) {
      const line = [
        `"${r._id || r.id || "-"}"`,
        `"${(r.name || "-").replace(/"/g, "'")}"`,
        `"${r.mobile || "-"}"`,
        `"${r.package || r.pkg || "-"}"`,
        `${r.childrenCount || 0}`,
        `"${r.createdAt ? new Date(r.createdAt).toLocaleString() : "-"}"`,
      ];
      csv.push(line.join(","));
    }

    const blob = new Blob([csv.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `genealogy_visible_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Simple search: ask backend for path-to-node support
  async function handleSearch() {
    if (!searchQuery) return fetchRoot(rootId);
    setSearching(true);
    try {
      const { data } = await axios.get(`/api/admin/genealogy/search`, { params: { q: searchQuery }, headers: getAuthHeaders() });
      // Expect: { path: [id1, id2, ...], root: {...}, nodes: [...] }
      if (data && data.root) {
        setTreeData({ ...data.root, children: (data.children || []).map((c) => ({ ...c, _hasMore: c.childrenCount > 0 })) });
      } else if (data && data.path && data.nodes) {
        // fallback: set root and then expand path automatically
        setTreeData(data.nodes[0]);
      }
    } catch (err) {
      console.error("handleSearch", err?.response || err);
      alert("Search failed. Ensure backend supports /api/admin/genealogy/search?q=...");
    } finally {
      setSearching(false);
    }
  }

  // render tree recursively using simple elements (so it works even without a Tree component)
  function RenderNode({ node, depth = 0 }) {
    const [expanded, setExpanded] = useState(false);
    const [loadingChildren, setLoadingChildren] = useState(false);

    const onToggle = async () => {
      if (!expanded) {
        // expand: load children
        setLoadingChildren(true);
        await onExpand(getPathToNode(node._id));
        setLoadingChildren(false);
      }
      setExpanded(!expanded);
    };

    const children = node.children || [];

    return (
      <div className="pl-2">
        <div className="flex items-center gap-2 py-1">
          <div className="w-6">
            {node._hasMore || (children && children.length > 0) ? (
              <button onClick={onToggle} className="p-1 rounded hover:bg-slate-100">
                {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            ) : <div className="w-4" />}
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{node.name || "-"}</div>
                <div className="text-xs text-muted-foreground">{node._id} • {node.package || "-"} • children: {node.childrenCount || 0}</div>
              </div>

              <div className="flex gap-2">
                <Button size="sm" onClick={() => openUser(node._id)}><Eye className="h-4 w-4" /></Button>
              </div>
            </div>
          </div>
        </div>

        {expanded && (
          <div className="ml-6">
            {loadingChildren ? (
              <div className="py-2"><Spinner /></div>
            ) : (
              children.length === 0 ? <div className="text-sm text-muted-foreground">No children</div> : children.map((c) => <RenderNode key={c._id} node={c} depth={depth + 1} />)
            )}
          </div>
        )}
      </div>
    );

    function getPathToNode(id) {
      // simple helper to get a path array; here we return id only because onExpand uses last id
      return [id];
    }
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Admin — User Genealogy (Tree)</h1>
        <div className="flex gap-2">
          <Button onClick={() => fetchRoot(rootId)} disabled={loading}><Download className="mr-2 h-4 w-4 inline" /> Reload</Button>
          <Button onClick={exportVisibleCSV}><Download className="mr-2 h-4 w-4 inline" /> Export Visible</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Input placeholder="Root user id (default: root)" value={rootId} onChange={(e) => setRootId(e.target.value)} />

            <div className="flex items-center">
              <Input placeholder="Search by id / name" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              <Button onClick={handleSearch} disabled={searching} className="ml-2"><Search className="h-4 w-4" /></Button>
            </div>

            <div className="col-span-2 flex gap-2">
              <Button onClick={() => { setRootId(DEFAULT_ROOT); fetchRoot(DEFAULT_ROOT); }}>Reset Root</Button>
              <Button onClick={() => { setRootId(window.localStorage.getItem("userId") || DEFAULT_ROOT); fetchRoot(window.localStorage.getItem("userId") || DEFAULT_ROOT); }}>My Tree</Button>
              <Button onClick={() => { setSearchQuery(""); fetchRoot(rootId); }}>Clear Search</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Genealogy</CardTitle>
          </CardHeader>
          <CardContent>
            {loading || !treeData ? (
              <div className="py-12 flex items-center justify-center"><Spinner /></div>
            ) : (
              <div className="max-h-[60vh] overflow-auto">
                <RenderNode node={treeData} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>

          {!selectedUser ? (
            <div className="py-12 flex items-center justify-center"><Spinner /></div>
          ) : (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <h3 className="font-medium">{selectedUser.name}</h3>
                  <div className="text-sm">User ID: <span className="font-mono">{selectedUser._id}</span></div>
                  <div className="text-sm">Mobile: {selectedUser.mobile}</div>
                  <div className="text-sm">Email: {selectedUser.email}</div>
                  <div className="text-sm">Package: {selectedUser.package || selectedUser.pkg}</div>
                </div>
                <div>
                  <h3 className="font-medium">Wallet & Status</h3>
                  <div className="text-sm">Wallet Balance: ₹{selectedUser.wallet || 0}</div>
                  <div className="text-sm">Status: {selectedUser.status}</div>
                  <div className="text-sm">KYC: {selectedUser.kyc?.status || "-"} {selectedUser.kyc?.remark ? `— ${selectedUser.kyc.remark}` : ""}</div>
                </div>
              </div>

              <div className="mt-4">
                <Button onClick={() => { navigator.clipboard.writeText(selectedUser._id || ""); alert("User ID copied to clipboard"); }}>Copy ID</Button>
                <Button variant="ghost" onClick={() => setDialogOpen(false)} className="ml-2">Close</Button>
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
