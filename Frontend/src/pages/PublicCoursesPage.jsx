import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, Bookmark, CloudUpload, Loader2, Search, Trash2, X } from 'lucide-react';
import DashboardShell from '../components/dashboard/DashboardShell';
import PublicCourseCard from '../components/publicCourses/PublicCourseCard';
import CreatorProfileModal from '../components/publicCourses/CreatorProfileModal';
import { API_BASE } from '../utils/publicCourse';

function CourseRail({ section, onLike, onBookmark, onCreator, onDelete }) {
  if (!section?.courses?.length) return null;
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4 px-1">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">{section.subtitle || 'Courses'}</p>
          <h2 className="mt-1 truncate text-2xl font-black text-white md:text-3xl capitalize">{section.title}</h2>
        </div>
        {section.totalPages > section.page && <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-black text-zinc-500">More below</span>}
      </div>
      <div className="custom-scroll flex gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-2 md:overflow-visible xl:grid-cols-3 2xl:grid-cols-4">
        {section.courses.map((course) => (
          <PublicCourseCard
            key={`${section.key}-${course._id}`}
            course={course}
            owner={section.ownerSection}
            onLike={onLike}
            onBookmark={onBookmark}
            onCreator={onCreator}
            onDelete={onDelete}
          />
        ))}
      </div>
    </section>
  );
}

function UploadModal({ open, onClose, user, onUploaded }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [publishingId, setPublishingId] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!open || !user?.id) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/public-courses/me/uploadable/${user.id}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Could not load completed courses.');
      setCourses(data.courses || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [open, user?.id]);

  useEffect(() => { load(); }, [load]);

  const publish = async (course) => {
    if (!user?.id || course.alreadyPublished) return;
    setPublishingId(course._id);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/public-courses/publish/${course._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clerkId: user.id, creatorName: user.fullName || user.username || 'Creator' }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Could not upload course.');
      onUploaded?.();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setPublishingId(null);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-[1300] bg-black/55 backdrop-blur-md" />
          <motion.section initial={{ opacity: 0, scale: 0.96, y: 18 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 18 }} className="fixed left-1/2 top-1/2 z-[1310] flex max-h-[84dvh] w-[min(94vw,48rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[#1b1b1b] shadow-[0_30px_100px_rgba(0,0,0,0.62)]">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">Upload completed guided courses</p>
                <h2 className="mt-1 text-2xl font-black text-white">Publish to Courses</h2>
              </div>
              <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-zinc-300 hover:bg-white hover:text-black"><X className="h-4 w-4" /></button>
            </div>
            <div className="custom-scroll min-h-0 flex-1 overflow-y-auto p-5">
              {error && <div className="mb-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm font-semibold text-rose-200">{error}</div>}
              {loading ? (
                <div className="flex min-h-44 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-zinc-400" /></div>
              ) : courses.length ? (
                <div className="space-y-3">
                  {courses.map((course) => (
                    <div key={course._id} className="grid gap-4 rounded-[1.35rem] border border-white/10 bg-white/[0.035] p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                      <div className="min-w-0">
                        <h3 className="truncate text-lg font-black text-white">{course.title}</h3>
                        <p className="mt-1 line-clamp-2 text-sm font-semibold text-zinc-500">{course.description || 'Completed guided course'}</p>
                        <p className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-zinc-600">{course.moduleCount} modules · {course.lessonCount} lessons · {course.progress}% done</p>
                      </div>
                      <button type="button" onClick={() => publish(course)} disabled={course.alreadyPublished || publishingId === course._id} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white px-4 text-sm font-black text-black transition hover:bg-zinc-200 disabled:opacity-45">
                        {publishingId === course._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CloudUpload className="h-4 w-4" />}
                        {course.alreadyPublished ? 'Uploaded' : 'Upload'}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-8 text-center text-sm font-semibold text-zinc-500">Complete a guided course to upload it here.</div>
              )}
            </div>
          </motion.section>
        </>
      )}
    </AnimatePresence>
  );
}

