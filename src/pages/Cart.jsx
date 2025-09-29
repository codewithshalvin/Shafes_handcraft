import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import "./Cart.css";

export default function Cart() {
  const { cart, removeFromCart, updateQuantity, getCartTotal, getCartCount, loading, error } = useCart();
  const navigate = useNavigate();

  // ✅ Enhanced total calculation that handles both product types
  const calculateTotal = () => {
    return cart.reduce((sum, item) => {
      let price = 0;
      let quantity = item.quantity || 1;

      // ✅ Handle different item structures
      if (item.isCustomDesign || item.customDesign) {
        // Custom design items have price directly on item
        price = Number(item.price) || 0;
      } else if (item.product) {
        // Backend items with nested product object
        price = Number(item.product.price) || 0;
      } else {
        // Direct product items
        price = Number(item.price) || 0;
      }

      return sum + (price * quantity);
    }, 0);
  };

  const total = calculateTotal();

  // ✅ Helper function to get item display data
  const getItemData = (item) => {
    if (item.isCustomDesign || item.customDesign) {
      return {
        id: item.cartItemId || item._id || item.id,
        name: item.name || "Custom Design",
        price: item.price || 0,
        image: item.image || item.designImage,
        quantity: item.quantity || 1,
        isCustom: true,
        material: item.material?.name,
        size: item.size?.name,
        specialRequest: item.specialRequest || item.requestMessage,
        designDataURL: item.designImage || item.image
      };
    } else {
      return {
        id: item.product?._id || item._id || item.id,
        name: item.product?.name || item.name || "Unnamed Product",
        price: item.product?.price || item.price || 0,
        image: item.product?.image || item.image,
        quantity: item.quantity || 1,
        isCustom: false,
        specialRequest: item.specialRequest,
        designDataURL: item.product?.designDataURL
      };
    }
  };

  // ✅ Helper function to get correct image source
  const getImageSource = (itemData) => {
    if (itemData.isCustom && itemData.designDataURL) {
      return itemData.designDataURL;
    }
    
    if (itemData.image) {
      if (itemData.image.startsWith("/uploads")) {
        return `http://localhost:5000${itemData.image}`;
      }
      if (itemData.image.startsWith("data:") || itemData.image.startsWith("http")) {
        return itemData.image;
      }
    }
    
    return "https://via.placeholder.com/150?text=No+Image";
  };

  // ✅ Enhanced remove function
  const handleRemove = (item) => {
    const itemData = getItemData(item);
    removeFromCart(itemData.id, itemData.isCustom);
  };

  // ✅ Enhanced quantity update
  const handleQuantityChange = (item, newQuantity) => {
    const itemData = getItemData(item);
    updateQuantity(itemData.id, newQuantity, itemData.isCustom);
  };

  if (loading) {
    return (
      <div className="cart-container">
        <div className="loading-container">
          <p>Loading cart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <div className="cart-header-section">
        <h2 className="cart-header">🛒 Your Cart</h2>
        {cart.length > 0 && (
          <div className="cart-summary">
            <span className="cart-count">{getCartCount ? getCartCount() : cart.length} items</span>
            <span className="cart-total-preview">₹{total.toFixed(2)}</span>
          </div>
        )}
      </div>

      {error && (
        <div className="error-message">
          <p>⚠️ {error}</p>
        </div>
      )}

      {cart.length === 0 ? (
        <div className="empty-cart-section">
          <div className="empty-cart-icon">🛍️</div>
          <p className="empty-cart-message">
            Your cart is empty. Start shopping to add some amazing items!
          </p>
          <button 
            className="continue-shopping-btn"
            onClick={() => navigate("/")}
          >
            Continue Shopping
          </button>
        </div>
      ) : (
        <div className="cart-content">
          <div className="cart-items">
            {cart.map((item, index) => {
              const itemData = getItemData(item);
              
              return (
                <div key={`${itemData.id}-${index}`} className="cart-item">
                  {/* ✅ Enhanced Image Display */}
                  <div className="cart-item-image-container">
                    <img
                      src={getImageSource(itemData)}
                      alt={itemData.name}
                      className="cart-item-image"
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/150?text=No+Image";
                      }}
                    />
                    {itemData.isCustom && (
                      <div className="custom-design-overlay">
                        🎨
                      </div>
                    )}
                  </div>

                  {/* ✅ Enhanced Item Details */}
                  <div className="cart-item-details">
                    <div className="item-header">
                      <h4 className="cart-item-name">{itemData.name}</h4>
                      {itemData.isCustom && (
                        <span className="custom-design-badge">🎨 Custom Design</span>
                      )}
                    </div>

                    <div className="item-info">
                      <p className="cart-item-price">₹{Number(itemData.price).toFixed(2)}</p>
                      
                      {/* ✅ Custom Design Details */}
                      {itemData.isCustom && (
                        <div className="custom-details">
                          {itemData.material && (
                            <span className="detail-tag">Material: {itemData.material}</span>
                          )}
                          {itemData.size && (
                            <span className="detail-tag">Size: {itemData.size}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* ✅ Special Request Display */}
                    {itemData.specialRequest && itemData.specialRequest.trim() && (
                      <div className="special-request-container">
                        <strong className="special-request-label">📝 Special Request:</strong>
                        <p className="special-request-text">"{itemData.specialRequest.trim()}"</p>
                      </div>
                    )}
                  </div>

                  {/* ✅ Quantity Controls */}
                  <div className="cart-item-controls">
                    <div className="quantity-control">
                      <button 
                        className="qty-btn minus"
                        onClick={() => handleQuantityChange(item, Math.max(1, itemData.quantity - 1))}
                        disabled={itemData.quantity <= 1}
                      >
                        −
                      </button>
                      <span className="quantity-display">{itemData.quantity}</span>
                      <button 
                        className="qty-btn plus"
                        onClick={() => handleQuantityChange(item, itemData.quantity + 1)}
                      >
                        +
                      </button>
                    </div>

                    <div className="item-total">
                      <span className="item-total-price">
                        ₹{(Number(itemData.price) * itemData.quantity).toFixed(2)}
                      </span>
                    </div>

                    <button
                      className="remove-button"
                      onClick={() => handleRemove(item)}
                      title="Remove from cart"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ✅ Enhanced Cart Summary */}
          <div className="cart-summary-section">
            <div className="cart-total-breakdown">
              <div className="total-line">
                <span>Subtotal ({getCartCount ? getCartCount() : cart.length} items):</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
              <div className="total-line shipping">
                <span>Shipping:</span>
                <span>Calculated at checkout</span>
              </div>
              <div className="total-line final-total">
                <strong>Total: ₹{total.toFixed(2)}</strong>
              </div>
            </div>

            <div className="cart-actions">
              <button
                className="continue-shopping-btn secondary"
                onClick={() => navigate("/")}
              >
                Continue Shopping
              </button>
              <button
                onClick={() => navigate("/checkout")}
                className="checkout-button"
                disabled={cart.length === 0}
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
