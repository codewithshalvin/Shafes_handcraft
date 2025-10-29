import { Link, useParams } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useRecentlyViewed } from "../context/RecentlyViewedContext";
import { useState, useEffect } from "react";
import RecentlyViewed from "../components/RecentlyViewed";
import "./ProductDetails.css";

export default function ProductDetails() {
  const { id } = useParams();
  const { addToCart, addToWishlist } = useCart();
  const { addToRecentlyViewed } = useRecentlyViewed();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [specialRequest, setSpecialRequest] = useState("");
  const [uploadedPhotos, setUploadedPhotos] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);

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
          
          // ✅ ADD TO RECENTLY VIEWED when product is loaded
          addToRecentlyViewed(data.product);
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
  }, [id, addToRecentlyViewed]);

  const handleRequestChange = (e) => {
    setSpecialRequest(e.target.value);
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;
    
    // Check if adding these files would exceed the 10 image limit
    if (uploadedPhotos.length + files.length > 10) {
      alert(`You can only upload up to 10 images. Currently you have ${uploadedPhotos.length} images.`);
      return;
    }

    setIsUploading(true);
    
    const processFiles = async () => {
      const newPhotos = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          alert(`${file.name} is too large. Please select images smaller than 5MB`);
          continue;
        }

        // Check file type
        if (!file.type.startsWith('image/')) {
          alert(`${file.name} is not a valid image file`);
          continue;
        }

        // Create preview
        const reader = new FileReader();
        const preview = await new Promise((resolve) => {
          reader.onload = (event) => resolve(event.target.result);
          reader.readAsDataURL(file);
        });
        
        newPhotos.push({
          id: Date.now() + i,
          file: file,
          preview: preview,
          name: file.name,
          size: file.size,
          type: file.type
        });
      }
      
      setUploadedPhotos(prev => [...prev, ...newPhotos]);
      setIsUploading(false);
      
      // Reset file input
      e.target.value = '';
    };
    
    processFiles();
  };

  const removePhoto = (photoId) => {
    setUploadedPhotos(prev => prev.filter(photo => photo.id !== photoId));
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    
    if (draggedIndex === null) return;
    
    const newPhotos = [...uploadedPhotos];
    const draggedPhoto = newPhotos[draggedIndex];
    
    // Remove from original position
    newPhotos.splice(draggedIndex, 1);
    
    // Insert at new position
    newPhotos.splice(dropIndex, 0, draggedPhoto);
    
    setUploadedPhotos(newPhotos);
    setDraggedIndex(null);
  };

  const movePhoto = (fromIndex, toIndex) => {
    const newPhotos = [...uploadedPhotos];
    const [movedPhoto] = newPhotos.splice(fromIndex, 1);
    newPhotos.splice(toIndex, 0, movedPhoto);
    setUploadedPhotos(newPhotos);
  };

  const handleAddToCart = () => {
    if (product) {
      addToCart({ 
        ...product, 
        specialRequest,
        customPhotos: uploadedPhotos.length > 0 ? uploadedPhotos.map((photo, index) => ({
          ...photo,
          order: index + 1
        })) : []
      });
    }
  };

  if (loading) return <p>Loading product...</p>;
  if (!product) return <p>No product found.</p>;

  return (
    <div className="product-details-page">
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

          <div className="photo-upload-section">
            <label htmlFor="photo-upload">Upload Reference Photos (Optional - up to 10):</label>
            
            {/* Upload Button */}
            {uploadedPhotos.length < 10 && (
              <div className="photo-upload-area">
                <input
                  type="file"
                  id="photo-upload"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  style={{ display: 'none' }}
                />
                <label htmlFor="photo-upload" className="photo-upload-button">
                  {isUploading ? (
                    <span>📤 Uploading...</span>
                  ) : (
                    <>
                      <span className="upload-icon">📷</span>
                      <span>Click to upload photos ({uploadedPhotos.length}/10)</span>
                      <small>Max 5MB each • JPG, PNG, GIF</small>
                    </>
                  )}
                </label>
              </div>
            )}

            {/* Photo Gallery */}
            {uploadedPhotos.length > 0 && (
              <div className="photo-gallery">
                <div className="gallery-header">
                  <span>📸 {uploadedPhotos.length} photo{uploadedPhotos.length > 1 ? 's' : ''} uploaded</span>
                  <small>Drag to reorder</small>
                </div>
                <div className="photo-grid">
                  {uploadedPhotos.map((photo, index) => (
                    <div
                      key={photo.id}
                      className={`photo-item ${draggedIndex === index ? 'dragging' : ''}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, index)}
                    >
                      <div className="photo-order-badge">{index + 1}</div>
                      <img 
                        src={photo.preview} 
                        alt={`Reference ${index + 1}`}
                        className="photo-thumbnail"
                      />
                      <div className="photo-overlay">
                        <div className="photo-info">
                          <span className="photo-name" title={photo.name}>
                            {photo.name.length > 15 ? photo.name.substring(0, 15) + '...' : photo.name}
                          </span>
                          <span className="photo-size">
                            {(photo.size / 1024 / 1024).toFixed(1)} MB
                          </span>
                        </div>
                        <div className="photo-actions">
                          {index > 0 && (
                            <button 
                              type="button" 
                              className="move-btn move-up"
                              onClick={() => movePhoto(index, index - 1)}
                              title="Move up"
                            >
                              ↑
                            </button>
                          )}
                          {index < uploadedPhotos.length - 1 && (
                            <button 
                              type="button" 
                              className="move-btn move-down"
                              onClick={() => movePhoto(index, index + 1)}
                              title="Move down"
                            >
                              ↓
                            </button>
                          )}
                          <button 
                            type="button" 
                            className="remove-photo-btn"
                            onClick={() => removePhoto(photo.id)}
                            title="Remove photo"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                      <div className="drag-handle">⋮⋮</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <small className="photo-upload-note">
              💡 Upload reference photos to help us understand your requirements better. Drag photos to change their order.
            </small>
          </div>

          <div className="actions">
            <button className="btn add-to-cart" onClick={handleAddToCart}>
              ADD TO CART
            </button>
            <button
              className="btn add-to-wishlist"
              onClick={() => addToWishlist(product)}
            >
              ADD TO WISHLIST
            </button>
            <Link to="/customize" className="btn live-customize">
              LIVE CUSTOMIZE
            </Link>
          </div>
        </div>
      </div>

      {/* ✅ ADD RECENTLY VIEWED SECTION */}
      <RecentlyViewed currentProductId={product._id} />
    </div>
  );
}
