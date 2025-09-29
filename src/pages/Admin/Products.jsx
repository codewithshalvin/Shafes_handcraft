import { useEffect, useState, useRef } from "react";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    category: "",
    stock: "",
    description: "",
    image: null,
  });
  const [editingProduct, setEditingProduct] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const fileInputRef = useRef(null);

  // ✅ Stock status helper
  const getStockStatus = (stock) => {
    const stockNum = parseInt(stock);
    return stockNum > 0 ? "Active" : "Inactive";
  };

  const getPermissions = (stock) => {
    const stockNum = parseInt(stock);
    const permissions = ["Read"];
    if (stockNum > 0) {
      permissions.push("Create", "Edit");
    }
    if (stockNum < 5) {
      permissions.push("Delete");
    }
    return permissions;
  };

  // ✅ Fetch products & categories on load
  useEffect(() => {
    fetch("http://localhost:5000/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setProducts(data.products);
      })
      .catch((err) => console.error("Error fetching products:", err));

    fetch("http://localhost:5000/getcategories")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setCategories(data.categories);
      })
      .catch((err) => console.error("Error fetching categories:", err));
  }, []);

  // ✅ Handle select all
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedProducts(filteredProducts.map(p => p._id));
    } else {
      setSelectedProducts([]);
    }
  };

  // ✅ Handle individual select
  const handleSelectProduct = (productId) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  // ✅ Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) {
      alert("Please select products to delete");
      return;
    }
    
    if (!window.confirm(`Are you sure you want to delete ${selectedProducts.length} product(s)?`)) return;

    try {
      const promises = selectedProducts.map(id =>
        fetch(`http://localhost:5000/api/products/${id}`, { method: "DELETE" })
      );
      
      await Promise.all(promises);
      setProducts(prev => prev.filter(p => !selectedProducts.includes(p._id)));
      setSelectedProducts([]);
    } catch (err) {
      console.error("Error deleting products:", err);
    }
  };

  // ✅ Add / Update product
  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("name", newProduct.name);
    formData.append("price", newProduct.price);
    formData.append("category", newProduct.category);
    formData.append("description", newProduct.description);
    formData.append("stock", newProduct.stock);
    if (newProduct.image) {
      formData.append("image", newProduct.image);
    }

    try {
      const url = editingProduct
        ? `http://localhost:5000/api/products/${editingProduct._id}`
        : "http://localhost:5000/addproducts";

      const method = editingProduct ? "PUT" : "POST";

      const res = await fetch(url, { method, body: formData });
      const data = await res.json();

      if (data.success) {
        if (editingProduct) {
          setProducts((prev) =>
            prev.map((p) => (p._id === editingProduct._id ? data.product : p))
          );
        } else {
          setProducts((prev) => [...prev, data.product]);
        }
        resetForm();
        setShowAddForm(false);
      } else {
        alert(data.message || "Failed to save product");
      }
    } catch (err) {
      console.error("Error saving product:", err);
    }
  };

  // ✅ Reset form
  const resetForm = () => {
    setNewProduct({ name: "", price: "", category: "", stock: "", description: "", image: null });
    setEditingProduct(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ✅ Edit product
  const handleEdit = (product) => {
    setEditingProduct(product);
    setNewProduct({
      name: product.name,
      price: product.price,
      category: product.category,
      stock: product.stock,
      description: product.description || "",
      image: null,
    });
    setShowAddForm(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ✅ Delete product
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    try {
      const res = await fetch(`http://localhost:5000/api/products/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (data.success) {
        setProducts((prev) => prev.filter((p) => p._id !== id));
      } else {
        alert(data.message || "Failed to delete product");
      }
    } catch (err) {
      console.error("Error deleting product:", err);
    }
  };

  // ✅ Toggle product status
  const toggleProductStatus = async (productId, currentStock) => {
    const newStock = currentStock > 0 ? 0 : 10;
    
    try {
      const res = await fetch(`http://localhost:5000/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: newStock })
      });
      
      if (res.ok) {
        setProducts(prev => prev.map(p => 
          p._id === productId ? { ...p, stock: newStock } : p
        ));
      }
    } catch (err) {
      console.error("Error updating product status:", err);
    }
  };

  // ✅ Sorting
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // ✅ Filter and search products
  let filteredProducts = selectedCategory === "All" 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  if (searchTerm) {
    filteredProducts = filteredProducts.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }

  // ✅ Apply sorting
  if (sortConfig.key) {
    filteredProducts.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  // ✅ Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div style={{
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '2rem',
      backgroundColor: '#ffffff',
      minHeight: '100vh',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        paddingBottom: '1rem',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div style={{
          fontSize: '1.5rem',
          fontWeight: '600',
          color: '#1f2937',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
           Product List
        </div>
        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
          
        </div>
      </div>

      {/* Action Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
        gap: '1rem',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              border: 'none',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              backgroundColor: '#3b82f6',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            + ADD
          </button>
          <button 
            onClick={handleBulkDelete}
            disabled={selectedProducts.length === 0}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              border: 'none',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: selectedProducts.length > 0 ? 'pointer' : 'not-allowed',
              backgroundColor: selectedProducts.length > 0 ? '#ef4444' : '#d1d5db',
              color: 'white',
              opacity: selectedProducts.length > 0 ? 1 : 0.5
            }}
          >
            DELETE
          </button>
        </div>
      </div>

      {/* Add Product Form */}
      {showAddForm && (
        <div style={{
          padding: '2rem',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          border: '1px solid #e5e7eb',
          borderRadius: '1.5rem',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
          marginBottom: '2rem'
        }}>
          <form onSubmit={handleSubmit}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1.5rem',
              marginBottom: '1.5rem'
            }}>
              <input
                type="text"
                placeholder="Product Name"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                style={{
                  width: '100%',
                  border: '1px solid #d1d5db',
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  fontSize: '1rem',
                  outline: 'none'
                }}
                required
              />
              <input
                type="number"
                placeholder="Price"
                value={newProduct.price}
                onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                style={{
                  width: '100%',
                  border: '1px solid #d1d5db',
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  fontSize: '1rem',
                  outline: 'none'
                }}
                required
              />
              <select
                value={newProduct.category}
                onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                style={{
                  width: '100%',
                  border: '1px solid #d1d5db',
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  fontSize: '1rem',
                  outline: 'none'
                }}
                required
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat.categoryname}>
                    {cat.categoryname}
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Stock"
                value={newProduct.stock}
                onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                style={{
                  width: '100%',
                  border: '1px solid #d1d5db',
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  fontSize: '1rem',
                  outline: 'none'
                }}
                required
              />
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => setNewProduct({ ...newProduct, image: e.target.files[0] })}
                accept="image/*"
                style={{
                  width: '100%',
                  border: '1px solid #d1d5db',
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  fontSize: '1rem'
                }}
              />
            </div>
            
            {/* Description textarea - full width */}
            <div style={{ marginBottom: '1.5rem' }}>
              <textarea
                placeholder="Product Description"
                value={newProduct.description}
                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                rows={4}
                style={{
                  width: '100%',
                  border: '1px solid #d1d5db',
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  fontSize: '1rem',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="submit" style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: 'white',
                padding: '1rem 2rem',
                borderRadius: '0.75rem',
                border: 'none',
                fontWeight: '600',
                fontSize: '1rem',
                cursor: 'pointer',
                flex: 1
              }}>
                {editingProduct ? "Update Product" : "Add Product"}
              </button>
              {editingProduct && (
                <button type="button" onClick={() => { resetForm(); setShowAddForm(false); }} style={{
                  backgroundColor: '#6b7280',
                  color: 'white',
                  padding: '1rem 2rem',
                  borderRadius: '0.75rem',
                  border: 'none',
                  fontWeight: '600',
                  fontSize: '1rem',
                  cursor: 'pointer'
                }}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Search and Filter */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <input
          type="text"
          placeholder="Search products, categories, or descriptions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '300px',
            padding: '0.5rem 0.75rem',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            outline: 'none'
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
          <select 
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            style={{
              padding: '0.25rem 0.5rem',
              border: '1px solid #e5e7eb',
              borderRadius: '0.375rem',
              fontSize: '0.875rem'
            }}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Category Filter */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        overflowX: 'auto',
        padding: '1rem 0',
        marginBottom: '1.5rem'
      }}>
        <button
          onClick={() => setSelectedCategory("All")}
          style={{
            padding: '0.75rem 1.5rem',
            border: 'none',
            backgroundColor: selectedCategory === "All" ? '#3b82f6' : '#e5e7eb',
            borderRadius: '9999px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            fontWeight: '500',
            color: selectedCategory === "All" ? 'white' : '#4b5563'
          }}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat._id}
            onClick={() => setSelectedCategory(cat.categoryname)}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              backgroundColor: selectedCategory === cat.categoryname ? '#3b82f6' : '#e5e7eb',
              borderRadius: '9999px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontWeight: '500',
              color: selectedCategory === cat.categoryname ? 'white' : '#4b5563'
            }}
          >
            {cat.categoryname}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{
        background: 'white',
        borderRadius: '0.75rem',
        border: '1px solid #e5e7eb',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
            <tr>
              <th style={{ padding: '1rem', textAlign: 'left', width: '50px' }}>
                <input
                  type="checkbox"
                  checked={selectedProducts.length === paginatedProducts.length && paginatedProducts.length > 0}
                  onChange={handleSelectAll}
                  style={{ width: '16px', height: '16px', accentColor: '#3b82f6', cursor: 'pointer' }}
                />
              </th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.875rem', color: '#374151' }}>Image</th>
              <th 
                onClick={() => handleSort('name')}
                style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.875rem', color: '#374151', cursor: 'pointer' }}
              >
                Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.875rem', color: '#374151' }}>Description</th>
              <th 
                onClick={() => handleSort('price')}
                style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.875rem', color: '#374151', cursor: 'pointer' }}
              >
                Price {sortConfig.key === 'price' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.875rem', color: '#374151' }}>Status</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.875rem', color: '#374151' }}>Permissions</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.875rem', color: '#374151' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedProducts.map((product) => (
              <tr key={product._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '1rem' }}>
                  <input
                    type="checkbox"
                    checked={selectedProducts.includes(product._id)}
                    onChange={() => handleSelectProduct(product._id)}
                    style={{ width: '16px', height: '16px', accentColor: '#3b82f6', cursor: 'pointer' }}
                  />
                </td>
                <td style={{ padding: '1rem' }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '0.5rem',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f3f4f6'
                  }}>
                    {product.image ? (
                      <img
                        src={`http://localhost:5000${product.image}`}
                        alt={product.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>No Image</span>
                    )}
                  </div>
                </td>
                <td style={{ padding: '1rem', fontWeight: '500', color: '#1f2937', fontSize: '0.875rem' }}>
                  {product.name}
                </td>
                <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#6b7280', maxWidth: '200px' }}>
                  <div style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }} title={product.description}>
                    {product.description || 'No description'}
                  </div>
                </td>
                <td style={{ padding: '1rem', fontWeight: '600', color: '#059669', fontSize: '0.875rem' }}>
                  ₹{product.price}
                </td>
                <td style={{ padding: '1rem' }}>
                  <label style={{
                    position: 'relative',
                    display: 'inline-block',
                    width: '48px',
                    height: '24px'
                  }}>
                    <input
                      type="checkbox"
                      checked={product.stock > 0}
                      onChange={() => toggleProductStatus(product._id, product.stock)}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span style={{
                      position: 'absolute',
                      cursor: 'pointer',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: product.stock > 0 ? '#10b981' : '#d1d5db',
                      transition: '0.3s',
                      borderRadius: '24px'
                    }}>
                      <span style={{
                        position: 'absolute',
                        height: '18px',
                        width: '18px',
                        left: product.stock > 0 ? '27px' : '3px',
                        bottom: '3px',
                        backgroundColor: 'white',
                        transition: '0.3s',
                        borderRadius: '50%',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
                        display: 'block'
                      }} />
                    </span>
                  </label>
                </td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                    {getPermissions(product.stock).map((permission) => (
                      <span
                        key={permission}
                        style={{
                          padding: '0.125rem 0.5rem',
                          borderRadius: '0.375rem',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          whiteSpace: 'nowrap',
                          backgroundColor: permission === 'Create' ? '#dcfce7' : 
                                         permission === 'Read' ? '#dbeafe' : 
                                         permission === 'Edit' ? '#fef3c7' : '#fee2e2',
                          color: permission === 'Create' ? '#166534' : 
                                permission === 'Read' ? '#1d4ed8' : 
                                permission === 'Edit' ? '#92400e' : '#991b1b'
                        }}
                      >
                        {permission}
                      </span>
                    ))}
                  </div>
                </td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button
                      onClick={() => handleEdit(product)}
                      style={{
                        padding: '0.375rem',
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        backgroundColor: '#f3f4f6',
                        color: '#6b7280',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(product._id)}
                      style={{
                        padding: '0.375rem',
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        backgroundColor: '#fee2e2',
                        color: '#dc2626',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem 1.5rem',
          backgroundColor: '#f9fafb',
          borderTop: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredProducts.length)} of {filteredProducts.length} entries
          </div>
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              style={{
                padding: '0.5rem 0.75rem',
                border: '1px solid #e5e7eb',
                backgroundColor: 'white',
                color: '#374151',
                borderRadius: '0.375rem',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                opacity: currentPage === 1 ? 0.5 : 1
              }}
            >
              Previous
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                style={{
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #e5e7eb',
                  backgroundColor: currentPage === i + 1 ? '#3b82f6' : 'white',
                  color: currentPage === i + 1 ? 'white' : '#374151',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              style={{
                padding: '0.5rem 0.75rem',
                border: '1px solid #e5e7eb',
                backgroundColor: 'white',
                color: '#374151',
                borderRadius: '0.375rem',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                opacity: currentPage === totalPages ? 0.5 : 1
              }}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {paginatedProducts.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          color: '#6b7280'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
          <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.125rem', fontWeight: '500', color: '#374151' }}>
            No products found
          </h3>
          <p style={{ margin: 0, fontSize: '0.875rem' }}>
            {searchTerm ? 'Try adjusting your search terms' : 'Add your first product to get started'}
          </p>
        </div>
      )}
    </div>
  );
}