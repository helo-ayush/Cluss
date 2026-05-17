import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { SignInButton, useUser } from '@clerk/clerk-react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRight,
  ArrowLeft,
  BookOpen,
  CheckCircle,
  ChevronRight,
  CirclePlay,
  Crown,
  FileSearch,
  Gauge,
  Layers3,
  LayoutDashboard,
  Loader2,
  Lock,
  Map,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target,
  Trash2,
  Trophy,
  WandSparkles,
  XCircle,
  Zap,
} from 'lucide-react';
import StudyConfigPanel from '../components/dashboard/DarkStudyConfigPanel';
import { normalizeStudyConfig } from '../utils/studyConfig';
import CreditCost from '../components/CreditCost';
import { getCostForAction } from '../config/creditCosts';
import DashboardShell from '../components/dashboard/DashboardShell';
import { useUsage } from '../contexts/UsageContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const statusCopy = {
  active: 'Active',
  completed: 'Done',
  locked: 'Locked',
};

function clampProgress(value) {
  const number = Number(value) || 0;
  return Math.max(0, Math.min(100, number));
}

function moduleCompletion(module) {
  const subtopics = module?.subtopics || [];
  if (!subtopics.length) return 0;
  const completed = subtopics.filter((item) => item.status === 'completed').length;
  return Math.round((completed / subtopics.length) * 100);
}

function getCurrentTopic(course, currentRef) {
  if (!course?.modules || !currentRef) return { module: null, subtopic: null };
  const module = course.modules[currentRef.moduleIndex];
  const subtopic = module?.subtopics?.[currentRef.subtopicIndex] || null;
  return { module, subtopic };
}

function scrollToElement(id, block = 'start') {
  const element = document.getElementById(id);
  if (element) element.scrollIntoView({ behavior: 'smooth', block });
}

