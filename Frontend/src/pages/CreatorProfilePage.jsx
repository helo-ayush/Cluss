import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { Eye, Heart, Loader2, UserPlus, Users } from 'lucide-react';
import DashboardShell from '../components/dashboard/DashboardShell';
import PublicCourseCard from '../components/publicCourses/PublicCourseCard';
import { API_BASE } from '../utils/publicCourse';

export default function CreatorProfilePage() {
  const { creatorClerkId } = useParams();
  const { user } = useUser();
  const [profile, setProfile] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (user?.id) params.set('viewerClerkId', user.id);
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
  }, [creatorClerkId, user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleFollow = async () => {
    if (!user?.id) {
      setError('Please sign in to follow creators.');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/public-courses/creator/${creatorClerkId}/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clerkId: user.id }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Could not update follow.');
      setProfile((prev) => prev ? { ...prev, followers: data.followers, viewer: { ...prev.viewer, following: data.following } } : prev);
    } catch (err) {
      setError(err.message);
    }
  };

  const mutateCourse = async (course, action) => {
    if (!user?.id) return;
    await fetch(`${API_BASE}/api/public-courses/${course._id}/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clerkId: user.id }),
    });
    load();
  };

  return (
    <DashboardShell title={profile?.name || 'Creator'} eyebrow="Creator Profile">
      <div className="mx-auto max-w-[104rem] space-y-6">
        {loading ? (
          <div className="flex min-h-80 items-center justify-center rounded-[2rem] border border-white/10 bg-[#101114]">
            <Loader2 className="h-7 w-7 animate-spin text-cyan-100" />
          </div>
        ) : (
          <>
            <section className="relative overflow-hidden rounded-[2.4rem] border border-white/10 bg-[#12141c] p-7 shadow-[0_24px_90px_rgba(0,0,0,0.34)] sm:p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="min-w-0">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white text-2xl font-black text-black">
                    {(profile?.name || 'C').slice(0, 1).toUpperCase()}
                  </div>
                  <h1 className="mt-5 break-words text-5xl font-black tracking-[-0.03em] text-white">{profile?.name || 'Creator'}</h1>
                  <p className="mt-3 text-sm font-semibold text-zinc-500">{profile?.courseCount || 0} published courses</p>
                </div>
                <button
                  type="button"
                  onClick={toggleFollow}
                  disabled={user?.id === creatorClerkId}
                  className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-black transition disabled:opacity-40 ${
                    profile?.viewer?.following ? 'border border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]' : 'bg-white text-black hover:bg-zinc-200'
                  }`}
                >
                  <UserPlus className="h-4 w-4" />
                  {profile?.viewer?.following ? 'Following' : 'Follow'}
                </button>
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.045] p-4">
                  <Users className="h-5 w-5 text-cyan-100" />
                  <p className="mt-3 text-3xl font-black text-white">{profile?.followers || 0}</p>
                  <p className="text-xs font-bold text-zinc-500">Followers</p>
                </div>
                <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.045] p-4">
                  <UserPlus className="h-5 w-5 text-zinc-300" />
                  <p className="mt-3 text-3xl font-black text-white">{profile?.following || 0}</p>
                  <p className="text-xs font-bold text-zinc-500">Following</p>
                </div>
                <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.045] p-4">
                  <Eye className="h-5 w-5 text-emerald-200" />
                  <p className="mt-3 text-3xl font-black text-white">{profile?.totals?.views || 0}</p>
                  <p className="text-xs font-bold text-zinc-500">Views</p>
                </div>
                <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.045] p-4">
                  <Heart className="h-5 w-5 text-rose-200" />
                  <p className="mt-3 text-3xl font-black text-white">{profile?.totals?.likes || 0}</p>
                  <p className="text-xs font-bold text-zinc-500">Likes</p>
                </div>
              </div>
            </section>

            {error && <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-5 py-4 text-sm font-semibold text-rose-200">{error}</div>}

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {courses.map((course) => (
                <PublicCourseCard key={course._id} course={course} onLike={(item) => mutateCourse(item, 'like')} onBookmark={(item) => mutateCourse(item, 'bookmark')} />
              ))}
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}
