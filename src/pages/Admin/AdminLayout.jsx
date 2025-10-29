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
  BarChart3
} from "lucide-react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import "./AdminLayout.css";

// Components are now handled by React Router's Outlet

export default function AdminLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isMobile, setIsMobile] = useState(false);
  const [adminInfo, setAdminInfo] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const links = [
    { id: "dashboard", label: "Dashboard", icon: <Home size={18} /> },
    { id: "reports", label: "Reports", icon: <BarChart3 size={18} /> },
    { id: "channelposts", label: "Channel Posts", icon: <Grid size={18} /> },
    { id: "orders", label: "Orders", icon: <ShoppingCart size={18} /> },
    { id: "users", label: "Users", icon: <Users size={18} /> },
    { id: "categories", label: "Categories", icon: <Grid size={18} /> },
    { id: "products", label: "Products", icon: <Package size={18} /> },
  ];

  // Load admin info from localStorage on component mount
  useEffect(() => {
    const storedAdminInfo = localStorage.getItem("adminInfo");
    if (storedAdminInfo) {
      try {
        setAdminInfo(JSON.parse(storedAdminInfo));
      } catch (error) {
        console.error('Error parsing admin info:', error);
      }
    }
  }, []);

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
  }, [isMobileMenuOpen]);

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
    // Clear admin session data
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminInfo");
    localStorage.removeItem("isAdmin");
    
    console.log('🚪 Admin logged out, redirecting to home');
    
    // Redirect to home page instead of login
    navigate("/");
  };

  // React Router will handle component rendering via Outlet

  return (
    <>
      {/* Admin Header */}
      <header className="admin-header">
        <div className="admin-header-content">
          <div className="admin-header-left">
            <div className="admin-logo">
              <h1>🏪 Shafe's Handcraft</h1>
              <span className="admin-badge-header">Admin Panel</span>
            </div>
          </div>
          
          <div className="admin-header-right">
            <button 
              className="admin-btn secondary small"
              onClick={() => navigate('/')}
              title="View Main Website"
            >
              <Home size={16} />
              View Site
            </button>
            
            <div className="admin-header-user">
              <div className="admin-user-avatar">
                {adminInfo?.name ? adminInfo.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="admin-user-info">
                <span className="admin-user-name">{adminInfo?.name || 'Admin User'}</span>
                <span className="admin-user-role">Administrator</span>
              </div>
            </div>
            
            <button 
              className="admin-btn danger small"
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </header>

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
        <div className="content-wrapper">
          <Outlet />
        </div>
      </main>
      </div>
    </>
  );
}
