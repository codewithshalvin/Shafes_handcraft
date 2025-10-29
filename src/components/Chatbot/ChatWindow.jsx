// src/components/Chatbot/ChatWindow.jsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useChatbot } from '../../context/ChatbotContext';
import './ChatWindow.css';

const STORAGE_KEY = 'shafes_chat_messages_v1';
const SHOW_SUGGESTIONS = false; // removed “Popular Questions”

function storageAvailable() {
  try {
    const x = '__storage_test__';
    localStorage.setItem(x, x);
    localStorage.removeItem(x);
    return true;
  } catch { return false; }
}

const EMAIL_RE = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
const ORDER_RE = /(?:#?\s*)(\d{5,})/;

// Expanded rules for ShafesHandCraft
const RULES = [
  { id: 'GREET', priority: 100, test: t => /\b(hi|hello|hey)\b/i.test(t),
    handle: () => "Hi! Want to browse products, track an order, ask about shipping, pricing, or start a custom request?" },

  // Shafes categories
  { id: 'RESIN', priority: 95, test: t => /(resin|epoxy|coaster|keychain|frame)/i.test(t),
    handle: () => "Resin picks include coasters, keychains, and frames—say 'popular resin items' or name a theme to see options." },

  { id: 'CROCHET', priority: 94, test: t => /(crochet|amigurumi|plush|yarn|bookmark)/i.test(t),
    handle: () => "Crochet options include plushies and bookmarks—tell me character, size, and colors to suggest matches." },

  { id: 'ILLUSTRATIONS', priority: 93, test: t => /(illustration|portrait|digital\s*art|sketch|chibi)/i.test(t),
    handle: () => "Illustrations available in portrait and chibi styles—share a reference photo and style preference to begin." },

  { id: 'POLAROID', priority: 92, test: t => /(polaroid|instax|photo\s*frame)/i.test(t),
    handle: () => "Polaroid frames can be personalized—add caption/date and photo count to get options." },

  { id: 'BUNDLES', priority: 91, test: t => /(gift|bundle|hamper|combo|diwali|christmas|birthday|anniversary)/i.test(t),
    handle: () => "Gift bundles by occasion are available—share budget and recipient to curate a set." },

  // Existing flows
  { id: 'BROWSE', priority: 90, test: t => /(product|catalog|browse|show|view)/i.test(t),
    handle: () => "Which category would you like to explore—resin art, crochet, illustrations, or polaroid frames?" },

  { id: 'PRICING', priority: 85, test: t => /(price|cost|rate|charges?)/i.test(t),
    handle: () => "Happy to help with pricing—name the category or item and any customization for an estimate." },

  { id: 'CUSTOM', priority: 80, test: t => /(custom|personaliz(e|ation)|bespoke|made\s*to\s*order)/i.test(t),
    handle: () => "Great—share theme, size, colors, and budget; a short brief helps me suggest options fast." },

  { id: 'TRACK_START', priority: 75, test: t => /(track|where.*order|order\s*status|track.*parcel)/i.test(t),
    handle: () => "I can track that—send order number and email together, e.g., '#12345 and you@example.com'.",
    flow: 'TRACK_ORDER' },

  { id: 'SHIPPING', priority: 70, test: t => /(ship|delivery|courier|timeline|ETA|pincode)/i.test(t),
    handle: () => "Do you need domestic, international, or COD details? I can fetch current shipping info." },

  { id: 'RETURNS', priority: 65, test: t => /(return|refund|replace|exchange|cancel)/i.test(t),
    handle: () => "I can share return policy or help start a request—what would you like to do?" },

  { id: 'PAYMENTS', priority: 60, test: t => /(payment|pay|upi|card|cod|gateway)/i.test(t),
    handle: () => "Multiple payment methods may be available—tell me your preference to proceed." },

  { id: 'CONTACT', priority: 55, test: t => /(contact|support|help|phone|email|chat)/i.test(t),
    handle: () => "Prefer an email or a callback? I can log your request right away." },

  // Info utilities
  { id: 'LEAD_TIME', priority: 54, test: t => /(lead\s*time|turnaround|processing|ready\s*by|deadline)/i.test(t),
    handle: () => "Share your deadline and city; I’ll estimate production + shipping and suggest feasible options." },

  { id: 'CARE', priority: 53, test: t => /(care|maintain|clean|wash)/i.test(t),
    handle: () => "Care tips: resin—soft cloth, avoid abrasives/heat; crochet—gentle hand wash, lay flat to dry; need details?" },

  { id: 'BULK', priority: 52, test: t => /(bulk|wholesale|corporate|logo)/i.test(t),
    handle: () => "For bulk/corporate, share quantity range, logo usage, and deadline; I’ll draft next steps." },
];

function matchIntent(text) {
  let best = null;
  for (const r of RULES) if (r.test(text)) best = !best || r.priority > best.priority ? r : best;
  return best;
}

const ChatWindow = () => {
  const { isOpen, closeChat } = useChatbot();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [flow, setFlow] = useState(null);
  const messagesEndRef = useRef(null);

  const addMessage = (text, sender = 'user') => setMessages(prev => [...prev, {
    id: Date.now() + Math.random(), text: String(text), sender, timestamp: Date.now()
  }]);
  const addBot = (t) => addMessage(t, 'bot');

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(scrollToBottom, [messages]);

  // Hydrate + welcome
  useEffect(() => {
    if (!isOpen) return;
    const hydrate = () => {
      if (storageAvailable()) {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) { setMessages(parsed); return; }
        } catch {}
      }
      setTimeout(() => addBot("Welcome to ShafesHandCraft! Ask for resin art, crochet, illustrations, polaroid frames, tracking, or shipping."), 400);
    };
    hydrate();
  }, [isOpen]);

  // Persist
  useEffect(() => {
    if (!messages.length || !storageAvailable()) return;
    const t = setTimeout(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages)); } catch {} }, 150);
    return () => clearTimeout(t);
  }, [messages]);

  // ESC to close
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); handleCloseChat(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  const handleCancelFlow = () => {
    setFlow(null);
    addBot("Cancelled. What next—browse products, track order, or start a custom request?");
  };

  const sendAndReply = async (userTextRaw) => {
    const userText = (userTextRaw ?? inputValue).trim();
    if (!userText) return;
    addMessage(userText, 'user');
    setInputValue('');
    setIsTyping(true);

    // Global cancel
    if (/\b(cancel|nevermind|never mind|stop)\b/i.test(userText)) {
      if (flow) {
        handleCancelFlow();
        setIsTyping(false);
        return;
      }
    }

    // Flow: TRACK_ORDER
    if (flow?.name === 'TRACK_ORDER') {
      const email = (userText.match(EMAIL_RE) || [])[1];
      const orderNum = (userText.match(ORDER_RE) || [])[1];
      if (!email || !orderNum) {
        setTimeout(() => { addBot("Please include both order number and email, e.g., '#12345 and you@example.com'."); setIsTyping(false); }, 500);
        return;
      }
      try {
        // const res = await fetch(`/api/orders/${orderNum}/track?email=${encodeURIComponent(email)}`);
        // const data = await res.json();
        setTimeout(() => {
          addBot(`Order #${orderNum} is in transit; an update has been emailed to ${email}.`);
          setFlow(null);
          setIsTyping(false);
        }, 700);
      } catch {
        setTimeout(() => { addBot("Tracking is unavailable right now—try again soon or ask to contact support."); setIsTyping(false); }, 700);
      }
      return;
    }

    const intent = matchIntent(userText);
    setTimeout(async () => {
      if (intent) {
        if (intent.flow === 'TRACK_ORDER') setFlow({ name: 'TRACK_ORDER' });
        addBot(intent.handle());
        setIsTyping(false);
        return;
      }
      addBot("Sorry, didn’t catch that—try 'View products', 'Track order', 'Shipping', 'Custom order', or 'Contact'.");
      setIsTyping(false);
    }, 600 + Math.random() * 400);
  };

  const handleCloseChat = () => { closeChat(); };

  if (!isOpen) return null;

  return (
    <div className="modern-chat-window">
      <div className="chat-backdrop" onClick={handleCloseChat} />
      <div
        className="chat-container"
        role="dialog" aria-modal="true" aria-labelledby="chat-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modern-chat-header">
          <div className="chat-header-left">
            <div className="bot-avatar"><div className="avatar-image"><span className="avatar-emoji" aria-hidden="true">🎨</span></div><div className="status-indicator online" aria-hidden="true" /></div>
            <div className="bot-info">
              <h3 className="bot-name" id="chat-title">Shafes Assistant</h3>
              <p className="bot-status"><span className="status-dot" aria-hidden="true" />Online • Ready to help</p>
            </div>
          </div>
          <div className="chat-header-actions" role="toolbar" aria-label="Chat actions">
            <button className="header-action minimize" onClick={handleCloseChat} title="Minimize" type="button" aria-label="Minimize chat"><span aria-hidden="true">−</span></button>
            <button className="header-action close" onClick={handleCloseChat} title="Close" type="button" aria-label="Close chat"><span aria-hidden="true">✕</span></button>
          </div>
        </div>

        <div className="modern-chat-messages" role="region" aria-labelledby="chat-title">
          <div className="messages-container" role="log" aria-live="polite" aria-atomic="false">
            {messages.map(m => (
              <div key={m.id} className={`modern-message ${m.sender}`}>
                {m.sender === 'bot' && <div className="message-avatar" aria-hidden="true"><span>🎨</span></div>}
                <div className="message-bubble">
                  <div className="message-text">{m.text}</div>
                  <div className="message-meta">
                    <span className="message-time">{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {m.sender === 'user' && <span className="message-status" aria-label="Sent">✓</span>}
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="modern-message bot" aria-live="polite">
                <div className="message-avatar" aria-hidden="true"><span>🎨</span></div>
                <div className="message-bubble typing-bubble" aria-label="Assistant is typing">
                  <div className="typing-animation"><div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" /></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Quick Actions retained; suggestions removed */}
        {/* Suggestions removed as requested */}

        <div className="modern-chat-input">
          <div className="input-container">
            <button className="input-action attachment" title="Attach file" type="button" aria-label="Attach a file">📎</button>
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAndReply(); } }}
              placeholder="Type your message…"
              className="message-input-field"
              disabled={isTyping}
              rows={1}
              aria-label="Message input"
            />
            <button className="input-action emoji" title="Emoji" type="button" aria-label="Insert emoji">😊</button>
            <button onClick={() => sendAndReply()} className={`send-button ${inputValue.trim() ? 'active' : ''}`} disabled={!inputValue.trim() || isTyping} title="Send message" type="button" aria-label="Send message">
              <span className="send-icon" aria-hidden="true">→</span>
            </button>
          </div>

          <div className="input-footer">
            {flow && <button className="cancel-flow" type="button" onClick={handleCancelFlow} aria-label="Cancel current flow">Cancel</button>}
            <span className="powered-by">⚡ Powered by rules</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
