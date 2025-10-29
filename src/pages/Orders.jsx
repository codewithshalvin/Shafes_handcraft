import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../context/AuthContext";

const BACKEND_URL = "http://localhost:5000";

// Steps config for progress bar (icons can be swapped to SVGs later)
const trackingSteps = [
  { key: "confirmed", label: "Order Confirmed", icon: "📝" },
  { key: "shipped", label: "Order Shipped", icon: "📦" },
  { key: "outForDelivery", label: "Out for Delivery", icon: "🚚" },
  { key: "delivered", label: "Order Delivered", icon: "🏠" },
];

// Map your backend orderStatus to a step index
function getStepIndex(status) {
  switch (status) {
    case "pending":
      return 0;
    case "confirmed":
      return 1;
    case "processing":
      return 1;
    case "shipped":
      return 2;
    case "outForDelivery":
      return 3;
    case "delivered":
      return 4;
    case "cancelled":
      return -1;
    default:
      return 0;
  }
}

// Generic modal using a portal with body scroll lock
function Modal({ onClose, width = 640, children, ariaLabel = "Dialog" }) {
  useEffect(() => {
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
    };
  }, []);

  const overlayStyle = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    zIndex: 10000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
  };

  const cardStyle = {
    background: "white",
    borderRadius: "15px",
    width: "100%",
    maxWidth: `${width}px`,
    position: "relative",
    padding: "24px",
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      style={overlayStyle}
      onClick={onClose}
      onWheel={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      <div style={cardStyle} onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          aria-label="Close dialog"
          style={{
            position: "absolute",
            top: "12px",
            right: "16px",
            background: "none",
            border: "none",
            fontSize: "1.75rem",
            color: "#888",
            cursor: "pointer",
            lineHeight: 1,
          }}
        >
          ×
        </button>
        {children}
      </div>
    </div>,
    document.body
  );
}

