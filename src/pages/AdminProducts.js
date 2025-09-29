import React, { useEffect, useState } from "react";
import { fetchProducts, addProduct, updateProduct, deleteProduct } from "../api";

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: "", price: "", category: "", image: "" });
  const [editingId, setEditingId] = useState(null);

  // Fetch products on mount
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const res = await fetchProducts();
      setProducts(res.data.products);
    } catch (err) {
      console.error("Error fetching products", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateProduct(editingId, form);
      } else {
        await addProduct(form);
      }
      setForm({ name: "", price: "", category: "", image: "" });
      setEditingId(null);
      loadProducts();
    } catch (err) {
      console.error("Error saving product", err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteProduct(id);
      loadProducts();
    } catch (err) {
      console.error("Error deleting product", err);
    }
  };

  const handleEdit = (product) => {
    setForm(product);
    setEditingId(product._id);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Manage Products</h2>

      {/* Add/Edit Form */}
      <form onSubmit={handleSubmit} className="mb-6 space-y-2">
        <input
          type="text"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="border p-2 w-full"
          required
        />
        <input
          type="number"
          placeholder="Price"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          className="border p-2 w-full"
          required
        />
        <input
          type="text"
          placeholder="Category"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="border p-2 w-full"
          required
        />
        <input
          type="text"
          placeholder="Image URL"
          value={form.image}
          onChange={(e) => setForm({ ...form, image: e.target.value })}
          className="border p-2 w-full"
        />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
          {editingId ? "Update Product" : "Add Product"}
        </button>
      </form>

      {/* Products List */}
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-2">Image</th>
            <th className="p-2">Name</th>
            <th className="p-2">Price</th>
            <th className="p-2">Category</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p._id} className="border-t text-center">
              <td className="p-2">
                {p.image ? <img src={p.image} alt={p.name} className="w-16 h-16 object-cover mx-auto" /> : "No Image"}
              </td>
              <td className="p-2">{p.name}</td>
              <td className="p-2">₹{p.price}</td>
              <td className="p-2">{p.category}</td>
              <td className="p-2 space-x-2">
                <button
                  onClick={() => handleEdit(p)}
                  className="bg-yellow-500 text-white px-2 py-1 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(p._id)}
                  className="bg-red-500 text-white px-2 py-1 rounded"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
