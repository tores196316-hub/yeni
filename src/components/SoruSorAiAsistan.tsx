import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, Trash2, HelpCircle, ChevronDown, RefreshCw, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const QUICK_QUESTIONS = [
  '📸 Resim nasıl yüklenir?',
  '📏 Maksimum dosya boyutu kaç MB?',
  '🔒 Gizli resim seçeneği nedir?',
  '⚡ PRO Üyelik avantajları nelerdir?',
  '⌛ Resimler ne kadar süre kalır?',
];

export function SoruSorAiAsistan() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasNewBadge, setHasNewBadge] = useState(true);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content:
        'Merhaba! 👋 Ben **Soru Sor AI Asistanı**.\n\nPicHost resim yükleme, üyelik, gizlilik ayarları veya diğer tüm konular hakkında bana dilediğiniz soruyu sorabilirsiniz. Size nasıl yardımcı olabilirim?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setHasNewBadge(false);
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage.trim();
    if (!text || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await response.json();
      const aiReply = data.reply || 'Üzgünüm, şu an yanıt oluşturamadım. Lütfen tekrar deneyin.';

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Bağlantı hatası oluştu. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        role: 'assistant',
        content: 'Sohbet geçmişiniz temizlendi! PicHost hakkında yeni bir soru sorabilirsiniz.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="fixed bottom-5 left-5 z-50">
      {/* Floating Widget Toggle Button (Bottom-Left) */}
      {!isOpen && (
        <motion.button
          id="btn-soru-sor-ai-asistan"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="relative group flex items-center gap-3 bg-slate-900/90 hover:bg-slate-900 border border-slate-700/80 hover:border-sky-500/80 text-white px-4 py-3 rounded-full shadow-2xl backdrop-blur-md transition-all cursor-pointer"
        >
          {/* Animated AI Icon Container */}
          <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-tr from-sky-600 to-indigo-600 text-white shadow-lg">
            <Bot className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>

          <div className="flex flex-col text-left pr-1">
            <div className="flex items-center gap-1.5 font-semibold text-sm text-slate-100 group-hover:text-sky-400 transition-colors">
              <span>Soru Sor AI Asistan</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            </div>
            <span className="text-[11px] text-slate-400 font-medium">PicHost Canlı Destek</span>
          </div>

          {/* New Badge Indicator */}
          {hasNewBadge && (
            <span className="absolute -top-1 -right-1 bg-sky-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md animate-bounce">
              7/24
            </span>
          )}
        </motion.button>
      )}

      {/* Expanded Chat Drawer / Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-[92vw] sm:w-[390px] h-[540px] max-h-[85vh] bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-2xl flex flex-col overflow-hidden text-slate-100"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5 bg-slate-900/90 border-b border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-md">
                  <Bot className="w-5 h-5" />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-900 rounded-full"></span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-sm text-slate-100">
                    <span>Soru Sor AI Asistan</span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Çevrimiçi • PicHost Rehberi</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleClearChat}
                  title="Sohbeti Temizle"
                  className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  title="Kapat"
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs sm:text-sm scrollbar-thin scrollbar-thumb-slate-700">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 ${
                    msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-full bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0 mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div className={`max-w-[82%] space-y-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`p-3 rounded-2xl text-slate-100 leading-relaxed whitespace-pre-wrap break-words ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-sky-600 to-indigo-600 rounded-br-none shadow-md font-medium'
                          : 'bg-slate-800/90 border border-slate-700/60 rounded-bl-none shadow-sm'
                      }`}
                    >
                      {msg.content}
                    </div>
                    <div
                      className={`text-[10px] text-slate-500 px-1 ${
                        msg.role === 'user' ? 'text-right' : 'text-left'
                      }`}
                    >
                      {msg.timestamp}
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing Loader */}
              {isLoading && (
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
                    <Bot className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="bg-slate-800 border border-slate-700/60 px-4 py-2.5 rounded-2xl rounded-bl-none flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce"></span>
                    <span className="text-xs text-slate-400 ml-1">Düşünüyor...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Question Chips (Show if conversation is short) */}
            {messages.length <= 3 && !isLoading && (
              <div className="px-3 py-2 bg-slate-950/40 border-t border-slate-800/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth">
                {QUICK_QUESTIONS.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(q)}
                    className="shrink-0 text-[11px] bg-slate-800 hover:bg-sky-600/30 hover:border-sky-500/50 border border-slate-700/80 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-full transition-all cursor-pointer whitespace-nowrap"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input Footer */}
            <div className="p-3 bg-slate-900/90 border-t border-slate-800">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="PicHost ile ilgili sorunuzu yazın..."
                  disabled={isLoading}
                  className="flex-1 bg-slate-950/80 border border-slate-700/80 focus:border-sky-500 focus:ring-1 focus:ring-sky-500/50 text-slate-100 placeholder-slate-500 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl outline-none transition-all disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isLoading}
                  className="bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 disabled:opacity-40 text-white p-2.5 rounded-xl transition-all shadow-md shrink-0 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>

              <div className="flex items-center justify-between mt-2 text-[10px] text-slate-500 px-1">
                <span>⚡ Gemini 3.6 Flash Yapay Zeka</span>
                <Link
                  to="/sss"
                  onClick={() => setIsOpen(false)}
                  className="text-sky-400 hover:underline flex items-center gap-1"
                >
                  <HelpCircle className="w-3 h-3" />
                  Sıkça Sorulan Sorular
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
