import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Categories from "./pages/Categories.jsx";
import ProductDetails from "./pages/ProductDetails.jsx";
import LiveCustomization from "./pages/LiveCustomization.jsx";
import Cart from "./pages/Cart.jsx";
import Wishlist from "./pages/Wishlist.jsx";
import Profile from "./pages/Profile.jsx";
import Auth from "./pages/Auth.jsx";
import UserSignup from "./pages/UserSignup.jsx";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import { RecentlyViewedProvider } from "./context/RecentlyViewedContext.jsx";
import { SettingsProvider } from "./context/SettingsContext.jsx";
import { ChatbotProvider } from "./context/ChatbotContext.jsx";
import { SubscriptionProvider } from "./context/SubscriptionContext.jsx";
import { useState } from "react";
import ChatWindow from "./components/Chatbot/ChatWindow.jsx";
import Checkout from "./pages/Checkout.jsx";
import Payment from "./pages/Payment.jsx";
import OrderTracking from "./pages/OrderTracking.jsx";
import Products from "./pages/Products.jsx";
import ShafesChannel from "./pages/ShafesChannel.jsx";

// Admin Pages
import AdminLayout from "./pages/Admin/AdminLayout.jsx";
import Dashboard from "./pages/Admin/Dashboard.jsx";
import AdminOrders from "./pages/Admin/Orders.jsx";
import AdminUsers from "./pages/Admin/Users.jsx";
import AdminCategories from "./pages/Admin/Categories.jsx";
import AdminProducts from "./pages/Admin/Products.jsx";
import AdminChannelPosts from "./pages/Admin/ChannelPosts.jsx";
import AdminReports from "./pages/Admin/AdminReports.jsx";
import AdminProtected from "./components/AdminProtected.jsx";
import AdminSignup from "./pages/Admin/AdminSignup.jsx";

// Import your actual customer orders page here
import CustomerOrders from "./pages/Orders.jsx";

// OrderSuccess Component (inline or as its own file)
function OrderSuccess() {
  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '2rem auto', 
      padding: '2rem', 
      textAlign: 'center',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        background: 'white',
        padding: '3rem 2rem',
        borderRadius: '15px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
        marginBottom: '2rem'
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
        <h1 style={{ color: '#28a745', fontSize: '2.5rem', marginBottom: '1rem' }}>
          Order Placed Successfully!
        </h1>
        <p style={{ color: '#666', fontSize: '1.1rem' }}>
          Thank you for your order. We'll start processing it right away.
        </p>
      </div>
    </div>
  );
}

// Protected Customer Routes
function ProtectedProfile() {
  const { user, token } = useAuth();
  return user && token ? <Profile /> : <Auth />;
}

function ProtectedOrders() {
  const { user, token } = useAuth();
  // Render CustomerOrders page if authenticated
  return user && token ? <CustomerOrders /> : <Auth />;
}

function ProtectedCheckout() {
  const { user, token } = useAuth();
  return user && token ? <Checkout /> : <Auth />;
}

function ProtectedWishlist() {
  const { user, token } = useAuth();
  return user && token ? <Wishlist /> : <Auth />;
}

// Layout wrapper for regular pages
function RegularLayout({ children }) {
  return (
    <div className="app-container">
      <Header />
      {children}
      <ChatWindow />
      <Footer />
    </div>
  );
}

// Layout wrapper for admin pages (no header/footer)
function AdminLayoutWrapper({ children }) {
  return (
    <div className="admin-app-container">
      {children}
    </div>
  );
}

function AppContent() {
  return (
    <Router>
      <Routes>
          {/* ===== PUBLIC ROUTES WITH REGULAR LAYOUT ===== */}
          <Route path="/" element={<RegularLayout><Home /></RegularLayout>} />
          <Route path="/categories" element={<RegularLayout><Categories /></RegularLayout>} />
          <Route path="/products" element={<RegularLayout><Products /></RegularLayout>} />
          <Route path="/products/:id" element={<RegularLayout><ProductDetails /></RegularLayout>} />
          <Route path="/product/:id" element={<RegularLayout><ProductDetails /></RegularLayout>} />
          <Route path="/categories/:category" element={<RegularLayout><Products /></RegularLayout>} />
          <Route path="/customize" element={<RegularLayout><LiveCustomization /></RegularLayout>} />
          <Route path="/cart" element={<RegularLayout><Cart /></RegularLayout>} />
          <Route path="/shafeschannel" element={<RegularLayout><ShafesChannel /></RegularLayout>} />
          <Route path="/order-success/:orderId" element={<RegularLayout><OrderSuccess /></RegularLayout>} />
          <Route path="/checkout" element={<RegularLayout><Checkout /></RegularLayout>} />
          {/* Authentication Routes */}
          <Route path="/auth" element={<RegularLayout><Auth /></RegularLayout>} />
          <Route path="/login" element={<RegularLayout><Auth /></RegularLayout>} />
          <Route path="/signup" element={<RegularLayout><UserSignup /></RegularLayout>} />

          {/* ===== PROTECTED CUSTOMER ROUTES ===== */}
          <Route path="/wishlist" element={<RegularLayout><ProtectedWishlist /></RegularLayout>} />
          <Route path="/orders" element={<RegularLayout><ProtectedOrders /></RegularLayout>} />
          <Route path="/profile" element={<RegularLayout><ProtectedProfile /></RegularLayout>} />

          {/* Order Success Routes */}
          <Route path="/order-confirmation/:orderId" element={<RegularLayout><OrderSuccess /></RegularLayout>} />

          {/* Other Protected Routes */}
          <Route path="/payment" element={<RegularLayout><Payment /></RegularLayout>} />
          <Route path="/tracking/:id" element={<RegularLayout><OrderTracking /></RegularLayout>} />
          <Route path="/tracking" element={<RegularLayout><OrderTracking /></RegularLayout>} />

          {/* ===== ADMIN ROUTES WITH ADMIN LAYOUT ===== */}
          <Route path="/admin/signup" element={<AdminLayoutWrapper><AdminSignup /></AdminLayoutWrapper>} />

          {/* Protected Admin Routes */}
          <Route element={<AdminProtected />}>
            <Route path="/admin" element={<AdminLayoutWrapper><AdminLayout /></AdminLayoutWrapper>}>
              <Route index element={<Dashboard />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="channelposts" element={<AdminChannelPosts />} />
              <Route path="reports" element={<AdminReports />} />
            </Route>
          </Route>

          {/* ===== FALLBACK ===== */}
          <Route path="*" element={<RegularLayout><Home /></RegularLayout>} />
        </Routes>
    </Router>
  );
}

function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <SubscriptionProvider>
          <CartProvider>
            <RecentlyViewedProvider>
              <ChatbotProvider>
                <AppContent />
              </ChatbotProvider>
            </RecentlyViewedProvider>
          </CartProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </SettingsProvider>
  );
}

export default App;
