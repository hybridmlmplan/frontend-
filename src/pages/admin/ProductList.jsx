import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Edit, Trash, Plus, Download, Upload, Eye } from "lucide-react";

/**
 * Admin — Product List Page
 * -------------------------
 * - CRUD for products used in the system (repurchase / BV eligible products)
 * - Filters: search, category/package (silver/gold/ruby), inStock
 * - Quick actions: enable/disable, delete
 * - Export visible list to CSV
 * - Import JSON/CSV (basic) — backend should accept bulk import
 *
 * Expected endpoints (adjust if needed):
 *  GET  /api/admin/products?page=&limit=&search=&package=&inStock=
 *  GET  /api/admin/products/:id
 *  POST /api/admin/products      (body product)
 *  PATCH /api/admin/products/:id
 *  DELETE /api/admin/products/:id
 *  POST /api/admin/products/bulk (body { items: [...] })
 */

const DEFAULT_LIMIT = 20;

const emptyProduct = {
  title: "",
  sku: "",
  package: "", // silver|gold|ruby or product category
  price: 0,
  pv: 0,
  bv: 0,
  stock: 0,
  active: true,
  description: "",
  image: "",
};

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState("");
  const [packageFilter, setPackageFilter] = useState("");
  const [inStockFilter, setInStockFilter] = useState("");

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("[");

  useEffect(() => {
    const t = setTimeout(() => fetchProducts(1), 400);
    return () => clearTimeout(t);
  }, [search, packageFilter, inStockFilter]);

  useEffect(() => {
    fetchProducts(page);
  }, [page]);

  function getAuthHeaders() {
    const token = localStorage.getItem("token") || "";
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async function fetchProducts(p = 1) {
    setLoading(true);
    try {
      const params = { page: p, limit };
      if (search) params.search = search;
      if (packageFilter) params.package = packageFilter;
      if (inStockFilter) params.inStock = inStockFilter;

      const { data } = await axios.get("/api/admin/products", { params, headers: getAuthHeaders() });
      setProducts(data.products || data.items || []);
      setTotal(data.total || data.count || 0);
      setPage(p);
    } catch (err) {
      console.error("fetchProducts", err?.response || err);
    } finally {
      setLoading(false);
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

  async function openProduct(id) {
    setDialogOpen(true);
    setSelectedProduct(null);
    try {
      const { data } = await axios.get(`/api/admin/products/${id}`, { headers: getAuthHeaders() });
      setSelectedProduct(data.product || data);
    } catch (err) {
      console.error("openProduct", err?.response || err);
      setDialogOpen(false);
    }
  }

  async function saveProduct(payload) {
    setActionLoading(true);
    try {
      if (payload._id || payload.id) {
        const id = payload._id || payload.id;
        const { data } = await axios.patch(`/api/admin/products/${id}`, payload, { headers: getAuthHeaders() });
        setProducts((prev) => prev.map((p) => (p._id === id || p.id === id ? (data.product || payload) : p)));
        setSelectedProduct(data.product || payload);
      } else {
        const { data } = await axios.post(`/api/admin/products`, payload, { headers: getAuthHeaders() });
        // Insert at top
        setProducts((prev) => [data.product || payload, ...prev]);
        setSelectedProduct(data.product || payload);
      }
    } catch (err) {
      console.error("saveProduct", err?.response || err);
      alert("Save failed. Check console for details.");
    } finally {
      setActionLoading(false);
    }
  }

  async function deleteProduct(id) {
    if (!confirm("Delete this product? This action cannot be undone.")) return;
    setActionLoading(true);
    try {
      await axios.delete(`/api/admin/products/${id}`, { headers: getAuthHeaders() });
      setProducts((prev) => prev.filter((p) => p._id !== id && p.id !== id));
    } catch (err) {
      console.error("deleteProduct", err?.response || err);
      alert("Delete failed. Check console.");
    } finally {
      setActionLoading(false);
    }
  }

  function exportCSV(rows) {
    const header = ["Product ID", "Title", "SKU", "Package", "Price", "PV", "BV", "Stock", "Active", "CreatedAt"];
    const csv = [header.join(",")];
    for (const r of rows) {
      const line = [
        `"${r._id || r.id || "-"}"`,
        `"${(r.title || "-").replace(/"/g, "'")}"`,
        `"${r.sku || "-"}"`,
        `"${r.package || r.pkg || "-"}"`,
        `${r.price || 0}`,
        `${r.pv || 0}`,
        `${r.bv || 0}`,
        `${r.stock || 0}`,
        `${r.active ? "YES" : "NO"}`,
        `"${formatDate(r.createdAt || r.created)}"`,
      ];
      csv.push(line.join(","));
    }

    const blob = new Blob([csv.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `products_export_page_${page}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importJSON() {
    setActionLoading(true);
    try {
      const parsed = JSON.parse(importText);
      if (!Array.isArray(parsed)) throw new Error("Import JSON must be an array of products");
      await axios.post(`/api/admin/products/bulk`, { items: parsed }, { headers: getAuthHeaders() });
      setImportOpen(false);
      setImportText("[");
      fetchProducts(1);
    } catch (err) {
      console.error("importJSON", err?.response || err);
      alert("Import failed. Ensure valid JSON array and check console.");
    } finally {
      setActionLoading(false);
    }
  }

  const totalPages = useMemo(() => Math.ceil(total / limit) || 1, [total, limit]);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Admin — Products</h1>
        <div className="flex gap-2 items-center">
          <Button onClick={() => fetchProducts(1)} disabled={loading}>Refresh</Button>
          <Button variant="ghost" onClick={() => exportCSV(products)}>
            <Download className="mr-2 h-4 w-4 inline" /> Export CSV
          </Button>
          <Button onClick={() => setImportOpen(true)}>
            <Upload className="mr-2 h-4 w-4 inline" /> Import JSON
          </Button>
          <Button onClick={() => { setSelectedProduct(emptyProduct); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4 inline" /> New Product
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Input placeholder="Search by title / sku / id" value={search} onChange={(e) => setSearch(e.target.value)} />

            <Select value={packageFilter} onChange={(e) => setPackageFilter(e.target.value)}>
              <option value="">All Packages</option>
              <option value="silver">Silver</option>
              <option value="gold">Gold</option>
              <option value="ruby">Ruby</option>
            </Select>

            <Select value={inStockFilter} onChange={(e) => setInStockFilter(e.target.value)}>
              <option value="">All Stock</option>
              <option value="in">In Stock</option>
              <option value="out">Out of Stock</option>
            </Select>

            <div className="flex gap-2">
              <Select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); fetchProducts(1); }}>
                <option value={10}>10 / page</option>
                <option value={20}>20 / page</option>
                <option value={50}>50 / page</option>
              </Select>
              <Button onClick={() => { setSearch(""); setPackageFilter(""); setInStockFilter(""); fetchProducts(1); }}>Clear</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Product Catalog</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-12 flex items-center justify-center"><Spinner /></div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <THead>
                    <TR>
                      <TH>Product</TH>
                      <TH>Package</TH>
                      <TH>Price</TH>
                      <TH>PV / BV</TH>
                      <TH>Stock</TH>
                      <TH>Active</TH>
                      <TH>Created</TH>
                      <TH>Action</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {products.length === 0 ? (
                      <TR><TD colSpan={8} className="text-center py-8">No products found</TD></TR>
                    ) : (
                      products.map((p) => (
                        <TR key={p._id || p.id}>
                          <TD>
                            <div className="flex items-center gap-3">
                              {p.image ? <img src={p.image} alt={p.title} className="w-12 h-12 object-cover rounded" /> : <div className="w-12 h-12 bg-slate-100 rounded flex items-center justify-center text-xs">No Img</div>}
                              <div>
                                <div className="font-medium">{p.title}</div>
                                <div className="text-xs text-muted-foreground">{p.sku || "-"}</div>
                              </div>
                            </div>
                          </TD>
                          <TD className="uppercase">{p.package || p.pkg || "-"}</TD>
                          <TD>₹{p.price || 0}</TD>
                          <TD>{p.pv || 0} / {p.bv || 0}</TD>
                          <TD>{p.stock || 0}</TD>
                          <TD>{p.active ? "Yes" : "No"}</TD>
                          <TD className="text-xs">{formatDate(p.createdAt || p.created)}</TD>
                          <TD>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => openProduct(p._id || p.id)}><Eye className="h-4 w-4" /></Button>
                              <Button size="sm" onClick={() => { setSelectedProduct(p); setDialogOpen(true); }}><Edit className="h-4 w-4" /></Button>
                              <Button size="sm" variant="destructive" onClick={() => deleteProduct(p._id || p.id)}><Trash className="h-4 w-4" /></Button>
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
              <div>Showing page {page} of {totalPages} — {total} products</div>
              <div className="flex gap-2 items-center">
                <Button onClick={() => fetchProducts(1)} disabled={page === 1}>First</Button>
                <Button onClick={() => fetchProducts(Math.max(1, page - 1))} disabled={page === 1}>Prev</Button>
                <div>Page</div>
                <Input value={page} onChange={(e) => setPage(Number(e.target.value || 1))} className="w-20" />
                <Button onClick={() => fetchProducts(page)}>Go</Button>
                <Button onClick={() => fetchProducts(Math.min(totalPages, page + 1))} disabled={page === totalPages}>Next</Button>
                <Button onClick={() => fetchProducts(totalPages)} disabled={page === totalPages}>Last</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Product dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedProduct && (selectedProduct._id || selectedProduct.id) ? "Edit Product" : "New Product"}</DialogTitle>
          </DialogHeader>

          {!selectedProduct ? (
            <div className="py-8 flex items-center justify-center"><Spinner /></div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <Input value={selectedProduct.title} placeholder="Title" onChange={(e) => setSelectedProduct({ ...selectedProduct, title: e.target.value })} />
                <Input value={selectedProduct.sku} placeholder="SKU" onChange={(e) => setSelectedProduct({ ...selectedProduct, sku: e.target.value })} />
                <Select value={selectedProduct.package} onChange={(e) => setSelectedProduct({ ...selectedProduct, package: e.target.value })}>
                  <option value="">Select package/category</option>
                  <option value="silver">Silver</option>
                  <option value="gold">Gold</option>
                  <option value="ruby">Ruby</option>
                </Select>
                <Input type="number" value={selectedProduct.price} placeholder="Price" onChange={(e) => setSelectedProduct({ ...selectedProduct, price: Number(e.target.value || 0) })} />
                <Input type="number" value={selectedProduct.pv} placeholder="PV" onChange={(e) => setSelectedProduct({ ...selectedProduct, pv: Number(e.target.value || 0) })} />
                <Input type="number" value={selectedProduct.bv} placeholder="BV" onChange={(e) => setSelectedProduct({ ...selectedProduct, bv: Number(e.target.value || 0) })} />
                <Input type="number" value={selectedProduct.stock} placeholder="Stock" onChange={(e) => setSelectedProduct({ ...selectedProduct, stock: Number(e.target.value || 0) })} />
                <Select value={selectedProduct.active} onChange={(e) => setSelectedProduct({ ...selectedProduct, active: e.target.value === "true" })}>
                  <option value={true}>Active</option>
                  <option value={false}>Inactive</option>
                </Select>
              </div>

              <Input value={selectedProduct.image} placeholder="Image URL" onChange={(e) => setSelectedProduct({ ...selectedProduct, image: e.target.value })} />
              <textarea className="w-full p-2 border rounded" value={selectedProduct.description} placeholder="Description" onChange={(e) => setSelectedProduct({ ...selectedProduct, description: e.target.value })} />

              <div className="flex gap-2">
                <Button onClick={() => saveProduct(selectedProduct)} disabled={actionLoading}>{selectedProduct._id || selectedProduct.id ? "Save" : "Create"}</Button>
                <Button variant="ghost" onClick={() => { setDialogOpen(false); setSelectedProduct(null); }}>Cancel</Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import dialog */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Products (JSON array)</DialogTitle>
          </DialogHeader>

          <div>
            <p className="text-sm text-muted-foreground mb-2">Paste an array of product objects. Example: [{"title":"Test","sku":"T1","price":100,"pv":10,"bv":10,"package":"silver"}]</p>
            <textarea className="w-full h-56 p-2 border rounded" value={importText} onChange={(e) => setImportText(e.target.value)} />
            <div className="flex gap-2 mt-3">
              <Button onClick={importJSON} disabled={actionLoading}><Upload className="mr-2 h-4 w-4 inline" /> Import</Button>
              <Button variant="ghost" onClick={() => { setImportText("["); setImportOpen(false); }}>Cancel</Button>
            </div>
          </div>

          <DialogFooter />
        </DialogContent>
      </Dialog>

    </div>
  );
}
