import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Bot, User, Trash2 } from 'lucide-react';

export default function ChatbotWidget({ apiUrl }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: 'Hello! I am the KBPIMSR Enquiry Assistant. Ask me anything about our courses, eligibility, fee structures, hostels, or placement details!',
      source: 'System'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    if (!textToSend) setInputText('');

    // Append student message
    const studentMsg = {
      id: Date.now(),
      sender: 'student',
      text: text
    };
    setMessages(prev => [...prev, studentMsg]);
    setIsLoading(true);

    try {
      const response = await fetch(`${apiUrl}/api/chatbot/ask/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: text })
      });

      if (!response.ok) throw new Error('Network response was not ok');

      const data = await response.json();
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: data.answer,
          source: data.source || 'AI Engine'
        }
      ]);
    } catch (error) {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: 'Sorry, I am facing trouble connecting to the server. Please check your network or try again later.',
          source: 'Error Fallback'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  const clearChat = () => {
    setMessages([
      {
        id: 1,
        sender: 'bot',
        text: 'Hello! I am the KBPIMSR Enquiry Assistant. Ask me anything about our courses, eligibility, fee structures, hostels, or placement details!',
        source: 'System'
      }
    ]);
  };

  const quickReplies = [
    "What courses are offered?",
    "What are the eligibility criteria for MCA?",
    "What is the fee structure for MBA?",
    "How are the placement records?",
    "Is hostel available?"
  ];

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1050 }}>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="btn-gold d-flex align-items-center justify-content-center shadow-lg"
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            animation: 'pulse 2s infinite'
          }}
        >
          <MessageSquare size={28} />
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div
          className="glass-panel animate-fade-in-up shadow-lg overflow-hidden d-flex flex-column"
          style={{
            width: '380px',
            height: '520px',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            position: 'absolute',
            bottom: '0',
            right: '0'
          }}
        >
          {/* Header */}
          <div
            className="d-flex align-items-center justify-content-between p-3"
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <div className="d-flex align-items-center gap-2">
              <div
                className="d-flex align-items-center justify-content-center"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(245, 158, 11, 0.15)',
                  color: 'var(--color-gold)'
                }}
              >
                <Bot size={20} />
              </div>
              <div>
                <h6 className="m-0 fw-bold text-white">KBPIMSR Bot</h6>
                <span className="text-success" style={{ fontSize: '0.7rem' }}>
                  ● Online • 24/7 Support
                </span>
              </div>
            </div>
            <div className="d-flex align-items-center gap-2">
              <button
                onClick={clearChat}
                className="btn btn-sm btn-link text-muted p-1 hover-light"
                title="Clear Chat"
              >
                <Trash2 size={16} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="btn btn-sm btn-link text-white p-1 hover-light"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Messages Feed */}
          <div
            className="flex-grow-1 p-3 overflow-y-auto d-flex flex-column gap-3"
            style={{ backgroundColor: 'rgba(10, 25, 47, 0.4)' }}
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`d-flex flex-column ${
                  msg.sender === 'student' ? 'align-items-end' : 'align-items-start'
                }`}
              >
                <div
                  className="d-flex align-items-start gap-2"
                  style={{ maxWidth: '85%' }}
                >
                  {msg.sender === 'bot' && (
                    <div
                      className="d-flex align-items-center justify-content-center mt-1"
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        color: 'var(--color-emerald)',
                        flexShrink: 0
                      }}
                    >
                      <Bot size={14} />
                    </div>
                  )}

                  <div
                    className="p-3"
                    style={{
                      borderRadius:
                        msg.sender === 'student'
                          ? '16px 16px 2px 16px'
                          : '16px 16px 16px 2px',
                      backgroundColor:
                        msg.sender === 'student'
                          ? 'var(--color-emerald)'
                          : 'rgba(255, 255, 255, 0.05)',
                      border:
                        msg.sender === 'student'
                          ? 'none'
                          : '1px solid rgba(255, 255, 255, 0.08)',
                      color: '#ffffff',
                      fontSize: '0.9rem',
                      lineHeight: '1.4'
                    }}
                  >
                    {msg.text}
                    
                    {msg.sender === 'bot' && msg.source && (
                      <div className="mt-1 d-flex justify-content-end">
                        <span 
                          className="badge bg-secondary text-white" 
                          style={{ fontSize: '0.6rem', opacity: 0.7 }}
                        >
                          {msg.source}
                        </span>
                      </div>
                    )}
                  </div>

                  {msg.sender === 'student' && (
                    <div
                      className="d-flex align-items-center justify-content-center mt-1"
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        color: 'var(--color-gold)',
                        flexShrink: 0
                      }}
                    >
                      <User size={14} />
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="d-flex align-items-start gap-2">
                <div
                  className="d-flex align-items-center justify-content-center mt-1"
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    color: 'var(--color-emerald)',
                    flexShrink: 0
                  }}
                >
                  <Bot size={14} />
                </div>
                <div
                  className="p-3"
                  style={{
                    borderRadius: '16px 16px 16px 2px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: 'var(--text-secondary)'
                  }}
                >
                  <div className="d-flex gap-1 align-items-center py-1">
                    <span className="dot" style={{ animation: 'bounce 1.4s infinite ease-in-out', width: '6px', height: '6px', backgroundColor: '#94a3b8', borderRadius: '50%' }}></span>
                    <span className="dot" style={{ animation: 'bounce 1.4s infinite ease-in-out 0.2s', width: '6px', height: '6px', backgroundColor: '#94a3b8', borderRadius: '50%' }}></span>
                    <span className="dot" style={{ animation: 'bounce 1.4s infinite ease-in-out 0.4s', width: '6px', height: '6px', backgroundColor: '#94a3b8', borderRadius: '50%' }}></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick FAQ Chips */}
          <div 
            className="p-2 border-top border-bottom border-dark overflow-x-auto whitespace-nowrap d-flex gap-1"
            style={{ 
              backgroundColor: 'rgba(15, 23, 42, 0.3)',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            {quickReplies.map((reply, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(reply)}
                className="btn btn-sm btn-outline-glass text-nowrap py-1 px-2"
                style={{ fontSize: '0.75rem', borderRadius: '15px' }}
                disabled={isLoading}
              >
                {reply}
              </button>
            ))}
          </div>

          {/* Input Panel */}
          <div
            className="p-3 d-flex gap-2"
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask a question..."
              className="form-control flex-grow-1"
              style={{ fontSize: '0.9rem' }}
              disabled={isLoading}
            />
            <button
              onClick={() => handleSend()}
              className="btn btn-gold d-flex align-items-center justify-content-center p-2"
              disabled={isLoading}
              style={{ width: '42px', height: '42px' }}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Local keyframes for pulse and bounce */}
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7); }
          70% { transform: scale(1.05); box-shadow: 0 0 0 15px rgba(245, 158, 11, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1.0); }
        }
      `}</style>
    </div>
  );
}
