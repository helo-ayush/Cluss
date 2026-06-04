import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { ArrowLeft, ArrowRight, Bookmark, CheckCircle2, Eye, Heart, Layers, Loader2, PlayCircle, UserPlus } from 'lucide-react';
import DashboardShell from '../components/dashboard/DashboardShell';
import CreatorProfileModal from '../components/publicCourses/CreatorProfileModal';
import { API_BASE, lessonCount, progressPercent } from '../utils/publicCourse';

export default function PublicCoursePlanPage() {
  const { slug } = useParams();
  const { search } = useLocation();
  const navigate = useNavigate();
  const { user } = useUser();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creatorModal, setCreatorModal] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(search);
    if (params.has('m') || params.has('s')) {
      navigate(`/courses/${slug}/learn/${Math.max(0, Number(params.get('m')) || 0)}/${Math.max(0, Number(params.get('s')) || 0)}`, { replace: true });
    }
  }, [navigate, search, slug]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (user?.id) params.set('viewerClerkId', user.id);
      const res = await fetch(`${API_BASE}/api/public-courses/${slug}?${params.toString()}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Could not load course.');
      setCourse(data.course);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [slug, user?.id]);

  useEffect(() => { load(); }, [load]);

  const saved = course?.viewer?.progress;
  const startUrl = saved
    ? `/courses/${slug}/learn/${saved.moduleIndex || 0}/${saved.subtopicIndex || 0}`
    : `/courses/${slug}/learn/0/0`;

  const toggle = async (action) => {
    if (!user?.id || !course?._id) {
      setError('Please sign in first.');
      return;
    }
    const res = await fetch(`${API_BASE}/api/public-courses/${course._id}/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clerkId: user.id }),
    });
    const data = await res.json();
    if (!data.success) return setError(data.message || 'Update failed.');
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

  const stats = useMemo(() => ({
    lessons: lessonCount(course),
    modules: course?.modules?.length || 0,
    percent: saved?.percent || 0
  }), [course, saved]);

  return (
    <DashboardShell title={course?.title || 'Course'} eyebrow="Course Plan" showCreate={false}>
      <div className="mx-auto max-w-[104rem] space-y-6 pb-16 text-white">
        {loading ? (
          <div className="grid gap-6 animate-pulse lg:grid-cols-[1.2fr_0.8fr]">
            <div className="h-[24rem] rounded-[2.3rem] border border-white/10 bg-[#1b1b1b]" />
            <div className="h-[24rem] rounded-[2.3rem] border border-white/10 bg-[#1b1b1b]" />
          </div>
        ) : error && !course ? (
          <div className="rounded-[2rem] border border-rose-400/20 bg-rose-500/10 p-8 text-rose-200">{error}</div>
        ) : (
          <>
            <section className="relative overflow-hidden rounded-[2.4rem] border border-white/10 bg-[#1b1b1b] p-6 shadow-[0_26px_90px_rgba(0,0,0,0.42)] sm:p-8">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
              <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link to="/courses" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs font-black text-zinc-200 hover:bg-white/[0.1]">
                      <ArrowLeft className="h-4 w-4" />Courses
                    </Link>
                    <button type="button" onClick={() => setCreatorModal(course.creatorClerkId)} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs font-black text-zinc-200 hover:bg-white/[0.1]">
                      <UserPlus className="h-4 w-4" />{course.creatorName || 'Creator'}
                    </button>
                  </div>
                  <h1 className="mt-6 max-w-5xl text-5xl font-black leading-none tracking-tight text-white md:text-6xl">{course.title}</h1>
                  <p className="mt-5 max-w-3xl text-sm font-semibold leading-7 text-zinc-400">{course.description || course.learningGoal || 'A public guided course built from structured lessons.'}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {(course.tags || []).slice(0, 8).map((tag) => (
                      <span key={tag} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-zinc-500">{tag}</span>
                    ))}
                  </div>
                  <div className="mt-7 flex flex-wrap gap-3">
                    <Link to={startUrl} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-5 text-sm font-black text-black transition hover:bg-zinc-200">
                      <PlayCircle className="h-4 w-4" />{saved ? 'Continue Learning' : 'Start Learning'}
                    </Link>
                    <button type="button" onClick={() => toggle('like')} className={`inline-flex min-h-12 items-center gap-2 rounded-full border px-5 text-sm font-black ${course.viewer?.liked ? 'border-rose-300/30 bg-rose-300/15 text-rose-200' : 'border-white/10 bg-white/[0.05] text-zinc-300'}`}>
                      <Heart className="h-4 w-4" fill={course.viewer?.liked ? 'currentColor' : 'none'} />{course.metrics?.likes || 0}
                    </button>
                    <button type="button" onClick={() => toggle('bookmark')} className={`inline-flex min-h-12 items-center gap-2 rounded-full border px-5 text-sm font-black ${course.viewer?.bookmarked ? 'border-amber-300/30 bg-amber-300/15 text-amber-200' : 'border-white/10 bg-white/[0.05] text-zinc-300'}`}>
                      <Bookmark className="h-4 w-4" fill={course.viewer?.bookmarked ? 'currentColor' : 'none'} />Save
                    </button>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                  {[
                    ['Modules', stats.modules, <Layers className="h-5 w-5" />],
                    ['Lessons', stats.lessons, <CheckCircle2 className="h-5 w-5" />],
                    ['Views', course.metrics?.views || 0, <Eye className="h-5 w-5" />],
                  ].map(([label, value, icon]) => (
                    <div key={label} className="rounded-[1.4rem] border border-white/10 bg-white/[0.035] p-5">
                      <div className="text-zinc-500">{icon}</div>
                      <p className="mt-4 text-4xl font-black text-white">{value}</p>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {error && <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-5 py-4 text-sm font-semibold text-rose-200">{error}</div>}

            <section className="rounded-[2.2rem] border border-white/10 bg-[#1b1b1b] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.34)] sm:p-7">
              <div className="mb-6 flex items-end justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">Course plan</p>
                  <h2 className="mt-1 text-3xl font-black text-white">Choose what to learn</h2>
                </div>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-black text-zinc-400">{stats.percent}% read</span>
              </div>
              <div className="space-y-6">
                {(course.modules || []).map((module, moduleIndex) => (
                  <div key={module.module_id || moduleIndex} className="rounded-[1.6rem] border border-white/[0.08] bg-[#202020] p-4">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-sm font-black text-black">{moduleIndex + 1}</div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">Module {moduleIndex + 1}</p>
                        <h3 className="truncate text-xl font-black text-white">{module.module_title}</h3>
                      </div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      {(module.subtopics || []).map((subtopic, subtopicIndex) => {
                        const active = saved?.moduleIndex === moduleIndex && saved?.subtopicIndex === subtopicIndex;
                        return (
                          <Link key={subtopic.subtopic_id || subtopicIndex} to={`/courses/${slug}/learn/${moduleIndex}/${subtopicIndex}`} className={`group rounded-[1.2rem] border p-4 transition hover:border-white/20 hover:bg-white/[0.05] ${active ? 'border-white/25 bg-white/[0.08]' : 'border-white/[0.07] bg-white/[0.025]'}`}>
                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-600">{String(subtopicIndex + 1).padStart(2, '0')} · {subtopic.subtopic_type || 'lesson'}</p>
                            <div className="mt-2 flex items-center justify-between gap-4">
                              <h4 className="line-clamp-2 text-sm font-black leading-6 text-zinc-200 group-hover:text-white">{subtopic.subtopic_title}</h4>
                              <ArrowRight className="h-4 w-4 shrink-0 text-zinc-500 group-hover:text-white" />
                            </div>
                            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
                              <div className="h-full rounded-full bg-white" style={{ width: `${active ? saved?.percent || progressPercent(course, moduleIndex, subtopicIndex) : 0}%` }} />
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
      <CreatorProfileModal creatorClerkId={creatorModal} viewerClerkId={user?.id} onClose={() => setCreatorModal(null)} onLike={() => {}} onBookmark={() => {}} />
    </DashboardShell>
  );
}