export default function PublicCoursesPage() {
  const { user } = useUser();
  const loadMoreRef = useRef(null);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [sections, setSections] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [creatorModal, setCreatorModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedQuery(query.trim()), 260);
    return () => window.clearTimeout(id);
  }, [query]);

  const loadSections = useCallback(async (nextPage = 1, append = false) => {
    append ? setLoadingMore(true) : setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(nextPage), limit: '12' });
      if (debouncedQuery) params.set('q', debouncedQuery);
      if (user?.id) params.set('clerkId', user.id);
      const res = await fetch(`${API_BASE}/api/public-courses/sections?${params.toString()}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Could not load courses.');
      setSections((prev) => append ? [...prev, ...(data.sections || [])] : (data.sections || []));
      setHasMore(!!data.hasMore);
      setPage(nextPage);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [debouncedQuery, user?.id]);

  useEffect(() => { loadSections(1, false); }, [loadSections]);

  useEffect(() => {
    if (!hasMore || debouncedQuery) return undefined;
    const target = loadMoreRef.current;
    if (!target) return undefined;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && !loadingMore && !loading) {
        loadSections(page + 1, true);
      }
    }, { rootMargin: '520px 0px' });
    observer.observe(target);
    return () => observer.disconnect();
  }, [debouncedQuery, hasMore, loadSections, loading, loadingMore, page]);

  const mutateCourse = async (course, action) => {
    if (!user?.id) return setError('Please sign in to like or bookmark courses.');
    try {
      const res = await fetch(`${API_BASE}/api/public-courses/${course._id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clerkId: user.id }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Update failed.');
      loadSections(1, false);
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteCourse = async () => {
    if (!user?.id || !deleteTarget?._id) return;
    try {
      const res = await fetch(`${API_BASE}/api/public-courses/${deleteTarget._id}?clerkId=${user.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Delete failed.');
      setDeleteTarget(null);
      loadSections(1, false);
    } catch (err) {
      setError(err.message);
    }
  };

  const visibleSections = useMemo(() => sections.filter((section) => section.courses?.length), [sections]);

  return (
    <DashboardShell title="Courses" eyebrow="Community Library">
      <div className="mx-auto max-w-[112rem] space-y-8 pb-16 text-white">
        <section className="relative overflow-hidden rounded-[2.4rem] border border-white/10 bg-[#1b1b1b] p-6 shadow-[0_26px_90px_rgba(0,0,0,0.42)] sm:p-8">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">Public course library</p>
              <h1 className="mt-3 max-w-4xl text-5xl font-black leading-none tracking-tight text-white md:text-6xl">Find a course worth opening.</h1>
              <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-zinc-500">Browse learner-built courses by momentum, topic, saved progress, and semantic search over course outlines.</p>
            </div>
            <button type="button" onClick={() => setUploadOpen(true)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-black text-black transition hover:bg-zinc-200">
              <CloudUpload className="h-4 w-4" />Upload Course
            </button>
          </div>
          <div className="mt-7 flex min-h-13 items-center gap-3 rounded-full border border-white/10 bg-black/25 px-4 focus-within:border-white/25">
            <Search className="h-4 w-4 text-zinc-500" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search AIML, automata, React hooks, DSA..." className="w-full bg-transparent py-4 text-sm font-semibold text-white outline-none placeholder:text-zinc-600" />
          </div>
        </section>

        {error && <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-5 py-4 text-sm font-semibold text-rose-200">{error}</div>}

        {loading ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((item) => <div key={item} className="h-96 animate-pulse rounded-[1.65rem] border border-white/10 bg-[#1b1b1b]" />)}
          </div>
        ) : visibleSections.length ? (
          <div className="space-y-10">
            {visibleSections.map((section, index) => (
              <CourseRail key={`${section.key}-${index}`} section={section} onLike={(course) => mutateCourse(course, 'like')} onBookmark={(course) => mutateCourse(course, 'bookmark')} onCreator={setCreatorModal} onDelete={setDeleteTarget} />
            ))}
            {hasMore && !debouncedQuery && (
              <div className="flex justify-center">
                <button ref={loadMoreRef} type="button" onClick={() => loadSections(page + 1, true)} disabled={loadingMore} className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-5 text-sm font-black text-zinc-200 transition hover:bg-white hover:text-black disabled:opacity-50">
                  {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  {loadingMore ? 'Loading more rows' : 'More rows load as you scroll'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-[2rem] border border-white/10 bg-[#1b1b1b] px-6 py-16 text-center">
            <h2 className="text-3xl font-black text-white">No courses found</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm font-semibold leading-7 text-zinc-500">Try another search, or upload a completed guided course.</p>
          </div>
        )}
      </div>

      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} user={user} onUploaded={() => loadSections(1, false)} />
      <CreatorProfileModal creatorClerkId={creatorModal} viewerClerkId={user?.id} onClose={() => setCreatorModal(null)} onLike={(course) => mutateCourse(course, 'like')} onBookmark={(course) => mutateCourse(course, 'bookmark')} />

      <AnimatePresence>
        {deleteTarget && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteTarget(null)} className="fixed inset-0 z-[1320] bg-black/55 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 12 }} className="fixed left-1/2 top-1/2 z-[1330] w-[min(92vw,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-[2rem] border border-white/10 bg-[#1b1b1b] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.62)]">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-400/15 text-red-200"><Trash2 className="h-5 w-5" /></div>
              <h2 className="mt-4 text-2xl font-black text-white">Delete uploaded course?</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-zinc-500">This permanently removes the public copy and its public likes, saves, views, and progress. Your private guided course stays untouched.</p>
              <div className="mt-5 flex justify-end gap-2">
                <button type="button" onClick={() => setDeleteTarget(null)} className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-black text-zinc-200 hover:bg-white/[0.08]">Cancel</button>
                <button type="button" onClick={deleteCourse} className="rounded-full bg-red-400 px-4 py-2.5 text-sm font-black text-black hover:bg-red-300">Delete</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </DashboardShell>
  );
}
