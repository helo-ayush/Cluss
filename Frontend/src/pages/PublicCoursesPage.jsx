import React, { useCallback, useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Bookmark, Compass, Flame, Loader2, Search, Sparkles, Users } from 'lucide-react';
import DashboardShell from '../components/dashboard/DashboardShell';
import PublicCourseCard from '../components/publicCourses/PublicCourseCard';
import { API_BASE } from '../utils/publicCourse';

const tabs = [
  { key: 'latest', label: 'Latest', icon: Sparkles },
  { key: 'top', label: 'Top Courses', icon: Flame },
  { key: 'following', label: 'Following', icon: Users },
];

export default function PublicCoursesPage() {
  const { user } = useUser();
  const [tab, setTab] = useState('latest');
  const [query, setQuery] = useState('');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadCourses = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ tab, q: query, limit: '18' });
      if (user?.id) params.set('clerkId', user.id);
      const res = await fetch(`${API_BASE}/api/public-courses?${params.toString()}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Could not load courses.');
      setCourses(data.courses || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [query, tab, user?.id]);

  useEffect(() => {
    const id = window.setTimeout(loadCourses, 250);
    return () => window.clearTimeout(id);
  }, [loadCourses]);

  const mutateCourse = async (course, action) => {
    if (!user?.id) {
      setError('Please sign in to like or bookmark courses.');
      return;
    }
    const optimistic = courses.map((item) => {
      if (item._id !== course._id) return item;
      const liked = action === 'like' ? !item.viewer?.liked : item.viewer?.liked;
      const bookmarked = action === 'bookmark' ? !item.viewer?.bookmarked : item.viewer?.bookmarked;
      return {
        ...item,
        viewer: { ...item.viewer, liked, bookmarked },
        metrics: {
          ...item.metrics,
          likes: action === 'like' ? Math.max(0, (item.metrics?.likes || 0) + (liked ? 1 : -1)) : item.metrics?.likes,
          bookmarks: action === 'bookmark' ? Math.max(0, (item.metrics?.bookmarks || 0) + (bookmarked ? 1 : -1)) : item.metrics?.bookmarks,
        }
      };
    });
    setCourses(optimistic);
    try {
      const res = await fetch(`${API_BASE}/api/public-courses/${course._id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clerkId: user.id }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Update failed.');
    } catch (err) {
      setError(err.message);
      loadCourses();
    }
  };

  return (
    <DashboardShell title="Courses" eyebrow="Community Library">
      <div className="mx-auto max-w-[104rem] space-y-6">
        <section className="relative overflow-hidden rounded-[2.4rem] border border-white/10 bg-[#12141c] p-6 shadow-[0_24px_90px_rgba(0,0,0,0.34)] sm:p-8">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-200/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-cyan-100">
                <Compass className="h-4 w-4" />
                Public guided courses
              </div>
              <h1 className="mt-5 text-5xl font-black leading-none tracking-[-0.03em] text-white md:text-6xl">
                Read courses built by other learners.
              </h1>
              <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-zinc-500">
                Discover generated guided paths, save them, continue reading later, and follow creators whose explanations work for you.
              </p>
            </div>
            <div className="flex min-h-12 w-full items-center gap-3 rounded-full border border-white/10 bg-black/30 px-4 focus-within:border-cyan-200/35 lg:max-w-md">
              <Search className="h-4 w-4 text-zinc-500" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search courses, modules, topics"
                className="w-full bg-transparent text-sm font-semibold text-white outline-none placeholder:text-zinc-600"
              />
            </div>
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2 overflow-x-auto rounded-full border border-white/10 bg-[#101114] p-1">
            {tabs.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setTab(item.key)}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-black transition ${
                    tab === item.key ? 'bg-white text-black' : 'text-zinc-400 hover:bg-white/[0.06] hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
          <a href="/dashboard/bookmarks" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm font-black text-zinc-300 transition hover:bg-white/[0.1] hover:text-white">
            <Bookmark className="h-4 w-4" />
            Bookmarks
          </a>
        </div>

        {error && <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-5 py-4 text-sm font-semibold text-rose-200">{error}</div>}

        {loading ? (
          <div className="flex min-h-60 items-center justify-center rounded-[2rem] border border-white/10 bg-[#101114]">
            <Loader2 className="h-7 w-7 animate-spin text-cyan-100" />
          </div>
        ) : courses.length ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {courses.map((course) => (
              <PublicCourseCard key={course._id} course={course} onLike={(item) => mutateCourse(item, 'like')} onBookmark={(item) => mutateCourse(item, 'bookmark')} />
            ))}
          </div>
        ) : (
          <div className="rounded-[2rem] border border-white/10 bg-[#101114] px-6 py-16 text-center">
            <h2 className="text-3xl font-black text-white">No courses found</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm font-semibold leading-7 text-zinc-500">
              Publish a guided course from your study plan map, or try a broader search.
            </p>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
