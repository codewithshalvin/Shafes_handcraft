import React from 'react';
import { useChatbot } from '../../context/ChatbotContext';

const ChatToggle = () => {
  const { isOpen, setIsOpen } = useChatbot();

  return (
    <button 
      className={`chat-toggle-btn ${isOpen ? 'chat-open' : ''}`}
      onClick={() => setIsOpen(!isOpen)}
      title={isOpen ? 'Close Chat' : 'Open Chat Support'}
      aria-label={isOpen ? 'Close Chat' : 'Open Chat Support'}
    >
      {isOpen ? '✕' : '💬'}
    </button>
  );
};

export default ChatToggle;
