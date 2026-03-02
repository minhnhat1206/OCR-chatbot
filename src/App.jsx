import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Bot, Loader2, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// === CẤU HÌNH WEBHOOK N8N ===
const WEBHOOK_URL = '/webhook/legal-chatbot'; // Proxied via Vite → https://minhnhat.app.n8n.cloud

function App() {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('chatHistory');
    if (saved) {
      return JSON.parse(saved);
    }
    return [{
      id: 1,
      sender: 'ai',
      text: 'Xin chào! Tôi là Trợ lý AI pháp luật lao động. Bạn cần tôi giải đáp thắc mắc gì?',
      timestamp: new Date().toISOString()
    }];
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => {
    const saved = localStorage.getItem('chatSessionId');
    if (saved) return saved;
    const newId = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
    localStorage.setItem('chatSessionId', newId);
    return newId;
  });

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('chatHistory', JSON.stringify(messages));
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px';
    }
  }, [input]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: input.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    if (!WEBHOOK_URL) {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          sender: 'ai',
          text: 'Vui lòng điền biến `WEBHOOK_URL` trong file `src/App.jsx` để tôi kết nối với n8n.',
          timestamp: new Date().toISOString()
        }]);
        setIsLoading(false);
      }, 1000);
      return;
    }

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          chatInput: userMsg.text
        })
      });

      if (!response.ok) throw new Error('Network response was not ok');

      const data = await response.json();
      const replyText = data.output || data.text || data.response || (typeof data === 'string' ? data : JSON.stringify(data));

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'ai',
        text: replyText,
        timestamp: new Date().toISOString()
      }]);
    } catch (error) {
      console.error('Webhook error:', error);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'ai',
        text: 'Lỗi: Không thể kết nối đến máy chủ. Vui lòng thử lại sau.',
        timestamp: new Date().toISOString(),
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ sự kiện chat?')) {
      const initialMsg = [{
        id: Date.now(),
        sender: 'ai',
        text: 'Lịch sử đã được xóa. Tôi có thể tiếp tục hỗ trợ gì cho bạn?',
        timestamp: new Date().toISOString()
      }];
      setMessages(initialMsg);
      localStorage.setItem('chatHistory', JSON.stringify(initialMsg));
    }
  };

  return (
    <div className="w-full h-full min-h-screen py-4 px-4 md:py-8 flex items-center justify-center">
      {/* Container Chính - Centered Desktop Mode */}
      <div className="glass-panel w-full max-w-[900px] h-[calc(100vh-2rem)] md:h-[calc(100vh-4rem)] flex flex-col rounded-[2.5rem] overflow-hidden shadow-2xl bg-white/70">

        {/* Header Cao Cấp */}
        <div className="px-8 py-5 border-b border-gray-200/50 bg-white/60 backdrop-blur-xl flex justify-between items-center z-20 sticky top-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white shadow-xl shadow-primary-500/30 transform transition-transform hover:scale-105">
              <Bot size={26} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="font-bold text-gray-800 text-xl tracking-tight">Legal AI Assistant</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                </span>
                <span className="text-sm text-gray-500 font-medium">Đang kết nối Webhook</span>
              </div>
            </div>
          </div>

          <button
            onClick={clearHistory}
            className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-300"
            title="Xóa lịch sử"
          >
            <Trash2 size={22} />
          </button>
        </div>

        {/* Khung Chat Chính */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-8 space-y-8 scroll-smooth bg-gradient-to-b from-transparent to-gray-50/50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`message-bounce flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-4 max-w-[85%] md:max-w-[75%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>

                {/* Avatar */}
                <div className={`shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md
                  ${msg.sender === 'user' ? 'bg-gradient-to-br from-gray-700 to-gray-900' : 'bg-gradient-to-br from-primary-500 to-primary-700'}`}
                >
                  {msg.sender === 'user' ? <User size={20} /> : <Bot size={20} />}
                </div>

                {/* Bong Bóng Chat */}
                <div className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`px-6 py-4 shadow-sm text-[15px] leading-relaxed relative ring-1
                    ${msg.sender === 'user'
                      ? 'bg-gray-900 text-white rounded-3xl rounded-tr-md ring-gray-900 shadow-xl shadow-gray-900/10'
                      : msg.isError
                        ? 'bg-red-50 text-red-800 ring-red-200 rounded-3xl rounded-tl-md'
                        : 'bg-white text-gray-800 ring-gray-200/70 rounded-3xl rounded-tl-md shadow-xl shadow-gray-200/20'
                    }`}
                  >
                    {msg.sender === 'user' ? (
                      msg.text.split('\\n').map((line, i) => (
                        <React.Fragment key={i}>
                          {line}
                          {i !== msg.text.split('\\n').length - 1 && <br />}
                        </React.Fragment>
                      ))
                    ) : (
                      <div className="prose prose-sm prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0 prose-strong:text-gray-800 prose-strong:font-bold prose-a:text-primary-600 prose-a:font-semibold max-w-none break-words">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            text({ node, children }) {
                              if (typeof children !== 'string') return children;
                              // Highlight regex patterns: (Điều X), (Khoản Y), (Điểm Z), (Bộ luật W)
                              const parts = children.split(/(Điều\s+\d+[a-zA-Z]*|Khoản\s+\d+|Điểm\s+[a-z]|Bộ luật\s+[A-ZĐa-zđ\s]+)/g);
                              return (
                                <>
                                  {parts.map((part, i) => {
                                    if (part.match(/^(Điều\s+\d+[a-zA-Z]*|Khoản\s+\d+|Điểm\s+[a-z]|Bộ luật\s+[A-ZĐa-zđ\s]+)$/)) {
                                      return <span key={i} className="font-semibold text-primary-700 bg-primary-50 px-1 py-0.5 rounded-md border border-primary-100">{part}</span>;
                                    }
                                    return <span key={i}>{part}</span>;
                                  })}
                                </>
                              );
                            }
                          }}
                        >
                          {msg.text}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 mt-2 px-2 font-medium">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="message-bounce flex w-full justify-start">
              <div className="flex gap-4 max-w-[85%] flex-row">
                <div className="shrink-0 w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white shadow-md">
                  <Bot size={20} />
                </div>
                <div className="px-6 py-4 shadow-xl shadow-gray-200/20 bg-white ring-1 ring-gray-200/70 rounded-3xl rounded-tl-md flex items-center gap-3 text-gray-500">
                  <Loader2 size={18} className="animate-spin text-primary-600" />
                  <span className="text-sm font-medium">Đang suy nghĩ...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>

        {/* Khung Nhập Liệu Điểm Nhấn */}
        <div className="px-6 pb-6 pt-2 bg-gradient-to-t from-white via-white to-transparent">
          <form
            onSubmit={handleSend}
            className="flex items-end gap-3 bg-white rounded-[2rem] p-2.5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] ring-1 ring-gray-200/80 focus-within:ring-2 focus-within:ring-primary-500 focus-within:shadow-[0_8px_30px_rgba(14,165,233,0.15)] transition-all duration-300 mx-auto max-w-[800px]"
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Hỏi về bộ luật lao động... (Shift + Enter để xuống hàng)"
              className="flex-1 min-h-[50px] bg-transparent border-none focus:ring-0 resize-none py-3.5 px-5 text-[16px] outline-none text-gray-700 placeholder:text-gray-400 scroll-smooth leading-relaxed"
              rows="1"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="mb-1.5 shrink-0 w-12 h-12 rounded-full bg-gray-900 text-white flex items-center justify-center hover:bg-primary-600 disabled:opacity-40 disabled:hover:bg-gray-900 transition-all duration-300 shadow-md group"
            >
              {isLoading ? (
                <Loader2 size={22} className="animate-spin" />
              ) : (
                <Send size={20} className="ml-0.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              )}
            </button>
          </form>
          <div className="text-center mt-4 text-xs text-gray-400 font-medium tracking-wide pb-2">
            AI DO GOM ĐƯỢC CUNG CẤP CÓ THỂ SAI LỆCH VÀ CHỈ MANG TÍNH CHẤT THAM KHẢO
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
