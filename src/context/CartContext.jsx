import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { handleCustomerPhotoUpload, handleMultipleCustomerPhotos } from '../utils/photoUpload';

const CartContext = createContext();

export function useCart() {
  return useContext(CartContext);
}

export function CartProvider({ children }) {
  const auth = useAuth() || {};
  const { token } = auth;

  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ✅ Enhanced localStorage functions with better error handling
  const saveCartToStorage = (cartData) => {
    try {
      // Only save custom designs locally, server items are handled by backend
      const localItems = cartData.filter(item => 
        (item.isCustomDesign || item.customDesign) && item.isLocal
      );
      
      if (localItems.length > 0) {
        // Check total size before saving
        const dataString = JSON.stringify(localItems);
        if (dataString.length > 5000000) { // ~5MB limit
          console.warn("Cart data too large, compressing...");
          // Compress images if needed
          const compressedItems = localItems.map(item => {
            if (item.image && item.image.length > 100000) { // ~100KB limit per image
              return {
                ...item,
                image: item.image.substring(0, 100000) + '...compressed',
                imageCompressed: true
              };
            }
            return item;
          });
          localStorage.setItem('shafe_cart', JSON.stringify(compressedItems));
        } else {
          localStorage.setItem('shafe_cart', dataString);
        }
        console.log(`Saved ${localItems.length} local cart items`);
      } else {
        localStorage.removeItem('shafe_cart');
      }
    } catch (error) {
      console.error("Failed to save cart to localStorage:", error);
      // Clear storage if save fails
      try {
        localStorage.removeItem('shafe_cart');
      } catch (clearError) {
        console.error("Failed to clear localStorage:", clearError);
      }
    }
  };

  const loadCartFromStorage = () => {
    try {
      const savedCart = localStorage.getItem('shafe_cart');
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        console.log(`Loaded ${parsedCart.length} local cart items`);
        return Array.isArray(parsedCart) ? parsedCart : [];
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
      localStorage.removeItem('shafe_cart');
    }
    return [];
  };

  // ✅ Load cart from localStorage on mount (only for offline custom designs)
  useEffect(() => {
    const localCart = loadCartFromStorage();
    if (localCart.length > 0) {
      setCart(localCart);
    }
  }, []);

  // ✅ Save only local custom designs to localStorage
  useEffect(() => {
    if (cart.length >= 0) { // Allow saving empty carts too
      saveCartToStorage(cart);
    }
  }, [cart]);

  // ✅ Enhanced token change handling
  useEffect(() => {
    if (token) {
      fetchCartAndWishlist();
    } else {
      // Keep only local custom designs when logged out
      setCart(prevCart => {
        const localItems = prevCart.filter(item => 
          (item.isCustomDesign || item.customDesign) && item.isLocal
        );
        console.log(`Keeping ${localItems.length} local items after logout`);
        return localItems;
      });
      setWishlist([]);
    }
  }, [token]);

  // ✅ Validate custom design data before sending
  const validateCustomDesign = (product) => {
    const errors = [];
    
    if (!product.name || product.name.trim() === '') {
      errors.push('Product name is required');
    }
    
    if (!product.price || isNaN(product.price) || product.price <= 0) {
      errors.push('Valid price is required');
    }
    
    if (!product.image || !product.image.startsWith('data:image/')) {
      errors.push('Valid image data is required');
    }
    
    if (product.image && product.image.length > 10000000) { // 10MB limit
      errors.push('Image size too large');
    }
    
    return errors;
  };

  // ✅ Sync local custom designs with server when user logs in
  const syncLocalCustomDesigns = async (localCustomItems) => {
    if (!token || localCustomItems.length === 0) return;

    console.log(`Syncing ${localCustomItems.length} local custom designs to server...`);
    
    try {
      let syncSuccessCount = 0;
      let syncErrorCount = 0;

      for (const item of localCustomItems) {
        if (item.isLocal && (item.isCustomDesign || item.customDesign)) {
          try {
            // Validate before sending
            const validationErrors = validateCustomDesign(item);
            if (validationErrors.length > 0) {
              console.error('Validation failed for item:', item.name, validationErrors);
              syncErrorCount++;
              continue;
            }

            const payload = {
              quantity: item.quantity || 1,
              specialRequest: item.specialRequest || "",
              customDesign: {
                name: item.name || "Custom Design",
                price: Number(item.price) || 299,
                image: item.image || "",
                designData: item.designData || "",
                material: item.material || { type: "resin", name: "Resin", multiplier: 1 },
                size: item.size || { value: "4", name: "4 inch", multiplier: 1 },
                pricing: item.pricing || { basePrice: 299, finalPrice: Number(item.price) || 299 },
                specifications: item.specifications || {}
              }
            };

            console.log(`Syncing item: ${item.name}...`);
            
            const response = await fetch("http://localhost:5000/api/cart/add", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(payload),
            });

            if (!response.ok) {
              const errorText = await response.text();
              console.error(`Failed to sync item ${item.name}:`, errorText);
              syncErrorCount++;
            } else {
              syncSuccessCount++;
              console.log(`Successfully synced: ${item.name}`);
            }
          } catch (itemError) {
            console.error(`Error syncing item ${item.name}:`, itemError);
            syncErrorCount++;
          }
        }
      }
      
      console.log(`Sync complete: ${syncSuccessCount} success, ${syncErrorCount} failed`);
      
      // Clear local storage only if all items synced successfully
      if (syncErrorCount === 0) {
        localStorage.removeItem('shafe_cart');
        console.log("Local storage cleared after successful sync");
      } else {
        console.warn("Some items failed to sync, keeping local storage");
      }
      
    } catch (error) {
      console.error("Failed to sync local custom designs:", error);
    }
  };

  // ✅ Enhanced fetch function with better error handling
  const fetchCartAndWishlist = async () => {
    if (!token) {
      console.log("No token available for fetching cart");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Get local custom designs before fetching from server
      const localCustomItems = cart.filter(item => 
        (item.isCustomDesign || item.customDesign) && item.isLocal
      );

      // Sync local custom designs to server first
      if (localCustomItems.length > 0) {
        await syncLocalCustomDesigns(localCustomItems);
      }

      // Fetch updated cart from server
      console.log("Fetching cart from server...");
      const cartRes = await fetch("http://localhost:5000/api/cart", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!cartRes.ok) {
        throw new Error(`Failed to fetch cart: ${cartRes.status}`);
      }
      
      const cartData = await cartRes.json();

      // Fetch wishlist
      console.log("Fetching wishlist from server...");
      const wishlistRes = await fetch("http://localhost:5000/api/wishlist", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!wishlistRes.ok) {
        console.warn("Failed to fetch wishlist, continuing with cart");
      } else {
        const wishlistData = await wishlistRes.json();
        setWishlist(wishlistData.wishlist?.products || []);
      }

      // Set cart (server items only, local items are now synced)
      setCart(cartData.items || []);
      console.log(`Fetched ${(cartData.items || []).length} items from server`);
      setError(null);
      
    } catch (error) {
      console.error("Error fetching cart and wishlist:", error);
      setError("Failed to load cart data");
      // Keep local items on error
    } finally {
      setLoading(false);
    }
  };

  // ✅ Convert uploaded photo to base64 for storage
  const convertPhotoToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // ✅ Enhanced Add product to cart with detailed logging
  const addToCart = async (product, qty = 1) => {
    console.log("Adding to cart:", { 
      product: product.name || product._id, 
      qty, 
      isCustom: !!(product.isCustomDesign || product.customDesign),
      hasCustomPhoto: !!product.customPhoto,
      hasCustomPhotos: !!(product.customPhotos && product.customPhotos.length > 0),
      photosCount: product.customPhotos?.length || 0
    });
    
    try {
      setLoading(true);
      setError(null);
      
      // ✅ Handle custom designs
      if (product.isCustomDesign || product.customDesign) {
        // Validate custom design
        const validationErrors = validateCustomDesign(product);
        if (validationErrors.length > 0) {
          throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
        }

        if (token) {
          // Send custom design to backend if logged in
          const payload = {
            quantity: qty,
            specialRequest: product.specialRequest || "",
            customDesign: {
              name: product.name,
              price: Number(product.price),
              image: product.image,
              designData: product.designData || "",
              material: product.material || { type: "resin", name: "Resin", multiplier: 1 },
              size: product.size || { value: "4", name: "4 inch", multiplier: 1 },
              pricing: product.pricing || { basePrice: 299, finalPrice: Number(product.price) },
              specifications: product.specifications || {}
            }
          };

          console.log("Sending custom design to server...", { name: payload.customDesign.name, price: payload.customDesign.price });
          
          const res = await fetch("http://localhost:5000/api/cart/add", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          });

          if (!res.ok) {
            const errorText = await res.text();
            console.error("Server error response:", errorText);
            throw new Error(`Server error: ${res.status} - ${errorText}`);
          }

          const data = await res.json();
          setCart(data.items || []);
          console.log("Custom design saved to server successfully");
        } else {
          // Store locally if not logged in
          const customItem = {
            ...product,
            quantity: qty,
            cartItemId: product.cartItemId || `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            addedAt: new Date().toISOString(),
            isLocal: true,
          };
          
          setCart(prevCart => {
            console.log("Adding custom design locally");
            return [...prevCart, customItem];
          });
          
          console.log("Custom design stored locally");
        }
        
        return;
      }

      // ✅ Handle regular products
      if (!token) {
        // Store temporarily if no token
        let customPhotosData = [];
        
        // Handle multiple photos
        if (product.customPhotos && product.customPhotos.length > 0) {
          try {
            console.log("Processing multiple photos for temporary storage...", product.customPhotos.length);
            customPhotosData = await handleMultipleCustomerPhotos(product.customPhotos, null);
            console.log("Photos processed for temporary storage:", customPhotosData.length);
          } catch (photoError) {
            console.error("Failed to process photos for temporary storage:", photoError);
            // Continue without photos if processing fails
          }
        }
        // Handle single photo (backward compatibility)
        else if (product.customPhoto && product.customPhoto.file) {
          try {
            console.log("Uploading single photo for temporary storage...");
            const singlePhotoData = await handleCustomerPhotoUpload(product.customPhoto.file, null);
            customPhotosData = [{ ...singlePhotoData, order: 1 }];
            console.log("Single photo uploaded for temporary storage:", singlePhotoData.filePath);
          } catch (photoError) {
            console.error("Failed to upload photo for temporary storage:", photoError);
            // Continue without photo if upload fails
          }
        }
        
        const tempItem = {
          ...product,
          quantity: qty,
          cartItemId: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          isTemporary: true,
          specialRequest: product.specialRequest || "",
          customPhotos: customPhotosData,
          // Keep backward compatibility
          customPhoto: customPhotosData.length > 0 ? customPhotosData[0] : null,
        };
        
        setCart(prevCart => [...prevCart, tempItem]);
        console.log("Regular product stored temporarily with photos:", customPhotosData.length);
        return;
      }

      // Send regular product to backend
      if (!product._id) {
        throw new Error("Product ID is required for regular products");
      }

      console.log("Sending regular product to server...", product._id);
      
      // Handle photo uploads if present
      let customPhotosData = [];
      
      // Handle multiple photos
      if (product.customPhotos && product.customPhotos.length > 0) {
        try {
          console.log("Uploading multiple customer photos to server...", product.customPhotos.length);
          customPhotosData = await handleMultipleCustomerPhotos(product.customPhotos, token);
          console.log("Photos uploaded successfully:", customPhotosData.length);
        } catch (photoError) {
          console.error("Failed to upload multiple photos:", photoError);
          throw new Error("Failed to upload customer photos: " + photoError.message);
        }
      }
      // Handle single photo (backward compatibility)
      else if (product.customPhoto && product.customPhoto.file) {
        try {
          console.log("Uploading single customer photo to server...");
          const singlePhotoData = await handleCustomerPhotoUpload(product.customPhoto.file, token);
          customPhotosData = [{ ...singlePhotoData, order: 1 }];
          console.log("Single photo uploaded successfully:", singlePhotoData.filePath);
        } catch (photoError) {
          console.error("Failed to upload photo:", photoError);
          throw new Error("Failed to upload customer photo: " + photoError.message);
        }
      }
      
      const res = await fetch("http://localhost:5000/api/cart/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: product._id,
          quantity: qty,
          specialRequest: product.specialRequest || "",
          customPhotos: customPhotosData,
          // Keep backward compatibility
          customPhoto: customPhotosData.length > 0 ? customPhotosData[0] : null,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Server error response:", errorText);
        throw new Error(`Server error: ${res.status}`);
      }

      const data = await res.json();
      setCart(data.items || []);
      console.log("Regular product saved to server successfully");
      
    } catch (error) {
      console.error("Add to cart failed:", error);
      setError(`Failed to add item to cart: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
// ✅ FIXED Remove function - NO optimistic updates, wait for server
const removeFromCart = async (productId, isCustom = false) => {
  console.log("🗑️ Starting removal process:", { productId, isCustom, currentCartSize: cart.length });
  
  try {
    setLoading(true);
    setError(null);

    // ✅ Find the item to understand its structure
    const itemToRemove = cart.find(item => {
      const itemIds = [
        item._id,
        item.cartItemId, 
        item.id,
        item.product?._id
      ].filter(Boolean);
      
      return itemIds.includes(productId);
    });

    if (!itemToRemove) {
      console.log("❌ Item not found in frontend cart state");
      setError("Item not found in cart");
      setLoading(false);
      return;
    }

    console.log("✅ Found item to remove:", {
      name: itemToRemove.name || itemToRemove.product?.name || 'Unknown',
      _id: itemToRemove._id,
      cartItemId: itemToRemove.cartItemId,
      productId: itemToRemove.product?._id,
      isLocal: itemToRemove.isLocal,
      isCustomDesign: itemToRemove.isCustomDesign,
      isTemporary: itemToRemove.isTemporary
    });

    // ✅ CASE 1: Local/Temporary items (no server removal needed)
    const isLocalItem = itemToRemove.isLocal || 
                       itemToRemove.isTemporary || 
                       (!token && (itemToRemove.isCustomDesign || itemToRemove.customDesign));

    if (isLocalItem) {
      console.log("🏠 Removing local item (no server call needed)");
      setCart(prevCart => {
        const filtered = prevCart.filter(item => {
          const itemIds = [item._id, item.cartItemId, item.id, item.product?._id].filter(Boolean);
          return !itemIds.includes(productId);
        });
        console.log(`✅ Local removal complete: ${prevCart.length} -> ${filtered.length}`);
        return filtered;
      });
      setError(null);
      setLoading(false);
      return;
    }

    // ✅ CASE 2: No token - only remove from local state
    if (!token) {
      console.log("🔐 No token, removing from local state only");
      setCart(prevCart => {
        const filtered = prevCart.filter(item => {
          const itemIds = [item._id, item.cartItemId, item.id, item.product?._id].filter(Boolean);
          return !itemIds.includes(productId);
        });
        return filtered;
      });
      setError(null);
      setLoading(false);
      return;
    }

    // ✅ CASE 3: Server item - DO NOT update state until server confirms
    const serverItemIsCustom = itemToRemove.isCustomDesign || itemToRemove.customDesign || isCustom;
    
    // ✅ Build the request payload based on item type
    let requestPayload;
    
    if (serverItemIsCustom) {
      requestPayload = {
        productId: itemToRemove.cartItemId || itemToRemove._id || productId,
        cartItemId: itemToRemove.cartItemId || itemToRemove._id || productId,
        isCustom: true
      };
    } else {
      requestPayload = {
        productId: itemToRemove.product?._id || itemToRemove._id || productId,
        cartItemId: itemToRemove._id || productId,
        isCustom: false
      };
    }

    console.log("🌐 Calling server to remove item...", requestPayload);
    
    // ❌ DO NOT update local state yet - wait for server response
    
    const res = await fetch("http://localhost:5000/api/cart/remove", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(requestPayload),
    });

    console.log("📡 Server response status:", res.status);

    if (!res.ok) {
      const errorText = await res.text();
      console.error("❌ Server removal failed:", res.status, errorText);
      
      // ✅ Only update local state if server explicitly says item not found (404)
      if (res.status === 404) {
        console.log("🔍 Server says item not found (404), removing from local state");
        setCart(prevCart => {
          const filtered = prevCart.filter(item => {
            const itemIds = [item._id, item.cartItemId, item.id, item.product?._id].filter(Boolean);
            return !itemIds.includes(productId);
          });
          return filtered;
        });
        setError(null);
      } else {
        // ✅ For other errors, show error and keep item in cart
        console.error("❌ Server error - keeping item in cart");
        
        let errorMessage;
        try {
          const parsedError = JSON.parse(errorText);
          errorMessage = parsedError.message || `Server error ${res.status}`;
        } catch (parseErr) {
          errorMessage = `Server error ${res.status}`;
        }
        
        setError(`Failed to remove item: ${errorMessage}`);
      }
      setLoading(false);
      return;
    }

    // ✅ Server removal successful - update state with server response
    try {
      const data = await res.json();
      console.log("✅ Server removal successful, response:", data);
      
      if (data.success && data.items) {
        setCart(data.items);
        console.log("Cart updated with server data");
      } else {
        // If no items in response, fetch fresh cart data
        console.log("📡 No items in response, fetching fresh cart...");
        await fetchCartAndWishlist();
      }
      
      setError(null);
    } catch (parseError) {
      console.error("❌ Failed to parse server response, fetching fresh cart data");
      await fetchCartAndWishlist();
    }
    
  } catch (error) {
    console.error("❌ Remove operation failed:", error);
    setError(`Network error: ${error.message}`);
    
    // ✅ For network errors, don't update local state - let user retry
    console.log("🔄 Network error - keeping item in cart for retry");
    
  } finally {
    setLoading(false);
  }
};



  // ✅ Enhanced Update quantity function with validation
  const updateQuantity = async (productId, newQuantity, isCustom = false) => {
    if (newQuantity <= 0) {
      removeFromCart(productId, isCustom);
      return;
    }

    console.log("Updating quantity:", { productId, newQuantity, isCustom });

    try {
      // Handle local items
      const localItem = cart.find(item => 
        (item.cartItemId === productId || item._id === productId || item.id === productId) && 
        (item.isLocal || isCustom)
      );

      if (localItem) {
        setCart(prevCart => 
          prevCart.map(item => {
            if (item.cartItemId === productId || item._id === productId || item.id === productId) {
              console.log("Updated local item quantity");
              return { ...item, quantity: newQuantity };
            }
            return item;
          })
        );
        return;
      }

      // Handle server items
      if (token) {
        setLoading(true);
        console.log("Updating quantity on server...");
        
        const res = await fetch("http://localhost:5000/api/cart/update", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ 
            productId, 
            cartItemId: productId,
            quantity: newQuantity,
            isCustom 
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setCart(data.items || []);
          console.log("Quantity updated on server successfully");
        } else {
          const errorText = await res.text();
          console.error("Update quantity error:", errorText);
        }
        setLoading(false);
      } else {
        // Update locally if no token
        setCart(prevCart => 
          prevCart.map(item => {
            if (item.cartItemId === productId || item._id === productId || item.id === productId) {
              console.log("Updated temporary item quantity");
              return { ...item, quantity: newQuantity };
            }
            return item;
          })
        );
      }
    } catch (error) {
      console.error("Update quantity failed:", error);
      setError("Failed to update quantity");
      setLoading(false);
    }
  };

  // ✅ Enhanced cart calculations with better error handling
  const getCartTotal = () => {
    try {
      return cart.reduce((total, item) => {
        let price = 0;
        let quantity = parseInt(item.quantity) || 1;

        // Handle different item structures
        if (item.isCustomDesign || item.customDesign) {
          price = Number(item.price) || Number(item.customDesign?.price) || 0;
        } else if (item.product) {
          price = Number(item.product.price) || 0;
        } else {
          price = Number(item.price) || 0;
        }

        return total + (price * quantity);
      }, 0);
    } catch (error) {
      console.error("Error calculating cart total:", error);
      return 0;
    }
  };

  const getCartCount = () => {
    try {
      return cart.reduce((count, item) => {
        const quantity = parseInt(item.quantity) || 0;
        return count + quantity;
      }, 0);
    } catch (error) {
      console.error("Error calculating cart count:", error);
      return 0;
    }
  };

  // ✅ Enhanced Clear cart function
  const clearCart = async () => {
    console.log("Clearing cart...");
    
    try {
      setLoading(true);
      setError(null);

      if (token) {
        const res = await fetch("http://localhost:5000/api/cart/clear", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (!res.ok) {
          console.warn("Failed to clear server cart, continuing with local clear");
        }
      }

      setCart([]);
      localStorage.removeItem('shafe_cart');
      console.log("Cart cleared successfully");
      
    } catch (error) {
      console.error("Clear cart failed:", error);
      setError("Failed to clear cart");
      // Clear locally even if server fails
      setCart([]);
      localStorage.removeItem('shafe_cart');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Wishlist functions with better error handling
  const addToWishlist = async (product) => {
    try {
      setLoading(true);
      setError(null);

      if (!token) {
        setError("Please login to add items to wishlist");
        return;
      }

      const res = await fetch("http://localhost:5000/api/wishlist/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId: product._id }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Server error: ${res.status} - ${errorText}`);
      }

      const data = await res.json();
      setWishlist(data.wishlist?.products || []);
      
    } catch (error) {
      console.error("Add to wishlist failed:", error);
      setError(`Failed to add to wishlist: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (productId) => {
    try {
      setLoading(true);
      setError(null);

      if (!token) {
        setError("Please login to manage wishlist");
        return;
      }

      const res = await fetch("http://localhost:5000/api/wishlist/remove", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Server error: ${res.status} - ${errorText}`);
      }

      const data = await res.json();
      setWishlist(data.wishlist?.products || []);
      
    } catch (error) {
      console.error("Remove from wishlist failed:", error);
      setError(`Failed to remove from wishlist: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const isInWishlist = (productId) => {
    return wishlist.some(item => (item._id === productId || item.id === productId));
  };

  const moveToCart = async (product) => {
    try {
      await addToCart(product);
      await removeFromWishlist(product._id || product.id);
    } catch (error) {
      console.error("Move to cart failed:", error);
      setError("Failed to move item to cart");
    }
  };

  // ✅ Enhanced debug function
  const debugCart = () => {
    console.log("=== CART DEBUG INFO ===");
    console.log("Current cart state:", cart);
    console.log("Cart count:", getCartCount());
    console.log("Cart total:", getCartTotal());
    console.log("Local storage:", localStorage.getItem('shafe_cart'));
    console.log("Token available:", !!token);
    console.log("Loading:", loading);
    console.log("Error:", error);
    console.log("Wishlist count:", wishlist.length);
    console.log("======================");
  };

  return (
    <CartContext.Provider
      value={{
        // State
        cart,
        wishlist,
        loading,
        error,
        
        // Cart functions
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartCount,
        
        // Wishlist functions
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        moveToCart,
        
        // Utility functions
        fetchCartAndWishlist,
        setError,
        debugCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
