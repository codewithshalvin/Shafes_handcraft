// src/context/SubscriptionContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const SubscriptionContext = createContext();

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

export const SubscriptionProvider = ({ children }) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionDate, setSubscriptionDate] = useState(null);

  // Load subscription status from localStorage on mount
  useEffect(() => {
    const savedSubscription = localStorage.getItem('shafes_subscription');
    if (savedSubscription) {
      const subscriptionData = JSON.parse(savedSubscription);
      setIsSubscribed(subscriptionData.isSubscribed);
      setSubscriptionDate(subscriptionData.date);
    }
  }, []);

  // Subscribe function
  const subscribe = (email) => {
    const subscriptionData = {
      isSubscribed: true,
      date: new Date().toISOString(),
      email: email
    };
    
    localStorage.setItem('shafes_subscription', JSON.stringify(subscriptionData));
    setIsSubscribed(true);
    setSubscriptionDate(subscriptionData.date);
  };

  // Unsubscribe function
  const unsubscribe = () => {
    localStorage.removeItem('shafes_subscription');
    setIsSubscribed(false);
    setSubscriptionDate(null);
  };

  const value = {
    isSubscribed,
    subscriptionDate,
    subscribe,
    unsubscribe
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};