import React, { useState, useRef, useEffect } from 'react';
import './ChatBot.css';
import { chatWithGemini } from './api/candidates';

const SUGGESTIONS = [
  'Find me remote React jobs over $150k',
  "What's a good answer to 'why this company'?",
  'Track my applications',
];

const ChatBot = ({ buttonContext = null, onContextReceived = null }) => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState('idle'); // idle | submitted | streaming
  const inputRef = useRef(null);
  const scrollRef = useRef(null);

  const isLoading = status === 'submitted' || status === 'streaming';

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open, messages.length]);

  useEffect(() => {
    // Auto-scroll
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (buttonContext) {
      setOpen(true);
      // Insert context as a bot message
      setMessages((m) => [...m, { id: `ctx-${Date.now()}`, role: 'assistant', text: buttonContext.context || 'Context provided.' }]);
      if (onContextReceived) onContextReceived(buttonContext);
    }
  }, [buttonContext, onContextReceived]);

  const send = async (text) => {
    const value = text?.trim();
    if (!value || isLoading) return;

    // Add user message
    const userMsg = { id: `u-${Date.now()}`, role: 'user', text: value };
    setMessages((m) => [...m, userMsg]);
    setInput('');

    // Build simple history for backend
    const recentHistory = messages.slice(-12).map((m) => ({ user: m.role === 'user' ? m.text : '', assistant: m.role === 'assistant' ? m.text : '' })).filter((h) => h.user || h.assistant);

    try {
      setStatus('submitted');
      const res = await chatWithGemini(value, recentHistory, buttonContext?.query || null);

      let botText = '';
      if (!res) {
        botText = 'No response from server.';
      } else if (typeof res === 'string') {
        botText = res;
      } else {
        botText = res.response || 'No response text.';
      }

      setMessages((m) => [...m, { id: `b-${Date.now()}`, role: 'assistant', text: botText }]);
    } catch (err) {
      console.error('Chat error', err);
      setMessages((m) => [...m, { id: `e-${Date.now()}`, role: 'assistant', text: 'Sorry — I could not send your message right now.' }]);
    } finally {
      setStatus('idle');
    }
  };

  const handleSend = (text) => send(text);

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`chatbot-toggle ${open ? 'open' : ''}`}
        aria-label="Open Hire AI assistant"
      >
        <img src="/robot.png" alt="AI" className="chatbot-icon-img" />
      </button>

      {open && (
        <div className="chatbot-panel" style={{ bottom: 100, right: 24, position: 'fixed', zIndex: 9999, width: 380, height: 560 }}>
          <div className="chatbot-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: '#e6f4ff', display: 'grid', placeItems: 'center' }}>
                🤖
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Hire Assistant</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>AI · always on</div>
              </div>
            </div>
            <button className="chatbot-close" onClick={() => setOpen(false)} aria-label="Close chat">✕</button>
          </div>

          <div ref={scrollRef} className="chatbot-messages" style={{ padding: 12, overflowY: 'auto', flex: 1, height: 420 }}>
            {messages.length === 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ background: '#fff', borderRadius: 8, padding: 10, fontSize: 13 }}>Hey 👋 I'm Hire — I can help you search jobs, refine your profile, prep for interviews, and track applications. What are you looking for?</div>
                <div style={{ marginTop: 8 }}>
                  {SUGGESTIONS.map((s) => (
                    <button key={s} onClick={() => handleSend(s)} className="chatbot-suggestion">{s}</button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) => (
              <div key={m.id} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
                <div style={{ maxWidth: '85%', padding: 10, borderRadius: 12, background: m.role === 'user' ? '#0ea5e9' : '#f3f4f6', color: m.role === 'user' ? '#fff' : '#111' }}>{m.text}</div>
              </div>
            ))}

            {status === 'submitted' && <div style={{ color: '#6b7280', fontSize: 13 }}>Thinking…</div>}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleSend(input); }} className="chatbot-input-form" style={{ padding: 10, borderTop: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} rows={1} placeholder="Ask about jobs, prep, applications…" style={{ flex: 1, resize: 'none', padding: 8, borderRadius: 8, border: '1px solid #e5e7eb' }} />
              <button type="submit" disabled={!input.trim() || isLoading} className="chatbot-send">→</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default ChatBot;

