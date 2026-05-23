import React, { useCallback, useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Bookmark, Clock, Loader2 } from 'lucide-react';
import DashboardShell from '../components/dashboard/DashboardShell';
import PublicCourseCard from '../components/publicCourses/PublicCourseCard';
import { API_BASE } from '../utils/publicCourse';

export default function BookmarksPage() {
  const { user, isLoaded } = useUser();
  const [bookmarks, setBookmarks] = useState([]);
  const [continues, setContinues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const [savedRes, progressRes] = await Promise.all([
        fetch(`${API_BASE}/api/public-courses/me/bookmarks/${user.id}`),
        fetch(`${API_BASE}/api/public-courses/me/progress/${user.id}`),
      ]);
      const [savedData, progressData] = await Promise.all([savedRes.json(), progressRes.json()]);
      if (!savedData.success) throw new Error(savedData.message || 'Could not load bookmarks.');
      if (!progressData.success) throw new Error(progressData.message || 'Could not load reading progress.');
      setBookmarks(savedData.courses || []);
      setContinues(progressData.courses || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (isLoaded) load();
  }, [isLoaded, load]);

  const mutateCourse = async (course, action) => {
    if (!user?.id) return;
    try {
      await fetch(`${API_BASE}/api/public-courses/${course._id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clerkId: user.id }),
      });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <DashboardShell title="Bookmarks" eyebrow="Saved Courses">
      <div className="mx-auto max-w-[104rem] space-y-8">
        <section className="rounded-[2.4rem] border border-white/10 bg-[#12141c] p-7 shadow-[0_24px_90px_rgba(0,0,0,0.34)]">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-300/10 text-amber-200">
              <Bookmark className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">Your library</p>
              <h1 className="mt-1 text-4xl font-black tracking-[-0.03em] text-white">Saved and in-progress courses</h1>
            </div>
          </div>
        </section>

        {error && <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-5 py-4 text-sm font-semibold text-rose-200">{error}</div>}
        {loading ? (
          <div className="flex min-h-60 items-center justify-center rounded-[2rem] border border-white/10 bg-[#101114]">
            <Loader2 className="h-7 w-7 animate-spin text-cyan-100" />
          </div>
        ) : !user?.id ? (
          <div className="rounded-[2rem] border border-white/10 bg-[#101114] px-6 py-16 text-center text-zinc-400">Sign in to save courses and continue reading.</div>
        ) : (
          <>
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-cyan-100" />
                <h2 className="text-2xl font-black text-white">Continue Reading</h2>
              </div>
              {continues.length ? (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {continues.map((course) => <PublicCourseCard key={course._id} course={course} onLike={(item) => mutateCourse(item, 'like')} onBookmark={(item) => mutateCourse(item, 'bookmark')} />)}
                </div>
              ) : (
                <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-6 text-sm font-semibold text-zinc-500">Courses you start reading will appear here.</div>
              )}
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <Bookmark className="h-5 w-5 text-amber-200" />
                <h2 className="text-2xl font-black text-white">Bookmarks</h2>
              </div>
              {bookmarks.length ? (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {bookmarks.map((course) => <PublicCourseCard key={course._id} course={course} onLike={(item) => mutateCourse(item, 'like')} onBookmark={(item) => mutateCourse(item, 'bookmark')} />)}
                </div>
              ) : (
                <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-6 text-sm font-semibold text-zinc-500">Bookmark courses from the Courses page to build your reading list.</div>
              )}
            </section>
          </>
        )}
      </div>
    </DashboardShell>
  );
}
