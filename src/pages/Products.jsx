// src/pages/ProductsPage.jsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useCart } from "../context/CartContext"; // Import your cart context
import "./products.css";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const { category } = useParams(); // get category from URL (e.g., /products/resin)
  
  // Import cart and wishlist functions
  const { addToCart, addToWishlist, removeFromWishlist, wishlist } = useCart();

  useEffect(() => {
    fetch("http://localhost:5000/api/products") // Make sure this route returns products
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          if (category) {
            // filter products by category (case-insensitive)
            const filtered = data.products.filter(
              (p) => p.category.toLowerCase() === category.toLowerCase()
            );
            setProducts(filtered);
          } else {
            setProducts(data.products);
          }
        }
      })
      .catch((err) => console.error(err));
  }, [category]);

  // Check if product is in wishlist
  const isInWishlist = (productId) => {
    return wishlist.some(item => item._id === productId || item.id === productId);
  };

  // Handle add to cart
  const handleAddToCart = async (product, e) => {
    e.preventDefault(); // Prevent navigation when clicking cart icon
    try {
      await addToCart(product, 1);
      // Optional: Show success notification
      console.log(`${product.name} added to cart`);
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  // Handle wishlist toggle
  const handleWishlistToggle = async (product, e) => {
    e.preventDefault(); // Prevent navigation when clicking heart icon
    try {
      if (isInWishlist(product._id)) {
        await removeFromWishlist(product._id);
        console.log(`${product.name} removed from wishlist`);
      } else {
        await addToWishlist(product);
        console.log(`${product.name} added to wishlist`);
      }
    } catch (error) {
      console.error('Error updating wishlist:', error);
    }
  };

  return (
    <div className="products-section">
      <div className="products-header">
        <h2 className="products-title">
          🛍️ {category ? `${category} Products` : "Our Products"}
        </h2>
      </div>

      {products.length ? (
        <div className="products-container">
          {products.map((p) => (
            <div key={p._id} className="product-card">
              <div className="product-image-container">
                {p.image ? (
                  <img src={`http://localhost:5000${p.image}`} alt={p.name} />
                ) : (
                  <div className="no-image-placeholder">No Image</div>
                )}
                
                {/* Wishlist and Cart Icons */}
                <div className="product-actions">
                  <button
                    className={`wishlist-btn ${isInWishlist(p._id) ? 'active' : ''}`}
                    onClick={(e) => handleWishlistToggle(p, e)}
                    title={isInWishlist(p._id) ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill={isInWishlist(p._id) ? '#ef4444' : 'none'}
                      stroke={isInWishlist(p._id) ? '#ef4444' : '#6b7280'}
                      strokeWidth="2"
                    >
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                  </button>
                  
                  <button
                    className="cart-btn"
                    onClick={(e) => handleAddToCart(p, e)}
                    disabled={p.stock === 0}
                    title={p.stock === 0 ? 'Out of stock' : 'Add to cart'}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#6b7280"
                      strokeWidth="2"
                    >
                      <circle cx="9" cy="21" r="1"></circle>
                      <circle cx="20" cy="21" r="1"></circle>
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                    </svg>
                  </button>
                </div>
              </div>

              <div className="product-content">
                <h3>{p.name}</h3>
                <p className="product-price">₹{p.price}</p>
                <p className="product-category">{p.category}</p>
                
                <p
                  className={`product-stock ${
                    p.stock < 5
                      ? "stock-low"
                      : p.stock < 15
                      ? "stock-medium"
                      : "stock-high"
                  }`}
                >
                  Stock: {p.stock}
                </p>
              </div>

              {/* ✅ Explicitly passing _id and logging */}
              {console.log("Product link id:", p._id)}
              <Link to={`/products/${p._id}`} className="add-to-cart-button">
                View
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="products-empty">
          <div className="empty-icon">🛒</div>
          <div className="empty-title">No products available</div>
          <div className="empty-subtitle">
            {category
              ? `No products found for ${category}.`
              : "Please check back later."}
          </div>
        </div>
      )}
    </div>
  );
}
