import React, { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Eye, Heart, Loader2, UserPlus, Users, X } from 'lucide-react';
import PublicCourseCard from './PublicCourseCard';
import { API_BASE } from '../../utils/publicCourse';

export default function CreatorProfileModal({ creatorClerkId, viewerClerkId, onClose, onLike, onBookmark }) {
  const [profile, setProfile] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!creatorClerkId) return;
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (viewerClerkId) params.set('viewerClerkId', viewerClerkId);
      const res = await fetch(`${API_BASE}/api/public-courses/creator/${creatorClerkId}?${params.toString()}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Could not load creator.');
      setProfile(data.creator);
      setCourses(data.courses || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [creatorClerkId, viewerClerkId]);

  useEffect(() => { load(); }, [load]);

  const toggleFollow = async () => {
    if (!viewerClerkId || !profile) return;
    const res = await fetch(`${API_BASE}/api/public-courses/creator/${creatorClerkId}/follow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clerkId: viewerClerkId }),
    });
    const data = await res.json();
    if (data.success) setProfile((prev) => ({ ...prev, followers: data.followers, viewer: { ...prev.viewer, following: data.following } }));
  };

  return (
    <AnimatePresence>
      {creatorClerkId && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-[1400] bg-black/55 backdrop-blur-md" />
          <motion.section
            initial={{ opacity: 0, scale: 0.96, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 18 }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            className="fixed left-1/2 top-1/2 z-[1410] flex max-h-[86dvh] w-[min(94vw,58rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[#1b1b1b] shadow-[0_30px_100px_rgba(0,0,0,0.62)]"
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5">
              {loading ? (
                <div className="flex items-center gap-3 text-zinc-400"><Loader2 className="h-5 w-5 animate-spin" />Loading creator</div>
              ) : (
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl font-black text-black">
                    {(profile?.name || 'C').slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate text-2xl font-black text-white">{profile?.name || 'Creator'}</h2>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold text-zinc-400">
                      <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1"><Users className="h-3.5 w-3.5" />{profile?.followers || 0} followers</span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">{profile?.courseCount || 0} courses</span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1"><Eye className="h-3.5 w-3.5" />{profile?.totals?.views || 0}</span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1"><Heart className="h-3.5 w-3.5" />{profile?.totals?.likes || 0}</span>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={toggleFollow}
                  disabled={!viewerClerkId || viewerClerkId === creatorClerkId}
                  className="hidden rounded-full bg-white px-4 py-2 text-sm font-black text-black transition hover:bg-zinc-200 disabled:opacity-40 sm:inline-flex"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  {profile?.viewer?.following ? 'Following' : 'Follow'}
                </button>
                <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-zinc-300 hover:bg-white hover:text-black">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="custom-scroll min-h-0 flex-1 overflow-y-auto p-5">
              {error ? (
                <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm font-semibold text-rose-200">{error}</div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {courses.slice(0, 4).map((course) => (
                    <PublicCourseCard key={course._id} course={course} onLike={onLike} onBookmark={onBookmark} onCreator={() => {}} />
                  ))}
                </div>
              )}
            </div>
          </motion.section>
        </>
      )}
    </AnimatePresence>
  );
}
