import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Categories from "./pages/Categories.jsx";
import ProductDetails from "./pages/ProductDetails.jsx";
import LiveCustomization from "./pages/LiveCustomization.jsx";
import Cart from "./pages/Cart.jsx";
import Wishlist from "./pages/Wishlist.jsx";
import Orders from "./pages/Orders.jsx";
import Profile from "./pages/Profile.jsx";
import Auth from "./pages/Auth.jsx";
import UserSignup from "./pages/UserSignUp.jsx";
import AdminLogin from "./pages/AdminLogin.jsx";
import Header from "./components/Header.jsx";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { CartProvider } from "./context/CartContext.jsx"; // ✅ CartProvider
import Checkout from "./pages/Checkout.jsx";
import Payment from "./pages/Payment.jsx";
import OrderTracking from "./pages/OrderTracking.jsx";
import Products from "./pages/Products.jsx";
// Admin Pages
import AdminLayout from "./pages/Admin/AdminLayout.jsx";
import Dashboard from "./pages/Admin/Dashboard.jsx";
import AdminOrders from "./pages/Admin/Orders.jsx";
import AdminUsers from "./pages/Admin/Users.jsx";
import AdminCategories from "./pages/Admin/Categories.jsx";
import AdminProducts from "./pages/Admin/Products.jsx";
import AdminProtected from "./components/AdminProtected.jsx";
import AdminSignup from "./pages/Admin/AdminSignup.jsx";

// Protected Customer Routes
function ProtectedProfile() {
  const { user } = useAuth();
  return user ? <Profile /> : <Auth />;
}

function ProtectedOrders() {
  const { user } = useAuth();
  return user ? <Orders /> : <Auth />;
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <div className="app-container">
            <Header />

            <Routes>
              {/* Customer Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/products/:id" element={<ProductDetails />} />
              <Route path="/customize" element={<LiveCustomization />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/orders" element={<ProtectedOrders />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/signup" element={<UserSignup />} />
              <Route path="/profile" element={<ProtectedProfile />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/payment" element={<Payment />} />
              <Route path="/tracking/:id" element={<OrderTracking />} />
              <Route path="/tracking" element={<OrderTracking />} />
              <Route path="/products" element={<Products />} />
              <Route path="/categories/:category" element={<Products />} />

              {/* Admin Routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/signup" element={<AdminSignup />} />

              {/* Protected Admin Routes */}
              <Route element={<AdminProtected />}>
                <Route path="/admin" element={<AdminLayout />}>
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="categories" element={<AdminCategories />} />
                  <Route path="products" element={<AdminProducts />} />
                </Route>
              </Route>

              {/* Catch-all redirect to Home */}
              <Route path="*" element={<Home />} />
            </Routes>
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
