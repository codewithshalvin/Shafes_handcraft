import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import "./Wishlist.css";

export default function Wishlist() {
  const { wishlist, removeFromWishlist, addToCart } = useCart();
  const navigate = useNavigate();

  return (
    <div className="wishlist-page">
      <h2>Your Wishlist</h2>
      {wishlist.length === 0 ? (
        <p className="wishlist-empty-message">Wishlist is empty</p>
      ) : (
        <div className="wishlist-items">
          {wishlist.map((item) => (
            <div key={item._id || item.id} className="card">
              <img
                src={
                  item.image?.startsWith("/uploads")
                    ? `http://localhost:5000${item.image}`
                    : item.image || "https://via.placeholder.com/150"
                }
                alt={item.name}
              />
              <div className="card-content">
                <h4>{item.name}</h4>
                <p>₹{item.price}</p>
              </div>
              <div className="card-buttons">
                <button className="btn move-to-cart" onClick={() => addToCart(item)}>
                  Move to Cart
                </button>
                <button
                  className="btn remove-btn"
                  onClick={() => removeFromWishlist(item._id || item.id)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
