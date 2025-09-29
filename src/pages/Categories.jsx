// src/pages/CategoriesPage.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Categories.css";

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:5000/getcategories")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setCategories(data.categories);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching categories:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="categories-section">
        <div className="categories-container">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="category-card loading">
              <div className="category-image-container"></div>
              <div className="category-content">
                <div
                  style={{
                    height: "24px",
                    background: "#f1f5f9",
                    borderRadius: "4px",
                    marginBottom: "16px",
                  }}
                ></div>
                <div
                  style={{
                    height: "40px",
                    background: "#f1f5f9",
                    borderRadius: "20px",
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="categories-section">
      <div className="categories-container">
        {categories.length ? (
          categories.map((cat) => (
            <div key={cat._id} className="category-card">
              <div className="wishlist-heart">
                <svg
                  className="heart-icon"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </div>

              {cat.isFeatured && <div className="category-badge">New</div>}

              <div className="category-image-container">
                <img
                  src={
                    cat.image
                      ? cat.image.startsWith("/uploads")
                        ? `http://localhost:5000${cat.image}`
                        : cat.image
                      : "https://via.placeholder.com/300x200?text=No+Image"
                  }
                  alt={cat.categoryname}
                />
                <div className="image-overlay"></div>
              </div>

              <div className="category-content">
                <h3>{cat.categoryname}</h3>

                {/* ✅ Correct navigation to category route */}
                <Link
                  to={`/categories/${cat.categoryname.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <button className="view-button">VIEW</button>
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="categories-empty">
            <div className="empty-icon">📦</div>
            <h3 className="empty-title">No Categories Found</h3>
            <p className="empty-subtitle">
              Categories will appear here once they are added to the system.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
