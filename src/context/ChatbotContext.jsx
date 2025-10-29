import React, { createContext, useContext, useState, useEffect } from 'react';

const ChatbotContext = createContext();

export const useChatbot = () => {
  const context = useContext(ChatbotContext);
  if (!context) {
    throw new Error('useChatbot must be used within a ChatbotProvider');
  }
  return context;
};

export const ChatbotProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! Welcome to Shafe's Handcraft! We specialize in beautiful resin art, crochet items, illustrations, and custom polaroid frames. How can I help you today?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  // Enhanced rule-based patterns and responses for resin craft business
  const chatPatterns = [
    // Greetings
    {
      patterns: [/hi|hello|hey|good morning|good afternoon|good evening/i],
      responses: [
        "Hello! Welcome to Shafe's Handcraft! We create beautiful resin art, crochet items, custom illustrations, and polaroid frames. How can I assist you today?",
        "Hi there! I'm here to help you explore our handcrafted resin products, crochet items, and custom artwork. What interests you?",
        "Welcome to Shafe's Handcraft! We specialize in custom resin work and handmade crafts. What can I help you find today?"
      ]
    },

    // Resin Products - General
    {
      patterns: [/resin|epoxy|clear.*art|resin.*art|resin.*product/i],
      responses: [
        "Our resin products are truly special! We create custom keychains, photo frames, ocean art pieces, and varmala preservation. Prices range from ₹150 to ₹8000 depending on size and customization. What type of resin art interests you?",
        "We specialize in beautiful resin artwork including ocean-themed pieces, custom keychains, frames, and wedding varmala preservation. Each piece is unique and handcrafted. Would you like to know about specific resin products?",
        "Resin art is our specialty! From small keychains starting at ₹150 to elaborate ocean art pieces up to ₹8000, we create custom pieces just for you. What kind of resin work are you looking for?"
      ]
    },

    // Custom Keychains
    {
      patterns: [/keychain|key.*chain|key.*ring|custom.*key/i],
      responses: [
        "Our custom resin keychains are perfect personalized gifts! We can embed photos, flowers, or create unique designs. Prices start from ₹150 and vary based on design complexity. Would you like to discuss a custom design?",
        "Custom resin keychains are very popular! We can create them with your photos, names, dates, or special elements. Starting at ₹150, each one is handcrafted uniquely. What design did you have in mind?",
        "Resin keychains make wonderful gifts! We offer photo keychains, floral designs, or completely custom creations. Prices begin at ₹150. Tell me what kind of keychain you'd like!"
      ]
    },

    // Resin Frames
    {
      patterns: [/resin.*frame|photo.*frame|picture.*frame|frame.*resin/i],
      responses: [
        "Our resin photo frames are stunning! We create custom frames with embedded elements, ocean themes, or clear designs. Prices vary from ₹400 to ₹3000 based on size and customization. What size frame do you need?",
        "Resin frames are perfect for preserving special memories! We offer various sizes and can customize with colors, elements, or themes. Pricing starts at ₹400. What type of frame interests you?",
        "Custom resin frames are a beautiful way to display photos! We can create ocean-themed, floral, or minimalist designs in different sizes. Prices range from ₹400-₹3000. What's your preference?"
      ]
    },

    // Ocean Art
    {
      patterns: [/ocean.*art|sea.*art|wave.*art|beach.*art|ocean.*resin/i],
      responses: [
        "Our ocean art pieces are breathtaking! We create realistic wave effects, beach scenes, and marine-themed resin art. These range from ₹800 to ₹8000 depending on size and complexity. Would you like to see some examples?",
        "Ocean-themed resin art is one of our specialties! We capture the beauty of waves, beaches, and sea life in resin. Prices vary from ₹800 for smaller pieces to ₹8000 for large artwork. What size are you considering?",
        "We love creating ocean art! From small wave coasters to large sea-themed wall art, each piece captures the ocean's beauty. Pricing ranges ₹800-₹8000. What type of ocean art would you like?"
      ]
    },

    // Varmala Preservation
    {
      patterns: [/varmala|wedding.*garland|garland.*preservation|preserve.*flowers|wedding.*flowers/i],
      responses: [
        "Varmala preservation in resin is a beautiful way to keep your wedding memories forever! We carefully preserve your wedding garland in clear resin, creating lasting keepsakes. Prices range from ₹2000 to ₹6000 based on size and design. When is your wedding?",
        "We specialize in preserving wedding varmalas in resin! This creates a permanent, beautiful memory of your special day. Pricing starts at ₹2000 for small pieces up to ₹6000 for larger displays. Would you like to discuss your varmala preservation?",
        "Wedding varmala preservation is one of our most cherished services! We transform your wedding flowers into stunning resin keepsakes. Prices range ₹2000-₹6000. Do you have a wedding coming up?"
      ]
    },

    // Crochet Products
    {
      patterns: [/crochet|knit|yarn|wool|crochet.*item|handmade.*fabric/i],
      responses: [
        "Our crochet collection includes beautiful handmade items like bags, tops, accessories, and home decor! Each piece is carefully crafted with quality yarn. Prices vary by item complexity. What type of crochet item interests you?",
        "We create lovely crochet products including clothing, bags, blankets, and decorative items. All are handmade with care and attention to detail. What crochet item are you looking for?",
        "Crochet items are perfect for gifts or personal use! We make bags, clothing, home accessories, and more. Each piece is unique and handcrafted. What would you like to know about our crochet work?"
      ]
    },

    // Illustration and Painting
    {
      patterns: [/illustration|painting|custom.*art|portrait|drawing|artwork/i],
      responses: [
        "We create beautiful custom illustrations and paintings! From portraits to custom artwork, each piece is hand-drawn/painted with care. Prices vary based on size, detail, and medium. What type of illustration are you interested in?",
        "Our illustration services include custom portraits, artwork, and personalized drawings. We work in various styles and mediums. Pricing depends on complexity and size. What kind of illustration would you like?",
        "Custom illustrations make perfect personalized gifts! We create portraits, artwork, and custom designs. Each piece is original and handcrafted. Tell me about the illustration you have in mind!"
      ]
    },

    // Polaroid Frames - Types and Sizes
    {
      patterns: [/polaroid|instant.*photo|polaroid.*frame|photo.*print|instant.*frame/i],
      responses: [
        "We offer various polaroid frame options! Available in different sizes - small (3x4 inches), medium (4x6 inches), and large (5x7 inches). Frame types include wooden, resin-embedded, decorative, and minimalist styles. Which size and style interests you?",
        "Polaroid frames are perfect for instant memories! We have multiple sizes and frame types: wooden frames, resin frames with embedded elements, decorative borders, and clean minimalist designs. What style do you prefer?",
        "Our polaroid frame collection includes various sizes and styles! From simple wooden frames to elaborate resin-embedded designs. Available in 3x4, 4x6, and 5x7 inch sizes. What type of polaroid frame are you looking for?"
      ]
    },

    // Pricing inquiries
    {
      patterns: [/price|cost|how much|expensive|cheap|budget|starting.*price/i],
      responses: [
        "Our prices vary by product type! Resin items: ₹150-₹8000 (keychains start at ₹150, ocean art up to ₹8000). Crochet items, illustrations, and polaroid frames have different pricing based on complexity. What specific item interests you?",
        "Pricing depends on the product! Resin work ranges from ₹150 for small keychains to ₹8000 for large custom pieces. Crochet, illustration, and frame prices vary by size and customization. Which product would you like pricing for?",
        "We offer competitive prices for handcrafted quality! Resin products: ₹150-₹8000 range, with customization affecting final price. Each piece is made to order. What specific item can I price for you?"
      ]
    },

    // Shipping and delivery time
    {
      patterns: [/shipping|delivery|ship|when.*arrive|how long|dispatch|send/i],
      responses: [
        "All our products are shipped within 15 days of order confirmation! We need this time to handcraft each piece with care and attention to detail. Please plan your orders accordingly as we don't accept urgent requests.",
        "We require 15 days for shipping all items since each piece is custom-made! This ensures quality and attention to detail. We cannot accommodate urgent or rush orders, so please order in advance.",
        "Our standard shipping time is 15 days for all products! This allows us to carefully craft your custom piece. We don't take urgent orders, so please place orders well in advance of when you need them."
      ]
    },

    // Urgent orders
    {
      patterns: [/urgent|rush|quick|fast|immediate|asap|emergency|need.*soon/i],
      responses: [
        "I understand you might need something quickly, but we don't accept urgent orders. All our products require 15 days for proper crafting and shipping. This ensures the quality you deserve! Please plan ahead for your orders.",
        "Sorry, we don't take urgent or rush orders! Each piece needs 15 days to be properly handcrafted and shipped. We believe in quality over speed. Please order at least 15 days before you need the item.",
        "We don't offer urgent services as quality craftsmanship takes time! All orders need 15 days minimum. This ensures each piece meets our high standards. Please plan your orders accordingly."
      ]
    },

    // Customization process
    {
      patterns: [/custom|personalize|customize|design|make.*own|bespoke/i],
      responses: [
        "We love creating custom pieces! For resin work, we can embed photos, flowers, colors, or special elements. Crochet items can be made in your choice of colors and patterns. Illustrations can be personalized portraits or designs. What custom piece interests you?",
        "Customization is our specialty! We can personalize resin items with your photos/elements, create crochet pieces in your preferred colors, or make custom illustrations. Each piece is unique to you. What would you like customized?",
        "Custom work is what makes us special! Whether it's resin art with your personal elements, crochet in your favorite colors, or custom illustrations, we make it uniquely yours. Tell me about your custom vision!"
      ]
    },

    // Order process
    {
      patterns: [/order|place.*order|buy|purchase|how.*order/i],
      responses: [
        "To place an order, first let me know what product interests you! Once we discuss your requirements and pricing, we'll collect details and start crafting. Remember, all orders take 15 days to complete. What would you like to order?",
        "Ordering is easy! Tell me what you'd like, we'll discuss customization and pricing, then confirm your order. We'll start crafting immediately and ship within 15 days. What product interests you?",
        "Ready to order? Let's discuss what you need - product type, customization, and confirm pricing. Once everything is set, we begin crafting! Each order takes 15 days. What catches your interest?"
      ]
    },

    // Quality and materials
    {
      patterns: [/quality|material|durable|last|good.*quality|how.*made/i],
      responses: [
        "We use only high-quality materials! Our resin is premium grade for clarity and durability. Crochet items use quality yarn for longevity. All work is handcrafted with attention to detail ensuring each piece lasts. Quality is our priority!",
        "Quality is everything to us! We source the best resin, yarns, and art materials. Each piece is carefully handcrafted to ensure it lasts for years. We never compromise on material quality or craftsmanship.",
        "We believe in lasting quality! Premium resin that won't yellow, quality yarns that hold their shape, and archival art materials. Every piece is made to be treasured for years. Quality craftsmanship is our promise!"
      ]
    },

    // Care instructions
    {
      patterns: [/care|maintain|clean|wash|preserve|keep.*good/i],
      responses: [
        "Care instructions vary by product! Resin items can be wiped with a soft, damp cloth. Crochet items may be hand washed gently. We provide detailed care instructions with each order to help your item last longer. What product care are you asking about?",
        "Proper care ensures longevity! Resin pieces need minimal care - just gentle wiping. Crochet items require gentle hand washing. We include care cards with every order. What specific item care would you like to know about?",
        "We want your items to last! Resin art requires simple care - avoid harsh chemicals, just soft cloth cleaning. Crochet items need gentle handling. Detailed care instructions come with each purchase. Which product's care interests you?"
      ]
    },

    // Support and help
    {
      patterns: [/help|support|problem|issue|contact|assistance/i],
      responses: [
        "I'm here to help! I can assist with product information, pricing, customization options, ordering process, or care instructions. What specific question do you have about our resin art, crochet items, illustrations, or polaroid frames?",
        "What can I assist you with today? I can help with product details, custom orders, pricing, shipping timelines, or any other questions about our handcrafted items. How can I help?",
        "How can I help you? I'm knowledgeable about all our products - resin art, crochet work, custom illustrations, and polaroid frames. I can also help with ordering, pricing, and care instructions. What interests you?"
      ]
    },

    // Returns and satisfaction
    {
      patterns: [/return|refund|exchange|money back|dissatisfied|not.*happy/i],
      responses: [
        "Since all our items are custom-made to your specifications, we have a limited return policy. We ensure quality before shipping and work with you during the design process. If there's an issue with craftsmanship, we'll make it right. What concerns do you have?",
        "Our items are custom-made, so returns are limited to quality issues or our errors. We work closely with customers during creation to ensure satisfaction. If there's a craftsmanship problem, we'll resolve it. What's the issue?",
        "Given the custom nature of our work, we focus on getting it right the first time! We collaborate with you throughout the process. For genuine quality issues, we'll find a solution. What can we address for you?"
      ]
    },

    // Goodbye
    {
      patterns: [/bye|goodbye|see you|thanks|thank you|that's all/i],
      responses: [
        "Thank you for your interest in Shafe's Handcraft! Remember, we create beautiful resin art, crochet items, illustrations, and custom frames. Feel free to return anytime with questions. Happy crafting!",
        "Goodbye! Thanks for learning about our handcrafted resin art and custom products. Don't hesitate to come back when you're ready to order or have more questions. Have a wonderful day!",
        "Thanks for chatting! Whether you need resin art, crochet work, custom illustrations, or polaroid frames, we're here to create something special for you. Come back anytime!"
      ]
    },

    // Default fallback
    {
      patterns: [/.*/],
      responses: [
        "I can help you with information about our resin art (₹150-₹8000), crochet items, custom illustrations, or polaroid frames. We ship in 15 days and don't take urgent orders. What would you like to know?",
        "I'm here to assist with our handcrafted products! Ask me about resin keychains, frames, ocean art, varmala preservation, crochet work, illustrations, or polaroid frames. What interests you?",
        "Let me help you explore our custom creations! We specialize in resin art, crochet items, custom illustrations, and polaroid frames. All items are handcrafted and ship within 15 days. What can I tell you about?"
      ]
    }
  ];

  const generateResponse = (userMessage) => {
    const message = userMessage.toLowerCase().trim();
    
    for (const pattern of chatPatterns) {
      for (const regex of pattern.patterns) {
        if (regex.test(message)) {
          const responses = pattern.responses;
          return responses[Math.floor(Math.random() * responses.length)];
        }
      }
    }
    
    // Fallback response
    return "I'm here to help with our handcrafted products! Ask me about resin art (₹150-₹8000), crochet items, custom illustrations, or polaroid frames. What interests you?";
  };

  const sendMessage = (text) => {
    if (!text.trim()) return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      text: text.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    // Simulate bot typing delay
    setTimeout(() => {
      const botResponse = generateResponse(text);
      const botMessage = {
        id: Date.now() + 1,
        text: botResponse,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000); // Random delay between 1-2 seconds
  };

  const clearChat = () => {
    setMessages([
      {
        id: 1,
        text: "Hello! Welcome to Shafe's Handcraft! We specialize in beautiful resin art, crochet items, illustrations, and custom polaroid frames. How can I help you today?",
        sender: 'bot',
        timestamp: new Date()
      }
    ]);
  };

  return (
    <ChatbotContext.Provider value={{
      isOpen,
      setIsOpen,
      messages,
      sendMessage,
      clearChat,
      isTyping
    }}>
      {children}
    </ChatbotContext.Provider>
  );
};
