import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { ArrowLeft, ArrowRight, Bookmark, Bot, Eye, Heart, Layers, Loader2, Send, UserPlus } from 'lucide-react';
import DashboardShell from '../components/dashboard/DashboardShell';
import MarkdownRenderer from '../components/MarkdownRenderer';
import CreditCost from '../components/CreditCost';
import { getCostForAction } from '../config/creditCosts';
import { API_BASE, progressPercent, safeLessonBlocks } from '../utils/publicCourse';

function PublicTutor({ course, moduleIndex, subtopicIndex, selectedBlock, user }) {
  const [messages, setMessages] = useState([{ role: 'assistant', text: 'I can help explain this public lesson. Ask me anything from the notes.' }]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);
  const canChat = !!user?.id && course?.viewer?.canChat;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  useEffect(() => {
    setMessages([{ role: 'assistant', text: 'New lesson loaded. Pick a block or ask from the full notes.' }]);
    setInput('');
  }, [course?._id, moduleIndex, subtopicIndex]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending || !user?.id || !canChat) return;
    setMessages((prev) => [...prev, { role: 'user', text }]);
    setInput('');
    setSending(true);
    try {
      const res = await fetch(`${API_BASE}/api/tutor-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerkId: user.id,
          publicCourseId: course._id,
          moduleIndex,
          subtopicIndex,
          message: text,
          history: messages,
          contextBlock: selectedBlock || null,
          explainMode: selectedBlock ? 'public course block-focused tutor' : 'public course lesson tutor',
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Tutor could not reply.');
      setMessages((prev) => [...prev, { role: 'assistant', text: data.reply }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', text: err.message }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <aside className="flex min-h-[34rem] flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[#12141c] shadow-[0_20px_70px_rgba(0,0,0,0.28)] xl:sticky xl:top-24 xl:h-[calc(100dvh-7rem)]">
      <div className="border-b border-white/10 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-200/20 bg-cyan-200/10 text-cyan-100">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">AI tutor</p>
            <h2 className="text-xl font-black text-white">Ask with context</h2>
          </div>
        </div>
      </div>

      {!user?.id && <div className="m-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm font-semibold leading-6 text-zinc-300">Sign in to chat with this lesson.</div>}

      <div ref={scrollRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 custom-scroll">
        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === 'user' ? 'bg-white text-black' : 'border border-white/10 bg-white/[0.055] text-zinc-300'}`}>
              {message.role === 'assistant' ? <MarkdownRenderer content={message.text} /> : message.text}
            </div>
          </div>
        ))}
        {sending && <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.055] px-4 py-2 text-sm font-semibold text-zinc-400"><Loader2 className="h-4 w-4 animate-spin" />Thinking</div>}
      </div>

      <div className="border-t border-white/10 p-4">
        <div className={`flex items-center gap-2 rounded-[1.5rem] border border-white/10 bg-white/[0.055] p-2 ${!canChat ? 'opacity-55' : ''}`}>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                send();
              }
            }}
            disabled={!canChat || sending}
            rows={1}
            placeholder={canChat ? 'Ask about this lesson...' : 'Sign in to chat here'}
            className="h-11 flex-1 resize-none bg-transparent px-3 py-2 text-sm font-semibold text-white outline-none placeholder:text-zinc-600"
          />
          <button type="button" onClick={send} disabled={!canChat || sending || !input.trim()} className="inline-flex h-10 shrink-0 items-center gap-1 rounded-full bg-white px-3 text-black disabled:opacity-40">
            <Send className="h-4 w-4" />
            <CreditCost cost={getCostForAction(course?.viewer?.plan, 'tutorChat')} className="text-black" />
          </button>
        </div>
      </div>
    </aside>
  );
}