// Progress bar with a single track and computed progress width
function ProgressBar({ status }) {
  const step = getStepIndex(status);
  // step indexes: 0..4; segments between icons = steps.length - 1
  const totalSegments = trackingSteps.length - 1;
  const progressSegments = Math.max(0, Math.min(step - 1, totalSegments));
  const progressPercent =
    totalSegments > 0 ? (progressSegments / totalSegments) * 100 : 0;

  const wrapper = {
    position: "relative",
    margin: "24px 0 10px 0",
    padding: "24px 8px 0 8px",
    minHeight: 110,
  };

  const track = {
    position: "absolute",
    top: 44, // roughly the icon center
    left: "8%",
    right: "8%",
    height: 5,
    background: "#e5e7eb",
    borderRadius: 6,
    zIndex: 1,
  };

  const progress = {
    position: "absolute",
    top: 44,
    left: "8%",
    height: 5,
    width: `calc(${progressPercent}% * 0.84)`, // 84% because left/right are 8% each
    background: "#28a745",
    borderRadius: 6,
    zIndex: 2,
    transition: "width 300ms ease",
  };

  const stepsRow = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    position: "relative",
    zIndex: 3,
    padding: "0 8%",
  };

  const stepItem = {
    width: 120,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  };

  const icon = (active) => ({
    background: active ? "#28a745" : "#e0e0e0",
    color: "#fff",
    borderRadius: "50%",
    width: 46,
    height: 46,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.6rem",
    marginBottom: 10,
    boxShadow: active ? "0 0 8px #28a74588" : "none",
    border: active ? "2px solid #147fff" : "2px solid #e0e0e0",
  });

  const label = (active) => ({
    marginTop: 8,
    fontWeight: 600,
    fontSize: "0.95rem",
    color: active ? "#28a745" : "#707070",
    lineHeight: 1.2,
  });

  return (
    <div style={wrapper}>
      <div style={track} />
      <div style={progress} />
      <div style={stepsRow}>
        {trackingSteps.map((s, idx) => {
          const active = idx <= step - 1;
          return (
            <div key={s.key} style={stepItem}>
              <div style={icon(active)}>{s.icon}</div>
              <div style={label(active)}>{s.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function CustomerOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState('');

  // Tracking modal
  const [trackModal, setTrackModal] = useState(false);
  const [trackOrder, setTrackOrder] = useState(null);

  // Receipt modal
  const [detailModal, setDetailModal] = useState(false);
  const [detailOrder, setDetailOrder] = useState(null);
  const receiptRef = useRef();

  useEffect(() => {
    console.log('Orders useEffect - user:', user);
    console.log('user?._id:', user?._id);
    console.log('user?.id:', user?.id);
    console.log('user?.userId:', user?.userId);
    console.log('typeof user:', typeof user);
    console.log('user === null:', user === null);
    console.log('user === undefined:', user === undefined);
    
    // Get the user ID from whichever property is available
    const userId = user?._id || user?.id || user?.userId;
    console.log('Determined userId:', userId);
    
    const fetchCustomerOrders = async () => {
      try {
        console.log('🚀 Starting fetchCustomerOrders for user ID:', userId);
        console.log('🌐 Backend URL:', BACKEND_URL);
        setError(null);
        setDebugInfo('Starting fetch...');
        
        const url = `${BACKEND_URL}/api/customer/orders/${userId}`;
        console.log('📡 Making request to:', url);
        setDebugInfo(`Making request to: ${url}`);
        
        // Create an AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        setDebugInfo('Sending fetch request...');
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal
        });
        
        setDebugInfo('Response received!');
        
        clearTimeout(timeoutId);
        
        console.log('📥 Orders API response received');
        console.log('📊 Response status:', response.status);
        console.log('📋 Response headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        console.log('📖 Parsing JSON response...');
        const data = await response.json();
        console.log('✅ Orders API response data:', data);
        console.log('📦 Number of orders:', data.orders?.length || 0);
        
        if (data.success) {
          console.log('✅ Setting orders state with', data.orders?.length || 0, 'orders');
          setOrders(data.orders || []);
        } else {
          console.log('❌ API returned error:', data.error || data.message);
          setError(data.error || data.message || 'Failed to fetch orders');
        }
      } catch (error) {
        console.error('❌ Fetch error:', error);
        console.error('❌ Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
        setError(`Failed to load orders: ${error.message}`);
      } finally {
        console.log('🏁 Fetch complete, setting loading to false');
        setLoading(false);
      }
    };
    
    if (userId) {
      console.log('✅ Condition met: userId is truthy, calling fetchCustomerOrders');
      setDebugInfo('About to call fetchCustomerOrders...');
      fetchCustomerOrders();
    } else if (user === null) {
      console.log('❌ User is explicitly null (not logged in)');
      // User is explicitly null (not logged in)
      setLoading(false);
      setError('Please log in to view your orders');
    } else {
      console.log('🔄 User is undefined, still loading auth state');
      setDebugInfo('Waiting for user authentication...');
    }
    // If user is undefined, keep loading (still checking auth)
  }, [user]);


  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/customer/orders/${orderId}`,
        { method: "DELETE", headers: { "Content-Type": "application/json" } }
      );
      const data = await response.json();
      if (data.success) {
        setOrders((prev) => prev.filter((o) => o._id !== orderId));
        alert("Order cancelled!");
      } else alert(data.message || "Cancellation failed.");
    } catch (error) {
      alert("Server error cancelling order.");
      console.error(error);
    }
  };

  const openTrackModal = (order) => {
    setTrackOrder(order);
    setTrackModal(true);
  };

  const openDetailModal = (order) => {
    setDetailOrder(order);
    setDetailModal(true);
  };

  const handlePrint = () => {
    if (!receiptRef.current) return;
    const html = receiptRef.current.innerHTML;
    const w = window.open("", "", "height=700,width=900");
    w.document.write("<html><head><title>Order Receipt</title>");
    w.document.write(
      "<style>body{font-family:sans-serif;margin:30px;}table{width:100%;border-collapse:collapse;}th,td{padding:8px;border-bottom:1px solid #eee;}h2{color:#147FFF;} h3{color:#28a745;} .total{font-size:1.1rem;}</style>"
    );
    w.document.write("</head><body>");
    w.document.write(html);
    w.document.write("</body></html>");
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
    setTimeout(() => w.close(), 700);
  };

  const formatDateTime = (dateString) =>
    dateString
      ? new Date(dateString).toLocaleString("en-IN", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "-";

  const formatCurrency = (amount) => `₹${amount?.toFixed(2) || "0.00"}`;

  const getStatusColor = (status) =>
    (
      {
        pending: "#ffc107",
        confirmed: "#17a2b8",
        processing: "#fd7e14",
        shipped: "#6f42c1",
        delivered: "#28a745",
        cancelled: "#dc3545",
      }[status] || "#6c757d"
    );

  if (loading) {
    return (
      <div style={{ padding: "2rem" }}>
        <div>Loading your orders...</div>
        {debugInfo && (
          <div style={{ 
            marginTop: "1rem", 
            padding: "1rem", 
            background: "#f0f0f0", 
            borderRadius: "5px",
            fontSize: "0.9rem",
            color: "#666"
          }}>
            Debug: {debugInfo}
          </div>
        )}
        {user && (
          <div style={{ 
            marginTop: "1rem", 
            padding: "1rem", 
            background: "#e8f5e8", 
            borderRadius: "5px",
            fontSize: "0.9rem",
            color: "#2d5a2d"
          }}>
            User ID: {user._id || user.id || user.userId || 'NOT FOUND'}<br/>
            Name: {user.name}<br/>
            Email: {user.email}<br/>
            Full user object: {JSON.stringify(user, null, 2)}
          </div>
        )}
      </div>
    );
  }
  
  if (error) {
    return (
      <div style={{ 
        padding: "2rem", 
        textAlign: "center",
        background: "white",
        borderRadius: "10px",
        margin: "2rem",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
      }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚠️</div>
        <h3 style={{ color: "#dc3545", marginBottom: "1rem" }}>Error Loading Orders</h3>
        <p style={{ color: "#666", marginBottom: "1rem" }}>{error}</p>
        <button
          onClick={() => window.location.reload()}
          style={{
            background: "#007bff",
            color: "white",
            border: "none",
            padding: "0.75rem 1.5rem",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "1rem"
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ color: "#2c3e50", marginBottom: "2rem" }}>
        📦 My Orders ({orders.length})
      </h1>

      {orders.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "4rem 2rem",
            background: "white",
            borderRadius: "10px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          }}
        >
          <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🛍️</div>
          <h3>No Orders Yet</h3>
          <p>You haven't placed any orders yet. Start shopping!</p>
          <button
            style={{
              background: "#007bff",
              color: "white",
              border: "none",
              padding: "1rem 2rem",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "1rem",
              marginTop: "1rem",
            }}
          >
            Start Shopping
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {orders.map((order) => (
            <div
              key={order._id}
              style={{
                background: "white",
                borderRadius: "10px",
                padding: "2rem",
                boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                border: "1px solid #e9ecef",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "1.5rem",
                  flexWrap: "wrap",
                  gap: "1rem",
                }}
              >
                <div>
                  <h3 style={{ margin: "0 0 0.5rem 0", color: "#007bff" }}>
                    {order.orderId}
                  </h3>
                  <p style={{ margin: 0, color: "#6c757d" }}>
                    Ordered on {formatDateTime(order.createdAt)}
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ marginBottom: "0.5rem" }}>
                    <span
                      style={{
                        background: getStatusColor(order.orderStatus),
                        color: "white",
                        padding: "0.4rem 1rem",
                        borderRadius: "20px",
                        fontSize: "0.9rem",
                        fontWeight: 600,
                        textTransform: "capitalize",
                      }}
                    >
                      {order.orderStatus}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: "1.2rem",
                      fontWeight: "bold",
                      color: "#28a745",
                    }}
                  >
                    {formatCurrency(order.totalAmount)}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                  gap: "1rem",
                }}
              >
                {order.items?.slice(0, 3).map((item, index) => {
                  const imageSrc = item.product?.image?.startsWith("/uploads")
                    ? `${BACKEND_URL}${item.product.image}`
                    : item.product?.image;
                  return (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "1rem",
                        background: "#f8f9fa",
                        padding: "1rem",
                        borderRadius: "8px",
                      }}
                    >
                      {imageSrc && (
                        <img
                          src={imageSrc}
                          alt={item.product?.name}
                          style={{
                            width: 60,
                            height: 60,
                            objectFit: "cover",
                            borderRadius: "6px",
                          }}
                        />
                      )}
                      <div>
                        <h5 style={{ margin: "0 0 0.5rem 0" }}>
                          {item.isCustomDesign
                            ? item.customDesign?.name
                            : item.product?.name}
                        </h5>
                        <p style={{ margin: 0, color: "#666", fontSize: "0.9rem" }}>
                          Qty: {item.quantity} × {formatCurrency(item.price)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {order.items?.length > 3 && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "#f8f9fa",
                      padding: "1rem",
                      borderRadius: "8px",
                      color: "#666",
                      fontWeight: 600,
                    }}
                  >
                    +{order.items.length - 3} more items
                  </div>
                )}
              </div>

              <div
                style={{
                  marginTop: "1.5rem",
                  paddingTop: "1.5rem",
                  borderTop: "1px solid #e9ecef",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "1rem",
                }}
              >
                <div style={{ color: "#6c757d" }}>
                  <strong>Payment:</strong> {order.paymentStatus} •{" "}
                  <strong> Items:</strong> {order.items?.length}
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    style={{
                      background: "#007bff",
                      color: "white",
                      border: "none",
                      padding: "0.5rem 1rem",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "0.9rem",
                    }}
                    onClick={() => openTrackModal(order)}
                  >
                    Track Order
                  </button>
                  <button
                    style={{
                      background: "white",
                      color: "#007bff",
                      border: "2px solid #007bff",
                      padding: "0.5rem 1rem",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "0.9rem",
                    }}
                    onClick={() => openDetailModal(order)}
                  >
                    View Details
                  </button>
                  {order.orderStatus === "pending" && (
                    <button
                      style={{
                        background: "#dc3545",
                        color: "white",
                        border: "none",
                        padding: "0.5rem 1rem",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "0.9rem",
                      }}
                      onClick={() => handleCancelOrder(order._id)}
                    >
                      Cancel Order
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tracking Modal */}
      {trackModal && trackOrder && (
        <Modal onClose={() => setTrackModal(false)} width={680} ariaLabel="Order tracking">
          <h2 style={{ marginBottom: "1rem", textAlign: "center", color: "#147FFF" }}>
            Order Tracking
          </h2>
          <div
            style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}
          >
            <div>
              <div style={{ fontWeight: 500 }}>
                Order ID:{" "}
                <span style={{ color: "#28a745", fontWeight: 700 }}>
                  {trackOrder.orderId}
                </span>
              </div>
              <div>
                Expected Arrival:&nbsp;
                <span
                  style={{
                    background: "#147FFF",
                    color: "white",
                    borderRadius: "8px",
                    padding: "2px 10px",
                    fontWeight: 500,
                  }}
                >
                  {trackOrder.expectedArrival
                    ? formatDateTime(trackOrder.expectedArrival)
                    : "-"}
                </span>
              </div>
            </div>
            <div>
              <div>
                Tracking ID:&nbsp;
                <span
                  style={{
                    background: "#e83e8c",
                    color: "white",
                    borderRadius: "8px",
                    padding: "2px 10px",
                    fontWeight: 500,
                  }}
                >
                  {trackOrder.trackingId || "-"}
                </span>
              </div>
            </div>
          </div>

          <ProgressBar status={trackOrder.orderStatus} />

          <ul
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: 0,
              marginTop: 18,
              listStyle: "none",
            }}
          >
            {trackingSteps.map((step, idx) => (
              <li
                key={step.key}
                style={{
                  width: 120,
                  textAlign: "center",
                  fontSize: "0.93rem",
                  color: "#343a40",
                }}
              >
                {trackOrder[`${step.key}At`] && (
                  <div style={{ color: "#28a745", fontSize: "0.93rem" }}>
                    {formatDateTime(trackOrder[`${step.key}At`])}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Modal>
      )}

      {/* View Details / Receipt Modal */}
      {detailModal && detailOrder && (
        <Modal onClose={() => setDetailModal(false)} width={680} ariaLabel="Order receipt">
          <div ref={receiptRef}>
            <h2 style={{ color: "#147FFF", textAlign: "center", marginBottom: "1.5rem" }}>
              Order Receipt
            </h2>
            <div
              style={{ marginBottom: 10, display: "flex", justifyContent: "space-between" }}
            >
              <div>
                <div>
                  <b>Order ID:</b> {detailOrder.orderId}
                </div>
                <div>
                  <b>Date:</b> {formatDateTime(detailOrder.createdAt)}
                </div>
              </div>
              <div>
                <div>
                  <b>Payment:</b> {detailOrder.paymentStatus}
                </div>
                <div>
                  <b>Status:</b> {detailOrder.orderStatus}
                </div>
              </div>
            </div>
            <div>
              <b>Shipping To:</b>
              <div style={{ marginBottom: "1em", color: "#333" }}>
                {detailOrder.shippingAddress?.name} <br />
                {detailOrder.shippingAddress?.phone}
                <br />
                {detailOrder.shippingAddress?.address}
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Item Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {detailOrder.items.map((item, i) => (
                  <tr key={i}>
                    <td>
                      {item.isCustomDesign
                        ? item.customDesign?.name
                        : item.product?.name}
                    </td>
                    <td>{item.quantity}</td>
                    <td>{formatCurrency(item.price)}</td>
                    <td>{formatCurrency(item.price * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="3" style={{ textAlign: "right", fontWeight: 600 }}>
                    Subtotal:
                  </td>
                  <td className="total">{formatCurrency(detailOrder.totalAmount)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
            <button
              style={{
                background: "#28a745",
                color: "white",
                border: "none",
                padding: "0.75rem 2.75rem",
                borderRadius: "7px",
                cursor: "pointer",
                fontSize: "1rem",
              }}
              onClick={handlePrint}
            >
              Print Receipt
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
