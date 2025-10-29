// src/components/MoreDropdown.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useChatbot } from '../context/ChatbotContext';
import SettingsPanel from './SettingsPanel';
import './MoreDropdown.css';

const MoreDropdown = ({ user, token, logout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showLanguageSubmenu, setShowLanguageSubmenu] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const { setIsOpen: setChatbotOpen } = useChatbot();
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setShowLanguageSubmenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChatbotClick = () => {
    setChatbotOpen(true);
    setIsOpen(false);
  };

  const handleSettingsClick = () => {
    setIsSettingsOpen(true);
    setIsOpen(false);
  };

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  const handleLanguageClick = () => {
    setShowLanguageSubmenu(!showLanguageSubmenu);
  };

  // Fixed Google Translate language selection
  const handleLanguageSelect = (langCode) => {
    console.log(`🌐 Attempting to change language to: ${langCode}`);
    
    try {
      // Method 1: Try to find and trigger the Google Translate dropdown
      const googleDropdown = document.querySelector('.goog-te-combo');
      if (googleDropdown) {
        console.log('✅ Found Google Translate dropdown');
        googleDropdown.value = langCode;
        
        // Create and dispatch a proper change event
        const changeEvent = new Event('change', { bubbles: true });
        googleDropdown.dispatchEvent(changeEvent);
        
        // Also try the native event
        if (document.createEvent) {
          const event = document.createEvent('HTMLEvents');
          event.initEvent('change', true, true);
          googleDropdown.dispatchEvent(event);
        }
        
        setCurrentLanguage(langCode);
        console.log(`✅ Language changed to: ${langCode}`);
      } else {
        console.log('⚠️ Google Translate dropdown not found, trying alternative methods...');
        
        // Method 2: Set cookie and reload (more reliable)
        document.cookie = `googtrans=/en/${langCode}; path=/`;
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }
    } catch (error) {
      console.error('❌ Error changing language:', error);
      
      // Method 3: URL hash method (fallback)
      try {
        window.location.hash = `googtrans(en|${langCode})`;
        setTimeout(() => {
          window.location.reload();
        }, 100);
      } catch (urlError) {
        console.error('❌ URL method also failed:', urlError);
      }
    }
    
    setShowLanguageSubmenu(false);
    setIsOpen(false);
  };

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
    { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' },
    { code: 'te', name: 'తెలుగు', flag: '🇮🇳' },
    { code: 'ml', name: 'മലയാളം', flag: '🇮🇳' },
    { code: 'kn', name: 'ಕನ್ನಡ', flag: '🇮🇳' },
    { code: 'gu', name: 'ગુજરાતી', flag: '🇮🇳' },
    { code: 'bn', name: 'বাংলা', flag: '🇧🇩' },
    { code: 'pa', name: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
    { code: 'ur', name: 'اردو', flag: '🇵🇰' }
  ];

  // Check current Google Translate language on mount
  useEffect(() => {
    const checkCurrentLanguage = () => {
      const googleDropdown = document.querySelector('.goog-te-combo');
      if (googleDropdown && googleDropdown.value) {
        setCurrentLanguage(googleDropdown.value);
      }
      
      // Also check cookie
      const cookies = document.cookie.split(';');
      for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'googtrans') {
          const langMatch = value.match(/\/en\/(.+)/);
          if (langMatch) {
            setCurrentLanguage(langMatch[1]);
          }
        }
      }
    };

    // Check initially and after Google Translate loads
    checkCurrentLanguage();
    
    const interval = setInterval(() => {
      if (document.querySelector('.goog-te-combo')) {
        checkCurrentLanguage();
        clearInterval(interval);
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div className="more-dropdown" ref={dropdownRef}>
        {/* More Button - Three Dots */}
        <button 
          className={`more-btn ${isOpen ? 'active' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
          aria-label="More options"
          title="More options"
        >
          <span className="more-icon">⋮</span>
        </button>

        {/* Enhanced Dropdown Menu */}
        {isOpen && (
          <div className="more-dropdown-menu">
            <div className="dropdown-arrow"></div>
            
            {/* User Section - Only show if logged in */}
            {user && token && (
              <>
                <div className="dropdown-user-section">
                  <div className="user-avatar">
                    👤
                  </div>
                  <div className="user-info">
                    <span className="user-name">{user.name?.split(' ')[0] || user.email?.split('@')[0] || 'User'}</span>
                    <span className="user-email">{user.email || 'user@example.com'}</span>
                  </div>
                </div>
                <div className="dropdown-divider"></div>
              </>
            )}

            {/* Profile Option - Only if logged in */}
            {user && token && (
              <Link to="/profile" className="dropdown-item" onClick={() => setIsOpen(false)}>
                <span className="dropdown-icon">👤</span>
                <div className="dropdown-content">
                  <span className="dropdown-title">Profile</span>
                  <span className="dropdown-description">View and edit profile</span>
                </div>
              </Link>
            )}

            {/* Orders Option - Only if logged in */}
            {user && token && (
              <Link to="/orders" className="dropdown-item" onClick={() => setIsOpen(false)}>
                <span className="dropdown-icon">📦</span>
                <div className="dropdown-content">
                  <span className="dropdown-title">My Orders</span>
                  <span className="dropdown-description">Track your orders</span>
                </div>
              </Link>
            )}

            {/* Chat Support */}
            <div className="dropdown-item" onClick={handleChatbotClick}>
              <span className="dropdown-icon">💬</span>
              <div className="dropdown-content">
                <span className="dropdown-title">Chat Support</span>
                <span className="dropdown-description">Get help instantly</span>
              </div>
            </div>

            {/* Language Options - Updated to show below */}
            <div className="dropdown-item-wrapper">
              <div className="dropdown-item language-item" onClick={handleLanguageClick}>
                <span className="dropdown-icon">🌐</span>
                <div className="dropdown-content">
                  <span className="dropdown-title">Language</span>
                  <span className="dropdown-description">
                    Current: {languages.find(lang => lang.code === currentLanguage)?.name || 'English'}
                  </span>
                </div>
                <span className={`dropdown-arrow-down ${showLanguageSubmenu ? 'rotated' : ''}`}>
                  ▼
                </span>
              </div>

              {/* Language Submenu - Now appears below */}
              {showLanguageSubmenu && (
                <div className="language-submenu-vertical">
                  <div className="language-grid">
                    {languages.map((lang) => (
                      <div 
                        key={lang.code}
                        className={`language-option ${currentLanguage === lang.code ? 'active' : ''}`}
                        onClick={() => handleLanguageSelect(lang.code)}
                      >
                        <span className="language-flag">{lang.flag}</span>
                        <span className="language-name">{lang.name}</span>
                        {currentLanguage === lang.code && (
                          <span className="current-indicator">✓</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="dropdown-divider"></div>

            {/* Settings */}
            <div className="dropdown-item" onClick={handleSettingsClick}>
              <span className="dropdown-icon">⚙️</span>
              <div className="dropdown-content">
                <span className="dropdown-title">Settings</span>
                <span className="dropdown-description">Customize your experience</span>
              </div>
            </div>

            {/* Login/Logout Options */}
            {user && token ? (
              <div className="dropdown-item logout-item" onClick={handleLogout}>
                <span className="dropdown-icon">🚪</span>
                <div className="dropdown-content">
                  <span className="dropdown-title">Logout</span>
                  <span className="dropdown-description">Sign out of your account</span>
                </div>
              </div>
            ) : (
              <Link to="/auth" className="dropdown-item login-item" onClick={() => setIsOpen(false)}>
                <span className="dropdown-icon">🔑</span>
                <div className="dropdown-content">
                  <span className="dropdown-title">Login</span>
                  <span className="dropdown-description">Sign in to your account</span>
                </div>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Use your existing SettingsPanel component */}
      <SettingsPanel 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
};

export default MoreDropdown;