export default function PublicCourseReader() {
  const { slug, moduleIndex: moduleParam = '0', subtopicIndex: subtopicParam = '0' } = useParams();
  const navigate = useNavigate();
  const moduleIndex = Math.max(0, Number.parseInt(moduleParam, 10) || 0);
  const subtopicIndex = Math.max(0, Number.parseInt(subtopicParam, 10) || 0);
  const { user } = useUser();
  const [course, setCourse] = useState(null);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (user?.id) params.set('viewerClerkId', user.id);
      const res = await fetch(`${API_BASE}/api/public-courses/${slug}?${params.toString()}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Could not load course.');
      const loaded = data.course;
      setCourse(loaded);
      fetch(`${API_BASE}/api/public-courses/${loaded._id}/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clerkId: user?.id || '' }),
      }).catch(() => {});
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [slug, user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const module = course?.modules?.[moduleIndex] || course?.modules?.[0];
  const subtopic = module?.subtopics?.[subtopicIndex] || module?.subtopics?.[0];
  const blocks = safeLessonBlocks(subtopic?.lessonContent || {}, subtopic?.subtopic_title);
  const percent = progressPercent(course, moduleIndex, subtopicIndex);

  useEffect(() => {
    setSelectedBlock(null);
    if (!course?._id || !user?.id) return;
    fetch(`${API_BASE}/api/public-courses/${course._id}/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clerkId: user.id, moduleIndex, subtopicIndex, percent }),
    }).catch(() => {});
  }, [course?._id, moduleIndex, percent, subtopicIndex, user?.id]);

  const go = (direction) => {
    if (!course) return;
    const modules = course.modules || [];
    let nextM = moduleIndex;
    let nextS = subtopicIndex + direction;
    if (nextS < 0) {
      nextM -= 1;
      nextS = Math.max(0, (modules[nextM]?.subtopics || []).length - 1);
    }
    if (nextS >= (modules[nextM]?.subtopics || []).length) {
      nextM += 1;
      nextS = 0;
    }
    if (modules[nextM]?.subtopics?.[nextS]) {
      navigate(`/courses/${slug}/learn/${nextM}/${nextS}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const toggle = async (action) => {
    if (!user?.id) {
      setError('Please sign in first.');
      return;
    }
    const res = await fetch(`${API_BASE}/api/public-courses/${course._id}/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clerkId: user.id }),
    });
    const data = await res.json();
    if (!data.success) {
      setError(data.message || 'Update failed.');
      return;
    }
    setCourse((prev) => ({
      ...prev,
      metrics: data.metrics,
      viewer: {
        ...prev.viewer,
        liked: action === 'like' ? data.liked : prev.viewer?.liked,
        bookmarked: action === 'bookmark' ? data.bookmarked : prev.viewer?.bookmarked,
      }
    }));
  };

  const toggleFollow = async () => {
    if (!user?.id) {
      setError('Please sign in first.');
      return;
    }
    const res = await fetch(`${API_BASE}/api/public-courses/creator/${course.creatorClerkId}/follow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clerkId: user.id }),
    });
    const data = await res.json();
    if (data.success) {
      setCourse((prev) => ({ ...prev, viewer: { ...prev.viewer, followingCreator: data.following } }));
    }
  };

  return (
    <DashboardShell title={course?.title || 'Course'} eyebrow="Public Lesson" showCreate={false} disableDefaultPadding>
      <div className="mx-auto max-w-[104rem] space-y-6 px-4 pt-24 pb-20 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex min-h-96 items-center justify-center rounded-[2rem] border border-white/10 bg-[#101114]">
            <Loader2 className="h-7 w-7 animate-spin text-cyan-100" />
          </div>
        ) : error && !course ? (
          <div className="rounded-[2rem] border border-rose-400/20 bg-rose-500/10 p-8 text-rose-200">{error}</div>
        ) : (
          <>
            <section className="relative overflow-hidden rounded-[2.4rem] border border-white/10 bg-[#1b1b1b] p-6 shadow-[0_24px_90px_rgba(0,0,0,0.38)] sm:p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link to={`/courses/${slug}`} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-black text-zinc-200 transition hover:bg-white/[0.1]">
                      <ArrowLeft className="h-4 w-4" />
                      Course plan
                    </Link>
                    <Link to={`/creators/${course.creatorClerkId}`} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-black text-zinc-300">
                      <UserPlus className="h-4 w-4" />
                      {course.creatorName || 'Creator'}
                    </Link>
                  </div>
                  <p className="mt-6 text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">{module?.module_title}</p>
                  <h1 className="mt-2 break-words text-4xl font-black leading-tight tracking-tight text-white md:text-5xl">{subtopic?.subtopic_title}</h1>
                  <p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-zinc-500">{course.title}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => toggle('like')} className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-black ${course.viewer?.liked ? 'border-rose-300/30 bg-rose-300/15 text-rose-200' : 'border-white/10 bg-white/[0.05] text-zinc-300'}`}>
                    <Heart className="h-4 w-4" fill={course.viewer?.liked ? 'currentColor' : 'none'} />
                    {course.metrics?.likes || 0}
                  </button>
                  <button type="button" onClick={() => toggle('bookmark')} className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-black ${course.viewer?.bookmarked ? 'border-amber-300/30 bg-amber-300/15 text-amber-200' : 'border-white/10 bg-white/[0.05] text-zinc-300'}`}>
                    <Bookmark className="h-4 w-4" fill={course.viewer?.bookmarked ? 'currentColor' : 'none'} />
                    Save
                  </button>
                  <button type="button" onClick={toggleFollow} disabled={user?.id === course.creatorClerkId} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 text-sm font-black text-zinc-300 disabled:opacity-40">
                    <UserPlus className="h-4 w-4" />
                    {course.viewer?.followingCreator ? 'Following' : 'Follow'}
                  </button>
                </div>
              </div>
              <div className="mt-7 flex flex-wrap gap-2 text-xs font-bold text-zinc-400">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5"><Eye className="h-3.5 w-3.5" />{course.metrics?.views || 0} views</span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">{percent}% read</span>
              </div>
            </section>

            {error && <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-5 py-4 text-sm font-semibold text-rose-200">{error}</div>}

            <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_25rem]">
              <main className="min-w-0 space-y-6">
                <section className="rounded-[2rem] border border-white/10 bg-[#1b1b1b] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.28)]">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">Lesson controls</p>
                  <h2 className="mt-2 flex items-center gap-2 text-2xl font-black tracking-tight text-white"><Layers className="h-5 w-5" />Structured notes</h2>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <button type="button" onClick={() => go(-1)} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 text-sm font-black text-zinc-300"><ArrowLeft className="h-4 w-4" />Prev</button>
                    <button type="button" onClick={() => go(1)} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-black text-black">Next<ArrowRight className="h-4 w-4" /></button>
                  </div>
                </section>

                <section className="space-y-5 rounded-[2rem] border border-white/10 bg-[#1b1b1b] p-4 shadow-[0_20px_70px_rgba(0,0,0,0.28)] md:p-7">
                  {blocks.map((block) => (
                    <article
                      key={block.blockId || block.title}
                      onClick={() => setSelectedBlock(block)}
                      className={`rounded-[1.75rem] border p-5 transition md:p-7 ${
                        selectedBlock?.blockId === block.blockId ? 'border-white/30 bg-white/[0.08]' : 'border-white/10 bg-white/[0.035] hover:border-white/20'
                      }`}
                    >
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">{block.type || 'concept'}</p>
                      <h3 className="mt-3 text-3xl font-black tracking-[-0.02em] text-white">{block.title}</h3>
                      <div className="mt-5 text-zinc-300">
                        <MarkdownRenderer content={block.body || ''} />
                      </div>
                      {block.code && <pre className="mt-5 overflow-x-auto rounded-2xl bg-black/50 p-4 text-sm text-zinc-100">{block.code}</pre>}
                    </article>
                  ))}
                </section>
              </main>

              <PublicTutor course={course} moduleIndex={moduleIndex} subtopicIndex={subtopicIndex} selectedBlock={selectedBlock} user={user} />
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}
