import React, { useState, useRef, useEffect } from 'react';
import './ChatBot.css';
import { chatWithGemini } from './api/candidates';

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { type: 'bot', text: 'Hi! I\'m your AI career advisor. Ask me anything about job search, career development, or interview prep!' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');

    // Add user message to chat
    setMessages(prev => [...prev, { type: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      // Extract conversation history for context
      const recentHistory = messages.slice(-6).map(msg => ({
        user: msg.type === 'user' ? msg.text : '',
        assistant: msg.type === 'bot' ? msg.text : ''
      })).filter(item => item.user || item.assistant);

      console.log('📤 Sending chat message:', userMessage);
      console.log('📊 History items:', recentHistory.length);
      
      const response = await chatWithGemini(userMessage, recentHistory);
      
      console.log('📥 API Response:', response);
      
      // CRITICAL: Check response format
      if (!response) {
        console.error('❌ API returned null/undefined response');
        setMessages(prev => [...prev, { type: 'bot', text: 'No response received from server. Please try again.' }]);
        setIsLoading(false);
        return;
      }
      
      // Extract the actual message text
      let botMessage = response?.response;
      
      // If response is a string directly (shouldn't happen but handle it)
      if (typeof response === 'string') {
        botMessage = response;
      }
      
      if (!botMessage || !botMessage.trim()) {
        console.warn('⚠️ Received empty bot message:', botMessage);
        botMessage = 'I received an empty response. Please try again.';
      }
      
      console.log('✅ Bot message extracted:', botMessage.substring(0, 50) + '...');
      setMessages(prev => [...prev, { type: 'bot', text: botMessage }]);
    } catch (error) {
      console.error('❌ Chat error:', error);
      
      let errorMessage = 'I encountered an error. Please try again later.';
      
      // Check for specific error types
      if (error.message.includes('401')) {
        errorMessage = 'Your session has expired. Please log in again.';
      } else if (error.message.includes('404')) {
        errorMessage = 'Chat service is not available. Please check your connection.';
      } else if (error.message.includes('500')) {
        errorMessage = 'Server error occurred. Please try again in a moment.';
      } else if (error.message.includes('Network')) {
        errorMessage = 'Network error. Please check your internet connection.';
      }
      
      setMessages(prev => [...prev, { type: 'bot', text: errorMessage }]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        className={`chatbot-toggle ${isOpen ? 'open' : ''}`}
        onClick={toggleChat}
        title={isOpen ? 'Close chat' : 'Open chat'}
      >
        <span className="chatbot-icon">
          {isOpen ? '✕' : '🤖'}
        </span>
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="chatbot-panel">
          <div className="chatbot-header">
            <h3>Career Advisor</h3>
            <button
              className="chatbot-close"
              onClick={toggleChat}
            >
              ✕
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`chatbot-message ${msg.type}`}
              >
                <div className="message-content">
                  {msg.type === 'bot' && <span className="bot-badge">🤖</span>}
                  <p>{msg.text}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="chatbot-message bot loading">
                <div className="message-content">
                  <span className="bot-badge">🤖</span>
                  <div className="typing-indicator">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="chatbot-input-form" onSubmit={handleSendMessage}>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask me anything..."
              disabled={isLoading}
              className="chatbot-input"
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="chatbot-send"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default ChatBot;

