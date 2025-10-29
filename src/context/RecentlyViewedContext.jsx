// context/RecentlyViewedContext.jsx
import { createContext, useContext, useState, useEffect } from "react";

const RecentlyViewedContext = createContext();

export const useRecentlyViewed = () => {
  const context = useContext(RecentlyViewedContext);
  if (!context) {
    throw new Error("useRecentlyViewed must be used within a RecentlyViewedProvider");
  }
  return context;
};

export const RecentlyViewedProvider = ({ children }) => {
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  // Load from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem('recentlyViewed');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setRecentlyViewed(parsed);
        console.log("📚 Loaded recently viewed from storage:", parsed.length, "items");
      } catch (error) {
        console.error("❌ Error loading recently viewed:", error);
        localStorage.removeItem('recentlyViewed');
      }
    }
  }, []);

  // Save to localStorage whenever recentlyViewed changes
  useEffect(() => {
    if (recentlyViewed.length > 0) {
      localStorage.setItem('recentlyViewed', JSON.stringify(recentlyViewed));
      console.log("💾 Saved recently viewed to storage:", recentlyViewed.length, "items");
    }
  }, [recentlyViewed]);

  const addToRecentlyViewed = (product) => {
    console.log("👁️ Adding to recently viewed:", product.name);
    
    setRecentlyViewed(prev => {
      // Remove the product if it already exists (to avoid duplicates)
      const filtered = prev.filter(item => item._id !== product._id);
      
      // Add the new product to the beginning
      const updated = [
        {
          _id: product._id,
          name: product.name,
          price: product.price,
          image: product.image,
          description: product.description,
          category: product.category,
          viewedAt: new Date().toISOString()
        },
        ...filtered
      ];
      
      // Keep only the last 8 items
      const limited = updated.slice(0, 8);
      
      console.log("✅ Updated recently viewed list:", limited.length, "items");
      return limited;
    });
  };

  const clearRecentlyViewed = () => {
    setRecentlyViewed([]);
    localStorage.removeItem('recentlyViewed');
    console.log("🧹 Cleared recently viewed products");
  };

  const removeFromRecentlyViewed = (productId) => {
    setRecentlyViewed(prev => {
      const updated = prev.filter(item => item._id !== productId);
      console.log("🗑️ Removed product from recently viewed:", productId);
      return updated;
    });
  };

  return (
    <RecentlyViewedContext.Provider value={{
      recentlyViewed,
      addToRecentlyViewed,
      clearRecentlyViewed,
      removeFromRecentlyViewed
    }}>
      {children}
    </RecentlyViewedContext.Provider>
  );
};
