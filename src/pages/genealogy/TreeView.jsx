// src/pages/genealogy/TreeView.jsx
import React, { useEffect, useState, useCallback, useRef } from "react";

/**
 * TreeView.jsx
 *
 * - Lazy-loads children from /api/genealogy/children?parentId=<id>
 * - Optionally fetch root node from /api/genealogy/root?userId=<rootId>
 * - Provides search by id, export JSON, and print support.
 *
 * Expected API shapes (example):
 * GET /api/genealogy/root?userId=123
 *   -> { ok: true, node: { id, name, sponsorId, placementId, packageName, pv, bv, rank, active } }
 *
 * GET /api/genealogy/children?parentId=123
 *   -> { ok: true, children: [ { id, name, sponsorId, placementId, packageName, pv, bv, rank, active, hasChildren } ] }
 *
 * Adjust endpoints/fields as per your backend.
 */

const PACKAGE_COLORS = {
  silver: "bg-gray-200 text-gray-800",
  gold: "bg-yellow-100 text-yellow-800",
  ruby: "bg-rose-100 text-rose-800",
  none: "bg-gray-50 text-gray-600",
};

function packageBadge(pkg) {
  const key = (pkg || "none").toLowerCase();
  const cls = PACKAGE_COLORS[key] || PACKAGE_COLORS.none;
  return (
    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${cls}`}>
      {pkg || "NoPkg"}
    </span>
  );
}

function NodeRow({ node, depth, onToggle, expanded, loading, onSelect, highlight }) {
  return (
    <div
      className={`flex items-start gap-3 p-2 rounded-md border ${
        highlight ? "border-indigo-500 bg-indigo-50" : "border-gray-100"
      }`}
      style={{ marginLeft: depth * 14 }}
    >
      <div className="flex items-center gap-2 w-48">
        <button
          onClick={() => onToggle(node)}
          className="w-8 h-8 rounded-md flex items-center justify-center border hover:bg-gray-100"
          aria-label={expanded ? "Collapse" : "Expand"}
        >
          {loading ? (
            <svg className="w-4 h-4 animate-spin text-gray-500" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          ) : node.hasChildren ? (
            <span className="text-sm">{expanded ? "−" : "+"}</span>
          ) : (
            <span className="text-sm opacity-40">•</span>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="truncate">
              <div className="text-sm font-medium">
                {node.name || `User ${node.id}`}
                <span className="ml-2 text-xs text-gray-500">#{node.id}</span>
              </div>
              <div className="text-xs text-gray-500 truncate">
                Sponsor: {node.sponsorId || "-"} • Placement: {node.placementId || "-"}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {packageBadge(node.packageName)}
            </div>
          </div>

          <div className="mt-2 flex gap-3 text-xs text-gray-600">
            <div>PV: <span className="font-medium">{node.pv ?? 0}</span></div>
            <div>BV: <span className="font-medium">{node.bv ?? 0}</span></div>
            <div>Rank: <span className="font-medium">{node.rank || "-"}</span></div>
            <div>Status: <span className={`font-medium ${node.active ? "text-green-600" : "text-red-600"}`}>{node.active ? "Active" : "Non-active"}</span></div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <button
          onClick={() => onSelect(node)}
          className="text-xs px-3 py-1 rounded-md border hover:bg-gray-50"
        >
          View
        </button>
      </div>
    </div>
  );
}

export default function TreeView({ rootId }) {
  const [root, setRoot] = useState(null);
  const [childrenMap, setChildrenMap] = useState({}); // parentId -> { loading, error, nodes: [] }
  const [expandedMap, setExpandedMap] = useState({}); // id -> true/false
  const [loadingRoot, setLoadingRoot] = useState(false);
  const [errorRoot, setErrorRoot] = useState("");
  const [selectedNode, setSelectedNode] = useState(null);
  const [searchId, setSearchId] = useState("");
  const [highlightedId, setHighlightedId] = useState(null);
  const treeRef = useRef();

  // utility to fetch root node
  const fetchRoot = useCallback(async (id) => {
    setLoadingRoot(true);
    setErrorRoot("");
    try {
      const q = id ? `?userId=${encodeURIComponent(id)}` : "";
      const res = await fetch(`/api/genealogy/root${q}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to fetch root");
      }
      setRoot(data.node);
    } catch (err) {
      console.error(err);
      setErrorRoot(err.message || "Error loading root");
    } finally {
      setLoadingRoot(false);
    }
  }, []);

  useEffect(() => {
    fetchRoot(rootId);
  }, [rootId, fetchRoot]);

  // fetch children for a parent (lazy)
  const fetchChildren = useCallback(async (parentId) => {
    setChildrenMap((m) => ({ ...m, [parentId]: { ...(m[parentId] || {}), loading: true, error: null } }));
    try {
      const res = await fetch(`/api/genealogy/children?parentId=${encodeURIComponent(parentId)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to load children");
      const nodes = (data.children || []).map((c) => ({
        // normalize keys in case backend uses different names
        id: c.id,
        name: c.name,
        sponsorId: c.sponsorId,
        placementId: c.placementId,
        packageName: c.packageName,
        pv: c.pv,
        bv: c.bv,
        rank: c.rank,
        active: !!c.active,
        hasChildren: !!c.hasChildren,
      }));
      setChildrenMap((m) => ({ ...m, [parentId]: { loading: false, error: null, nodes } }));
    } catch (err) {
      console.error(err);
      setChildrenMap((m) => ({ ...m, [parentId]: { loading: false, error: err.message || "Error", nodes: [] } }));
    }
  }, []);

  // toggle expand/collapse
  const toggleNode = async (node) => {
    const id = node.id;
    const isExpanded = !!expandedMap[id];
    if (isExpanded) {
      setExpandedMap((m) => ({ ...m, [id]: false }));
      return;
    }

    // expanding: fetch children if not loaded
    if (!childrenMap[id]) {
      await fetchChildren(id);
    }
    setExpandedMap((m) => ({ ...m, [id]: true }));
  };

  // build flat render list (preorder) with depth
  const buildRenderList = useCallback(() => {
    const out = [];
    if (!root) return out;
    const stack = [{ node: root, depth: 0 }];
    while (stack.length) {
      const { node, depth } = stack.shift();
      out.push({ node, depth });
      const isExpanded = !!expandedMap[node.id];
      const ch = childrenMap[node.id]?.nodes || [];
      if (isExpanded && ch.length) {
        // append children in order
        for (let i = 0; i < ch.length; i++) {
          stack.splice(i, 0); // noop - maintain FIFO by pushing sequentially
        }
        // simpler: push children at front of queue with proper order
        stack.unshift(...ch.map((c) => ({ node: c, depth: depth + 1 })));
      }
    }
    return out;
    // Note: above logic keeps a breadth-first style; for depth-first use recursion.
  }, [root, childrenMap, expandedMap]);

  // simpler recursive builder to preserve proper tree order
  const buildRenderListRecursive = useCallback(() => {
    const out = [];
    const walk = (n, depth) => {
      out.push({ node: n, depth });
      if (expandedMap[n.id]) {
        const ch = childrenMap[n.id]?.nodes || [];
        for (const c of ch) walk(c, depth + 1);
      }
    };
    if (root) walk(root, 0);
    return out;
  }, [root, childrenMap, expandedMap]);

  // search by id -> expands path to it
  const handleSearch = async (e) => {
    e?.preventDefault?.();
    setHighlightedId(null);
    if (!searchId) return;
    // simple approach: try iterative BFS load until found
    // 1) if root is the id, highlight.
    if (!root) return;
    if (String(root.id) === String(searchId)) {
      setHighlightedId(root.id);
      setExpandedMap({}); // collapse others
      return;
    }

    // BFS queue of parentIds to explore; start with root
    const queue = [root];
    const visited = new Set();
    const parentMap = {}; // childId -> parentId
    let found = null;

    while (queue.length && !found) {
      const current = queue.shift();
      if (visited.has(current.id)) continue;
      visited.add(current.id);

      // ensure children loaded
      if (!childrenMap[current.id]) {
        // fetch synchronously (await) so tree expands properly
        // eslint-disable-next-line no-await-in-loop
        await fetchChildren(current.id);
      }
      const ch = childrenMap[current.id]?.nodes || [];
      for (const c of ch) {
        parentMap[c.id] = current.id;
        if (String(c.id) === String(searchId)) {
          found = c;
          break;
        }
        queue.push(c);
      }
    }

    if (found) {
      // expand path from root to found
      const path = [];
      let cur = found.id;
      while (cur && cur !== root.id) {
        const p = parentMap[cur];
        if (!p) break;
        path.unshift(p);
        cur = p;
      }
      // mark all parents expanded
      const newExpanded = { ...expandedMap };
      for (const p of path) newExpanded[p] = true;
      setExpandedMap(newExpanded);
      setHighlightedId(found.id);
      // scroll into view after short delay
      setTimeout(() => {
        const el = document.querySelector(`[data-node-id="${found.id}"]`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 250);
    } else {
      alert("User not found in currently reachable tree (loaded nodes).");
    }
  };

  // select node - show details in side panel
  const handleSelect = (node) => {
    setSelectedNode(node);
  };

  // export visible tree to JSON (only loaded nodes)
  const exportJson = () => {
    const collect = (n) => {
      const ch = (childrenMap[n.id]?.nodes || []).map(collect);
      return { ...n, children: ch };
    };
    if (!root) return;
    const json = collect(root);
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `genealogy-tree-${root.id || "root"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // small retry root loader
  const retryRoot = () => {
    fetchRoot(rootId);
  };

  // render
  const renderList = buildRenderListRecursive();

  return (
    <div ref={treeRef} className="p-4 min-h-[60vh]">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold">Genealogy Tree</h1>
          <div className="text-sm text-gray-500">View and explore your network</div>
        </div>

        <div className="flex items-center gap-2">
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <input
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="Search ID"
              className="px-3 py-2 border rounded-md text-sm w-32"
            />
            <button type="submit" className="px-3 py-2 rounded-md bg-indigo-600 text-white text-sm">
              Search
            </button>
          </form>

          <button
            onClick={exportJson}
            className="px-3 py-2 rounded-md border text-sm hover:bg-gray-50"
          >
            Export JSON
          </button>

          <button
            onClick={() => window.print()}
            className="px-3 py-2 rounded-md border text-sm hover:bg-gray-50"
          >
            Print
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="col-span-2">
          <div className="bg-white border rounded-lg shadow-sm p-3 min-h-[420px]">
            {loadingRoot ? (
              <div className="flex items-center justify-center p-10">
                <svg className="w-8 h-8 animate-spin text-gray-500" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              </div>
            ) : errorRoot ? (
              <div className="p-6 text-center">
                <div className="text-red-600 mb-2">Error: {errorRoot}</div>
                <button onClick={retryRoot} className="px-4 py-2 bg-indigo-600 text-white rounded-md">
                  Retry
                </button>
              </div>
            ) : !root ? (
              <div className="p-6 text-center text-gray-500">No root user available.</div>
            ) : (
              <div className="space-y-2">
                {/* Render nodes */}
                {renderList.map(({ node, depth }) => (
                  <div key={node.id} data-node-id={node.id}>
                    <NodeRow
                      node={node}
                      depth={depth}
                      onToggle={() => toggleNode(node)}
                      expanded={!!expandedMap[node.id]}
                      loading={childrenMap[node.id]?.loading}
                      onSelect={handleSelect}
                      highlight={String(node.id) === String(highlightedId)}
                    />
                    {childrenMap[node.id]?.error && (
                      <div className="ml-[calc(1rem+14px)] text-xs text-red-600 px-3 py-1">
                        Error loading children: {childrenMap[node.id].error}
                      </div>
                    )}
                  </div>
                ))}

                {/* Empty message when root exists but nothing else */}
                {renderList.length === 1 && (
                  <div className="text-sm text-gray-500 p-4">No downline loaded yet. Expand nodes to load children.</div>
                )}
              </div>
            )}
          </div>
        </div>

        <aside className="col-span-1">
          <div className="bg-white border rounded-lg shadow-sm p-4">
            <h3 className="text-sm font-semibold mb-3">Selected Node</h3>
            {selectedNode ? (
              <div className="text-sm space-y-2">
                <div><strong>Name:</strong> {selectedNode.name || `User ${selectedNode.id}`}</div>
                <div><strong>ID:</strong> {selectedNode.id}</div>
                <div><strong>Package:</strong> {selectedNode.packageName || "-"}</div>
                <div><strong>PV:</strong> {selectedNode.pv ?? 0}</div>
                <div><strong>BV:</strong> {selectedNode.bv ?? 0}</div>
                <div><strong>Rank:</strong> {selectedNode.rank || "-"}</div>
                <div><strong>Sponsor:</strong> {selectedNode.sponsorId || "-"}</div>
                <div><strong>Placement:</strong> {selectedNode.placementId || "-"}</div>

                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => {
                      // quick expand this node
                      setExpandedMap((m) => ({ ...m, [selectedNode.id]: true }));
                      fetchChildren(selectedNode.id);
                    }}
                    className="px-3 py-1 text-sm rounded-md border hover:bg-gray-50"
                  >
                    Load children
                  </button>

                  <button
                    onClick={() => navigator.clipboard?.writeText(JSON.stringify(selectedNode))}
                    className="px-3 py-1 text-sm rounded-md border hover:bg-gray-50"
                  >
                    Copy JSON
                  </button>
                </div>
              </div>
            ) : root ? (
              <div className="text-sm text-gray-500">
                Select a node to view details. Root: <strong>{root.name || `#${root.id}`}</strong>
              </div>
            ) : (
              <div className="text-sm text-gray-500">No selection</div>
            )}
          </div>

          <div className="bg-white border rounded-lg shadow-sm p-4 mt-4">
            <h3 className="text-sm font-semibold mb-3">Legend</h3>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex items-center gap-2"><span className="w-3 h-3 bg-gray-200 rounded-full" /> Silver</div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 bg-yellow-100 rounded-full" /> Gold</div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 bg-rose-100 rounded-full" /> Ruby</div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
