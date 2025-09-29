// TrainSaleBanner.jsx (same folder as Header.jsx)
import React from 'react';
import './TrainSaleBanner.css';

const TrainSaleBanner = () => {
  return (
    <div className="train-banner">
      <div className="train-track">
        <div className="train-car engine">🚂</div>
        <div className="train-car">SALE IS ON!</div>
        <div className="train-car">70% OFF</div>
        <div className="train-car">FREE SHIPPING</div>
        <div className="train-car">🔥 HOT DEALS</div>
        <div className="train-car">LIMITED TIME</div>
        <div className="train-car engine">🚂</div>
        <div className="train-car">SALE IS ON!</div>
        <div className="train-car">70% OFF</div>
        <div className="train-car">FREE SHIPPING</div>
      </div>
    </div>
  );
};

export default TrainSaleBanner;
