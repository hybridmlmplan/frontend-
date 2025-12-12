// src/pages/franchisePanel/CreateOrder.jsx
import React, { useEffect, useState } from "react";
import api from "../../api/axiosConfig";
import { useStore } from "../../store";
import { useNavigate } from "react-router-dom";

/**
 * Franchise Create Order Page
 *
 * Usage:
 * - Paste as src/pages/franchisePanel/CreateOrder.jsx
 * - Ensure backend routes:
 *    GET  /franchise/products
 *    POST /franchise/orders/create
 *
 * Notes:
 * - Products should include price, bv, pv fields so frontend can calculate totals.
 * - Server MUST validate BV/PV and commission logic.
 */

export default function CreateOrder() {
  const { state, actions } = useStore();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [error, setError] = useState(null);

  // Form
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [placementId, setPlacementId] = useState(""); // optional
  const [sponsorId, setSponsorId] = useState(""); // optional
  const [note, setNote] = useState("");

  // Preview totals
  const selectedProduct = products.find((p) => p.id === productId);
  const price = selectedProduct ? Number(selectedProduct.price || 0) : 0;
  const pv = selectedProduct ? Number(selectedProduct.pv || 0) : 0;
  const bv = selectedProduct ? Number(selectedProduct.bv || 0) : 0;
  const subtotal = price * Number(quantity || 0);
  const totalPV = pv * Number(quantity || 0);
  const totalBV = bv * Number(quantity || 0);

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchProducts() {
    setLoadingProducts(true);
    setError(null);
    try {
      const res = await api.get("/franchise/products");
      const data = res.data || res;
      // Expect array
      setProducts(Array.isArray(data) ? data : data.products || []);
    } catch (err) {
      console.error("Failed to fetch products", err);
      setError(err?.message || "Failed to load products");
    } finally {
      setLoadingProducts(false);
    }
  }

  function validateForm() {
    if (!productId) return "Please select a product.";
    if (!quantity || Number(quantity) <= 0) return "Quantity must be at least 1.";
    if (!customerName || customerName.trim().length < 2) return "Enter customer name.";
    if (!customerPhone || customerPhone.trim().length < 7) return "Enter valid customer phone.";
    return null;
  }

  async function handleCreateOrder(e) {
    e.preventDefault();
    setError(null);

    const v = validateForm();
    if (v) {
      setError(v);
      return;
    }

    const payload = {
      productId,
      quantity: Number(quantity),
      customer: {
        name: customerName.trim(),
        phone: customerPhone.trim(),
        email: customerEmail.trim() || undefined,
      },
      sponsorId: sponsorId || undefined,
      placementId: placementId || undefined,
      note: note || undefined,
      // frontend sends totals for convenience; server computes authoritative values
      totals: {
        subtotal,
        pv: totalPV,
        bv: totalBV,
      },
    };

    setLoadingCreate(true);
    try {
      const res = await api.post("/franchise/orders/create", payload);
      const data = res.data || res;
      actions.addNotification({ type: "success", message: "Order created successfully" });
      // If backend returns order id, navigate to order details
      const orderId = data?.order?.id || data?.id || null;
      if (orderId) {
        navigate(`/franchise/orders/${orderId}`);
      } else {
        // fallback: go to franchise orders list
        navigate("/franchise/orders");
      }
    } catch (err) {
      console.error("Create order failed", err);
      setError(err?.response?.data?.message || err?.message || "Failed to create order");
      actions.addNotification({ type: "error", message: error || "Order creation failed" });
    } finally {
      setLoadingCreate(false);
    }
  }

  return (
    <div className="p-6 pt-24">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Create Franchise Order</h1>
            <p className="text-sm text-gray-500">Place orders for customers, generate BV/PV & track sales.</p>
          </div>
        </div>

        <div className="bg-white border rounded shadow p-4">
          {error && <div className="mb-3 text-sm text-red-600">{error}</div>}

          <form onSubmit={handleCreateOrder} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Product</label>
                {loadingProducts ? (
                  <div className="p-2 text-sm text-gray-500">Loading products...</div>
                ) : (
                  <select
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                    className="w-full border px-3 py-2 rounded"
                  >
                    <option value="">-- Select product --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — ₹{p.price} — PV:{p.pv ?? 0} BV:{p.bv ?? 0}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Customer Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full border px-3 py-2 rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Customer Phone</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full border px-3 py-2 rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Customer Email (optional)</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Sponsor ID (optional)</label>
                <input
                  type="text"
                  value={sponsorId}
                  onChange={(e) => setSponsorId(e.target.value)}
                  className="w-full border px-3 py-2 rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Placement ID (optional)</label>
                <input
                  type="text"
                  value={placementId}
                  onChange={(e) => setPlacementId(e.target.value)}
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Note (optional)</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full border px-3 py-2 rounded"
                rows="3"
              />
            </div>

            {/* Preview */}
            <div className="border rounded p-3 bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium">Order Summary</div>
                <div className="text-xs text-gray-500">Preview (server authoritative)</div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Product</div>
                <div className="text-right">{selectedProduct ? selectedProduct.name : "-"}</div>

                <div>Unit Price</div>
                <div className="text-right">₹{price}</div>

                <div>Quantity</div>
                <div className="text-right">{quantity}</div>

                <div>Subtotal</div>
                <div className="text-right font-semibold">₹{subtotal}</div>

                <div>Total PV</div>
                <div className="text-right">{totalPV}</div>

                <div>Total BV</div>
                <div className="text-right">{totalBV}</div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  // clear form
                  setProductId("");
                  setQuantity(1);
                  setCustomerName("");
                  setCustomerPhone("");
                  setCustomerEmail("");
                  setSponsorId("");
                  setPlacementId("");
                  setNote("");
                }}
                className="px-4 py-2 border rounded"
              >
                Reset
              </button>

              <button
                type="submit"
                disabled={loadingCreate}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                {loadingCreate ? "Placing order..." : "Create Order"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
