import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSubscription } from "../context/SubscriptionContext";
import logo from "../assets/logo.png";
import TrainSaleBanner from "./TrainSaleBanner";
import MoreDropdown from "./MoreDropdown";
import "./Header.css"; // ✅ Import the CSS file

export default function Header() {
  const { user, token, logout } = useAuth();
  const { isSubscribed } = useSubscription();

  // ✅ Add Google Translate functionality
  useEffect(() => {
    // Prevent adding script multiple times
    if (!document.getElementById("google-translate-script")) {
      const addScript = document.createElement("script");
      addScript.id = "google-translate-script";
      addScript.src =
        "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      document.body.appendChild(addScript);

      window.googleTranslateElementInit = () => {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: "en",
            includedLanguages: "en,ta,hi,te,ml,kn,ur,gu,bn,pa",
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false,
          },
          "google_translate_element"
        );
      };
    }
  }, []);

  return (
    <>
      {/* Train Sale Banner at the very top */}
      <TrainSaleBanner />
      
      {/* ✅ Use CSS classes instead of inline styles */}
      <header className="header">
        {/* Logo Section */}
        <div className="logo-container">
          <img src={logo} alt="Shafe's Handcraft Logo" className="logo" />
          <div className="logo-text-container">
            <h1>Shafe's_handcraft</h1>
            {isSubscribed && (
              <span className="subscription-star" title="Subscribed Member">
                ⭐
              </span>
            )}
          </div>
        </div>

        {/* Main Navigation */}
        <nav>
          <Link to="/">HOME</Link>
          <Link to="/categories">CATEGORIES</Link>
          <Link to="/cart">CART</Link>
          <Link to="/wishlist">WISHLIST</Link>
          <Link to="/customize">CUSTOMIZE</Link>
          
          {/* Conditional Login/Profile Links - Keep for mobile/tablet fallback */}
          {user && token ? (
            <>
              <Link to="/profile" className="profile-link mobile-only">
                👤 {user.name?.split(' ')[0] || user.email?.split('@')[0] || 'PROFILE'}
              </Link>
              <button onClick={logout} className="logout-btn mobile-only">
                LOGOUT
              </button>
            </>
          ) : (
            <Link to="/auth" className="login-btn mobile-only">
              LOGIN
            </Link>
          )}
        </nav>

        {/* Header Right Section with More Dropdown */}
        <div className="header-right-section">
          {/* Hidden Google Translate Container - Now integrated into dropdown */}
          <div className="translate-container hidden">
            <div id="google_translate_element"></div>
          </div>
          
          {/* Enhanced More Dropdown with all options */}
          <MoreDropdown user={user} token={token} logout={logout} />
        </div>
      </header>
    </>
  );
}
