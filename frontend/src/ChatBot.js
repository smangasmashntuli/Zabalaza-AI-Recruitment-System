import React, { useState, useRef, useEffect } from 'react';
import './ChatBot.css';
import { chatWithGemini } from './api/candidates';

const ChatBot = ({ buttonContext = null, onContextReceived = null }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { type: 'bot', text: '🤖 Hello! I\'m your AI Career Assistant. How can I help you today?' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeContext, setActiveContext] = useState(buttonContext);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle when button context is received from JobPortal
  useEffect(() => {
    if (buttonContext && buttonContext !== activeContext) {
      setActiveContext(buttonContext);
      setIsOpen(true); // Auto-open chat when context is provided

      // Add context message to chat
      const contextMsg = buttonContext.context || 'Loading context...';
      setMessages(prev => [...prev,
        { type: 'bot', text: contextMsg, isContext: true }
      ]);

      if (onContextReceived) {
        onContextReceived(buttonContext);
      }
    }
  }, [buttonContext, activeContext, onContextReceived]);

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
      const recentHistory = messages
        .slice(-10)
        .map(msg => ({
          user: msg.type === 'user' ? msg.text : '',
          assistant: msg.type === 'bot' ? msg.text : ''
        }))
        .filter(item => item.user || item.assistant);

      console.log('📤 Sending chat message:', userMessage);
      console.log('📊 History items:', recentHistory.length);
      if (activeContext) {
        console.log('📋 Context:', activeContext.button_type);
      }

      // Send message with context
      const response = await chatWithGemini(
        userMessage,
        recentHistory,
        activeContext?.query || null // Send the Gemini query if available
      );

      console.log('📥 API Response:', response);

      // CRITICAL: Check response format
      if (!response) {
        console.error('❌ API returned null/undefined response');
        setMessages(prev => [...prev, {
          type: 'bot',
          text: 'No response received from server. Please try again.'
        }]);
        setIsLoading(false);
        return;
      }

      // Extract the actual message text
      let botMessage = response?.response;

      // If response is a string directly
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
        title="AI Career Assistant"
      >
        <img src="/robot.png" alt="AI Assistant" className="chatbot-icon-img" />
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="chatbot-panel">
          {/* Header */}
          <div className="chatbot-header">
            <h3>CareerMate AI</h3>
            <button
              className="chatbot-close"
              onClick={toggleChat}
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>

          {/* Messages Container */}
          <div className="chatbot-messages">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`chatbot-message ${msg.type} ${msg.isContext ? 'context-message' : ''}`}
              >
                <div className="message-content">{msg.text}</div>
              </div>
            ))}

            {isLoading && (
              <div className="chatbot-message bot">
                <div className="message-content">
                  <span className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Active Context Badge */}
          {activeContext && (
            <div className="context-badge">
              <strong>Context:</strong> {activeContext.job_title}
            </div>
          )}

          {/* Input Area */}
          <form onSubmit={handleSendMessage} className="chatbot-input-form">
            <input
              type="text"
              className="chatbot-input"
              placeholder="Ask me anything..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isLoading}
              autoComplete="off"
            />
            <button
              type="submit"
              className="chatbot-send"
              disabled={isLoading || !inputValue.trim()}
            >
              →
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default ChatBot;

