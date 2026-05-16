import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUp, BookOpen, ChevronDown, Clock3, Menu, MessageSquareText, Pencil, Plus, Sparkles, X } from 'lucide-react';
import DashboardShell from '../components/dashboard/DashboardShell';
import MarkdownRenderer from '../components/MarkdownRenderer';
import CreditCost from '../components/CreditCost';
import { getCostForAction } from '../config/creditCosts';
import { useUsage } from '../contexts/UsageContext';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

function MessageRow({ message, user }) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isUser) {
    /* ── User message: white bubble, right-aligned, no avatar ── */
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="w-full"
      >
        <div className="mx-auto flex w-full max-w-3xl justify-end px-4 py-4 sm:px-6">
          <div className="max-w-[80%] rounded-2xl bg-white px-4 py-3 text-black shadow-[0_2px_12px_rgba(255,255,255,0.06)]">
            <p className="whitespace-pre-wrap text-[15px] font-medium leading-7">{message.text}</p>
          </div>
        </div>
      </motion.div>
    );
  }

  /* ── AI / System message: icon + text, full-width ── */
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="w-full"
    >
      <div className="mx-auto flex w-full max-w-3xl gap-4 px-4 py-5 sm:px-6">
        <div
          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border shadow-[0_10px_24px_rgba(0,0,0,0.24)] ${
            isSystem
              ? 'border-[#FF9F1C]/30 bg-[#FF9F1C]/15 text-[#FFBE55]'
              : 'border-[#A3FF4F]/30 bg-[#A3FF4F]/15 text-[#A3FF4F]'
          }`}
        >
          {isSystem ? <span className="text-sm font-black">!</span> : <Sparkles className="h-4 w-4" />}
        </div>

        <div className="min-w-0 flex-1">
          {isSystem ? (
            <p className="whitespace-pre-wrap text-[15px] leading-7 text-[#ffd08a]">{message.text}</p>
          ) : (
            <div className="chat-markdown text-[15px] leading-7 text-zinc-100">
              <MarkdownRenderer content={message.text} />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function TypingRow() {
  return (
    <div className="w-full">
      <div className="mx-auto flex w-full max-w-3xl gap-4 px-4 py-6 sm:px-6">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#A3FF4F]/30 bg-[#A3FF4F]/15 text-[#A3FF4F] shadow-[0_10px_24px_rgba(0,0,0,0.24)]">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((dot) => (
            <span
              key={dot}
              className="h-2 w-2 animate-pulse rounded-full bg-zinc-300"
              style={{ animationDelay: `${dot * 120}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Composer({ input, setInput, sendMessage, loading, usageData, textareaRef, courses, selectedCourse, setSelectedCourse, hasMessages, onNewChatWithCourse }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef(null);
  const courseLocked = hasMessages && !!selectedCourse;

  useEffect(() => {
    const handler = (e) => { if (pickerRef.current && !pickerRef.current.contains(e.target)) setPickerOpen(false); };
    if (pickerOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [pickerOpen]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-3 pt-3 sm:px-6">
      <div className="rounded-[1.85rem] border border-white/12 bg-[#2b2b2f] shadow-[0_28px_70px_rgba(0,0,0,0.48)] transition focus-within:border-white/25 focus-within:bg-[#313136] focus-within:shadow-[0_32px_80px_rgba(0,0,0,0.58)]">
        <div className="flex items-end gap-2 px-3 py-3">
          {/* + Button — locked after first message */}
          <div className="relative" ref={pickerRef}>
            <button
              type="button"
              onClick={() => setPickerOpen((v) => !v)}
              className={`mb-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition ${pickerOpen ? 'bg-white/15 text-white' : 'text-zinc-400 hover:bg-white/10 hover:text-white'}`}
              aria-label="Attach course context"
            >
              <Plus className="h-5 w-5" />
            </button>

            <AnimatePresence>
              {pickerOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-12 left-0 z-50 w-72 overflow-hidden rounded-2xl border border-white/12 bg-[#1e1e22] shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
                >
                  <div className="border-b border-white/8 px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Attach course context</p>
                    <p className="mt-0.5 text-[11px] text-zinc-600">AI will learn your course structure</p>
                  </div>

                  {courseLocked && (
                    <div className="border-b border-amber-500/15 bg-amber-500/[0.06] px-4 py-2.5">
                      <p className="text-[11px] font-medium text-amber-400/90">⚠ Switching course will start a new chat</p>
                    </div>
                  )}

                  <div className="custom-scroll max-h-48 overflow-y-auto p-2">
                    {courses.length === 0 ? (
                      <p className="px-3 py-4 text-center text-sm text-zinc-600">No guided courses yet.</p>
                    ) : (
                      courses.map((course) => (
                        <button
                          key={course._id}
                          type="button"
                          onClick={() => {
                            if (courseLocked && course._id !== selectedCourse?._id) {
                              onNewChatWithCourse(course);
                            } else {
                              setSelectedCourse(course);
                            }
                            setPickerOpen(false);
                          }}
                          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                            selectedCourse?._id === course._id
                              ? 'bg-[#A3FF4F]/15 text-[#A3FF4F]'
                              : 'text-zinc-300 hover:bg-white/[0.06] hover:text-white'
                          }`}
                        >
                          <BookOpen className="h-4 w-4 shrink-0 opacity-60" />
                          <span className="truncate">{course.course_title}</span>
                        </button>
                      ))
                    )}
                  </div>
                  {selectedCourse && !courseLocked && (
                    <div className="border-t border-white/8 p-2">
                      <button
                        type="button"
                        onClick={() => { setSelectedCourse(null); setPickerOpen(false); }}
                        className="w-full rounded-xl px-3 py-2 text-center text-xs font-semibold text-zinc-500 transition hover:bg-white/[0.06] hover:text-white"
                      >
                        Remove course context
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                sendMessage();
              }
            }}
            rows={1}
            placeholder={selectedCourse ? `Ask about ${selectedCourse.course_title}...` : 'Ask anything'}
            className="custom-scroll max-h-40 min-h-[2.8rem] flex-1 resize-none bg-transparent py-1.5 text-[15px] leading-7 text-white outline-none placeholder:text-zinc-500"
          />

          <button
            type="button"
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="mb-1 flex h-10 min-w-10 shrink-0 items-center justify-center rounded-full bg-white text-black transition hover:scale-[1.03] hover:bg-[#A3FF4F] disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Send message"
          >
            <ArrowUp className="h-4 w-4" strokeWidth={2.4} />
          </button>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-center">
        <CreditCost cost={getCostForAction(usageData?.plan, 'tutorChat')} className="text-[11px] text-zinc-600" />
      </div>
    </div>
  );
}

export default function DashboardChatPage() {
  const { user } = useUser();
  const { usageData, fetchUsage } = useUsage();
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [generatingSessions, setGeneratingSessions] = useState(new Set());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [guidedCourses, setGuidedCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);
  const activeSessionRef = useRef(sessionId);

  // Derived: is the CURRENT session generating?
  const loading = generatingSessions.has(sessionId ?? '_new_');

  // Keep the ref in sync
  useEffect(() => { activeSessionRef.current = sessionId; }, [sessionId]);

  const fetchSessions = useCallback(async () => {
    if (!user?.id) return;
    try {
      const response = await fetch(`${API}/api/tutor-chat/sessions?clerkId=${user.id}`);
      const data = await response.json();
      if (data.success) setSessions(data.sessions || []);
    } catch (error) {
      console.error(error);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    fetchUsage();
    fetchSessions();
    // Fetch guided courses for the course picker
    fetch(`${API}/api/study-plans/user/${user.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          const guided = (data.plans || data.courses || []).filter((c) => c.sourceType === 'guided-topic');
          setGuidedCourses(guided);
        }
      })
      .catch(() => {});
  }, [fetchSessions, fetchUsage, user?.id]);

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = '0px';
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
  }, [input]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const markGenerating = (key, on) => {
    setGeneratingSessions((prev) => {
      const next = new Set(prev);
      on ? next.add(key) : next.delete(key);
      return next;
    });
  };

  const openSession = async (id) => {
    if (!user?.id) return;
    try {
      const response = await fetch(`${API}/api/tutor-chat/sessions/${id}?clerkId=${user.id}`);
      const data = await response.json();
      if (data.success) {
        setSessionId(data.session._id);
        setMessages(data.session.messages || []);
        // Restore linked course context
        const linked = data.session.linkedCourseId
          ? guidedCourses.find((c) => c._id === data.session.linkedCourseId) || null
          : null;
        setSelectedCourse(linked);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setDrawerOpen(false);
    }
  };

  const startNewChat = () => {
    setSessionId(null);
    setMessages([]);
    setInput('');
    setSelectedCourse(null);
    setDrawerOpen(false);
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const onNewChatWithCourse = (course) => {
    setSessionId(null);
    setMessages([]);
    setInput('');
    setSelectedCourse(course);
    setDrawerOpen(false);
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading || !user?.id) return;

    const history = messages.map((message) => ({
      role: message.role === 'user' ? 'user' : 'assistant',
      text: message.text,
    }));

    // Snapshot the session we're sending from
    const sendingSessionId = sessionId;
    const generatingKey = sendingSessionId ?? '_new_';
    setMessages((prev) => [...prev, { role: 'user', text }]);
    setInput('');
    markGenerating(generatingKey, true);

    // Backend saves the session with user message before AI generation,
    // so a short delay fetch will pick up the new session in the sidebar
    setTimeout(() => fetchSessions(), 800);

    try {
      // Build course outline context if a course is attached
      let explainMode = 'global study assistant';
      if (selectedCourse?.modules) {
        const outline = selectedCourse.modules
          .map((mod, mi) => {
            const subtopics = (mod.subtopics || []).map((st) => st.subtopic_title).filter(Boolean).join(', ');
            return `Module ${mi + 1}: ${mod.module_title}${subtopics ? ` (${subtopics})` : ''}`;
          })
          .join(' | ');
        explainMode = `Course-aware tutor for "${selectedCourse.course_title}". Course outline: ${outline}`;
      }

      const response = await fetch(`${API}/api/tutor-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerkId: user.id,
          sessionId: sendingSessionId,
          message: text,
          history,
          explainMode,
          linkedCourseId: selectedCourse?._id || null,
        }),
      });
      const data = await response.json();

      // Only update UI if we're still on the same session
      // (if user switched sessions, response is already saved to DB by backend)
      const stillViewing = activeSessionRef.current === sendingSessionId || (!sendingSessionId && data.sessionId);
      if (stillViewing) {
        setMessages((prev) => [
          ...prev,
          {
            role: data.success ? 'assistant' : 'system',
            text: data.success ? data.reply : data.message || 'Could not answer right now.',
          },
        ]);
        if (data.sessionId) setSessionId(data.sessionId);
      }
      fetchSessions();
      fetchUsage();
    } catch (error) {
      if (activeSessionRef.current === sendingSessionId) {
        setMessages((prev) => [...prev, { role: 'system', text: 'Connection failed. Try again in a moment.' }]);
      }
    } finally {
      markGenerating(generatingKey, false);
      // If the session got a new ID, also clear the _new_ key
      if (!sendingSessionId) markGenerating('_new_', false);
    }
  };

  const hasMessages = messages.length > 0 || loading;
   const quickPrompts = [
    'How to be consistent in learning',
    'Motivate me to study',
    'How to become rich in 24 hours',
    'Tell me a sarcastic joke',
  ];
  const openThreadTitle =

    sessions.find((session) => session._id === sessionId)?.title ||
    (messages.length > 0 ? 'Current conversation' : 'New conversation');

  const drawer = (
    <div className="flex h-full w-full rounded-l-4xl flex-col bg-[#141416]">
      <div className="flex items-center justify-between border-b border-white/8 px-4 py-4">
        <div>
          <p className="text-[11px] pl-0.5 font-bold uppercase tracking-[0.22em] text-zinc-600">Recent chats</p>
          <p className="mt-1 text-sm text-zinc-400">Your conversations.</p>
        </div>
        <button
          type="button"
          onClick={() => setDrawerOpen(false)}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-white/10 hover:text-white xl:hidden"
          aria-label="Close recent chats"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="px-4 py-4">
        <button
          type="button"
          onClick={startNewChat}
          className={`flex w-full items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition ${
            !sessionId
              ? 'bg-white text-black'
              : 'border border-white/10 bg-white/[0.03] text-zinc-200 hover:bg-white/10 hover:text-white'
          }`}
        >
          <Pencil className="h-4 w-4" />
          New chat
        </button>
      </div>

      <div className="custom-scroll flex-1 space-y-2 overflow-y-auto px-3 pb-4">
        {sessions.length > 0 ? (
          sessions.map((session) => (
            <button
              key={session._id}
              type="button"
              onClick={() => openSession(session._id)}
              className={`w-full rounded-full px-4 py-3 text-left text-sm transition ${
                sessionId === session._id
                  ? 'bg-white/10 text-white'
                  : 'text-zinc-400 hover:bg-white/[0.05] hover:text-white'
              }`}
            >
              <span className="block truncate font-medium">{session.title}</span>
            </button>
          ))
        ) : (
          <div className="rounded-full border border-white/8 bg-white/[0.02] px-4 py-4 text-sm text-zinc-600">
            No recent chats yet.
          </div>
        )}
      </div>
    </div>
  );

  return (
    <DashboardShell
      title="AI Chat"
      usageData={usageData}
      disableDefaultPadding
      contentClassName="h-dvh overflow-hidden pt-[5.5rem]"
    >
      <style>{`
        .chat-markdown .markdown-renderer {
          font-size: 15px;
          line-height: 1.75;
          color: #e4e4e7;
        }
        .chat-markdown .markdown-renderer p,
        .chat-markdown .markdown-renderer li,
        .chat-markdown .markdown-renderer ul,
        .chat-markdown .markdown-renderer ol {
          color: #e4e4e7;
        }
        .chat-markdown .markdown-renderer strong,
        .chat-markdown .markdown-renderer h1,
        .chat-markdown .markdown-renderer h2,
        .chat-markdown .markdown-renderer h3,
        .chat-markdown .markdown-renderer h4 {
          color: #ffffff;
        }
        .chat-markdown .markdown-renderer code {
          background: rgba(255,255,255,0.06);
          border-color: rgba(255,255,255,0.12);
          color: #f4f4f5;
        }
        .chat-markdown .markdown-renderer pre {
          background: #111111;
          border-color: rgba(255,255,255,0.08);
        }
        .chat-markdown .markdown-renderer blockquote {
          border-left-color: rgba(255,255,255,0.16);
          background: rgba(255,255,255,0.03);
          color: #d4d4d8;
        }
      `}</style>

      <section className="relative flex h-full min-h-0 overflow-hidden bg-[#0b0b0c] text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[12%] top-[10%] h-64 w-64 rounded-full bg-white/3 blur-[120px]" />
          <div className="absolute bottom-[10%] right-[18%] h-80 w-80 rounded-full bg-[#A3FF4F]/5 blur-[160px]" />
        </div>

        <main className="relative flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="relative z-60 flex h-14 sm:h-16 shrink-0 items-center justify-between border-b border-white/8 bg-[#0b0b0c]/92 px-3 backdrop-blur-xl sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white max-w-[12rem] sm:max-w-[24rem]">{openThreadTitle}</p>
                <div className="mt-0.5 flex items-center gap-2 text-[10px] sm:text-[11px] text-zinc-500">
                  <span>{sessions.length} chats</span>
                  <span className="h-1 w-1 rounded-full bg-zinc-700" />
                  <span>{messages.length} messages</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setDrawerOpen((open) => !open)}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-2 sm:px-4 sm:py-2.5 text-sm font-semibold shadow-[0_12px_28px_rgba(0,0,0,0.22)] transition ${
                drawerOpen
                  ? 'border-white/25 bg-white text-black'
                  : 'border-white/12 bg-[#1b1b1d] text-zinc-200 hover:border-white/20 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="hidden sm:inline">Recent</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${drawerOpen ? 'bg-black/10 text-black' : 'bg-white/[0.1] text-zinc-300'}`}>
                {sessions.length}
              </span>
            </button>
          </div>

          <div ref={scrollRef} className="custom-scroll min-h-0 flex-1 overflow-y-auto">
            {!hasMessages ? (
              <div className="flex min-h-full flex-col items-center justify-center px-4 py-10">
                <div className="w-full max-w-3xl">
                  <h1 className="mb-8 text-center text-[1.5rem] font-semibold tracking-tight text-white sm:text-[2.35rem]">
                    How can I help you
                    <br className="sm:hidden" />{' '}
                    <span className="text-zinc-500">today?</span>
                  </h1>
                </div>
              </div>
            ) : (
              <div className="pb-36 pt-3">
                {messages.map((message, index) => (
                  <MessageRow key={`${message.role}-${index}`} message={message} user={user} />
                ))}
                {loading && <TypingRow />}
              </div>
            )}
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-[#0b0b0c] via-[#0b0b0c]/90 to-transparent pt-8">
            <div className="pointer-events-auto">
            <Composer
              input={input}
              setInput={setInput}
              sendMessage={sendMessage}
              loading={loading}
              usageData={usageData}
              textareaRef={textareaRef}
              courses={guidedCourses}
              selectedCourse={selectedCourse}
              setSelectedCourse={setSelectedCourse}
              hasMessages={hasMessages}
              onNewChatWithCourse={onNewChatWithCourse}
            />

            {!hasMessages && (
              <div className="mx-auto hidden w-full max-w-3xl flex-wrap justify-center gap-2 px-6 pb-8 sm:flex">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => setInput(prompt)}
                    className="w-full rounded-full border border-white/10 px-4 py-2.5 text-sm text-zinc-300 transition hover:bg-white/10 hover:text-white sm:w-auto"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}
            </div>
          </div>
        </main>

        <AnimatePresence>
          {drawerOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setDrawerOpen(false)}
                className="fixed inset-x-0 bottom-0 top-[5.5rem] z-40 bg-black/35 backdrop-blur-[2px]"
              />

              <motion.aside
                initial={{ x: 340 }}
                animate={{ x: 0 }}
                exit={{ x: 340 }}
                transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                className="fixed bottom-0 right-0 top-[5.5rem] z-100 w-[280px] border-l border-white/8 bg-[#141416] shadow-[-24px_0_64px_rgba(0,0,0,0.36)] sm:w-[320px]"
              >
                {drawer}
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </section>
    </DashboardShell>
  );
}
