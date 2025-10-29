// frontend/src/services/chatbotService.js
class ChatbotService {
  constructor() {
    // Point to your backend server
    this.baseURL = 'http://localhost:5000/api';
    this.conversationHistory = [];
  }

  async sendMessage(message) {
    try {
      const response = await fetch(`${this.baseURL}/chatbot/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          conversationHistory: this.conversationHistory
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // Update conversation history
        this.conversationHistory.push(
          { role: "user", parts: [{ text: message }] },
          { role: "model", parts: [{ text: data.message }] }
        );
        
        // Keep only last 10 exchanges
        if (this.conversationHistory.length > 20) {
          this.conversationHistory = this.conversationHistory.slice(-20);
        }
      }

      return data;

    } catch (error) {
      console.error('Chatbot service error:', error);
      return {
        success: false,
        message: 'Unable to connect to chatbot. Please try again.',
        error: error.message
      };
    }
  }

  clearHistory() {
    this.conversationHistory = [];
  }
}

export default new ChatbotService();
