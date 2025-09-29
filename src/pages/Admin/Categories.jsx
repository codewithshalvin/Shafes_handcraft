import React, { useState, useEffect } from "react";
import { Search, Edit, Trash2, Plus, X, Eye } from "lucide-react";
import "./categories.css"; // custom styles

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [categoryname, setCategoryname] = useState("");
  const [image, setImage] = useState(null);
  const [message, setMessage] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState("10");
  const [selectedItems, setSelectedItems] = useState([]);

  // ✅ Fetch categories
  useEffect(() => {
    fetch("http://localhost:5000/getcategories")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setCategories(data.categories);
      })
      .catch((err) => console.error("Error fetching categories:", err));
  }, []);

  // ✅ Add category
  const handleSubmit = async () => {
    if (!categoryname) {
      setMessage("⚠️ Category name is required");
      return;
    }

    const formData = new FormData();
    formData.append("categoryname", categoryname);
    if (image) formData.append("image", image);

    try {
      const res = await fetch("http://localhost:5000/addcategory", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        setMessage("✅ Category added successfully!");
        setCategories([...categories, data.category]);
        setCategoryname("");
        setImage(null);
        setShowAddForm(false);
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("❌ Failed to add category");
      }
    } catch (err) {
      console.error(err);
      setMessage("⚠️ Error connecting to server");
    }
  };

  // ✅ Delete category
 const handleDelete = async (id) => {
  console.log("Trying to delete category:", id);
  try {
    const res = await fetch(`http://localhost:5000/deletecategory/${id}`, {
      method: "DELETE",
    });

    console.log("Response status:", res.status);
    const text = await res.text();
    console.log("Raw response:", text);

    // Only parse JSON if response is JSON
    try {
      const data = JSON.parse(text);
      if (data.success) {
        setCategories(categories.filter((cat) => cat._id !== id));
        setMessage("✅ Category deleted successfully!");
      } else {
        setMessage("❌ Failed to delete category");
      }
    } catch (e) {
      console.error("Not JSON:", text);
      setMessage("⚠️ Server returned non-JSON");
    }
  } catch (err) {
    console.error("Delete error:", err);
    setMessage("⚠️ Error deleting category");
  }
};

  const filteredCategories = categories.filter((cat) =>
    cat.categoryname.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Categories Management</h1>
        <p>Manage your product categories efficiently</p>
      </div>

      {message && <div className="alert">{message}</div>}

      <div className="action-bar">
        <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
          <Plus size={16} /> Add Category
        </button>

        <input
          type="text"
          placeholder="Search categories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />

        <select
          value={itemsPerPage}
          onChange={(e) => setItemsPerPage(e.target.value)}
          className="select-box"
        >
          <option value="10">10</option>
          <option value="25">25</option>
          <option value="50">50</option>
          <option value="100">All</option>
        </select>
      </div>

      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Category</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCategories.length > 0 ? (
              filteredCategories
                .slice(0, itemsPerPage === "100" ? undefined : parseInt(itemsPerPage))
                .map((cat, index) => (
                  <tr key={cat._id}>
                    <td>{index + 1}</td>
                    <td className="category-cell">
                      <img
                        src={`http://localhost:5000${cat.image}`}
                        alt={cat.categoryname}
                        className="category-img"
                        onError={(e) => (e.target.style.display = "none")}
                      />
                      <span>{cat.categoryname}</span>
                    </td>
                    <td>
                      <span className="status active">Active</span>
                    </td>
                    <td>{new Date().toLocaleDateString()}</td>
                    <td>
                      <button className="btn-icon edit">
                        <Edit size={16} />
                      </button>
                      <button className="btn-icon delete" onClick={() => handleDelete(cat._id)}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
            ) : (
              <tr>
                <td colSpan="5" className="no-data">
                  No categories found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Add New Category</h3>
              <button onClick={() => setShowAddForm(false)} className="btn-icon close">
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <input
                type="text"
                placeholder="Enter category name"
                value={categoryname}
                onChange={(e) => setCategoryname(e.target.value)}
              />
              <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} />
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowAddForm(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSubmit}>
                Add Category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
