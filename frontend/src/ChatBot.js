import React, { useState, useEffect, useRef } from 'react';
import './ChatBot.css';

// Backend chat endpoint. You can set a runtime backend URL via `window.__ENV.BACKEND_URL` or
// `window.BACKEND_URL`. Defaults to http://localhost:8000 for local development.
const BACKEND_BASE = (typeof window !== 'undefined' && (window.__ENV?.BACKEND_URL || window.BACKEND_URL)) || 'http://localhost:8000';
const API_ENDPOINT = `${BACKEND_BASE}/api/v1/generative/chat`;
const MAX_HISTORY_LENGTH = 10;

function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      content: "🧑‍💻 Hello👋! I'm Hire Assistant, your AI Career Assistant 👨‍💼. I can help you search jobs, refine your profile, prep for interviews, and track applications. How can I help you today?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [conversationHistory, setConversationHistory] = useState([]);
  const messagesEndRef = useRef(null);

  const systemInstruction = `You are Hire Assistant, an AI career assistant. Follow these rules:
1. Provide accurate, helpful career and job search information.
2. Help candidates find jobs, refine profiles, and prep for interviews.
3. Use clear, simple language.
4. Always include useful, actionable advice.
5. For specific job opportunities, suggest checking the job portal.
6. Current date: ${new Date().toLocaleDateString()}`;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion);
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');

    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // Send user message + conversation history to our backend proxy
      const requestBody = {
        message: userMessage,
        history: conversationHistory,
        context: null
      };

      // Try primary endpoint, fall back to legacy /api/v1/chat if server mounted differently
      const endpointsToTry = [API_ENDPOINT, `${BACKEND_BASE}/api/v1/chat`];
      let response;
      let data;
      for (const url of endpointsToTry) {
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });

        try {
          data = await response.json();
        } catch (e) {
          data = null;
        }

        if (response.ok) break; // success
        // If 404, try next endpoint. For other errors, stop and report.
        if (response.status === 404) {
          continue;
        } else {
          throw new Error((data && (data.detail || data.error)) || `API Error: ${response.status}`);
        }
      }

      if (!response || !response.ok) {
        throw new Error((data && (data.detail || data.error)) || `API Error: ${response?.status}`);
      }

      const botResponse = data.reply || "I'm sorry, I couldn't generate a response.";

      setMessages(prev => [...prev, { role: 'bot', content: botResponse }]);

      // Update history as an array of turns { user, assistant }
      setConversationHistory(prev => {
        const updated = [...prev, { user: userMessage, assistant: botResponse }];
        return updated.slice(-MAX_HISTORY_LENGTH);
      });

      setIsOnline(true);
    } catch (error) {
      console.error('❌ Chat Error Details:', {
        message: error.message,
        status: error.response?.status,
        detail: error.response?.data?.detail,
        fullResponse: error.response?.data
      });

      const errorMessage = error.response?.data?.detail || error.message || 'Unknown error';
      setMessages(prev => [...prev, {
        role: 'bot',
        content: `⚠️ Error: ${errorMessage}`
      }]);
      setIsOnline(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const showSuggestions = () => (
    <div className="suggestions">
      <p>Try asking:</p>
      <div className="suggestion-buttons">
        {["Find me remote React jobs", "How to improve my profile", "Interview prep tips", "Track my applications"].map((s, i) => (
          <button key={i} className="suggestion-btn" onClick={() => handleSuggestionClick(s)}>{s}</button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="health-chatbot">
      {!isOpen ? (
        <button
          className="chat-launcher"
          onClick={() => setIsOpen(true)}
          title="Open Chat Assistant"
        >
          <img
            src="https://cdn-icons-png.flaticon.com/512/4712/4712035.png"
            alt="Chat"
            className="chat-launcher-image"
          />
        </button>
      ) : (
        <div className="chat-container">
          <header className="chat-header">
            <div className="header-content">
              <span className="logo">🤖 Hire Assistant</span>
              <div className="header-actions">
                <span className={`status-indicator ${isOnline ? 'online' : 'offline'}`}>
                  ● {isOnline ? 'Online' : 'Offline'}
                </span>
                <button
                  className="chat-close-button"
                  onClick={() => setIsOpen(false)}
                  title="Close chat"
                >
                  ×
                </button>
              </div>
            </div>
          </header>

          <div className="chat-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.role}-message`}>
                <div className="message-content">{msg.content}</div>
                <div className="message-time">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="message bot-message">
                <div className="typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}

            {messages.length === 1 && showSuggestions()}
            <div ref={messagesEndRef} />
          </div>

          <div className="input-container">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about jobs, profile, interviews…"
              disabled={isLoading}
              autoComplete="off"
            />
            <button
              className="send-button"
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>

          <div className="disclaimer">
            <small>This AI assistant provides career guidance and job matching support. For specific job opportunities, visit the Job Portal.</small>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatBot;