function StudyPulsePanel({ progress, currentModule, currentSubtopic }) {
  const safeProgress = clampProgress(progress);

  return (
    <div className="relative overflow-hidden rounded-[1.65rem] border border-white/10 bg-[#181a21] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:col-span-2 lg:col-span-2 xl:col-span-2">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-100/40 to-transparent" />
      <div className="flex items-start justify-between gap-5">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-100/70">Study pulse</p>
          <h2 className="mt-3 text-4xl font-black leading-none text-white">{safeProgress}%</h2>
          <p className="mt-3 line-clamp-2 text-sm font-semibold leading-6 text-zinc-500">
            {currentSubtopic?.subtopic_title || currentModule?.module_title || 'Plan is ready when you are.'}
          </p>
        </div>
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-200/20 bg-cyan-200/10 text-cyan-100">
          <Gauge className="h-6 w-6" />
        </div>
      </div>
      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.18em] text-zinc-600">
          <span>Overall</span>
          <span>{safeProgress}/100</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/[0.08]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-200 via-white to-amber-200 transition-all duration-700"
            style={{ width: `${safeProgress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function MetricTile({ label, value, detail, accent = '#f5f5f5', delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ delay, duration: 0.45 }}
      whileHover={{ y: -3, scale: 1.01 }}
      className="group relative overflow-hidden rounded-[1.35rem] border border-white/10 bg-white/[0.045] p-4 shadow-[0_18px_54px_rgba(0,0,0,0.22)]"
    >
      <div className="absolute inset-x-0 top-0 h-px opacity-60 transition group-hover:opacity-100" style={{ backgroundColor: accent }} />
      <div className="relative">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">{label}</p>
        <p className="mt-2 text-3xl font-black text-white">{value}</p>
      </div>
      <p className="relative mt-2 text-xs font-semibold leading-5 text-zinc-500">{detail}</p>
    </motion.div>
  );
}

function CommandDeck({ course, currentRef, currentModule, currentSubtopic, pathStats, onOpenSettings }) {
  const continueUrl = currentRef
    ? `/dashboard/guided/study-plan/${course._id}/learn/${currentRef.moduleIndex}/${currentRef.subtopicIndex}`
    : `/dashboard/guided/study-plan/${course._id}`;
  const moduleProgress = moduleCompletion(currentModule);

  return (
    <section className="relative overflow-hidden rounded-[2.4rem] border border-white/10 bg-[#12141c] shadow-[0_24px_90px_rgba(0,0,0,0.38)]">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.085),transparent_38%),linear-gradient(180deg,rgba(20,184,166,0.08),transparent_45%),linear-gradient(115deg,transparent_0%,rgba(245,158,11,0.08)_68%,transparent_100%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />

      <div className="relative grid gap-8 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_24rem] lg:p-8 xl:grid-cols-[minmax(0,1fr)_31rem]">

        {/* ── Left: Title + Up Next + Buttons ── */}
        <div className="flex min-w-0 flex-col gap-7">
          {/* Badges + Title */}
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <Link to="/dashboard/guided" className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-black text-zinc-200 transition hover:bg-white/[0.1] hover:text-white">
                <ArrowLeft className="h-4 w-4" />
                Library
              </Link>
              <span className="inline-flex items-center rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-cyan-100">
                Guided command center
              </span>
              {course.studyConfig?.miniProjectsEnabled && (
                <span className="inline-flex items-center rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-amber-200">
                  Checkpoints on
                </span>
              )}
            </div>
            <h1 className="mt-6 break-words text-[2.2rem] font-black leading-[1.02] tracking-[-0.03em] text-white sm:text-[3rem] lg:text-[3.8rem]">
              {course.course_title}
            </h1>
            {course.learningGoal && course.learningGoal !== course.course_query && (
              <p className="mt-4 text-[15px] leading-8 text-zinc-400 line-clamp-2" title={course.learningGoal}>
                {course.learningGoal}
              </p>
            )}
          </div>

          {/* Up Next card */}
          <div className="w-full max-w-[32rem] overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.055] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">Up next</p>
            <div className="mt-3 grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-black">
                <CirclePlay className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-zinc-400">
                  {currentModule ? `Module ${currentRef.moduleIndex + 1}: ${currentModule.module_title}` : 'No active module'}
                </p>
                <h2 className="mt-1 break-words text-xl font-black leading-snug text-white line-clamp-2">
                  {currentSubtopic?.subtopic_title || 'Your plan is ready'}
                </h2>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-200 via-white to-amber-200 transition-all duration-700"
                    style={{ width: `${moduleProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Buttons — always below Up Next */}
          <div className="flex flex-wrap gap-3">
            <Link
              to={continueUrl}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-black transition hover:-translate-y-0.5 hover:bg-zinc-200"
            >
              Continue <ArrowRight className="h-4 w-4" />
            </Link>
            <button
              type="button"
              onClick={onOpenSettings}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-black text-zinc-200 transition hover:-translate-y-0.5 hover:bg-white/[0.1] hover:text-white"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Defaults
            </button>
          </div>
        </div>

        {/* ── Right: Study Pulse ── */}
        <div className="flex flex-col gap-4 lg:items-end">
          <StudyPulsePanel progress={course.progress || 0} currentModule={currentModule} currentSubtopic={currentSubtopic} />
          <div className="grid w-full grid-cols-2 gap-3">
            <MetricTile label="Modules" value={(course.modules || []).length} detail="Major sections" accent="#b9f9ff" />
            <MetricTile label="Lessons" value={pathStats.total} detail="Learning units" accent="#ffffff" delay={0.04} />
            <MetricTile label="Done" value={(course.modules || []).flatMap((module) => module.subtopics || []).filter((item) => item.status === 'completed').length} detail="Completed units" accent="#6ee7b7" delay={0.08} />
            <MetricTile label="Gates" value={(course.modules || []).flatMap((module) => module.subtopics || []).filter((item) => item.subtopic_type === 'mini-project').length} detail="Mini projects" accent="#fde68a" delay={0.12} />
          </div>
        </div>

      </div>
    </section>
  );
}

function SettingsPanel({ open, configDraft, setConfigDraft, plan, saving, onSave, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.section
          key="study-controls"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22 }}
          className="rounded-[2rem] border border-white/10 bg-[#12141c] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.3)] sm:p-6 lg:p-7"
        >
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-white">
                <Settings2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">Lesson defaults</p>
                <h2 className="mt-1 text-2xl font-black text-white">Study controls</h2>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onSave}
                disabled={saving}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-black text-black transition hover:bg-zinc-200 disabled:opacity-40"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                {saving ? 'Saving' : 'Save'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] px-5 py-2.5 text-sm font-bold text-zinc-300 transition hover:bg-white/[0.09] hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
          <StudyConfigPanel value={configDraft} onChange={setConfigDraft} plan={plan} />
        </motion.section>
      )}
    </AnimatePresence>
  );
}

