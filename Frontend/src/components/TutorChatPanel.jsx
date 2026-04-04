import React, { useState, useRef, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import MarkdownRenderer from './MarkdownRenderer';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export default function TutorChatPanel({ isOpen, onClose, courseId, moduleIndex, subtopicIndex, topicTitle, isPro }) {
  const { user } = useUser();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Reset chat when topic changes
  useEffect(() => {
    setMessages([]);
    setInput('');
  }, [courseId, moduleIndex, subtopicIndex]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, text: m.text }));

      const res = await fetch(`${API_BASE}/api/tutor-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerkId: user.id,
          courseId,
          moduleIndex,
          subtopicIndex,
          message: userMsg,
          history
        })
      });

      const data = await res.json();

      if (data.success) {
        setMessages(prev => [...prev, { role: 'assistant', text: data.reply }]);
      } else if (data.limitReached) {
        setMessages(prev => [...prev, { role: 'system', text: data.message }]);
      } else {
        setMessages(prev => [...prev, { role: 'system', text: 'Something went wrong. Please try again.' }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'system', text: 'Failed to connect. Please try again.' }]);
    }

    setLoading(false);
  };

  const suggestedQuestions = [
    `Explain the key concepts of ${topicTitle || 'this topic'}`,
    'Can you give me a simple example?',
    'What are the common mistakes to avoid?',
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-60"
            style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, translateY: '-48%' }}
            animate={{ opacity: 1, scale: 1, translateY: '-50%' }}
            exit={{ opacity: 0, scale: 0.95, translateY: '-48%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-6 z-70 flex flex-col overflow-hidden rounded-[32px]"
            style={{
              top: '50%',
              width: 'min(450px, 92vw)',
              height: 'min(820px, 85vh)',
              background: 'var(--theme-nav-bg)',
              backdropFilter: 'blur(35px)',
              border: '1px solid var(--theme-border-strong)',
              boxShadow: '0 25px 60px rgba(0,0,0,0.2), 0 0 0 1px var(--theme-border)',
            }}>
            {/* Header */}
            <div className="relative shrink-0 flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid var(--theme-border-strong)' }}>
              <div className="flex items-center gap-3">
                <div className="flex flex-col">
                  <h3 className="font-headline text-base font-bold tracking-tight" style={{ color: 'var(--theme-text-heading)' }}>AI Learning Tutor</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                    <span className="font-label text-[10px] uppercase tracking-widest font-black" 
                      style={{ color: '#6366f1', opacity: 0.9 }}>Intelligence Online</span>
                  </div>
                </div>
              </div>
              <button onClick={onClose} 
                className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 transition-all active:scale-90 group"
                style={{ border: '1px solid var(--theme-border)' }}>
                <span className="material-symbols-outlined group-hover:rotate-90 transition-transform duration-300" 
                  style={{ color: 'var(--theme-text-muted)', fontSize: '20px' }}>close</span>
              </button>
            </div>

            {/* Topic context pill */}
            <div className="relative px-6 py-3 shrink-0" style={{ background: 'var(--theme-hover-bg)', borderBottom: '1px solid var(--theme-border-strong)' }}>
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[15px] text-indigo-500">auto_awesome</span>
                <p className="font-label text-[10px] font-bold uppercase tracking-wider truncate" style={{ color: 'var(--theme-text-muted)' }}>
                  Active Context: <span style={{ color: 'var(--theme-text-heading)', fontWeight: 800 }}>{topicTitle || 'General Lesson Content'}</span>
                </p>
              </div>
            </div>

            {/* Messages Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-6 custom-scroll relative">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-16 h-16 rounded-[24px] flex items-center justify-center mb-6 shadow-sm" 
                    style={{ background: 'var(--theme-hover-bg)', border: '1px solid var(--theme-border-strong)' }}>
                    <span className="material-symbols-outlined text-3xl text-indigo-500">forum</span>
                  </motion.div>
                  <h4 className="font-headline text-xl font-bold mb-2" style={{ color: 'var(--theme-text-heading)' }}>How can I help you today?</h4>
                  <p className="font-body text-[13px] mb-8 px-8 opacity-70 leading-relaxed" style={{ color: 'var(--theme-text-body)' }}>
                    I'm your personal AI tutor, ready to clarify concepts, provide examples, or help you debug your code.
                  </p>

                  {/* Suggested questions */}
                  <div className="flex flex-wrap justify-center gap-2.5 px-4">
                    {suggestedQuestions.map((q, i) => (
                      <motion.button
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + i * 0.1 }}
                        onClick={() => { setInput(q); inputRef.current?.focus(); }}
                        className="px-4 py-2.5 rounded-2xl font-body text-[11px] font-semibold transition-all hover:bg-indigo-500/10 border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 active:scale-95 shadow-xs"
                        style={{ color: 'var(--theme-text-body-strong)' }}
                      >
                        {q}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Message List */}
              <div className="space-y-6">
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`relative min-w-[70px] max-w-[90%] px-5 py-4 rounded-[26px] shadow-xs transition-all ${
                        msg.role === 'user' 
                          ? 'bg-linear-to-br from-[#6366f1] to-[#8b5cf6] text-white rounded-tr-none border border-white/10' 
                          : msg.role === 'system' 
                            ? 'bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-200'
                            : 'bg-black/4 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-tl-none'
                      }`}
                    >
                      {msg.role === 'assistant' ? (
                        <div className="max-w-none prose-slate dark:prose-invert">
                          <MarkdownRenderer content={msg.text} className="text-[14.5px] leading-relaxed font-body" />
                        </div>
                      ) : (
                        <p className="text-[14.5px] leading-relaxed font-body" style={{ color: msg.role === 'user' ? '#fff' : 'var(--theme-text-body-strong)', whiteSpace: 'pre-wrap' }}>{msg.text}</p>
                      )}
                      
                      <div className={`mt-2 font-label text-[9px] uppercase tracking-widest opacity-50 font-bold ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                        {msg.role === 'user' ? 'User Presence' : 'Lumina AI Tutor'}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {loading && (
                <div className="flex justify-start">
                   <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                     className="px-5 py-4 rounded-[24px] rounded-tl-none bg-black/4 dark:bg-white/5 border border-black/5 dark:border-white/10 max-w-[120px]">
                    <div className="flex items-center gap-3">
                       <span className="material-symbols-outlined text-indigo-500 animate-spin text-[16px]">progress_activity</span>
                       <span className="font-label text-[10px] uppercase font-black tracking-tighter text-indigo-600 dark:text-indigo-400">Processing</span>
                    </div>
                  </motion.div>
                </div>
              )}
            </div>

            {/* Input Station */}
            <div className="relative shrink-0 px-6 py-6" style={{ borderTop: '1px solid var(--theme-border-strong)', background: 'var(--theme-nav-bg)' }}>
              {!isPro && (
                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 rounded-2xl flex items-center justify-between border border-amber-500/20 bg-amber-500/10">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="material-symbols-outlined text-amber-500 text-[20px] shrink-0">workspace_premium</span>
                    <p className="font-body text-[11px] text-amber-800 dark:text-amber-200/90 leading-snug truncate">
                      Upgrade to <strong className="text-amber-600 dark:text-amber-500 font-black">Pro</strong> for unlimited <br/> AI tutoring support.
                    </p>
                  </div>
                  <Link to="/#pricing" className="shrink-0 px-4 py-2 rounded-xl bg-amber-500 text-[10px] font-black uppercase text-white hover:bg-amber-400 transition-all shadow-md active:scale-95">
                    Upgrade
                  </Link>
                </motion.div>
              )}
              
              <div className={`group relative transition-all duration-300 ${!isPro ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <div className="relative flex items-center gap-3 rounded-2xl px-5 py-4 transition-all" style={{
                  background: 'var(--dash-input-bg)',
                  border: '1px solid var(--dash-input-border)',
                }}>
                  <textarea
                    ref={inputRef}
                    rows={1}
                    className="flex-1 bg-transparent border-none outline-none font-body text-[14px] resize-none max-h-40 custom-scroll placeholder:opacity-50"
                    style={{ color: 'var(--theme-text-heading)' }}
                    placeholder={isPro ? "What would you like to clarify?..." : "AI tutoring is locked..."}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    disabled={loading || !isPro}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || loading || !isPro}
                    className="shrink-0 w-10 min-h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 group shadow-sm"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #818cf8)' }}
                  >
                    <span className="material-symbols-outlined text-white" style={{ fontSize: '20px' }}>send</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
