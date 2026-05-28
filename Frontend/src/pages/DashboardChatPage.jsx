import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUp, BookOpen, PanelRightClose, PanelRightOpen, Pencil, Plus, Sparkles, Trash2, X } from 'lucide-react';
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
        <div className="mx-auto flex w-full max-w-4xl justify-end px-4 py-4 sm:px-6">
          <div className="max-w-[80%] rounded-[1.6rem] rounded-tr-md bg-white px-4 py-3 text-black shadow-[0_14px_34px_rgba(0,0,0,0.22)]">
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
      <div className="mx-auto flex w-full max-w-4xl gap-4 px-4 py-4 sm:px-6">
        <div
          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border shadow-[0_10px_24px_rgba(0,0,0,0.24)] ${
            isSystem
              ? 'border-white/10 bg-white/[0.06] text-zinc-300'
              : 'border-white/10 bg-white text-black'
          }`}
        >
          {isSystem ? <span className="text-sm font-black">!</span> : <Sparkles className="h-4 w-4" />}
        </div>

        <div className="min-w-0 flex-1 rounded-[1.6rem] rounded-tl-md border border-white/[0.08] bg-[#202020] px-5 py-4 shadow-[0_14px_34px_rgba(0,0,0,0.18)]">
          {isSystem ? (
            <p className="whitespace-pre-wrap text-[15px] leading-7 text-zinc-300">{message.text}</p>
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
      <div className="mx-auto flex w-full max-w-4xl gap-4 px-4 py-6 sm:px-6">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white text-black shadow-[0_10px_24px_rgba(0,0,0,0.24)]">
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

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '44px'; // Base height for 1 line
      if (input) {
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    }
  }, [input, textareaRef]);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-3 pt-3 sm:px-6">
      <div className="rounded-[2rem] border border-white/12 bg-[#2f2f2f] shadow-[0_20px_54px_rgba(0,0,0,0.34)] transition focus-within:border-white/25 focus-within:bg-[#343434]">
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
                  className="absolute bottom-12 left-0 z-50 w-72 overflow-hidden rounded-2xl border border-white/12 bg-[#202020] shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
                >
                  <div className="border-b border-white/8 px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Attach course context</p>
                    <p className="mt-0.5 text-[11px] text-zinc-600">AI will learn your course structure</p>
                  </div>

                  {courseLocked && (
                    <div className="border-b border-white/10 bg-white/[0.04] px-4 py-2.5">
                      <p className="text-[11px] font-medium text-zinc-300">Switching course will start a new chat</p>
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
                              ? 'bg-white text-black'
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
            placeholder={selectedCourse ? `Ask about ${selectedCourse.course_title.length > 35 ? selectedCourse.course_title.slice(0, 35) + '...' : selectedCourse.course_title}` : 'Ask anything'}
            className="custom-scroll max-h-[200px] flex-1 resize-none bg-transparent py-2.5 text-[15px] leading-[1.6] text-white outline-none placeholder:text-zinc-500 overflow-y-auto"
            style={{ minHeight: '44px' }}
          />

          <button
            type="button"
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="mb-1 flex h-10 min-w-10 shrink-0 items-center justify-center rounded-full bg-white text-black transition hover:scale-[1.03] hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-30"
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

function ChatPageSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      className="relative mx-auto flex h-full w-full max-w-[1720px] overflow-hidden rounded-[2.25rem] border border-white/[0.10] bg-[#171717] shadow-[0_30px_90px_rgba(0,0,0,0.46)]"
    >
      <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#1f1f1f]">
        <div className="flex min-h-[78px] shrink-0 items-center justify-between gap-4 border-b border-white/[0.06] bg-gradient-to-b from-[#1b1b1b] to-[#171717] px-4 sm:px-6">
          <div className="space-y-2">
            <div className="h-5 w-44 animate-pulse rounded-full bg-white/[0.08]" />
            <div className="h-3 w-28 animate-pulse rounded-full bg-white/[0.045]" />
          </div>
          <div className="h-10 w-20 animate-pulse rounded-[1.25rem] bg-white/[0.06] xl:hidden" />
        </div>

        <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-10">
          <div className="w-full max-w-4xl rounded-[2rem] border border-white/[0.08] bg-[#202020] px-6 py-12 shadow-[0_20px_60px_rgba(0,0,0,0.24)]">
            <div className="mx-auto h-11 w-72 max-w-full animate-pulse rounded-2xl bg-white/[0.07]" />
            <div className="mx-auto mt-9 h-[86px] w-full max-w-3xl animate-pulse rounded-[2rem] border border-white/[0.08] bg-white/[0.045]" />
            <div className="mx-auto mt-6 flex max-w-3xl flex-wrap justify-center gap-2">
              {[0, 1, 2, 3].map((item) => (
                <div key={item} className="h-9 w-40 animate-pulse rounded-full border border-white/[0.06] bg-white/[0.035]" />
              ))}
            </div>
          </div>
        </div>

        <div className="px-4 pb-6 sm:px-6">
          <div className="mx-auto h-[86px] w-full max-w-4xl animate-pulse rounded-[2rem] border border-white/[0.08] bg-[#2a2a2a]" />
        </div>
      </div>

      <aside className="hidden w-[360px] shrink-0 border-l border-white/[0.08] bg-[#171717] xl:block">
        <div className="border-b border-white/8 px-4 py-4">
          <div className="h-3 w-32 animate-pulse rounded-full bg-white/[0.055]" />
          <div className="mt-3 h-4 w-44 animate-pulse rounded-full bg-white/[0.075]" />
        </div>
        <div className="space-y-3 px-4 py-4">
          <div className="h-[62px] animate-pulse rounded-[1.45rem] bg-white/[0.06]" />
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-[62px] animate-pulse rounded-[1.35rem] border border-white/[0.06] bg-white/[0.035]" />
          ))}
        </div>
      </aside>
    </motion.div>
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
  const [recentCollapsed, setRecentCollapsed] = useState(false);
  const [deletingSessionId, setDeletingSessionId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [pageLoading, setPageLoading] = useState(true);
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
    let active = true;
    setPageLoading(true);

    const fetchCourses = fetch(`${API}/api/study-plans/user/${user.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (active && data.success) {
          const guided = (data.plans || data.courses || []).filter((c) => c.sourceType === 'guided-topic');
          setGuidedCourses(guided);
        }
      })
      .catch(() => {});

    Promise.all([fetchUsage(), fetchSessions(), fetchCourses])
      .finally(() => {
        if (active) setPageLoading(false);
      });

    return () => {
      active = false;
    };
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

  const requestDeleteSession = (event, session) => {
    event.stopPropagation();
    if (deletingSessionId) return;
    setDeleteError('');
    setDeleteTarget(session);
  };

  const deleteSession = async () => {
    if (!user?.id || deletingSessionId || !deleteTarget?._id) return;

    const id = deleteTarget._id;
    setDeletingSessionId(id);
    setDeleteError('');
    try {
      const response = await fetch(`${API}/api/tutor-chat/sessions/${id}?clerkId=${user.id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.message || 'Failed to delete chat');

      setSessions((prev) => prev.filter((item) => item._id !== id));
      if (sessionId === id) {
        setSessionId(null);
        setMessages([]);
        setInput('');
        setSelectedCourse(null);
      }
      setDeleteTarget(null);
    } catch (error) {
      console.error(error);
      setDeleteError(error.message || 'Could not delete this chat.');
    } finally {
      setDeletingSessionId(null);
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
    <div className="flex h-full w-full flex-col bg-[#171717]">
      <div className="border-b border-white/8 px-4 py-4">
        <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate pl-0.5 text-[11px] font-bold uppercase tracking-[0.22em] text-zinc-500">Recent chats</p>
          <p className="mt-1 truncate text-sm font-semibold text-zinc-200">Your conversations</p>
        </div>
        <button
          type="button"
          onClick={() => setRecentCollapsed(true)}
          className="hidden h-9 w-9 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-white/10 hover:text-white xl:flex"
          aria-label="Collapse recent chats"
        >
          <PanelRightClose className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setDrawerOpen(false)}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-white/10 hover:text-white xl:hidden"
          aria-label="Close recent chats"
        >
          <X className="h-4 w-4" />
        </button>
        </div>
      </div>

      <div className="px-4 py-4">
        <button
          type="button"
          onClick={startNewChat}
          className={`group flex w-full min-w-0 items-center gap-3 rounded-[1.45rem] border px-4 py-3.5 text-sm font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition duration-200 ${
            !sessionId
              ? 'border-white/25 bg-gradient-to-b from-[#f5f5f5] to-[#d9d9d9] text-black shadow-[0_18px_36px_rgba(255,255,255,0.10)]'
              : 'border-white/[0.10] bg-gradient-to-b from-[#2a2a2a] to-[#202020] text-zinc-100 hover:border-white/[0.18] hover:from-[#323232] hover:to-[#242424] hover:text-white'
          }`}
        >
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition ${
            !sessionId ? 'bg-black/10 text-black' : 'bg-white/[0.07] text-zinc-200 group-hover:bg-white/[0.11] group-hover:text-white'
          }`}>
            <Pencil className="h-4 w-4 shrink-0" />
          </span>
          <span className="min-w-0 truncate">New chat</span>
        </button>
      </div>

      <div className="custom-scroll flex-1 space-y-2.5 overflow-y-auto px-3 pb-4">
        {sessions.length > 0 ? (
          sessions.map((session, index) => (
            <div
              key={session._id}
              className={`group flex w-full min-w-0 items-center gap-2 rounded-[1.35rem] border px-4 py-3.5 text-left text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] transition duration-200 ${
                sessionId === session._id
                  ? 'border-white/[0.22] bg-gradient-to-b from-[#343434] to-[#262626] text-white shadow-[0_18px_34px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.08)]'
                  : 'border-white/[0.07] bg-gradient-to-b from-[#222222] to-[#1b1b1b] text-zinc-400 hover:border-white/[0.16] hover:from-[#292929] hover:to-[#202020] hover:text-white'
              }`}
            >
              <button
                type="button"
                onClick={() => openSession(session._id)}
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
              >
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${
                  sessionId === session._id ? 'bg-white text-black shadow-[0_0_18px_rgba(255,255,255,0.10)]' : 'bg-white/[0.06] text-zinc-500 group-hover:bg-white/[0.10] group-hover:text-zinc-200'
                }`}>
                  {index + 1}
                </span>
                <span className="block min-w-0 truncate font-semibold">{session.title}</span>
              </button>
              <button
                type="button"
                onClick={(event) => requestDeleteSession(event, session)}
                disabled={deletingSessionId === session._id}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-500 opacity-0 transition hover:bg-red-500/12 hover:text-red-200 focus:opacity-100 disabled:pointer-events-none disabled:opacity-100 group-hover:opacity-100"
                aria-label={`Delete ${session.title}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        ) : (
          <div className="rounded-[1.35rem] border border-white/8 bg-white/[0.02] px-4 py-4 text-sm text-zinc-600">
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

      <section className="relative flex h-full min-h-0 overflow-hidden bg-[#080808] p-3 text-white sm:p-4">
        <AnimatePresence mode="wait">
          {pageLoading ? (
            <ChatPageSkeleton key="chat-skeleton" />
          ) : (
        <motion.div
          key="chat-page"
          initial={{ opacity: 0, y: 14, scale: 0.992 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.992 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto flex h-full w-full max-w-[1720px] overflow-hidden rounded-[2.25rem] border border-white/[0.10] bg-[#171717] shadow-[0_30px_90px_rgba(0,0,0,0.46)]"
        >
        <main className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-[#1f1f1f]">
          <div className="relative z-60 flex min-h-[78px] shrink-0 items-center justify-between gap-4 border-b border-white/[0.06] bg-gradient-to-b from-[#1b1b1b] to-[#171717] px-4 shadow-[0_18px_50px_rgba(0,0,0,0.14)] backdrop-blur-xl sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="min-w-0">
                <p className="truncate text-lg font-black tracking-tight text-white max-w-[12rem] sm:max-w-[30rem]">{openThreadTitle}</p>
                <div className="mt-1 flex items-center gap-2 text-[10px] sm:text-[11px] text-zinc-500">
                  <span>{sessions.length} chats</span>
                  <span className="h-1 w-1 rounded-full bg-zinc-700" />
                  <span>{messages.length} messages</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setDrawerOpen((open) => !open)}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-[1.25rem] border px-3 py-2 text-sm font-semibold shadow-[0_12px_28px_rgba(0,0,0,0.22)] transition xl:hidden sm:px-4 sm:py-2.5 ${
                drawerOpen
                  ? 'border-white/25 bg-white text-black'
                  : 'border-white/12 bg-[#2f2f2f] text-zinc-200 hover:border-white/20 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="hidden sm:inline">Recent</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${drawerOpen ? 'bg-black/10 text-black' : 'bg-white/[0.1] text-zinc-300'}`}>
                {sessions.length}
              </span>
            </button>
          </div>

          <div ref={scrollRef} className="custom-scroll min-h-0 flex-1 overflow-y-auto bg-[#1f1f1f]">
            {!hasMessages ? (
              <div className="flex min-h-full flex-col items-center justify-center px-4 py-10">
                <div className="w-full max-w-4xl rounded-[2rem] border border-white/[0.08] bg-[#202020] px-6 py-12 shadow-[0_20px_60px_rgba(0,0,0,0.24)]">
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

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-[#1f1f1f] via-[#1f1f1f]/94 to-transparent pt-8">
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

        <aside className={`hidden shrink-0 border-l border-white/[0.08] bg-[#171717] transition-[width] duration-300 xl:block ${recentCollapsed ? 'w-[88px]' : 'w-[360px]'}`}>
          {recentCollapsed ? (
            <div className="flex h-full flex-col items-center gap-4 px-3 py-4">
              <button
                type="button"
                onClick={() => setRecentCollapsed(false)}
                className="flex h-12 w-12 items-center justify-center rounded-[1.2rem] border border-white/[0.10] bg-[#242424] text-zinc-300 transition hover:bg-white hover:text-black"
                aria-label="Expand recent chats"
              >
                <PanelRightOpen className="h-4.5 w-4.5" />
              </button>
              <button
                type="button"
                onClick={startNewChat}
                className="flex h-12 w-12 items-center justify-center rounded-[1.2rem] bg-white text-black transition hover:bg-zinc-200"
                aria-label="New chat"
              >
                <Pencil className="h-4.5 w-4.5" />
              </button>
              <div className="mt-2 flex flex-1 flex-col items-center gap-2 overflow-hidden">
                {sessions.slice(0, 8).map((session, index) => (
                  <button
                    key={`rail-${session._id}`}
                    type="button"
                    onClick={() => openSession(session._id)}
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-black transition ${
                      sessionId === session._id ? 'bg-white text-black' : 'bg-white/[0.06] text-zinc-500 hover:bg-white/[0.12] hover:text-white'
                    }`}
                    aria-label={`Open ${session.title}`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </div>
          ) : drawer}
        </aside>
        </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {drawerOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setDrawerOpen(false)}
                  className="fixed inset-0 z-[1000] bg-black/45 backdrop-blur-md xl:hidden"
                />

                <motion.aside
                  initial={{ scale: 0.94, opacity: 0, y: 18 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.94, opacity: 0, y: 18 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                  className="fixed left-1/2 top-1/2 z-[1010] h-[74dvh] w-[min(92vw,380px)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[2rem] border border-white/[0.12] bg-[#171717] shadow-[0_30px_90px_rgba(0,0,0,0.62)] xl:hidden"
                >
                  {drawer}
                </motion.aside>
            </>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {deleteTarget && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  if (!deletingSessionId) setDeleteTarget(null);
                }}
                className="fixed inset-0 z-[1020] bg-black/45 backdrop-blur-md"
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 12 }}
                transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                className="fixed left-1/2 top-1/2 z-[1030] w-[min(92vw,420px)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[2rem] border border-white/[0.12] bg-[#181818] shadow-[0_30px_90px_rgba(0,0,0,0.62)]"
                role="dialog"
                aria-modal="true"
                aria-labelledby="delete-chat-title"
              >
                <div className="border-b border-white/[0.08] px-5 py-5">
                  <p id="delete-chat-title" className="text-lg font-black tracking-tight text-white">Delete chat?</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    This will permanently remove
                    {' '}
                    <span className="font-semibold text-zinc-200">"{deleteTarget.title || 'this chat'}"</span>
                    .
                  </p>
                </div>

                <div className="px-5 py-4">
                  {deleteError && (
                    <div className="mb-3 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                      {deleteError}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteTarget(null);
                        setDeleteError('');
                      }}
                      disabled={!!deletingSessionId}
                      className="rounded-full border border-white/[0.10] bg-white/[0.04] px-4 py-2.5 text-sm font-bold text-zinc-200 transition hover:bg-white/[0.08] hover:text-white disabled:pointer-events-none disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={deleteSession}
                      disabled={!!deletingSessionId}
                      className="rounded-full bg-red-400 px-4 py-2.5 text-sm font-black text-black transition hover:bg-red-300 disabled:pointer-events-none disabled:opacity-60"
                    >
                      {deletingSessionId ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </section>
    </DashboardShell>
  );
}
