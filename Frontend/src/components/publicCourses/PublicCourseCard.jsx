import React from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, BookOpen, Eye, Heart, PlayCircle, UserPlus } from 'lucide-react';

function Stat({ icon: Icon, value, label }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-bold text-zinc-400">
      <Icon className="h-3.5 w-3.5" />
      {value || 0} {label}
    </span>
  );
}

export default function PublicCourseCard({ course, onLike, onBookmark }) {
  const progress = course?.viewer?.progress;
  const continueUrl = progress
    ? `/courses/${course.slug}?m=${progress.moduleIndex || 0}&s=${progress.subtopicIndex || 0}`
    : `/courses/${course.slug}`;

  return (
    <article className="group flex min-h-[23rem] flex-col overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#111318] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.24)] transition hover:-translate-y-1 hover:border-white/20">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-100/65">
            {course.moduleCount || 0} modules · {course.lessonCount || 0} lessons
          </p>
          <Link to={`/courses/${course.slug}`} className="mt-3 block">
            <h2 className="line-clamp-2 text-2xl font-black leading-tight tracking-[-0.02em] text-white group-hover:text-cyan-50">
              {course.title}
            </h2>
          </Link>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => onLike?.(course)}
            title={course.viewer?.liked ? 'Unlike course' : 'Like course'}
            className={`flex h-10 w-10 items-center justify-center rounded-full border transition ${
              course.viewer?.liked ? 'border-rose-300/30 bg-rose-300/15 text-rose-200' : 'border-white/10 bg-white/[0.04] text-zinc-400 hover:text-white'
            }`}
          >
            <Heart className="h-4 w-4" fill={course.viewer?.liked ? 'currentColor' : 'none'} />
          </button>
          <button
            type="button"
            onClick={() => onBookmark?.(course)}
            title={course.viewer?.bookmarked ? 'Remove bookmark' : 'Bookmark course'}
            className={`flex h-10 w-10 items-center justify-center rounded-full border transition ${
              course.viewer?.bookmarked ? 'border-amber-300/30 bg-amber-300/15 text-amber-200' : 'border-white/10 bg-white/[0.04] text-zinc-400 hover:text-white'
            }`}
          >
            <Bookmark className="h-4 w-4" fill={course.viewer?.bookmarked ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      <p className="mt-4 line-clamp-3 text-sm font-semibold leading-7 text-zinc-500">
        {course.description || 'A community-published guided course with generated lesson notes and a structured path.'}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {(course.tags || []).slice(0, 4).map((tag) => (
          <span key={tag} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-zinc-500">
            {tag}
          </span>
        ))}
      </div>

      {progress && (
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.18em] text-zinc-600">
            <span>Continue reading</span>
            <span>{progress.percent || 0}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/[0.08]">
            <div className="h-full rounded-full bg-gradient-to-r from-cyan-200 via-white to-amber-200" style={{ width: `${progress.percent || 0}%` }} />
          </div>
        </div>
      )}

      <div className="mt-auto pt-6">
        <div className="mb-4 flex flex-wrap gap-2">
          <Stat icon={Eye} value={course.metrics?.views} label="views" />
          <Stat icon={Heart} value={course.metrics?.likes} label="likes" />
          <Stat icon={Bookmark} value={course.metrics?.bookmarks} label="saves" />
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-4">
          <Link to={`/creators/${course.creatorClerkId}`} className="inline-flex min-w-0 items-center gap-2 text-sm font-bold text-zinc-400 transition hover:text-white">
            <UserPlus className="h-4 w-4 shrink-0" />
            <span className="truncate">{course.creatorName || 'Creator'}</span>
          </Link>
          <Link to={continueUrl} className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-4 py-2.5 text-xs font-black text-black transition hover:bg-zinc-200">
            {progress ? <PlayCircle className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />}
            {progress ? 'Continue' : 'Read'}
          </Link>
        </div>
      </div>
    </article>
  );
}
