import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

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

  // ✅ Enhanced Add product to cart with detailed logging
  const addToCart = async (product, qty = 1) => {
    console.log("Adding to cart:", { product: product.name || product._id, qty, isCustom: !!(product.isCustomDesign || product.customDesign) });
    
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
        const tempItem = {
          ...product,
          quantity: qty,
          cartItemId: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          isTemporary: true,
          specialRequest: product.specialRequest || "",
        };
        
        setCart(prevCart => [...prevCart, tempItem]);
        console.log("Regular product stored temporarily");
        return;
      }

      // Send regular product to backend
      if (!product._id) {
        throw new Error("Product ID is required for regular products");
      }

      console.log("Sending regular product to server...", product._id);
      
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

  // ✅ Enhanced Remove product from cart with better identification
  const removeFromCart = async (productId, isCustom = false) => {
    console.log("Removing from cart:", { productId, isCustom });
    
    try {
      setLoading(true);
      setError(null);

      // Handle local custom designs
      const isLocalCustom = cart.find(item => 
        (item.cartItemId === productId || item._id === productId || item.id === productId) && 
        (item.isLocal || isCustom)
      );

      if (isLocalCustom) {
        setCart(prevCart => {
          const filtered = prevCart.filter(item => 
            item.cartItemId !== productId && 
            item._id !== productId && 
            item.id !== productId
          );
          console.log("Removed local item");
          return filtered;
        });
        return;
      }

      // Handle server items
      if (!token) {
        setCart(prevCart => {
          const filtered = prevCart.filter(item => 
            item._id !== productId && item.id !== productId
          );
          console.log("Removed temporary item");
          return filtered;
        });
        return;
      }

      console.log("Removing item from server...");
      
      const res = await fetch("http://localhost:5000/api/cart/remove", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          productId, 
          cartItemId: productId,
          isCustom 
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Remove error response:", errorText);
        throw new Error(`Server error: ${res.status}`);
      }

      const data = await res.json();
      setCart(data.items || []);
      console.log("Item removed from server successfully");
      
    } catch (error) {
      console.error("Remove from cart failed:", error);
      setError(`Failed to remove item: ${error.message}`);
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
