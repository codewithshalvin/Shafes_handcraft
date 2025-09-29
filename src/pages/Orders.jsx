import React, { useEffect, useMemo, useState } from "react";

// --- Utilities for localStorage persistence ---
const LS_ORDERS_KEY = "orders";
const LS_CART_KEY = "cart"; // assuming your CartContext also mirrors to localStorage

function loadOrders() {
  try {
    const raw = localStorage.getItem(LS_ORDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to load orders", e);
    return [];
  }
}
function saveOrders(orders) {
  try {
    localStorage.setItem(LS_ORDERS_KEY, JSON.stringify(orders));
  } catch (e) {
    console.error("Failed to save orders", e);
  }
}
function loadCart() {
  try {
    const raw = localStorage.getItem(LS_CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to load cart", e);
    return [];
  }
}

function formatINR(amount) {
  const num = Number(amount || 0);
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(num);
}

function makeOrderCode() {
  const now = new Date();
  const y = String(now.getFullYear()).slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const short = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ORD-${y}${m}${d}-${short}`;
}

// --- Modal helper ---
function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 10, width: "min(850px, 96vw)", maxHeight: "90vh", overflow: "auto", boxShadow: "0 12px 30px rgba(0,0,0,0.2)" }}>
        <div style={{ padding: 16, borderBottom: "1px solid #eee", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button onClick={onClose} aria-label="Close" style={{ fontSize: 18, background: "transparent", border: "none", cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ padding: 16 }}>{children}</div>
        {footer && <div style={{ padding: 16, borderTop: "1px solid #eee", display: "flex", gap: 8, justifyContent: "flex-end" }}>{footer}</div>}
      </div>
    </div>
  );
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [creatingFromCart, setCreatingFromCart] = useState(false);
  const [viewOrder, setViewOrder] = useState(null);
  const [invoiceOrder, setInvoiceOrder] = useState(null);

  // Checkout form state (for Create Order from Cart)
  const [customer, setCustomer] = useState({ name: "", phone: "", address: "" });
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [orderNote, setOrderNote] = useState("");

  // Load once
  useEffect(() => {
    setOrders(loadOrders());
  }, []);

  // Derived cart state
  const cartItems = useMemo(() => loadCart(), []);
  const cartSubtotal = useMemo(() => {
    return cartItems.reduce((acc, it) => acc + Number(it.price || 0) * Number(it.qty || 1), 0);
  }, [cartItems]);
  const shipping = useMemo(() => (cartSubtotal > 999 ? 0 : cartSubtotal > 0 ? 79 : 0), [cartSubtotal]);
  const tax = useMemo(() => Math.round(cartSubtotal * 0.05), [cartSubtotal]); // 5% GST example
  const cartTotal = useMemo(() => cartSubtotal + shipping + tax, [cartSubtotal, shipping, tax]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders
      .filter((o) => (statusFilter === "ALL" ? true : o.status === statusFilter))
      .filter((o) =>
        !q
          ? true
          : [
              o.id,
              o.code,
              o.customer?.name,
              o.customer?.phone,
              o.customer?.address,
              ...(o.items || []).map((i) => i.name),
            ]
              .join(" ")
              .toLowerCase()
              .includes(q)
      )
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [orders, search, statusFilter]);

  function persist(next) {
    setOrders(next);
    saveOrders(next);
  }

  function placeOrderFromCart() {
    if (!cartItems.length) {
      alert("Your cart is empty.");
      return;
    }
    if (!customer.name || !customer.phone || !customer.address) {
      alert("Please fill customer name, phone, and address.");
      return;
    }
    const now = new Date().toISOString();
    const newOrder = {
      id: Date.now(),
      code: makeOrderCode(),
      createdAt: now,
      customer: { ...customer },
      note: orderNote,
      items: cartItems.map((it) => ({
        id: it.id,
        name: it.name,
        price: Number(it.price || 0),
        qty: Number(it.qty || 1),
        image: it.image,
        requestMessage: it.requestMessage || "",
        customDesign: !!it.customDesign,
      })),
      totals: { subtotal: cartSubtotal, shipping, tax, total: cartTotal },
      payment: { method: paymentMethod, status: paymentMethod === "COD" ? "Pending" : "Awaiting Confirmation" },
      status: "Processing",
    };

    const next = [newOrder, ...orders];
    persist(next);
    setCreatingFromCart(false);
    setCustomer({ name: "", phone: "", address: "" });
    setOrderNote("");

    // Try to clear cart (if your CartContext mirrors in localStorage)
    try {
      localStorage.setItem(LS_CART_KEY, JSON.stringify([]));
      window.dispatchEvent(new Event("storage"));
    } catch (e) {
      console.warn("Could not clear cart", e);
    }

    alert(`Order ${newOrder.code} placed!`);
  }

  function updateStatus(orderId, nextStatus) {
    const next = orders.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o));
    persist(next);
  }

  function updatePayment(orderId, nextPayment) {
    const next = orders.map((o) => (o.id === orderId ? { ...o, payment: { ...o.payment, ...nextPayment } } : o));
    persist(next);
  }

  function removeOrder(orderId) {
    if (!confirm("Delete this order?")) return;
    const next = orders.filter((o) => o.id !== orderId);
    persist(next);
  }

  function openInvoice(order) {
    setInvoiceOrder(order);
    // open a printable window
    const w = window.open("", "_blank");
    if (!w) return;
    const styles = `
      body { font-family: Arial, sans-serif; padding: 24px; }
      h2 { margin: 0 0 6px; }
      table { width: 100%; border-collapse: collapse; margin-top: 12px; }
      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
      tfoot td { font-weight: bold; }
      .muted { color: #666; }
    `;
    const rows = order.items
      .map(
        (it, idx) => `
          <tr>
            <td>${idx + 1}</td>
            <td>${it.name}${it.customDesign ? " (Custom)" : ""}</td>
            <td>${it.qty}</td>
            <td>${formatINR(it.price)}</td>
            <td>${formatINR(it.qty * it.price)}</td>
          </tr>`
      )
      .join("");

    const html = `
      <html>
        <head><title>Invoice ${order.code}</title><style>${styles}</style></head>
        <body>
          <h2>Shafe's_handcreaft — Tax Invoice</h2>
          <div class="muted">Order Code: ${order.code} · Date: ${new Date(order.createdAt).toLocaleString()}</div>
          <hr/>
          <div><strong>Bill To:</strong><br/>${order.customer.name}<br/>${order.customer.phone}<br/>${order.customer.address}</div>
          ${order.note ? `<p><strong>Order Note:</strong> ${order.note}</p>` : ""}
          <table>
            <thead><tr><th>#</th><th>Item</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
            <tbody>${rows}</tbody>
            <tfoot>
              <tr><td colspan="4">Subtotal</td><td>${formatINR(order.totals.subtotal)}</td></tr>
              <tr><td colspan="4">Shipping</td><td>${formatINR(order.totals.shipping)}</td></tr>
              <tr><td colspan="4">Tax</td><td>${formatINR(order.totals.tax)}</td></tr>
              <tr><td colspan="4">Total</td><td>${formatINR(order.totals.total)}</td></tr>
            </tfoot>
          </table>
          <p class="muted">Payment: ${order.payment.method} — ${order.payment.status}</p>
          <script>window.onload = () => window.print();</script>
        </body>
      </html>`;

    w.document.write(html);
    w.document.close();
  }

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ marginBottom: 6 }}>📦 Orders</h2>
      <p style={{ marginTop: 0, color: "#666" }}>Create orders from your cart and manage statuses, payments, and invoices.</p>

      {/* Create from cart banner */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: 12, background: "#f7fbff", border: "1px solid #d0e7ff", borderRadius: 10, marginBottom: 16 }}>
        <div>
          <strong>Cart Summary:</strong> {cartItems.length} item(s) · Subtotal {formatINR(cartSubtotal)} · Shipping {formatINR(shipping)} · Tax {formatINR(tax)} · <strong>Total {formatINR(cartTotal)}</strong>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setCreatingFromCart(true)} disabled={!cartItems.length} style={{ padding: "8px 12px", borderRadius: 8, background: "#4dabf7", color: "#fff", border: "none" }}>Create Order from Cart</button>
          <button onClick={() => (window.location.href = "/cart")} style={{ padding: "8px 12px", borderRadius: 8 }}>Go to Cart</button>
        </div>
      </div>

      {/* Top toolbar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        <input
          placeholder="Search orders by code, name, phone, item..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 260, padding: 8, borderRadius: 8, border: "1px solid #ddd" }}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: 8, borderRadius: 8, border: "1px solid #ddd" }}>
          <option value="ALL">All Statuses</option>
          <option value="Processing">Processing</option>
          <option value="Shipped">Shipped</option>
          <option value="Delivered">Delivered</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {/* Orders table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#fafafa" }}>
              <th style={th}>Code</th>
              <th style={th}>Customer</th>
              <th style={th}>Items</th>
              <th style={th}>Total</th>
              <th style={th}>Payment</th>
              <th style={th}>Status</th>
              <th style={th}>Date</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: 24, textAlign: "center", color: "#777" }}>
                  No orders yet.
                </td>
              </tr>
            )}
            {filtered.map((o) => (
              <tr key={o.id} style={{ borderTop: "1px solid #eee" }}>
                <td style={td}><code>{o.code}</code></td>
                <td style={td}>
                  <div style={{ fontWeight: 600 }}>{o.customer?.name}</div>
                  <div style={{ fontSize: 12, color: "#666" }}>{o.customer?.phone}</div>
                </td>
                <td style={td}>{o.items?.length} item(s)</td>
                <td style={td}>{formatINR(o.totals?.total)}</td>
                <td style={td}>
                  <span style={pill}>{o.payment?.method}</span>
                  <div style={{ fontSize: 12, color: "#666" }}>{o.payment?.status}</div>
                </td>
                <td style={td}><span style={{ ...pill, background: statusBg(o.status), color: statusColor(o.status) }}>{o.status}</span></td>
                <td style={td}>{new Date(o.createdAt).toLocaleString()}</td>
                <td style={{ ...td, minWidth: 280 }}>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <button onClick={() => setViewOrder(o)} style={btn}>View</button>
                    <button onClick={() => openInvoice(o)} style={btn}>Invoice</button>
                    {o.status === "Processing" && (
                      <button onClick={() => updateStatus(o.id, "Shipped")} style={btnAction}>Mark Shipped</button>
                    )}
                    {o.status === "Shipped" && (
                      <button onClick={() => updateStatus(o.id, "Delivered")} style={btnAction}>Mark Delivered</button>
                    )}
                    {o.status !== "Cancelled" && o.status !== "Delivered" && (
                      <button onClick={() => updateStatus(o.id, "Cancelled")} style={btnDanger}>Cancel</button>
                    )}
                    <button onClick={() => removeOrder(o.id)} style={btnGhost}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create from Cart modal */}
      <Modal
        open={creatingFromCart}
        onClose={() => setCreatingFromCart(false)}
        title="Create Order from Cart"
        footer={[
          <button key="cancel" onClick={() => setCreatingFromCart(false)} style={btnGhost}>Cancel</button>,
          <button key="place" onClick={placeOrderFromCart} style={{ ...btnAction, padding: "10px 14px" }}>Place Order</button>,
        ]}
      >
        {!cartItems.length ? (
          <p>Your cart is empty. Add items first.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <h4>Customer Details</h4>
              <div style={field}><label>Name</label><input value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} /></div>
              <div style={field}><label>Phone</label><input value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} /></div>
              <div style={field}><label>Address</label><textarea rows={5} value={customer.address} onChange={(e) => setCustomer({ ...customer, address: e.target.value })} /></div>
              <div style={field}><label>Payment Method</label>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  <option>COD</option>
                  <option>UPI</option>
                  <option>Card</option>
                </select>
              </div>
              <div style={field}><label>Order Note (optional)</label><textarea rows={3} value={orderNote} onChange={(e) => setOrderNote(e.target.value)} placeholder="e.g., Please gift wrap." /></div>
            </div>
            <div>
              <h4>Items</h4>
              <div style={{ maxHeight: 300, overflow: "auto", border: "1px solid #eee", borderRadius: 8 }}>
                {cartItems.map((it) => (
                  <div key={it.id} style={{ display: "flex", gap: 10, padding: 8, borderBottom: "1px solid #f2f2f2" }}>
                    <img src={it.image} alt={it.name} style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 6, border: "1px solid #eee" }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{it.name}</div>
                      <div style={{ fontSize: 12, color: "#666" }}>Qty: {it.qty} · {formatINR(it.price)}</div>
                      {it.requestMessage && <div style={{ fontSize: 12, marginTop: 4 }}><strong>Request:</strong> {it.requestMessage}</div>}
                      {it.customDesign && <div style={{ fontSize: 12, color: "#2563eb" }}>Custom Design</div>}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12, padding: 10, border: "1px solid #eee", borderRadius: 8 }}>
                <div style={sumRow}><span>Subtotal</span><strong>{formatINR(cartSubtotal)}</strong></div>
                <div style={sumRow}><span>Shipping</span><strong>{formatINR(shipping)}</strong></div>
                <div style={sumRow}><span>Tax (5%)</span><strong>{formatINR(tax)}</strong></div>
                <div style={{ ...sumRow, borderTop: "1px dashed #e5e7eb", paddingTop: 8 }}><span>Total</span><strong>{formatINR(cartTotal)}</strong></div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* View order modal */}
      <Modal
        open={!!viewOrder}
        onClose={() => setViewOrder(null)}
        title={viewOrder ? `Order ${viewOrder.code}` : "Order"}
        footer={[
          viewOrder && viewOrder.status === "Processing" && (
            <button key="ship" onClick={() => { updateStatus(viewOrder.id, "Shipped"); setViewOrder({ ...viewOrder, status: "Shipped" }); }} style={btnAction}>Mark Shipped</button>
          ),
          viewOrder && viewOrder.status === "Shipped" && (
            <button key="deliver" onClick={() => { updateStatus(viewOrder.id, "Delivered"); setViewOrder({ ...viewOrder, status: "Delivered" }); }} style={btnAction}>Mark Delivered</button>
          ),
          viewOrder && viewOrder.status !== "Cancelled" && viewOrder.status !== "Delivered" && (
            <button key="cancel" onClick={() => { updateStatus(viewOrder.id, "Cancelled"); setViewOrder({ ...viewOrder, status: "Cancelled" }); }} style={btnDanger}>Cancel</button>
          ),
          <button key="close" onClick={() => setViewOrder(null)} style={btnGhost}>Close</button>,
        ].filter(Boolean)}
      >
        {viewOrder && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <h4>Customer</h4>
              <div><strong>{viewOrder.customer?.name}</strong></div>
              <div>{viewOrder.customer?.phone}</div>
              <div style={{ whiteSpace: "pre-wrap" }}>{viewOrder.customer?.address}</div>
              {viewOrder.note && <p><strong>Order Note:</strong> {viewOrder.note}</p>}
              <p><strong>Payment:</strong> {viewOrder.payment.method} — {viewOrder.payment.status}</p>
              <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                <button onClick={() => updatePayment(viewOrder.id, { status: "Paid" })} style={btn}>Mark Paid</button>
                <button onClick={() => updatePayment(viewOrder.id, { status: "Refunded" })} style={btn}>Refund</button>
              </div>
            </div>
            <div>
              <h4>Items</h4>
              <div style={{ maxHeight: 320, overflow: "auto", border: "1px solid #eee", borderRadius: 8 }}>
                {viewOrder.items.map((it, idx) => (
                  <div key={idx} style={{ display: "flex", gap: 10, padding: 8, borderBottom: "1px solid #f2f2f2" }}>
                    <img src={it.image} alt={it.name} style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 6, border: "1px solid #eee" }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{it.name}{it.customDesign ? " (Custom)" : ""}</div>
                      <div style={{ fontSize: 12, color: "#666" }}>Qty: {it.qty} · {formatINR(it.price)}</div>
                      {it.requestMessage && <div style={{ fontSize: 12, marginTop: 4 }}><strong>Request:</strong> {it.requestMessage}</div>}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12, padding: 10, border: "1px solid #eee", borderRadius: 8 }}>
                <div style={sumRow}><span>Subtotal</span><strong>{formatINR(viewOrder.totals.subtotal)}</strong></div>
                <div style={sumRow}><span>Shipping</span><strong>{formatINR(viewOrder.totals.shipping)}</strong></div>
                <div style={sumRow}><span>Tax</span><strong>{formatINR(viewOrder.totals.tax)}</strong></div>
                <div style={{ ...sumRow, borderTop: "1px dashed #e5e7eb", paddingTop: 8 }}><span>Total</span><strong>{formatINR(viewOrder.totals.total)}</strong></div>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button onClick={() => openInvoice(viewOrder)} style={btn}>Print Invoice</button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// --- Styles ---
const th = { textAlign: "left", padding: 10, fontWeight: 700, borderBottom: "1px solid #eee", whiteSpace: "nowrap" };
const td = { padding: 10, verticalAlign: "top" };
const pill = { display: "inline-block", padding: "2px 8px", borderRadius: 999, background: "#eef2ff", color: "#333", fontSize: 12 };
const btn = { padding: "6px 10px", borderRadius: 8, border: "1px solid #ddd", background: "#fff", cursor: "pointer" };
const btnAction = { ...btn, background: "#4dabf7", color: "#fff", border: "1px solid #4dabf7" };
const btnDanger = { ...btn, background: "#ef4444", color: "#fff", border: "1px solid #ef4444" };
const btnGhost = { ...btn, background: "#f8f9fa" };
const field = { display: "grid", gap: 6, marginBottom: 10 };
const sumRow = { display: "flex", justifyContent: "space-between", margin: "6px 0" };

function statusBg(s) {
  switch (s) {
    case "Processing":
      return "#fff7ed";
    case "Shipped":
      return "#ecfeff";
    case "Delivered":
      return "#ecfdf5";
    case "Cancelled":
      return "#fef2f2";
    default:
      return "#f3f4f6";
  }
}
function statusColor(s) {
  switch (s) {
    case "Processing":
      return "#9a3412";
    case "Shipped":
      return "#164e63";
    case "Delivered":
      return "#065f46";
    case "Cancelled":
      return "#991b1b";
    default:
      return "#374151";
  }
}
