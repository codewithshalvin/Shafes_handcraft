// src/components/Footer.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSubscription } from '../context/SubscriptionContext';
import './Footer.css';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [localSubscribed, setLocalSubscribed] = useState(false);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const navigate = useNavigate();
  const { isSubscribed, subscribe } = useSubscription();

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email && !isSubscribed) {
      // Use subscription context to save subscription
      subscribe(email);
      setLocalSubscribed(true);
      setEmail('');
      // Show success message for 2 seconds, then redirect to ShafesChannel
      setTimeout(() => {
        navigate('/shafeschannel');
        setLocalSubscribed(false);
      }, 2000);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <footer className="footer">
      {/* Back to Top Button */}
      <button className="back-to-top" onClick={scrollToTop}>
        <span className="back-to-top-icon">↑</span>
        <div className="back-to-top-ripple"></div>
      </button>

      {/* Animated Wave Decoration */}
      <div className="footer-waves">
        <div className="wave wave1"></div>
        <div className="wave wave2"></div>
        <div className="wave wave3"></div>
      </div>

      <div className="footer-content">
        {/* Main Footer Sections */}
        <div className="footer-container">
          {/* About Section */}
          <div className="footer-section about-section">
            <h3 className="section-title">
              <span className="title-icon">🎨</span>
              About Us
            </h3>
            <p className="section-description">
              Shafe's Handcraft is your premier destination for unique, handmade crafts. 
              We specialize in creating beautiful, one-of-a-kind pieces that bring warmth 
              and personality to your home.
            </p>
            <div className="about-stats">
              <div className="stat-item">
                <span className="stat-number">500+</span>
                <span className="stat-label">Happy Customers</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-number">1000+</span>
                <span className="stat-label">Crafts Made</span>
              </div>
            </div>
          </div>

          {/* Contact Section */}
          <div className="footer-section contact-section">
            <h3 className="section-title">
              <span className="title-icon">📞</span>
              Contact Us
            </h3>
            <div className="contact-info">
              <div className="contact-item">
                <span className="contact-icon">📍</span>
                <span>Thoothukudi</span>
              </div>
              <div className="contact-item">
                <span className="contact-icon">📧</span>
                <span>shalvinfelcia@gmail.com</span>
              </div>
              <div className="contact-item">
                <span className="contact-icon">📱</span>
                <span>6382221045</span>
              </div>
              <div className="contact-item">
                <span className="contact-icon">🕒</span>
                <span>Available 24/7</span>
              </div>
            </div>
          </div>

          {/* Newsletter Section */}
          <div className="footer-section newsletter-section">
            <h3 className="section-title">
              <span className="title-icon">📧</span>
              Stay Connected
            </h3>
            
            <p className="newsletter-description">
              Get the latest updates on new products, special offers, and creative tips!
            </p>

            {isSubscribed ? (
              <div className="already-subscribed">
                <div className="subscribed-message">
                  <span className="subscribed-icon">⭐</span>
                  <span>You're already subscribed!</span>
                  <button 
                    className="visit-channel-btn"
                    onClick={() => navigate('/shafeschannel')}
                  >
                    Visit Channel →
                  </button>
                </div>
              </div>
            ) : (
              <form className="newsletter-form" onSubmit={handleSubscribe}>
                <div className="newsletter-input-group">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="newsletter-input"
                    required
                  />
                  <button 
                    type="submit" 
                    className={`newsletter-btn ${localSubscribed ? 'subscribed' : ''}`}
                    disabled={localSubscribed}
                  >
                    {localSubscribed ? '✓' : '→'}
                  </button>
                </div>
                {localSubscribed && (
                  <div className="success-message">
                    <span className="success-icon">🎉</span>
                    Welcome to Shafe's Channel! Redirecting...
                  </div>
                )}
              </form>
            )}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <div className="copyright">
              <p>© {currentYear} Shafe's Handcraft. All rights reserved.</p>
              <p className="tagline">Made with ❤️ for craft lovers everywhere</p>
            </div>
            
            <div className="footer-bottom-links">
              <Link to="/privacy" className="bottom-link">Privacy Policy</Link>
              <span className="separator">•</span>
              <Link to="/terms" className="bottom-link">Terms of Service</Link>
              <span className="separator">•</span>
              <Link to="/cookies" className="bottom-link">Cookie Policy</Link>
            </div>

            <div className="payment-methods">
              <span className="payment-text">We Accept:</span>
              <div className="payment-icons">
                <span className="payment-icon">💳</span>
                <span className="payment-icon">📱</span>
                <span className="payment-icon">🏦</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="floating-elements">
        <span className="floating-element element-1">✨</span>
        <span className="floating-element element-2">🎨</span>
        <span className="floating-element element-3">💫</span>
        <span className="floating-element element-4">🌟</span>
      </div>
    </footer>
  );
};

export default Footer;
