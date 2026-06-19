import React, { useEffect, useRef, useState } from 'react';
import './ChatBot.css';

const BACKEND_BASE =
  (typeof window !== 'undefined' && (window.__ENV?.BACKEND_URL || window.BACKEND_URL)) ||
  'http://localhost:8000';
const API_ENDPOINT = `${BACKEND_BASE}/api/v1/generative/chat`;
const MAX_HISTORY_LENGTH = 10;

function ChatBot({ mode = 'floating', title = 'Career coach' }) {
  const isEmbedded = mode === 'embedded';
  const [isOpen, setIsOpen] = useState(isEmbedded);
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      content:
        "Hello! I'm Hire Assistant, your AI career coach. I can help you search jobs, refine your profile, prep for interviews, and track applications. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [conversationHistory, setConversationHistory] = useState([]);
  const messagesEndRef = useRef(null);

  const systemInstruction = `You are Hire Assistant, an AI career assistant. Follow these rules:
1. Provide accurate, helpful career and job search information.
2. Help candidates find jobs, refine profiles, and prepare for interviews.
3. Use clear, simple language.
4. Always include useful, actionable advice.
5. For specific job opportunities, suggest checking the job portal.
6. Current date: ${new Date().toLocaleDateString()}`;

  useEffect(() => {
    if (isEmbedded) {
      setIsOpen(true);
    }
  }, [isEmbedded]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion);
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const requestBody = {
        message: userMessage,
        history: conversationHistory,
        context: systemInstruction,
      };
      const token = localStorage.getItem('access_token');
      const endpointsToTry = [API_ENDPOINT, `${BACKEND_BASE}/api/v1/chat`];
      let response;
      let data;

      for (const url of endpointsToTry) {
        response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(requestBody),
        });

        try {
          data = await response.json();
        } catch {
          data = null;
        }

        if (response.ok) break;
        if (response.status !== 404) {
          throw new Error(data?.detail || data?.error || `API Error: ${response.status}`);
        }
      }

      if (!response || !response.ok) {
        throw new Error(data?.detail || data?.error || `API Error: ${response?.status}`);
      }

      const botResponse = data?.reply || data?.response || "I'm sorry, I couldn't generate a response.";
      setMessages((prev) => [...prev, { role: 'bot', content: botResponse }]);
      setConversationHistory((prev) => [...prev, { user: userMessage, assistant: botResponse }].slice(-MAX_HISTORY_LENGTH));
      setIsOnline(true);
    } catch (error) {
      console.error('Chat Error Details:', error);
      setMessages((prev) => [...prev, { role: 'bot', content: `Error: ${error.message || 'Unknown error'}` }]);
      setIsOnline(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const showSuggestions = () => (
    <div className="suggestions">
      <p>Try asking:</p>
      <div className="suggestion-buttons">
        {[
          'Find me remote React jobs',
          'How do I improve my profile?',
          'Interview prep tips',
          'Help me follow up on an application',
        ].map((suggestion) => (
          <button key={suggestion} className="suggestion-btn" onClick={() => handleSuggestionClick(suggestion)}>
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className={`health-chatbot ${isEmbedded ? 'embedded' : 'floating'}`}>
      {!isOpen && !isEmbedded ? (
        <button className="chat-launcher" onClick={() => setIsOpen(true)} title="Open Career Coach">
          <img
            src="https://cdn-icons-png.flaticon.com/512/4712/4712035.png"
            alt="Career coach"
            className="chat-launcher-image"
          />
        </button>
      ) : (
        <div className="chat-container">
          <header className="chat-header">
            <div className="header-content">
              <span className="logo">{title}</span>
              <div className="header-actions">
                <span className={`status-indicator ${isOnline ? 'online' : 'offline'}`}>
                  {isOnline ? 'Online' : 'Offline'}
                </span>
                {!isEmbedded && (
                  <button className="chat-close-button" onClick={() => setIsOpen(false)} title="Close chat">
                    x
                  </button>
                )}
              </div>
            </div>
          </header>

          <div className="chat-messages">
            {messages.map((msg, idx) => (
              <div key={`${msg.role}-${idx}`} className={`message ${msg.role}-message`}>
                <div className="message-content">{msg.content}</div>
                <div className="message-time">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="message bot-message">
                <div className="typing-indicator">
                  <span />
                  <span />
                  <span />
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
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about jobs, profile, interviews..."
              disabled={isLoading}
              autoComplete="off"
            />
            <button className="send-button" onClick={sendMessage} disabled={isLoading || !input.trim()} aria-label="Send message">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
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
