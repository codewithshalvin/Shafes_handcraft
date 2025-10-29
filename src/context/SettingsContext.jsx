import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    const savedSettings = localStorage.getItem('userSettings');
    return savedSettings ? JSON.parse(savedSettings) : {
      theme: 'light',
      fontSize: 'medium',
      fontFamily: 'Inter',
      primaryColor: '#007bff',
      animations: true,
      compactMode: false
    };
  });

  // Available Google Fonts
  const availableFonts = {
    'Inter': 'Inter:wght@300;400;500;600;700',
    'Roboto': 'Roboto:wght@300;400;500;700',
    'Open Sans': 'Open+Sans:wght@300;400;500;600;700',
    'Poppins': 'Poppins:wght@300;400;500;600;700',
    'Montserrat': 'Montserrat:wght@300;400;500;600;700',
    'Nunito': 'Nunito:wght@300;400;500;600;700',
    'Lato': 'Lato:wght@300;400;700',
    'Playfair Display': 'Playfair+Display:wght@400;500;600;700',
    'Source Sans Pro': 'Source+Sans+Pro:wght@300;400;600;700',
    'Ubuntu': 'Ubuntu:wght@300;400;500;700'
  };

  // Load Google Fonts Web Font Loader
  useEffect(() => {
    // Load Web Font Loader script if not already loaded
    if (!window.WebFont && !document.getElementById('webfont-loader')) {
      const script = document.createElement('script');
      script.id = 'webfont-loader';
      script.src = 'https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js';
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  const loadGoogleFont = (fontName) => {
    return new Promise((resolve, reject) => {
      // If WebFont is not loaded yet, wait and try again
      if (!window.WebFont) {
        setTimeout(() => {
          loadGoogleFont(fontName).then(resolve).catch(reject);
        }, 100);
        return;
      }

      const googleFontName = availableFonts[fontName];
      if (!googleFontName) {
        // If it's not a Google Font, just resolve (system font)
        resolve();
        return;
      }

      window.WebFont.load({
        google: {
          families: [googleFontName]
        },
        active: () => {
          console.log(`✅ Font loaded successfully: ${fontName}`);
          resolve();
        },
        inactive: () => {
          console.warn(`⚠️ Font failed to load: ${fontName}`);
          reject(new Error(`Failed to load font: ${fontName}`));
        },
        timeout: 3000 // 3 second timeout
      });
    });
  };

  const updateSetting = async (key, value) => {
    // If updating font family, load the font first
    if (key === 'fontFamily' && value !== settings.fontFamily) {
      try {
        // Show loading state (you can add a loading indicator here)
        console.log(`🔄 Loading font: ${value}`);
        
        await loadGoogleFont(value);
        
        // Font loaded successfully, update settings
        setSettings(prev => {
          const newSettings = { ...prev, [key]: value };
          localStorage.setItem('userSettings', JSON.stringify(newSettings));
          return newSettings;
        });
      } catch (error) {
        console.error('Failed to load font:', error);
        // Optionally show error message to user
        alert(`Failed to load font: ${value}. Using fallback font.`);
        // Still update the setting (will use fallback)
        setSettings(prev => {
          const newSettings = { ...prev, [key]: value };
          localStorage.setItem('userSettings', JSON.stringify(newSettings));
          return newSettings;
        });
      }
    } else {
      // For non-font settings, update immediately
      setSettings(prev => {
        const newSettings = { ...prev, [key]: value };
        localStorage.setItem('userSettings', JSON.stringify(newSettings));
        return newSettings;
      });
    }
  };

  const resetSettings = async () => {
    const defaultSettings = {
      theme: 'light',
      fontSize: 'medium',
      fontFamily: 'Inter',
      primaryColor: '#007bff',
      animations: true,
      compactMode: false
    };

    // Load default font
    try {
      await loadGoogleFont(defaultSettings.fontFamily);
    } catch (error) {
      console.error('Failed to load default font:', error);
    }

    setSettings(defaultSettings);
    localStorage.setItem('userSettings', JSON.stringify(defaultSettings));
  };

  // Apply settings to DOM
  useEffect(() => {
    // Apply theme
    document.documentElement.setAttribute('data-theme', settings.theme);
    
    // Apply font size
    document.documentElement.style.fontSize = getFontSizeValue(settings.fontSize);
    
    // Apply primary color
    document.documentElement.style.setProperty('--primary-color', settings.primaryColor);
    
    // Apply font family with proper fallbacks
    const fontStack = getFontStack(settings.fontFamily);
    document.documentElement.style.setProperty('--font-family', fontStack);
    document.body.style.fontFamily = fontStack;
    
    // Apply animations setting
    if (!settings.animations) {
      document.documentElement.style.setProperty('--transition-duration', '0s');
    } else {
      document.documentElement.style.removeProperty('--transition-duration');
    }
    
    // Apply compact mode
    if (settings.compactMode) {
      document.documentElement.classList.add('compact-mode');
    } else {
      document.documentElement.classList.remove('compact-mode');
    }
  }, [settings]);

  // Load initial font
  useEffect(() => {
    loadGoogleFont(settings.fontFamily).catch(console.error);
  }, []);

  const getFontSizeValue = (size) => {
    const sizes = {
      small: '14px',
      medium: '16px',
      large: '18px',
      xlarge: '20px'
    };
    return sizes[size] || sizes.medium;
  };

  const getFontStack = (fontName) => {
    // Define fallback stacks for different font types
    const fallbacks = {
      'Inter': '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      'Roboto': '"Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      'Open Sans': '"Open Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      'Poppins': '"Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      'Montserrat': '"Montserrat", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      'Nunito': '"Nunito", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      'Lato': '"Lato", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      'Playfair Display': '"Playfair Display", Georgia, "Times New Roman", serif',
      'Source Sans Pro': '"Source Sans Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      'Ubuntu': '"Ubuntu", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    };
    
    return fallbacks[fontName] || `"${fontName}", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  };

  return (
    <SettingsContext.Provider value={{
      settings,
      updateSetting,
      resetSettings,
      getFontSizeValue,
      getFontStack,
      availableFonts: Object.keys(availableFonts),
      loadGoogleFont
    }}>
      {children}
    </SettingsContext.Provider>
  );
};
