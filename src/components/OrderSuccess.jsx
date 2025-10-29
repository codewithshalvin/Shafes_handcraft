import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./OrderSuccess.css";

export default function OrderSuccess() {
  const { orderId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    
    fetchOrder();
  }, [orderId, token]);

  const fetchOrder = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        setOrder(data.order);
      } else {
        console.error("Failed to fetch order:", data.message);
      }
    } catch (error) {
      console.error("Error fetching order:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-container">Loading order details...</div>;
  }

  if (!order) {
    return (
      <div className="error-container">
        <h2>Order not found</h2>
        <button onClick={() => navigate("/")}>Go Home</button>
      </div>
    );
  }

  return (
    <div className="order-success-container">
      <div className="success-header">
        <div className="success-icon">✅</div>
        <h1>Order Placed Successfully!</h1>
        <p>Thank you for your purchase. Your order has been confirmed.</p>
      </div>

      <div className="order-details">
        <div className="order-info">
          <h2>Order Details</h2>
          <div className="info-row">
            <span>Order ID:</span>
            <span>{order.orderId}</span>
          </div>
          <div className="info-row">
            <span>Payment ID:</span>
            <span>{order.razorpayPaymentId}</span>
          </div>
          <div className="info-row">
            <span>Amount Paid:</span>
            <span>₹{order.totalAmount.toFixed(2)}</span>
          </div>
          <div className="info-row">
            <span>Order Status:</span>
            <span className={`status ${order.orderStatus}`}>
              {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
            </span>
          </div>
          <div className="info-row">
            <span>Order Date:</span>
            <span>{new Date(order.orderDate).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="order-items">
          <h2>Items Ordered</h2>
          {order.items.map((item, index) => (
            <div key={index} className="order-item">
              <div className="item-details">
                <h4>
                  {item.isCustomDesign 
                    ? item.customDesign.name 
                    : item.product?.name || "Product"
                  }
                </h4>
                <p>Quantity: {item.quantity}</p>
                <p>Price: ₹{item.price.toFixed(2)}</p>
                {item.specialRequest && (
                  <p className="special-request">
                    Special Request: {item.specialRequest}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="shipping-address">
          <h2>Shipping Address</h2>
          <div className="address-details">
            <p>{order.shippingAddress.name}</p>
            <p>{order.shippingAddress.address}</p>
            <p>{order.shippingAddress.city}, {order.shippingAddress.state}</p>
            <p>{order.shippingAddress.country} - {order.shippingAddress.pincode}</p>
            <p>Phone: {order.shippingAddress.phone}</p>
          </div>
        </div>
      </div>

      <div className="action-buttons">
        <button 
          className="continue-shopping-btn"
          onClick={() => navigate("/")}
        >
          Continue Shopping
        </button>
        <button 
          className="view-orders-btn"
          onClick={() => navigate("/orders")}
        >
          View All Orders
        </button>
      </div>
    </div>
  );
}
