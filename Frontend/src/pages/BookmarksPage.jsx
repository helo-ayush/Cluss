import React, { useCallback, useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Bookmark, Clock, Loader2 } from 'lucide-react';
import DashboardShell from '../components/dashboard/DashboardShell';
import PublicCourseCard from '../components/publicCourses/PublicCourseCard';
import CreatorProfileModal from '../components/publicCourses/CreatorProfileModal';
import { API_BASE } from '../utils/publicCourse';

function Rail({ title, subtitle, icon: Icon, courses, onLike, onBookmark, onCreator }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-zinc-300"><Icon className="h-5 w-5" /></div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">{subtitle}</p>
          <h2 className="text-3xl font-black text-white">{title}</h2>
        </div>
      </div>
      {courses.length ? (
        <div className="custom-scroll flex gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-2 md:overflow-visible xl:grid-cols-3 2xl:grid-cols-4">
          {courses.map((course) => <PublicCourseCard key={course._id} course={course} onLike={onLike} onBookmark={onBookmark} onCreator={onCreator} />)}
        </div>
      ) : (
        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-6 text-sm font-semibold text-zinc-500">Nothing here yet.</div>
      )}
    </section>
  );
}

export default function BookmarksPage() {
  const { user, isLoaded } = useUser();
  const [bookmarks, setBookmarks] = useState([]);
  const [continues, setContinues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creatorModal, setCreatorModal] = useState(null);

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

  useEffect(() => { if (isLoaded) load(); }, [isLoaded, load]);

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
      <div className="mx-auto max-w-[112rem] space-y-8 pb-16 text-white">
        <section className="rounded-[2.4rem] border border-white/10 bg-[#1b1b1b] p-7 shadow-[0_24px_90px_rgba(0,0,0,0.34)]">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">Your public course shelf</p>
          <h1 className="mt-2 text-5xl font-black tracking-tight text-white">Saved and in-progress courses</h1>
        </section>

        {error && <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-5 py-4 text-sm font-semibold text-rose-200">{error}</div>}
        {loading ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="h-96 animate-pulse rounded-[1.65rem] border border-white/10 bg-[#1b1b1b]" />)}</div>
        ) : !user?.id ? (
          <div className="rounded-[2rem] border border-white/10 bg-[#1b1b1b] px-6 py-16 text-center text-zinc-400">Sign in to save courses and continue reading.</div>
        ) : (
          <>
            <Rail title="Continue Reading" subtitle="Resume lessons" icon={Clock} courses={continues} onLike={(course) => mutateCourse(course, 'like')} onBookmark={(course) => mutateCourse(course, 'bookmark')} onCreator={setCreatorModal} />
            <Rail title="Bookmarks" subtitle="Saved courses" icon={Bookmark} courses={bookmarks} onLike={(course) => mutateCourse(course, 'like')} onBookmark={(course) => mutateCourse(course, 'bookmark')} onCreator={setCreatorModal} />
          </>
        )}
      </div>
      <CreatorProfileModal creatorClerkId={creatorModal} viewerClerkId={user?.id} onClose={() => setCreatorModal(null)} onLike={(course) => mutateCourse(course, 'like')} onBookmark={(course) => mutateCourse(course, 'bookmark')} />
    </DashboardShell>
  );
}
