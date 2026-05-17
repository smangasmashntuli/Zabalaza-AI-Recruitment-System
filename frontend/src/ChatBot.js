import React, { useEffect, useRef, useState } from 'react';
import './ChatBot.css';
import { chatWithGemini } from './api/candidates';

const WELCOME_MESSAGE =
  "Hey 👋 I'm Hire Assistant — I can help you search jobs, refine your profile, prep for interviews, and track applications. What are you looking for?";

const SUGGESTIONS = [
  'Find me remote React jobs',
  "What's a good answer to 'why this company'?",
  'Track my applications',
];

const MAX_HISTORY_LENGTH = 10;

const ChatBot = ({ buttonContext = null, onContextReceived = null }) => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { id: 'welcome', role: 'assistant', content: WELCOME_MESSAGE },
  ]);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [status, setStatus] = useState('idle'); // idle | submitted | streaming
  const [isOnline, setIsOnline] = useState(true);
  const inputRef = useRef(null);
  const scrollRef = useRef(null);
  const lastContextSignatureRef = useRef('');

  const isLoading = status === 'submitted' || status === 'streaming';
  const hasContextMessage = messages.some((message) => message.role === 'assistant' && message.id.startsWith('ctx-'));

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open, messages.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (!buttonContext) return;

    const signature = `${buttonContext?.query || ''}::${buttonContext?.context || ''}`;
    if (!signature || signature === lastContextSignatureRef.current) return;

    lastContextSignatureRef.current = signature;
    setOpen(true);

    const contextText = buttonContext.context || buttonContext.query || 'Context provided.';
    setMessages((current) => [
      ...current,
      {
        id: `ctx-${Date.now()}`,
        role: 'assistant',
        content: contextText,
      },
    ]);

    if (onContextReceived) {
      onContextReceived(buttonContext);
    }
  }, [buttonContext, onContextReceived]);

  const formatResponse = (response) => {
    if (!response) return 'No response from server.';
    if (typeof response === 'string') return response;
    return response.response || response.message || 'No response text.';
  };

  const sendMessage = async (rawText = input) => {
    const value = rawText?.trim();
    if (!value || isLoading) return;

    const userMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: value,
    };

    setMessages((current) => [...current, userMessage]);
    setInput('');

    const historySnapshot = conversationHistory.slice(-MAX_HISTORY_LENGTH);

    try {
      setStatus('submitted');
      const response = await chatWithGemini(value, historySnapshot, buttonContext?.query || null);
      const botText = formatResponse(response);

      setMessages((current) => [
        ...current,
        {
          id: `b-${Date.now()}`,
          role: 'assistant',
          content: botText,
        },
      ]);

      setConversationHistory((current) => {
        const updated = [...current, { user: value, assistant: botText }];
        return updated.slice(-MAX_HISTORY_LENGTH);
      });

      setIsOnline(true);
    } catch (error) {
      console.error('Chat error', error);
      setIsOnline(false);
      setMessages((current) => [
        ...current,
        {
          id: `e-${Date.now()}`,
          role: 'assistant',
          content: 'Sorry — I could not send your message right now. Please try again.',
        },
      ]);
    } finally {
      setStatus('idle');
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen((value) => !value)}
        className={`chatbot-toggle ${open ? 'open' : ''}`}
        aria-label="Open Hire AI assistant"
      >
        <img src="/robot.png" alt="AI" className="chatbot-icon-img" />
      </button>

      {open && (
        <div
          className="chatbot-panel"
          style={{ bottom: 100, right: 24, position: 'fixed', zIndex: 9999, width: 380, height: 560 }}
        >
          <div className="chatbot-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: '#e6f4ff',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                🤖
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Hire Assistant</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>
                  AI · {isOnline ? 'online' : 'offline'}
                </div>
              </div>
            </div>
            <button className="chatbot-close" onClick={() => setOpen(false)} aria-label="Close chat">
              ✕
            </button>
          </div>

          <div
            ref={scrollRef}
            className="chatbot-messages"
            style={{ padding: 12, overflowY: 'auto', flex: 1, height: 420 }}
          >
            {messages.length === 1 && !hasContextMessage && (
              <div style={{ marginTop: 8, marginBottom: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => sendMessage(suggestion)}
                    className="chatbot-suggestion"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`chatbot-message ${message.role}`}
                style={{ marginBottom: 8 }}
              >
                <div className="message-content">
                  <p>{message.content}</p>
                </div>
              </div>
            ))}

            {isLoading && <div style={{ color: '#6b7280', fontSize: 13 }}>Thinking…</div>}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage();
            }}
            className="chatbot-input-form"
            style={{ padding: 10, borderTop: '1px solid #e5e7eb' }}
          >
            <div style={{ display: 'flex', gap: 8 }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Ask about jobs, prep, applications…"
                className="chatbot-input"
                style={{ flex: 1, resize: 'none' }}
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="chatbot-send"
              >
                →
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default ChatBot;

