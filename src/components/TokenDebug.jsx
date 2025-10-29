import React from 'react';

const TokenDebug = () => {
  const adminToken = localStorage.getItem('adminToken');
  const isAdmin = localStorage.getItem('isAdmin');
  const adminInfo = localStorage.getItem('adminInfo');
  
  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: 'white', 
      border: '1px solid #ccc',
      padding: '10px',
      borderRadius: '8px',
      fontSize: '12px',
      maxWidth: '300px',
      zIndex: 9999
    }}>
      <h4>🔍 Token Debug</h4>
      <p><strong>adminToken:</strong> {adminToken ? `${adminToken.substring(0, 20)}...` : '❌ Not found'}</p>
      <p><strong>isAdmin:</strong> {isAdmin || '❌ Not found'}</p>
      <p><strong>adminInfo:</strong> {adminInfo || '❌ Not found'}</p>
      <button 
        onClick={() => {
          localStorage.clear();
          window.location.reload();
        }}
        style={{ marginTop: '10px', padding: '5px' }}
      >
        Clear All & Reload
      </button>
    </div>
  );
};

export default TokenDebug;