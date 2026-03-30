import React, { useState, useRef, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed top-0 right-0 h-full z-70 flex flex-col"
            style={{
              width: 'min(420px, 90vw)',
              background: 'var(--color-background)',
              borderLeft: '1px solid var(--theme-border)',
              boxShadow: '-20px 0 60px rgba(0,0,0,0.3)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--theme-border)' }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.12)' }}>
                  <span className="material-symbols-outlined" style={{ color: '#818cf8', fontSize: '20px' }}>smart_toy</span>
                </div>
                <div>
                  <h3 className="font-headline text-sm font-bold" style={{ color: 'var(--theme-text-heading)' }}>AI Tutor</h3>
                  <p className="font-label text-[10px] uppercase tracking-wider" style={{ color: 'var(--color-primary)' }}>PRO FEATURE</p>
                </div>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors">
                <span className="material-symbols-outlined" style={{ color: 'var(--theme-text-muted)', fontSize: '20px' }}>close</span>
              </button>
            </div>

            {/* Topic indicator */}
            <div className="px-6 py-3" style={{ background: 'rgba(99,102,241,0.04)', borderBottom: '1px solid var(--theme-border)' }}>
              <p className="font-body text-xs truncate" style={{ color: 'var(--theme-text-muted)' }}>
                <span className="material-symbols-outlined align-middle mr-1" style={{ fontSize: '14px', color: 'var(--color-primary)' }}>topic</span>
                {topicTitle || 'Current Topic'}
              </p>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-4 custom-scroll">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(99,102,241,0.08)' }}>
                    <span className="material-symbols-outlined text-3xl" style={{ color: '#818cf8' }}>chat</span>
                  </div>
                  <p className="font-body text-sm mb-2" style={{ color: 'var(--theme-text-heading)' }}>Ask me anything!</p>
                  <p className="font-body text-xs mb-6" style={{ color: 'var(--theme-text-muted)' }}>I'll answer based on this topic's video content</p>

                  {/* Suggested questions */}
                  <div className="space-y-2 w-full">
                    {suggestedQuestions.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => { setInput(q); inputRef.current?.focus(); }}
                        className="w-full text-left px-4 py-3 rounded-xl font-body text-xs transition-all hover:scale-[1.01]"
                        style={{
                          background: 'var(--theme-hover-bg)',
                          border: '1px solid var(--theme-border)',
                          color: 'var(--theme-text-body)',
                        }}
                      >
                        <span className="material-symbols-outlined align-middle mr-2" style={{ fontSize: '14px', color: 'var(--color-primary)' }}>arrow_forward</span>
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-3 rounded-2xl ${
                      msg.role === 'user' 
                        ? 'bg-indigo-600 text-white' 
                        : msg.role === 'system' 
                          ? 'bg-amber-500/10 border border-amber-500/20 text-amber-200'
                          : 'bg-white/5 border border-white/10 text-slate-200'
                    }`}
                  >
                    {msg.role === 'system' && (
                      <span className="material-symbols-outlined align-middle mr-1" style={{ fontSize: '14px', color: '#fbbf24' }}>info</span>
                    )}
                    {msg.role === 'assistant' ? (
                      <div className="markdown-body text-sm leading-relaxed">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                            strong: ({node, ...props}) => <strong className="font-bold text-slate-200" {...props} />,
                            code: ({node, inline, ...props}) => 
                              inline ? (
                                <code className="px-1.5 py-0.5 rounded text-xs font-mono bg-black/20 text-indigo-300" {...props} />
                              ) : (
                                <pre className="p-3 my-2 rounded-lg text-xs font-mono bg-black/30 overflow-x-auto text-indigo-200 custom-scroll"><code {...props} /></pre>
                              ),
                            ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2 last:mb-0 space-y-1" {...props} />,
                            ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-2 last:mb-0 space-y-1" {...props} />,
                            li: ({node, ...props}) => <li className="pl-1" {...props} />,
                            a: ({node, ...props}) => <a className="text-indigo-400 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />
                          }}
                        >
                          {msg.text}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <span style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</span>
                    )}
                  </div>
                </motion.div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="px-4 py-3 rounded-2xl" style={{ background: 'var(--theme-hover-bg)', border: '1px solid var(--theme-border)' }}>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="px-4 py-4" style={{ borderTop: '1px solid var(--theme-border)' }}>
              {!isPro && (
                <div className="mb-3 px-3 py-2 rounded-lg flex items-center gap-2 border border-amber-500/20 bg-amber-500/10">
                  <span className="material-symbols-outlined text-amber-500 text-[16px]">lock</span>
                  <p className="font-body text-[11px] text-amber-200/90">
                    This feature is for premium users. <Link to="/#pricing" className="underline font-bold text-amber-500 hover:text-amber-400">Upgrade</Link>
                  </p>
                </div>
              )}
              <div className="flex items-center gap-2 rounded-xl px-4 py-2.5" style={{
                background: 'var(--dash-input-bg, var(--theme-hover-bg))',
                border: '1px solid var(--dash-input-border, var(--theme-border))',
                opacity: isPro ? 1 : 0.6,
              }}>
                <input
                  ref={inputRef}
                  type="text"
                  className="flex-1 bg-transparent border-none outline-none font-body text-sm"
                  style={{ color: 'var(--theme-text-heading)' }}
                  placeholder={isPro ? "Ask about this topic..." : "Premium feature..."}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  disabled={loading || !isPro}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || loading || !isPro}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-30"
                  style={{ background: 'var(--color-primary)' }}
                >
                  <span className="material-symbols-outlined text-white" style={{ fontSize: '16px' }}>send</span>
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
