import { Link, useParams } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useState, useEffect } from "react";
import "./ProductDetails.css";

export default function ProductDetails() {
  const { id } = useParams();
  const { addToCart, addToWishlist } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [specialRequest, setSpecialRequest] = useState("");

useEffect(() => {
  const fetchProduct = async () => {
    try {
      console.log("🔍 Fetching product with id:", id);

      const res = await fetch(`http://localhost:5000/api/products/${id}`);
      console.log("📡 Request sent:", res);

      const data = await res.json();
      console.log("✅ Response data in component:", data);

      if (data.success) {
        setProduct(data.product);
      } else {
        setProduct(null);
      }
    } catch (err) {
      console.error("❌ Error fetching product:", err);
    } finally {
      console.log("⏹ Setting loading to false");
      setLoading(false);
    }
  };

  fetchProduct();
}, [id]);


  const handleRequestChange = (e) => {
    setSpecialRequest(e.target.value);
  };

  const handleAddToCart = () => {
    if (product) {
      addToCart({ ...product, specialRequest });
    }
  };

  if (loading) return <p>Loading product...</p>;
  if (!product) return <p>No product found.</p>;

  return (
    <div className="product-details-container">
      <div className="product-image">
        <img src={`http://localhost:5000${product.image}`} alt={product.name} />
      </div>

      <div className="product-info">
        <h2 className="product-title">{product.name}</h2>
        <p className="product-description">{product.description}</p>
        <h3 className="product-price">₹{product.price}</h3>

        <div className="special-request">
          <label htmlFor="special-request">Special Request:</label>
          <textarea
            id="special-request"
            placeholder="Enter your request..."
            value={specialRequest}
            onChange={handleRequestChange}
          />
        </div>

        <div className="actions">
          <button className="btn add-to-cart" onClick={handleAddToCart}>
            Add to Cart
          </button>
          <button
            className="btn add-to-wishlist"
            onClick={() => addToWishlist(product)}
          >
            Add to Wishlist
          </button>
          <Link to="/customize" className="btn live-customize">
            Live Customize
          </Link>
        </div>
      </div>
    </div>
  );
}
