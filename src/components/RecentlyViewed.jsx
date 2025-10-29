// components/RecentlyViewed.jsx
import { useRecentlyViewed } from "../context/RecentlyViewedContext";
import { useCart } from "../context/CartContext";
import { Link } from "react-router-dom";
import "./RecentlyViewed.css";

export default function RecentlyViewed({ currentProductId }) {
  const { recentlyViewed, removeFromRecentlyViewed } = useRecentlyViewed();
  const { addToCart, addToWishlist } = useCart();

  // Filter out the current product from recently viewed
  const filteredProducts = recentlyViewed.filter(product => product._id !== currentProductId);

  if (filteredProducts.length === 0) {
    return null; // Don't show section if no recently viewed products
  }

  const handleQuickAddToCart = (e, product) => {
    e.preventDefault(); // Prevent navigation when clicking the button
    addToCart(product);
    
    // Show a quick feedback
    const button = e.target;
    const originalText = button.textContent;
    button.textContent = "Added!";
    button.style.background = "#28a745";
    
    setTimeout(() => {
      button.textContent = originalText;
      button.style.background = "";
    }, 1000);
  };

  const handleQuickAddToWishlist = (e, product) => {
    e.preventDefault(); // Prevent navigation when clicking the button
    addToWishlist(product);
    
    // Show a quick feedback
    const button = e.target;
    const originalText = button.textContent;
    button.textContent = "Added!";
    button.style.background = "#dc3545";
    
    setTimeout(() => {
      button.textContent = originalText;
      button.style.background = "";
    }, 1000);
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const viewed = new Date(dateString);
    const diffInMinutes = Math.floor((now - viewed) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="recently-viewed-section">
      <div className="recently-viewed-header">
        <h3>👁️ Recently Viewed Products</h3>
        <p>Products you've looked at recently</p>
      </div>
      
      <div className="recently-viewed-grid">
        {filteredProducts.slice(0, 6).map((product) => (
          <div key={product._id} className="recently-viewed-card">
            <Link to={`/products/${product._id}`} className="product-link">
              <div className="recently-viewed-image">
                <img 
                  src={`http://localhost:5000${product.image}`} 
                  alt={product.name}
                  onError={(e) => {
                    e.target.src = '/placeholder-image.jpg'; // Fallback image
                  }}
                />
                <div className="viewed-time">{formatTimeAgo(product.viewedAt)}</div>
                <button 
                  className="remove-btn"
                  onClick={(e) => {
                    e.preventDefault();
                    removeFromRecentlyViewed(product._id);
                  }}
                  title="Remove from recently viewed"
                >
                  ×
                </button>
              </div>
              
              <div className="recently-viewed-info">
                <h4 className="product-name">{product.name}</h4>
                <p className="product-price">₹{product.price}</p>
                <p className="product-description">
                  {product.description?.substring(0, 60)}
                  {product.description?.length > 60 ? "..." : ""}
                </p>
              </div>
            </Link>
            
            <div className="recently-viewed-actions">
              <button 
                className="quick-add-cart"
                onClick={(e) => handleQuickAddToCart(e, product)}
                title="Quick add to cart"
              >
                🛒 Add to Cart
              </button>
              <button 
                className="quick-add-wishlist"
                onClick={(e) => handleQuickAddToWishlist(e, product)}
                title="Add to wishlist"
              >
                ❤️
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {filteredProducts.length > 6 && (
        <div className="view-all-recently-viewed">
          <p>and {filteredProducts.length - 6} more items recently viewed</p>
        </div>
      )}
    </div>
  );
}
