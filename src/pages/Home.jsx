import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import k from "../assets/keychain (2).jpeg";
import c from "../assets/crochet.jpeg";
import h from "../assets/hoop1.jpeg";
import ill from "../assets/illu1.jpeg";
import "./Home.css";

import OftenBought from "../components/OftenBought/OftenBought.jsx";

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hoveredAchievement, setHoveredAchievement] = useState(null);
  const carouselRef = useRef(null);

  const categories = [
    { name: "Resin", path: "/categories" },
    { name: "Illustration Painting", path: "/categories" },
    { name: "Hoop Art", path: "/categories" },
    { name: "Crochet", path: "/categories" },
  ];

  const featured = [
    { id: 1, name: "Resin Keychain", image: k, category: "Handcrafted Resin Art" },
    { id: 2, name: "Resin Coaster", image: ill, category: "Custom Illustrations" },
    { id: 3, name: "Hoop Art Wall Hanging", image: h, category: "Embroidery Art" },
    { id: 4, name: "Crochet", image: c, category: "Handmade Textiles" },
  ];

  // Achievement photos data - replace with your actual achievement images
  const achievements = [
    { 
      id: 1, 
      image: k, 
      title: "Premium Resin Crafts", 
      description: "Custom keychains & accessories",
      badge: "Bestseller",
      stats: "500+ Orders"
    },
    { 
      id: 2, 
      image: ill, 
      title: "Custom Illustrations", 
      description: "Personalized artwork & portraits",
      badge: "Featured",
      stats: "200+ Artworks"
    },
    { 
      id: 3, 
      image: h, 
      title: "Hoop Art Mastery", 
      description: "Embroidered wall hangings",
      badge: "Trending",
      stats: "150+ Pieces"
    },
    { 
      id: 4, 
      image: c, 
      title: "Crochet Collections", 
      description: "Handmade textile creations",
      badge: "Popular",
      stats: "300+ Items"
    },
  ];

  // Auto-slide functionality with pause on hover
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isAnimating) {
        nextSlide();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [currentSlide, isAnimating]);

  const nextSlide = () => {
    setIsAnimating(true);
    setCurrentSlide((prev) => (prev + 1) % featured.length);
    setTimeout(() => setIsAnimating(false), 800);
  };

  const prevSlide = () => {
    setIsAnimating(true);
    setCurrentSlide((prev) => (prev - 1 + featured.length) % featured.length);
    setTimeout(() => setIsAnimating(false), 800);
  };

  const goToSlide = (index) => {
    if (index !== currentSlide && !isAnimating) {
      setIsAnimating(true);
      setCurrentSlide(index);
      setTimeout(() => setIsAnimating(false), 800);
    }
  };

  return (
    <div className="home-container">
      {/* Often Bought Section (from DB) */}
      <section>
        {/* Dynamically inserted below via component import */}
      </section>
      {/* Hero Section */}
      <section className="hero">
        <p></p>
        <Link to="/Products" className="btn">Shop Now</Link>
      </section>

      {/* Often Bought - live from orders */}
      <OftenBought limit={8} />

      {/* Advanced Featured Products Carousel */}
      <section className="featured-advanced">
        <div className="section-header">
          <h3 className="gradient-text">Featured Products</h3>
          <div className="header-accent"></div>
        </div>
        
        <div 
          className="advanced-carousel-container"
          ref={carouselRef}
        >
          <div className="carousel-stage">
            {featured.map((item, index) => {
              const offset = index - currentSlide;
              const absOffset = Math.abs(offset);
              const isActive = index === currentSlide;
              
              return (
                <div
                  key={item.id}
                  className={`carousel-card ${isActive ? 'active' : ''}`}
                  style={{
                    transform: `
                      translateX(${offset * 320}px) 
                      translateZ(${isActive ? 0 : -200}px) 
                      rotateY(${offset * 15}deg)
                      scale(${isActive ? 1 : 0.8})
                    `,
                    opacity: absOffset > 2 ? 0 : 1 - (absOffset * 0.3),
                    zIndex: 10 - absOffset,
                    filter: `blur(${absOffset * 2}px)`,
                  }}
                  onClick={() => goToSlide(index)}
                >
                  <div className="card-glass">
                    <div className="card-reflection"></div>
                    <div className="card-glow"></div>
                    
                    <div className="image-container">
                      <img src={item.image} alt={item.name} />
                      <div className="image-overlay"></div>
                    </div>
                    
                    <div className="card-content-glass">
                      <div className="floating-elements">
                        <span className="element-1"></span>
                        <span className="element-2"></span>
                        <span className="element-3"></span>
                      </div>
                      
                      <h4 className="product-name">{item.name}</h4>
                      <p className="product-category">{item.category}</p>
                      
                      <div className="card-footer">
                        <div className="popularity-indicator">
                          <div className="popularity-bar"></div>
                          <span>Popular</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Advanced Navigation */}
          <button 
            className="nav-btn nav-prev" 
            onClick={prevSlide}
            disabled={isAnimating}
          >
            <span className="nav-icon">‹</span>
            <div className="nav-ripple"></div>
          </button>
          
          <button 
            className="nav-btn nav-next" 
            onClick={nextSlide}
            disabled={isAnimating}
          >
            <span className="nav-icon">›</span>
            <div className="nav-ripple"></div>
          </button>

          {/* Progress Indicators */}
          <div className="progress-indicators">
            {featured.map((_, index) => (
              <button
                key={index}
                className={`progress-dot ${index === currentSlide ? 'active' : ''}`}
                onClick={() => goToSlide(index)}
              >
                <span className="dot-inner"></span>
                <div className="dot-ripple"></div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 🎉 NEW: Our Achievements Gallery - Animated */}
      <section className="achievements-gallery">
        <div className="section-header">
          <h3 className="gradient-text">Our Creative Achievements</h3>
          <p className="section-subtitle">Showcasing our finest handcrafted masterpieces</p>
          <div className="header-accent"></div>
        </div>
        
        <div className="achievements-container">
          <div className="achievements-grid">
            {achievements.map((achievement, index) => (
              <div
                key={achievement.id}
                className={`achievement-card ${hoveredAchievement === index ? 'hovered' : ''}`}
                style={{
                  animationDelay: `${index * 0.2}s`
                }}
                onMouseEnter={() => setHoveredAchievement(index)}
                onMouseLeave={() => setHoveredAchievement(null)}
              >
                {/* Floating Badge */}
                <div className="achievement-badge">
                  <span className="badge-text">{achievement.badge}</span>
                  <div className="badge-glow"></div>
                </div>
                
                {/* Stats Indicator */}
                <div className="stats-indicator">
                  <div className="stats-icon">📈</div>
                  <span className="stats-text">{achievement.stats}</span>
                </div>
                
                {/* Image Container with Multiple Effects */}
                <div className="achievement-image-container">
                  <div className="image-wrapper">
                    <img 
                      src={achievement.image} 
                      alt={achievement.title}
                      className="achievement-image"
                    />
                    <div className="image-overlay-gradient"></div>
                    <div className="shimmer-effect"></div>
                    
                    {/* Floating Particles */}
                    <div className="particle particle-1">✨</div>
                    <div className="particle particle-2">⭐</div>
                    <div className="particle particle-3">💫</div>
                  </div>
                  
                  {/* Hover Reveal Content */}
                  <div className="hover-content">
                    <div className="hover-icon">🎨</div>
                    <p className="hover-text">View Gallery</p>
                  </div>
                </div>
                
                {/* Content with Staggered Animation */}
                <div className="achievement-content">
                  <div className="content-wrapper">
                    <h4 className="achievement-title">{achievement.title}</h4>
                    <p className="achievement-description">{achievement.description}</p>
                    
                    {/* Action Button */}
                    <Link to="/categories" className="achievement-btn">
                      <span className="btn-text">Explore</span>
                      <div className="btn-ripple"></div>
                      <div className="btn-glow"></div>
                    </Link>
                  </div>
                  
                  {/* Progress Bar Animation */}
                  <div className="progress-container">
                    <div className="progress-bar">
                      <div className="progress-fill"></div>
                    </div>
                    <span className="progress-label">Mastery Level</span>
                  </div>
                </div>
                
                {/* Card Glow Effects */}
                <div className="card-glow-effect"></div>
                <div className="card-border-effect"></div>
              </div>
            ))}
          </div>
          
          {/* Decorative Elements */}
          <div className="floating-shapes">
            <div className="shape shape-1"></div>
            <div className="shape shape-2"></div>
            <div className="shape shape-3"></div>
          </div>
        </div>
      </section>
    </div>
  );
}
