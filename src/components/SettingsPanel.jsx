// SettingsPanel.jsx
import React from 'react';
import { useSettings } from '../context/SettingsContext';
import './SettingsPanel.css';

const SettingsPanel = ({ isOpen, onClose }) => {
  const { settings, updateSetting, resetSettings, availableFonts } = useSettings();

  if (!isOpen) return null;

  const themes = [
    { value: 'light', name: 'Light', preview: 'light' },
    { value: 'dark', name: 'Dark', preview: 'dark' },
    { value: 'blue', name: 'Blue', preview: 'blue' }
  ];

  const colors = [
    '#007bff', // Blue
    '#28a745', // Green
    '#dc3545', // Red
    '#ffc107', // Yellow
    '#17a2b8', // Cyan
    '#6f42c1', // Purple
    '#fd7e14', // Orange
    '#20c997'  // Teal
  ];

  const fontSizes = [
    { value: 'small', name: 'Small' },
    { value: 'medium', name: 'Medium' },
    { value: 'large', name: 'Large' },
    { value: 'xlarge', name: 'X-Large' }
  ];

  return (
    <div className="settings-panel-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>Settings</h2>
          <button onClick={onClose} className="close-settings">×</button>
        </div>
        
        <div className="settings-content">
          {/* Theme Section */}
          <div className="settings-section">
            <h3>Theme</h3>
            <div className="theme-options">
              {themes.map((theme) => (
                <div
                  key={theme.value}
                  className={`theme-option ${settings.theme === theme.value ? 'active' : ''}`}
                  onClick={() => updateSetting('theme', theme.value)}
                >
                  <div className={`theme-preview ${theme.preview}`}></div>
                  <span className="theme-name">{theme.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Font Family Section */}
          <div className="settings-section">
            <h3>Font Family</h3>
            <div className="font-options">
              {availableFonts.map((font) => (
                <div
                  key={font}
                  className={`font-option ${settings.fontFamily === font ? 'active' : ''}`}
                  onClick={() => updateSetting('fontFamily', font)}
                  style={{ fontFamily: `"${font}", sans-serif` }}
                >
                  {font}
                </div>
              ))}
            </div>
          </div>

          {/* Font Size Section */}
          <div className="settings-section">
            <h3>Font Size</h3>
            <div className="size-options">
              {fontSizes.map((size) => (
                <div
                  key={size.value}
                  className={`size-option ${settings.fontSize === size.value ? 'active' : ''}`}
                  onClick={() => updateSetting('fontSize', size.value)}
                >
                  {size.name}
                </div>
              ))}
            </div>
          </div>

          

          {/* ❌ REMOVED: Toggles Section (Animations & Compact Mode) */}

          {/* Reset Section */}
          <div className="reset-section">
            <button className="reset-btn" onClick={resetSettings}>
              RESET TO DEFAULT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
