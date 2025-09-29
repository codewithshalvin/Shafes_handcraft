import { useState, useEffect } from "react";
import { 
  Home, 
  ShoppingCart, 
  Users, 
  Grid, 
  Package, 
  Menu, 
  X,
  Settings,
  LogOut,
  ChevronDown
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import "./AdminLayout.css";

// Import your real admin pages
import Products from "./Products";
import Orders from "./Orders";
import UsersPage from "./Users";
import Categories from "./Categories";
import Dashboard from "./Dashboard";

export default function AdminLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const links = [
    { id: "dashboard", label: "Dashboard", icon: <Home size={18} /> },
    { id: "orders", label: "Orders", icon: <ShoppingCart size={18} /> },
    { id: "users", label: "Users", icon: <Users size={18} /> },
    { id: "categories", label: "Categories", icon: <Grid size={18} /> },
    { id: "products", label: "Products", icon: <Package size={18} /> },
  ];

  // Enhanced mobile detection and resize handling
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      
      // Auto-close mobile menu when switching to desktop
      if (!mobile && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    const handleClickOutside = (event) => {
      // Close profile dropdown when clicking outside
      if (isProfileDropdownOpen && !event.target.closest(".profile-dropdown")) {
        setIsProfileDropdownOpen(false);
      }
      
      // Close mobile menu when clicking outside (but not on toggle button)
      if (isMobileMenuOpen && 
          !event.target.closest(".admin-sidebar") && 
          !event.target.closest(".mobile-menu-toggle")) {
        setIsMobileMenuOpen(false);
      }
    };

    // Initial check
    checkMobile();

    // Add event listeners
    window.addEventListener("resize", checkMobile);
    document.addEventListener("click", handleClickOutside);

    return () => {
      window.removeEventListener("resize", checkMobile);
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isProfileDropdownOpen, isMobileMenuOpen]);

  // Sync active tab with URL
  useEffect(() => {
    const path = location.pathname.split("/").pop();
    setActiveTab(path || "dashboard");
  }, [location.pathname]);

  // Enhanced toggle function with better state management
  const toggleMobileMenu = (e) => {
    e.stopPropagation(); // Prevent event bubbling
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleNavClick = (id) => {
    setActiveTab(id);
    navigate(`/admin/${id}`);
    closeMobileMenu(); // Always close mobile menu after navigation
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminInfo");
    navigate("/admin/login");
  };

  // Connect components instead of placeholders
  const tabComponents = {
    dashboard: <Dashboard />,
    orders: <Orders />,
    users: <UsersPage />,
    categories: <Categories />,
    products: <Products />,
  };

  return (
    <div className="admin-container">
      {/* Mobile Menu Toggle - Only show on mobile */}
      {isMobile && (
        <button 
          className="mobile-menu-toggle" 
          onClick={toggleMobileMenu}
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      )}

      {/* Mobile Overlay - Only show when menu is open */}
      {isMobileMenuOpen && isMobile && (
        <div className="mobile-overlay is-active" onClick={closeMobileMenu} />
      )}

      {/* Admin Sidebar with correct class names */}
      <aside className={`admin-sidebar ${isMobileMenuOpen ? "is-open" : ""}`}>
        <div className="sidebar-header">
          <h2>Admin Panel</h2>
          <p>Shafe's Handcraft</p>
        </div>

        <nav>
          <ul>
            {links.map((link) => (
              <li key={link.id}>
                <button
                  onClick={() => handleNavClick(link.id)}
                  className={`nav-link ${activeTab === link.id ? "active" : ""}`}
                >
                  <span className="nav-icon">{link.icon}</span>
                  {link.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button className="nav-link">
            <span className="nav-icon"><Settings size={18} /></span>
            Settings
          </button>
          <button className="nav-link" onClick={handleLogout}>
            <span className="nav-icon"><LogOut size={18} /></span>
            Logout
          </button>
        </div>
      </aside>

      {/* Admin Content */}
      <main className="admin-content">
        {/* Simplified top bar with only profile dropdown */}
        <div className="top-bar">
          <div className="top-bar-spacer"></div> {/* Spacer to push profile to right */}
          
          <div className="top-bar-actions">
            <div className={`profile-dropdown ${isProfileDropdownOpen ? 'is-open' : ''}`}>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsProfileDropdownOpen(!isProfileDropdownOpen);
                }} 
                className="profile-btn"
              >
                <div className="profile-avatar">A</div>
                <ChevronDown size={16} />
              </button>

              {isProfileDropdownOpen && (
                <div className="dropdown-menu">
                  <div className="dropdown-header">
                    <p className="dropdown-name">Admin User</p>
                    <p className="dropdown-email">admin@shafe.com</p>
                  </div>
                  <button className="dropdown-item">
                    <Settings size={16} />Settings
                  </button>
                  <button className="dropdown-item" onClick={handleLogout}>
                    <LogOut size={16} />Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="content-wrapper">
          {tabComponents[activeTab] || <div>Content not available</div>}
        </div>
      </main>
    </div>
  );
}