function ModuleHealthPanel({ modules, currentRef }) {
  return (
    <section className="flex min-h-0 flex-1 flex-col rounded-[2rem] border border-white/10 bg-[#0d0e10] p-4 shadow-[0_20px_70px_rgba(0,0,0,0.28)]">
      <div className="mb-4 flex shrink-0 items-center justify-between gap-3 px-1">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">Module stack</p>
          <h2 className="mt-1 text-xl font-black text-white">Plan health</h2>
        </div>
        <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-black text-zinc-500">{(modules || []).length}</span>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1 custom-scroll">
        {(modules || []).map((module, index) => {
          const progress = moduleCompletion(module);
          const active = currentRef?.moduleIndex === index;

          return (
            <button
              key={module.module_id || index}
              type="button"
              onClick={() => scrollToElement(`module-section-${index}`)}
              className={`group w-full rounded-[1.15rem] border px-3 py-2.5 text-left transition hover:-translate-y-0.5 ${
                active
                  ? 'border-cyan-200/30 bg-cyan-200/10'
                  : 'border-white/[0.08] bg-white/[0.03] hover:border-white/[0.16] hover:bg-white/[0.055]'
              }`}
            >
              <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-black ${active ? 'bg-cyan-100 text-black' : 'bg-black/35 text-zinc-300'}`}>
                  {index + 1}
                </div>
                <div className="min-w-0">
                  <p className={`truncate text-xs font-black ${active ? 'text-white' : 'text-zinc-300 group-hover:text-white'}`}>{module.module_title}</p>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.08]">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${active ? 'bg-cyan-100' : progress === 100 ? 'bg-emerald-300' : 'bg-white/40'}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
                <span className="text-[11px] font-black text-zinc-500">{progress}%</span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function PathToolbar({ query, setQuery, filter, setFilter, visibleCount, totalCount }) {
  const filters = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'completed', label: 'Done' },
    { key: 'locked', label: 'Locked' },
    { key: 'projects', label: 'Projects' },
  ];

  return (
    <div className="flex flex-col gap-4 border-b border-white/10 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-white">
          <Map className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">Learning path</p>
          <h2 className="mt-1 text-2xl font-black text-white">Syllabus board</h2>
        </div>
      </div>

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="flex min-h-12 items-center gap-3 rounded-full border border-white/10 bg-black/30 px-4 focus-within:border-cyan-200/30">
          <Search className="h-4 w-4 text-zinc-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search lessons"
            className="w-full min-w-0 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-zinc-600 sm:w-60"
          />
        </div>

        <div className="flex gap-1 overflow-x-auto rounded-full border border-white/10 bg-black/25 p-1 custom-scroll-x">
          {filters.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-black transition ${
                filter === item.key ? 'bg-white text-black' : 'text-zinc-400 hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <span className="text-xs font-bold text-zinc-600">{visibleCount}/{totalCount}</span>
      </div>
    </div>
  );
}

function SubtopicRow({ courseId, moduleIndex, subtopicIndex, subtopic, isCurrent }) {
  const navigate = useNavigate();
  const completed = subtopic.status === 'completed';
  const locked = subtopic.status === 'locked';
  const miniProject = subtopic.subtopic_type === 'mini-project';
  const ready = subtopic.generationStatus === 'ready';
  const Icon = locked ? Lock : completed ? CheckCircle : miniProject ? Crown : CirclePlay;

  return (
    <motion.button
      type="button"
      id={isCurrent ? 'study-plan-current-topic' : undefined}
      onClick={() => !locked && navigate(`/dashboard/guided/study-plan/${courseId}/learn/${moduleIndex}/${subtopicIndex}`)}
      disabled={locked}
      whileHover={locked ? {} : { y: -2 }}
      transition={{ duration: 0.18 }}
      className={`group w-full overflow-hidden rounded-[1.35rem] border px-4 py-4 text-left transition sm:px-5 ${
        locked
          ? 'cursor-not-allowed border-white/10 bg-white/[0.04]'
          : isCurrent
            ? 'border-cyan-200/40 bg-cyan-200/10 shadow-[0_0_28px_rgba(103,232,249,0.08)]'
            : completed
              ? 'border-emerald-300/20 bg-emerald-300/[0.055] hover:border-emerald-300/35'
              : 'border-white/10 bg-white/[0.055] hover:border-white/20 hover:bg-white/[0.08]'
      }`}
    >
      <div className="grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${
          locked
            ? 'border-white/5 bg-white/[0.03] text-zinc-600'
            : isCurrent
              ? 'border-cyan-100/40 bg-cyan-100 text-black'
              : completed
                ? 'border-emerald-300/30 bg-emerald-300/12 text-emerald-200'
                : miniProject
                  ? 'border-amber-300/25 bg-amber-300/10 text-amber-200'
                  : 'border-white/10 bg-black/30 text-white'
        }`}>
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${
              locked
                ? 'border-white/5 text-zinc-600'
                : isCurrent
                  ? 'border-cyan-100/30 bg-cyan-100/10 text-cyan-100'
                  : completed
                    ? 'border-emerald-300/25 bg-emerald-300/10 text-emerald-200'
                    : 'border-white/10 bg-white/[0.04] text-zinc-300'
            }`}>
              {statusCopy[subtopic.status] || 'Ready'}
            </span>
            {miniProject && (
              <span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-amber-200">
                Gate
              </span>
            )}
            {!locked && (
              <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                {ready ? 'Ready' : 'Generate'}
              </span>
            )}
          </div>

          <h3 className={`mt-3 text-lg font-black leading-snug ${locked ? 'text-zinc-500' : 'text-white'}`}>
            {String(subtopicIndex + 1).padStart(2, '0')} - {subtopic.subtopic_title}
          </h3>
        </div>

        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <span className={`text-xs font-black uppercase tracking-[0.18em] ${locked ? 'text-zinc-700' : 'text-zinc-500 group-hover:text-white'}`}>
            {locked ? 'Locked' : 'Open'}
          </span>
          <ChevronRight className={`h-5 w-5 ${locked ? 'text-zinc-700' : 'text-zinc-500 group-hover:text-white'}`} />
        </div>
      </div>
    </motion.button>
  );
}

function LearningPath({ course, currentRef, query, setQuery, filter, setFilter, filteredModules, visibleCount, totalCount }) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#12141c] shadow-[0_24px_80px_rgba(0,0,0,0.34)]">
      <PathToolbar
        query={query}
        setQuery={setQuery}
        filter={filter}
        setFilter={setFilter}
        visibleCount={visibleCount}
        totalCount={totalCount}
      />

      <div className="p-5 sm:p-6 lg:p-7">
        {visibleCount === 0 ? (
          <div className="flex min-h-[18rem] flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-white/10 bg-white/[0.025] text-center">
            <FileSearch className="h-8 w-8 text-zinc-600" />
            <h3 className="mt-4 text-xl font-black text-white">No lessons found</h3>
            <p className="mt-2 text-sm text-zinc-500">Adjust the search or filter.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {filteredModules.map(({ module, moduleIndex, subtopics }) => (
              <div key={module.module_id || moduleIndex} id={`module-section-${moduleIndex}`} className="relative">
                <div className="mb-4 flex flex-col gap-4 rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-lg font-black text-black">
                      {moduleIndex + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">Module {moduleIndex + 1}</p>
                      <h3 className="mt-1 truncate text-2xl font-black text-white">{module.module_title}</h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-32 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-gradient-to-r from-cyan-200 via-white to-emerald-200" style={{ width: `${moduleCompletion(module)}%` }} />
                    </div>
                    <span className="text-sm font-black text-zinc-500">{moduleCompletion(module)}%</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {subtopics.map(({ subtopic, subtopicIndex }) => (
                    <SubtopicRow
                      key={`${moduleIndex}-${subtopicIndex}`}
                      courseId={course._id}
                      moduleIndex={moduleIndex}
                      subtopicIndex={subtopicIndex}
                      subtopic={subtopic}
                      isCurrent={currentRef?.moduleIndex === moduleIndex && currentRef?.subtopicIndex === subtopicIndex}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function SyllabusTuner({ courseId, clerkId, plan, modules, onCourseUpdate }) {
  const [instruction, setInstruction] = useState('');
  const [loading, setLoading] = useState(false);
  const [diff, setDiff] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');

  const creditCost = getCostForAction(plan, 'courseScaffold');

  const handleTune = async () => {
    if (!instruction.trim() || loading) return;
    setLoading(true);
    setError('');
    setDiff(null);
    try {
      const res = await fetch(`${API_BASE}/api/study-plans/${courseId}/tune`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clerkId, instruction: instruction.trim() }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Tuning failed');
      setDiff(data.diff);
      setInstruction('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (apply) => {
    setConfirming(true);
    try {
      const res = await fetch(`${API_BASE}/api/study-plans/${courseId}/tune/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apply, diff }),
      });
      const data = await res.json();
      if (apply && data.success && data.course) onCourseUpdate(data.course);
    } catch (err) {
      setError(err.message);
    } finally {
      setConfirming(false);
      setDiff(null);
    }
  };

  const flatList = useMemo(() => {
    if (!diff || !modules) return [];
    const removedKeys = new Set((diff.removes || []).map((item) => `${item.moduleIndex}-${item.subtopicIndex}`));
    const rows = [];
    modules.forEach((module, moduleIndex) => {
      rows.push({ type: 'module', title: module.module_title, moduleIndex });
      (module.subtopics || []).forEach((subtopic, subtopicIndex) => {
        const key = `${moduleIndex}-${subtopicIndex}`;
        rows.push({
          type: 'subtopic',
          title: subtopic.subtopic_title,
          moduleIndex,
          subtopicIndex,
          status: removedKeys.has(key) ? 'removed' : 'existing',
        });
      });
      (diff.adds || [])
        .filter((item) => item.moduleIndex === moduleIndex)
        .forEach((add) => {
          rows.push({
            type: 'subtopic',
            title: add.subtopic_title,
            moduleIndex,
            status: 'added',
          });
        });
    });
    return rows;
  }, [diff, modules]);

  return (
    <section id="study-plan-tuner" className="shrink-0 rounded-[2rem] border border-white/10 bg-[#12141c] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.28)]">
      <div className="mb-5 flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-teal-300/20 bg-teal-300/10 text-teal-100">
          <WandSparkles className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">AI tuner</p>
          <h2 className="mt-1 text-xl font-black text-white">Tune syllabus</h2>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!diff ? (
          <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="rounded-[1.25rem] border border-white/10 bg-black/35 p-1.5 transition focus-within:border-teal-200/35">
              <textarea
                value={instruction}
                onChange={(event) => setInstruction(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    handleTune();
                  }
                }}
                placeholder='Add indexing after module 2, remove null values, make probability deeper...'
                className="min-h-[7rem] w-full resize-none bg-transparent px-3 py-3 text-sm font-semibold leading-6 text-white outline-none placeholder:text-zinc-600"
              />
            </div>
            {error && <p className="mt-2 text-xs font-semibold text-red-300">{error}</p>}
            <button
              type="button"
              disabled={loading || !instruction.trim()}
              onClick={handleTune}
              className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-black transition hover:bg-zinc-200 disabled:opacity-40"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {loading ? 'Thinking' : 'Generate changes'}
              <CreditCost cost={creditCost} className="ml-1 text-black/50" />
            </button>
          </motion.div>
        ) : (
          <motion.div key="diff" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="mb-3 rounded-[1.25rem] border border-white/10 bg-white/[0.035] px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Summary</p>
              <p className="mt-1 text-sm font-semibold leading-6 text-zinc-300">{diff.summary}</p>
            </div>

            <div className="max-h-[22rem] space-y-1 overflow-y-auto pr-1 custom-scroll">
              {flatList.map((row, index) => {
                if (row.type === 'module') {
                  return (
                    <div key={index} className="px-2 pb-1 pt-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                        Module {row.moduleIndex + 1}: {row.title}
                      </p>
                    </div>
                  );
                }
                if (row.status === 'removed') {
                  return (
                    <div key={index} className="flex items-center gap-3 rounded-xl border border-red-300/20 bg-red-400/10 px-3 py-2.5">
                      <Trash2 className="h-3.5 w-3.5 shrink-0 text-red-300" />
                      <span className="text-sm font-semibold text-red-200 line-through">{row.title}</span>
                    </div>
                  );
                }
                if (row.status === 'added') {
                  return (
                    <div key={index} className="flex items-center gap-3 rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-3 py-2.5">
                      <Plus className="h-3.5 w-3.5 shrink-0 text-emerald-200" />
                      <span className="text-sm font-semibold text-emerald-100">{row.title}</span>
                    </div>
                  );
                }
                return (
                  <div key={index} className="rounded-xl border border-white/5 bg-white/[0.025] px-3 py-2.5">
                    <span className="text-sm font-semibold text-zinc-400">{row.title}</span>
                  </div>
                );
              })}
            </div>

            {error && <p className="mt-2 text-xs font-semibold text-red-300">{error}</p>}

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={confirming}
                onClick={() => handleConfirm(false)}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.05] text-sm font-black text-zinc-300 transition hover:bg-white/[0.09] disabled:opacity-40"
              >
                <XCircle className="h-4 w-4" />
                Reject
              </button>
              <button
                type="button"
                disabled={confirming}
                onClick={() => handleConfirm(true)}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white text-sm font-black text-black transition hover:bg-zinc-200 disabled:opacity-40"
              >
                {confirming ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                Apply
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

export default function GuidedStudyPlanMap() {
  const { courseId } = useParams();
  const { user, isLoaded, isSignedIn } = useUser();
  const { usageData } = useUsage();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [configDraft, setConfigDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showStudyControls, setShowStudyControls] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [toast, setToast] = useState(null); // { message, type }

  const redirectToLibrary = useCallback((message) => {
    navigate('/dashboard/guided', {
      replace: true,
      state: { toast: { message } },
    });
  }, [navigate]);

  const fetchCourse = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${API_BASE}/api/study-plans/${courseId}?clerkId=${user.id}`);
      const data = await res.json();
      if (!data.success || data.course?.sourceType !== 'guided-topic') {
        redirectToLibrary(data.message || 'Access denied: You are not the creator of this study plan.');
        return;
      }
      setCourse(data.course);
      setConfigDraft(data.course.studyConfig);
    } catch (error) {
      console.error(error);
      redirectToLibrary('Access denied: You are not the creator of this study plan.');
    } finally {
      setLoading(false);
    }
  }, [courseId, user?.id, redirectToLibrary]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  const currentRef = useMemo(() => {
    if (!course?.modules) return null;
    for (let moduleIndex = 0; moduleIndex < course.modules.length; moduleIndex += 1) {
      const subtopics = course.modules[moduleIndex].subtopics || [];
      for (let subtopicIndex = 0; subtopicIndex < subtopics.length; subtopicIndex += 1) {
        if (subtopics[subtopicIndex].status === 'active') return { moduleIndex, subtopicIndex };
      }
    }
    return { moduleIndex: course.current_module_index || 0, subtopicIndex: course.current_subtopic_index || 0 };
  }, [course]);

  const { module: currentModule, subtopic: currentSubtopic } = useMemo(
    () => getCurrentTopic(course, currentRef),
    [course, currentRef]
  );

  const pathStats = useMemo(() => {
    const allSubtopics = (course?.modules || []).flatMap((module) => module.subtopics || []);
    return {
      total: allSubtopics.length,
      active: allSubtopics.filter((item) => item.status === 'active').length,
      locked: allSubtopics.filter((item) => item.status === 'locked').length,
      ready: allSubtopics.filter((item) => item.generationStatus === 'ready').length,
    };
  }, [course]);

  const filteredModules = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return (course?.modules || [])
      .map((module, moduleIndex) => {
        const moduleTitleMatch = module.module_title?.toLowerCase().includes(normalizedQuery);
        const subtopics = (module.subtopics || [])
          .map((subtopic, subtopicIndex) => ({ subtopic, subtopicIndex }))
          .filter(({ subtopic }) => {
            const matchesQuery = !normalizedQuery
              || moduleTitleMatch
              || subtopic.subtopic_title?.toLowerCase().includes(normalizedQuery);
            const matchesFilter = filter === 'all'
              || (filter === 'projects' && subtopic.subtopic_type === 'mini-project')
              || subtopic.status === filter;
            return matchesQuery && matchesFilter;
          });

        return { module, moduleIndex, subtopics };
      })
      .filter((module) => module.subtopics.length > 0);
  }, [course, filter, query]);

  const visibleCount = useMemo(
    () => filteredModules.reduce((sum, module) => sum + module.subtopics.length, 0),
    [filteredModules]
  );

  const handleSaveConfig = async () => {
    if (!configDraft) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/study-plans/${courseId}/config`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studyConfig: normalizeStudyConfig(configDraft, usageData?.plan || 'free') }),
      });
      const data = await res.json();
      if (data.success) {
        setCourse(data.course);
        setConfigDraft(data.course.studyConfig);
        setShowStudyControls(false);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };


  if (isLoaded && !isSignedIn) {
    return (
      <DashboardShell title="Sign in required" showCreate={false} disableDefaultPadding>
        <div className="flex min-h-screen items-center justify-center px-6 bg-[#050505]">
          <div className="max-w-xl rounded-[2.4rem] border border-white/10 bg-[#111111] px-8 py-10 text-center shadow-[0_20px_60px_rgba(0,0,0,0.4)] w-full">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-indigo-500/10 text-indigo-400">
              <Lock className="h-7 w-7" />
            </div>
            <h1 className="mt-6 font-serif text-4xl font-semibold text-white">Sign in to continue</h1>
            <p className="mt-4 text-sm leading-7 text-slate-400">You must be logged in to view this study plan. If you are the creator, please sign in.</p>
            <div className="mt-6">
              <SignInButton mode="modal">
                <button type="button" className="w-full rounded-full bg-white px-6 py-3 text-sm font-black text-black transition hover:bg-zinc-200">Sign in</button>
              </SignInButton>
            </div>
          </div>
        </div>
      </DashboardShell>
    );
  }

  /* ── Skeleton while fetching ─────────────────────────────────────────── */
  if (loading || !isLoaded || !course) {
    return (
      <DashboardShell title="Loading plan..." eyebrow="Guided Plan">
        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-2xl border border-red-400/20 bg-red-500/10 px-5 py-3 text-sm font-semibold text-red-200 backdrop-blur-md shadow-xl"
            >
              {toast.message}
            </motion.div>
          )}
        </AnimatePresence>
        <div className="mx-auto max-w-[104rem] flex flex-col gap-6 animate-pulse">
          {/* Hero skeleton */}
          <div className="order-1 rounded-[2.4rem] border border-white/[0.06] bg-[#0b0c0e] p-8 md:p-12">
            <div className="grid gap-8 lg:grid-cols-[1fr_24rem]">
              <div className="space-y-5">
                <div className="flex gap-3">
                  <div className="h-8 w-44 rounded-full bg-white/[0.06]" />
                  <div className="h-8 w-32 rounded-full bg-white/[0.04]" />
                </div>
                <div className="h-14 w-3/4 rounded-2xl bg-white/[0.07]" />
                <div className="h-8 w-full rounded-2xl bg-white/[0.04]" />
                <div className="h-20 w-full rounded-2xl bg-white/[0.04]" />
                <div className="flex gap-3 pt-2">
                  <div className="h-12 w-32 rounded-full bg-white/[0.07]" />
                  <div className="h-12 w-24 rounded-full bg-white/[0.04]" />
                  <div className="h-12 w-28 rounded-full bg-white/[0.04]" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="h-36 rounded-[1.65rem] bg-white/[0.05]" />
              </div>
            </div>
          </div>

          {/* Metric Tiles Skeleton */}
          <div className="order-4 md:order-2 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {[0, 1, 2, 3].map(i => <div key={i} className="h-32 rounded-[1.45rem] bg-white/[0.04]" />)}
          </div>

          {/* Settings Skeleton */}
          <div className="order-2 md:order-3 h-0" />

          {/* Path skeleton */}
          <div className="order-3 md:order-4 grid gap-6 xl:grid-cols-[1fr_340px]">
            <div className="space-y-4">
              {[0, 1, 2].map(i => (
                <div key={i} className="rounded-[2rem] border border-white/[0.06] bg-[#0d0e10] p-6 space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-white/[0.06]" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-20 rounded bg-white/[0.04]" />
                      <div className="h-6 w-2/3 rounded-xl bg-white/[0.06]" />
                    </div>
                  </div>
                  {[0, 1, 2].map(j => <div key={j} className="h-14 rounded-2xl bg-white/[0.04]" />)}
                </div>
              ))}
            </div>
            <div className="space-y-4">
              <div className="h-64 rounded-[2rem] bg-white/[0.04]" />
              <div className="h-48 rounded-[2rem] bg-white/[0.04]" />
            </div>
          </div>
        </div>
      </DashboardShell>
    );
  }



  return (
    <DashboardShell title={course.course_title} eyebrow="Guided Plan">
      <div className="mx-auto max-w-[104rem] flex flex-col gap-6">
        <div className="order-1">
          <CommandDeck
            course={course}
            currentRef={currentRef}
            currentModule={currentModule}
            currentSubtopic={currentSubtopic}
            pathStats={pathStats}
            onOpenSettings={() => setShowStudyControls((value) => !value)}
          />
        </div>

        <div className="order-2 md:order-3">
          <SettingsPanel
            open={showStudyControls}
            configDraft={configDraft}
            setConfigDraft={setConfigDraft}
            plan={usageData?.plan || 'free'}
            saving={saving}
            onSave={handleSaveConfig}
            onClose={() => setShowStudyControls(false)}
          />
        </div>

        <div className="order-3 md:order-4 grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <LearningPath
            course={course}
            currentRef={currentRef}
            query={query}
            setQuery={setQuery}
            filter={filter}
            setFilter={setFilter}
            filteredModules={filteredModules}
            visibleCount={visibleCount}
            totalCount={pathStats.total}
          />

          <aside className="min-w-0 self-start xl:sticky xl:top-24 xl:flex xl:h-[calc(100dvh-9rem)] xl:flex-col xl:gap-6 xl:overflow-hidden">
            <SyllabusTuner
              courseId={course._id}
              clerkId={user?.id}
              plan={usageData?.plan || 'free'}
              modules={course.modules || []}
              onCourseUpdate={(updatedCourse) => {
                setCourse(updatedCourse);
                setConfigDraft(updatedCourse.studyConfig);
              }}
            />
            <ModuleHealthPanel modules={course.modules || []} currentRef={currentRef} />
          </aside>
        </div>
      </div>
    </DashboardShell>
  );
}
