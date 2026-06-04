import React from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, BookOpen, Eye, Heart, Layers, PlayCircle, Trash2, UserPlus } from 'lucide-react';

function Stat({ icon: Icon, value, label }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-bold text-zinc-400">
      <Icon className="h-3.5 w-3.5" />
      {value || 0} {label}
    </span>
  );
}

export default function PublicCourseCard({ course, onLike, onBookmark, onCreator, onDelete, owner = false }) {
  const progress = course?.viewer?.progress;
  const continueUrl = progress
    ? `/courses/${course.slug}/learn/${progress.moduleIndex || 0}/${progress.subtopicIndex || 0}`
    : `/courses/${course.slug}`;

  return (
    <article className="group relative flex min-h-[24rem] w-[22rem] max-w-[86vw] shrink-0 flex-col overflow-hidden rounded-[1.65rem] border border-white/10 bg-[#1b1b1b] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.34)] transition duration-300 hover:border-white/20 hover:bg-[#202020] md:w-full">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-white/[0.035] blur-3xl transition group-hover:bg-white/[0.06]" />

      <Link to={`/courses/${course.slug}`} className="relative block rounded-[1.25rem] border border-white/[0.06] bg-gradient-to-br from-[#303030] to-[#171717] p-4 transition group-hover:border-white/[0.14]">
        <div className="flex items-center justify-between gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-black shadow-[0_16px_34px_rgba(255,255,255,0.08)]">
            <Layers className="h-5 w-5" />
          </div>
          <p className="rounded-full border border-white/[0.08] bg-black/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">
            {course.moduleCount || 0} modules
          </p>
        </div>
        <h2 className="mt-5 line-clamp-2 min-h-[4rem] text-2xl font-black leading-tight tracking-tight text-white">
          {course.title}
        </h2>
      </Link>

      <div className="relative mt-4 flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={() => onCreator?.(course.creatorClerkId)}
          className="inline-flex min-w-0 items-center gap-2 text-sm font-bold text-zinc-400 transition hover:text-white"
        >
          <UserPlus className="h-4 w-4 shrink-0" />
          <span className="truncate">{course.creatorName || 'Creator'}</span>
        </button>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => onLike?.(course)}
            title={course.viewer?.liked ? 'Unlike course' : 'Like course'}
            className={`flex h-9 w-9 items-center justify-center rounded-full border transition ${
              course.viewer?.liked ? 'border-rose-300/30 bg-rose-300/15 text-rose-200' : 'border-white/10 bg-white/[0.04] text-zinc-400 hover:text-white'
            }`}
          >
            <Heart className="h-4 w-4" fill={course.viewer?.liked ? 'currentColor' : 'none'} />
          </button>
          <button
            type="button"
            onClick={() => onBookmark?.(course)}
            title={course.viewer?.bookmarked ? 'Remove bookmark' : 'Bookmark course'}
            className={`flex h-9 w-9 items-center justify-center rounded-full border transition ${
              course.viewer?.bookmarked ? 'border-amber-300/30 bg-amber-300/15 text-amber-200' : 'border-white/10 bg-white/[0.04] text-zinc-400 hover:text-white'
            }`}
          >
            <Bookmark className="h-4 w-4" fill={course.viewer?.bookmarked ? 'currentColor' : 'none'} />
          </button>
          {owner && (
            <button
              type="button"
              onClick={() => onDelete?.(course)}
              title="Delete uploaded course"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-red-300/15 bg-red-400/10 text-red-200 transition hover:bg-red-400 hover:text-black"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
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
            <div className="h-full rounded-full bg-white" style={{ width: `${progress.percent || 0}%` }} />
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
          <span className="text-xs font-black uppercase tracking-[0.14em] text-zinc-600">
            {course.lessonCount || 0} lessons
          </span>
          <Link to={continueUrl} className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-4 py-2.5 text-xs font-black text-black transition hover:bg-zinc-200">
            {progress ? <PlayCircle className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />}
            {progress ? 'Continue' : 'Open'}
          </Link>
        </div>
      </div>
    </article>
  );
}
