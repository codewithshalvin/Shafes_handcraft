import React from 'react';

const SettingsButton = ({ onClick }) => {
  return (
    <button 
      className="settings-toggle-btn"
      onClick={onClick}
      title="Settings"
    >
      ⚙️
    </button>
  );
};

export default SettingsButton;
