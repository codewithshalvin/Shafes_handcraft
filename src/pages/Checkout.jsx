import { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./Checkout.css";

export default function Checkout() {
  const { cart, getCartTotal, clearCart } = useCart();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [shippingAddress, setShippingAddress] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
    city: user?.city || "",
    state: user?.state || "",
    country: user?.country || "India",
    pincode: ""
  });

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    
    if (cart.length === 0) {
      navigate("/cart");
      return;
    }
  }, [token, cart, navigate]);

  const handleAddressChange = (e) => {
    setShippingAddress({
      ...shippingAddress,
      [e.target.name]: e.target.value
    });
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    try {
      setLoading(true);

      // Validate shipping address
      const requiredFields = ["name", "phone", "address", "city", "state", "pincode"];
      const missingFields = requiredFields.filter(field => !shippingAddress[field]?.trim());
      
      if (missingFields.length > 0) {
        alert(`Please fill in: ${missingFields.join(", ")}`);
        setLoading(false);
        return;
      }

      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        alert("Razorpay SDK failed to load. Please check your internet connection.");
        setLoading(false);
        return;
      }

      const totalAmount = getCartTotal();
      
      // Create order on backend
      console.log("💳 Creating payment order...");
      const orderResponse = await fetch("http://localhost:5000/api/payment/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: totalAmount,
          currency: "INR",
          shippingAddress: shippingAddress
        }),
      });

      const orderData = await orderResponse.json();
      
      if (!orderData.success) {
        throw new Error(orderData.message || "Failed to create order");
      }

      console.log("✅ Order created:", orderData.order);

      // Razorpay options
      const options = {
        key: orderData.key,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: "Your Store Name",
        description: "Purchase from Your Store",
        order_id: orderData.order.id,
        prefill: {
          name: shippingAddress.name,
          email: shippingAddress.email,
          contact: shippingAddress.phone,
        },
        theme: {
          color: "#3399cc",
        },
        handler: async (response) => {
          try {
            console.log("💳 Payment completed:", response);
            
            // Verify payment on backend
            const verifyResponse = await fetch("http://localhost:5000/api/payment/verify", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderId: orderData.order.orderId
              }),
            });

            const verifyData = await verifyResponse.json();
            
            if (verifyData.success) {
              console.log("✅ Payment verified successfully");
              alert("Payment successful! Your order has been placed.");
              clearCart(); // Clear cart from context
              navigate(`/order-success/${verifyData.order.orderId}`);
            } else {
              throw new Error(verifyData.message || "Payment verification failed");
            }
          } catch (error) {
            console.error("❌ Payment verification error:", error);
            alert("Payment verification failed. Please contact support.");
          }
        },
        modal: {
          ondismiss: () => {
            console.log("💳 Payment modal closed");
            setLoading(false);
          },
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();

    } catch (error) {
      console.error("❌ Payment initiation error:", error);
      alert(`Payment failed: ${error.message}`);
      setLoading(false);
    }
  };

  if (!token || cart.length === 0) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading checkout...</p>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      <div className="checkout-content">
        <div className="checkout-sections">
          {/* Shipping Address Section */}
          <div className="checkout-section">
            <h2>📦 Shipping Address</h2>
            <div className="address-form">
              <div className="form-row">
                <input
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  value={shippingAddress.name}
                  onChange={handleAddressChange}
                  required
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={shippingAddress.email}
                  onChange={handleAddressChange}
                  required
                />
              </div>
              <div className="form-row">
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone Number"
                  value={shippingAddress.phone}
                  onChange={handleAddressChange}
                  required
                />
                <input
                  type="text"
                  name="pincode"
                  placeholder="Pincode"
                  value={shippingAddress.pincode}
                  onChange={handleAddressChange}
                  required
                />
              </div>
              <textarea
                name="address"
                placeholder="Full Address"
                value={shippingAddress.address}
                onChange={handleAddressChange}
                rows="3"
                required
              ></textarea>
              <div className="form-row">
                <input
                  type="text"
                  name="city"
                  placeholder="City"
                  value={shippingAddress.city}
                  onChange={handleAddressChange}
                  required
                />
                <input
                  type="text"
                  name="state"
                  placeholder="State"
                  value={shippingAddress.state}
                  onChange={handleAddressChange}
                  required
                />
              </div>
            </div>
          </div>

          {/* ✅ SINGLE Order Summary Section - FIXED IMAGE HANDLING */}
          <div className="checkout-section">
            <h2>📋 Order Summary</h2>
            <div className="order-summary">
              {cart.map((item, index) => {
                // ✅ Enhanced item data processing
                let itemData;
                
                if (item.isCustomDesign || item.customDesign) {
                  // Custom design item
                  itemData = {
                    name: item.customDesign?.name || item.name || "Custom Design",
                    price: Number(item.customDesign?.price || item.price || 0),
                    image: item.customDesign?.image || item.image || item.designImage,
                    quantity: Number(item.quantity || 1),
                    isCustom: true
                  };
                } else {
                  // Regular product item
                  itemData = {
                    name: item.product?.name || item.name || "Product",
                    price: Number(item.product?.price || item.price || 0),
                    image: item.product?.image || item.image,
                    quantity: Number(item.quantity || 1),
                    isCustom: false
                  };
                }

                // ✅ Enhanced image URL handling
                const getImageSrc = () => {
                  if (!itemData.image) {
                    console.log("No image found for:", itemData.name);
                    return createFallbackImage();
                  }
                  
                  // If it's a base64 image (custom design), use directly
                  if (itemData.image.startsWith("data:image/")) {
                    console.log("Using base64 image for:", itemData.name);
                    return itemData.image;
                  }
                  
                  // If it's a server image path, prepend server URL
                  if (itemData.image.startsWith("/uploads")) {
                    const fullUrl = `http://localhost:5000${itemData.image}`;
                    console.log("Using server image for:", itemData.name, "URL:", fullUrl);
                    return fullUrl;
                  }
                  
                  // If it's already a full URL, use it
                  if (itemData.image.startsWith("http")) {
                    console.log("Using external URL for:", itemData.name);
                    return itemData.image;
                  }
                  
                  // Default fallback
                  console.log("Using fallback image for:", itemData.name);
                  return createFallbackImage();
                };

                // ✅ Create fallback image function
                const createFallbackImage = () => {
                  return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Crect width='60' height='60' fill='%23f8f9fa' stroke='%23dee2e6'/%3E%3Ctext x='30' y='30' text-anchor='middle' dy='0.3em' font-size='16' fill='%236c757d'%3E📦%3C/text%3E%3C/svg%3E";
                };

                return (
                  <div key={`${item._id || item.cartItemId || index}`} className="order-item">
                    <div className="order-item-image-container">
                      <img 
                        src={getImageSrc()}
                        alt={itemData.name}
                        className="order-item-image"
                        onError={(e) => {
                          console.log("Image load error for:", itemData.name, "Original src:", e.target.src);
                          e.target.src = createFallbackImage();
                        }}
                        onLoad={() => console.log("✅ Image loaded successfully for:", itemData.name)}
                      />
                      {itemData.isCustom && (
                        <div className="custom-design-badge">🎨</div>
                      )}
                    </div>
                    <div className="order-item-details">
                      <h4>{itemData.name}</h4>
                      <p>Quantity: {itemData.quantity}</p>
                      <p className="item-price">₹{(itemData.price * itemData.quantity).toFixed(2)}</p>
                      {itemData.isCustom && (
                        <p className="custom-label">Custom Design</p>
                      )}
                    </div>
                  </div>
                );
              })}
              
              <div className="order-total">
                <div className="total-row">
                  <span>Subtotal ({cart.length} items):</span>
                  <span>₹{getCartTotal().toFixed(2)}</span>
                </div>
                <div className="total-row">
                  <span>Shipping:</span>
                  <span>Free</span>
                </div>
                <div className="total-row final-total">
                  <strong>Total: ₹{getCartTotal().toFixed(2)}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Button */}
        <div className="payment-section">
          <button
            className="pay-now-button"
            onClick={handlePayment}
            disabled={loading}
          >
            {loading ? "Processing..." : `Pay ₹${getCartTotal().toFixed(2)} with Razorpay`}
          </button>
          <p className="payment-note">
            🔒 Secure payment powered by Razorpay
          </p>
        </div>
      </div>
    </div>
  );
}
