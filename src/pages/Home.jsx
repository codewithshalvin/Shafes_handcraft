import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import k from "../assets/keychain (2).jpeg";
import c from "../assets/crochet.jpeg";
import h from "../assets/hoop1.jpeg";
import ill from "../assets/illu1.jpeg";

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
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
      {/* Hero Section */}
      <section className="hero">
        <p></p>
        <Link to="/Products" className="btn">Shop Now</Link>
      </section>

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

      {/* Categories */}
      <section className="categories">
        <h3>Shop by Category</h3>
        <div className="grid">
          {categories.map((cat, i) => (
            <div key={i} className="card">
              <h4>{cat.name}</h4>
              <Link to={cat.path} className="btn">Explore</Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
