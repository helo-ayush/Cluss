import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Check,
  CheckCircle,
  ChevronRight,
  CirclePlay,
  Crown,
  FileSearch,
  Gauge,
  Globe2,
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
    <div className="relative overflow-hidden rounded-[1.65rem] border border-white/[0.06] bg-[#1b1b1b] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] sm:col-span-2 lg:col-span-2 xl:col-span-2">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#efff55]/10 to-transparent" />
      <div className="flex items-start justify-between gap-5">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#efff55]/80">Study pulse</p>
          <h2 className="mt-3 text-4xl font-black leading-none text-white">{safeProgress}%</h2>
          <p className="mt-3 line-clamp-2 text-sm font-semibold leading-6 text-zinc-500">
            {currentSubtopic?.subtopic_title || currentModule?.module_title || 'Plan is ready when you are.'}
          </p>
        </div>
      </div>
      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-600">
          <span>Overall</span>
          <span>{safeProgress}/100</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/[0.08]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#efff55] to-white transition-all duration-700"
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
      className="group relative overflow-hidden rounded-[1.35rem] border border-white/[0.06] bg-[#1b1b1b]/40 p-4 transition-all duration-300 hover:border-[#efff55]/30 shadow-[0_18px_54px_rgba(0,0,0,0.22)]"
    >
      <div className="relative">
        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500">{label}</p>
        <p className="mt-2 text-3xl font-black text-white">{value}</p>
      </div>
      <p className="relative mt-2 text-xs font-semibold leading-5 text-zinc-500">{detail}</p>
    </motion.div>
  );
}

function CommandDeck({ course, currentRef, currentModule, currentSubtopic, pathStats, onOpenSettings, onPublish, publishing, canPublish }) {
  const continueUrl = currentRef
    ? `/dashboard/guided/study-plan/${course._id}/learn/${currentRef.moduleIndex}/${currentRef.subtopicIndex}`
    : `/dashboard/guided/study-plan/${course._id}`;
  const moduleProgress = moduleCompletion(currentModule);

  return (
    <section className="relative overflow-hidden rounded-[2.4rem] border border-white/[0.06] bg-[#1b1b1b] shadow-[0_24px_90px_rgba(0,0,0,0.38)]">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.02),transparent_38%),linear-gradient(180deg,rgba(239,255,85,0.02),transparent_45%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="relative grid gap-8 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_24rem] lg:p-8 xl:grid-cols-[minmax(0,1fr)_31rem]">

        {/* ── Left: Title + Up Next + Buttons ── */}
        <div className="flex min-w-0 flex-col gap-7">
          {/* Badges + Title */}
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <Link to="/dashboard/guided" className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.04] px-4 py-2 text-xs font-medium text-zinc-300 transition hover:bg-white/[0.08] hover:text-white">
                <ArrowLeft className="h-4 w-4" />
                Library
              </Link>
              <span className="inline-flex items-center rounded-full border border-[#efff55]/20 bg-[#efff55]/5 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.18em] text-[#efff55]">
                Guided command center
              </span>
              {course.studyConfig?.miniProjectsEnabled && (
                <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.02] px-4 py-2 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-400">
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
          <div className="w-full max-w-[32rem] overflow-hidden rounded-[1.5rem] border border-white/[0.06] bg-white/[0.025] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.01)]">
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500">Up next</p>
            <div className="mt-3 min-w-0">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-zinc-400">
                  {currentModule ? `Module ${currentRef.moduleIndex + 1}: ${currentModule.module_title}` : 'No active module'}
                </p>
                <h2 className="mt-1 break-words text-xl font-bold leading-snug text-white line-clamp-2">
                  {currentSubtopic?.subtopic_title || 'Your plan is ready'}
                </h2>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#efff55] to-white transition-all duration-700"
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
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#efff55] px-5 py-3 text-sm font-bold text-black hover:bg-[#efff55]/90 transition hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(239,255,85,0.15)] duration-300"
            >
              Continue <ArrowRight className="h-4 w-4" />
            </Link>
            <button
              type="button"
              onClick={onOpenSettings}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.04] px-5 py-3 text-sm font-medium text-zinc-200 transition hover:-translate-y-0.5 hover:bg-white/[0.08]"
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
            <MetricTile label="Modules" value={(course.modules || []).length} detail="Major sections" />
            <MetricTile label="Lessons" value={pathStats.total} detail="Learning units" delay={0.04} />
            <MetricTile label="Done" value={(course.modules || []).flatMap((module) => module.subtopics || []).filter((item) => item.status === 'completed').length} detail="Completed units" delay={0.08} />
            <MetricTile label="Gates" value={(course.modules || []).flatMap((module) => module.subtopics || []).filter((item) => item.subtopic_type === 'mini-project').length} detail="Mini projects" delay={0.12} />
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
          className="rounded-[2rem] border border-white/[0.06] bg-[#1b1b1b] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.3)] sm:p-6 lg:p-7"
        >
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.03] text-white">
                <Settings2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Lesson defaults</p>
                <h2 className="mt-1 text-2xl font-bold text-white">Study controls</h2>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onSave}
                disabled={saving}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-black transition hover:bg-zinc-200 disabled:opacity-40"
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
    <section className="flex min-h-0 flex-1 flex-col rounded-[2rem] border border-white/[0.06] bg-[#1b1b1b] p-4 shadow-[0_20px_70px_rgba(0,0,0,0.28)]">
      <div className="mb-4 flex shrink-0 items-center justify-between gap-3 px-1">
        <div>
          <h2 className="text-xl font-bold text-white">Plan health</h2>
        </div>
        <span className="rounded-full border border-white/[0.06] bg-white/[0.02] px-2.5 py-1 text-[10px] font-semibold text-zinc-400">{(modules || []).length}</span>
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
                  ? 'border-[#efff55]/20 bg-[#efff55]/5 shadow-[0_0_15px_rgba(239,255,85,0.03)]'
                  : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]'
              }`}
            >
              <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold border border-white/[0.04] ${active ? 'bg-[#efff55] text-black shadow-sm' : 'bg-black/35 text-zinc-300'}`}>
                  {index + 1}
                </div>
                <div className="min-w-0">
                  <p className={`truncate text-xs font-semibold ${active ? 'text-white' : 'text-zinc-300 group-hover:text-white'}`}>{module.module_title}</p>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.08]">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${active ? 'bg-[#efff55]' : progress === 100 ? 'bg-[#efff55]' : 'bg-white/40'}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-zinc-500">{progress}%</span>
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
    <div className="flex flex-col gap-4 border-b border-white/[0.06] px-5 py-5 sm:flex-row sm:items-center sm:justify-between bg-black/10 flex-wrap">
      <div>
        <h2 className="text-2xl font-bold text-white">Syllabus board</h2>
      </div>

      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
        <div className="flex min-h-12 items-center gap-3 rounded-full border border-white/[0.06] bg-black/30 px-4 focus-within:border-[#efff55]/30 w-full sm:w-60">
          <Search className="h-4 w-4 text-zinc-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search lessons"
            className="w-full min-w-0 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-zinc-600"
          />
        </div>

        <div className="flex gap-1 overflow-x-auto rounded-full border border-white/[0.06] bg-black/25 p-1 custom-scroll-x max-w-full">
          {filters.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${
                filter === item.key ? 'bg-[#efff55] text-black shadow-md' : 'text-zinc-400 hover:bg-white/[0.04] hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <span className="text-xs font-bold text-zinc-600 ml-auto sm:ml-0">{visibleCount}/{totalCount}</span>
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
  const Icon = locked ? Lock : completed ? Check : miniProject ? Crown : CirclePlay;

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
          ? 'cursor-not-allowed border-white/[0.04] bg-white/[0.01]'
          : isCurrent
            ? 'border-[#efff55]/20 bg-[#efff55]/5 shadow-[0_0_28px_rgba(239,255,85,0.03)]'
            : completed
              ? 'border-zinc-800 bg-[#161616]/40 hover:border-zinc-700'
              : miniProject
                ? 'border-[#efff55]/15 bg-[#efff55]/[0.01] hover:border-[#efff55]/25 hover:bg-[#efff55]/[0.03]'
                : 'border-white/[0.06] bg-white/[0.025] hover:border-white/15 hover:bg-white/[0.04]'
      }`}
    >
      <div className="grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${
          locked
            ? 'border-white/5 bg-white/[0.02] text-zinc-600'
            : isCurrent
              ? 'border-[#efff55]/20 bg-[#efff55] text-black shadow-sm'
              : completed
                ? 'border-zinc-800 bg-zinc-900/50 text-[#efff55]'
                : miniProject
                  ? 'border-[#efff55]/20 bg-[#efff55]/5 text-[#efff55]'
                  : 'border-white/10 bg-black/35 text-white'
        }`}>
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] ${
              locked
                ? 'border-white/5 text-zinc-600'
                : isCurrent
                  ? 'border-[#efff55]/20 bg-[#efff55]/10 text-[#efff55]'
                  : completed
                    ? 'border-zinc-800 bg-zinc-900/40 text-zinc-500'
                    : miniProject
                      ? 'border-[#efff55]/20 bg-[#efff55]/5 text-[#efff55]'
                      : 'border-white/10 bg-white/[0.03] text-zinc-400'
            }`}>
              {statusCopy[subtopic.status] || 'Ready'}
            </span>
            {miniProject && (
              <span className={`rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] ${
                completed
                  ? 'border-zinc-800 bg-zinc-900/40 text-zinc-500'
                  : 'border-[#efff55]/30 bg-[#efff55]/10 text-[#efff55]'
              }`}>
                Project Gate
              </span>
            )}
            {!locked && (
              <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-500">
                {ready ? 'Ready' : 'Generate'}
              </span>
            )}
          </div>

          <h3 className={`mt-3 text-lg font-bold leading-snug ${locked ? 'text-zinc-500' : 'text-white'}`}>
            {String(subtopicIndex + 1).padStart(2, '0')} - {subtopic.subtopic_title}
          </h3>
        </div>

        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <span className={`text-xs font-semibold uppercase tracking-[0.18em] ${locked ? 'text-zinc-700' : 'text-zinc-500 group-hover:text-white'}`}>
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
    <section className="overflow-hidden rounded-[2rem] border border-white/[0.06] bg-[#1b1b1b] shadow-[0_24px_80px_rgba(0,0,0,0.34)]">
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
            <h3 className="mt-4 text-xl font-bold text-white">No lessons found</h3>
            <p className="mt-2 text-sm text-zinc-500">Adjust the search or filter.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {filteredModules.map(({ module, moduleIndex, subtopics }) => (
              <div key={module.module_id || moduleIndex} id={`module-section-${moduleIndex}`} className="relative pb-10 last:pb-2">
                <div className="mb-6 flex flex-col gap-4 rounded-[1.5rem] border border-white/[0.06] bg-white/[0.02] p-5 sm:flex-row sm:items-center sm:justify-between shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-lg font-black text-black shadow-md border border-white/[0.06]">
                      {moduleIndex + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Module {moduleIndex + 1}</p>
                      <h3 className="mt-1 truncate text-2xl font-bold text-white">{module.module_title}</h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-32 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-gradient-to-r from-[#efff55] to-white" style={{ width: `${moduleCompletion(module)}%` }} />
                    </div>
                    <span className="text-sm font-semibold text-zinc-500">{moduleCompletion(module)}%</span>
                  </div>
                </div>

                <div className="ml-3 pl-4 border-l border-white/[0.08] sm:ml-7 sm:pl-6 space-y-3">
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

function SyllabusTuner({ courseId, clerkId, plan, modules, onCourseUpdate, onTuningStateChange }) {
  const [instruction, setInstruction] = useState('');
  const [loading, setLoading] = useState(false);
  const [diff, setDiff] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (onTuningStateChange) {
      onTuningStateChange(!!diff);
    }
  }, [diff, onTuningStateChange]);

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

    // Legacy fallback support for adds/removes format
    if (!diff.modules) {
      const removedKeys = new Set((diff.removes || []).map((item) => `${item.moduleIndex}-${item.subtopicIndex}`));
      const rows = [];
      modules.forEach((module, moduleIndex) => {
        rows.push({ type: 'module', title: module.module_title, moduleIndex });
        (module.subtopics || []).forEach((subtopic, subtopicIndex) => {
          const key = `${moduleIndex}-${subtopicIndex}`;
          rows.push({
            type: 'subtopic',
            title: subtopic.subtopic_title,
            subtopicType: subtopic.subtopic_type || 'lesson',
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
              subtopicType: add.subtopic_type || 'lesson',
              moduleIndex,
              status: 'added',
            });
          });
      });
      return rows;
    }

    // New reconstructed syllabus format mapping
    const rows = [];
    const usedSubtopicKeys = new Set();
    const usedModuleIndices = new Set();

    diff.modules.forEach((newMod, newModIdx) => {
      // Trace original module index to detect renames/existing modules
      const originalModIdx = modules.findIndex((m) => m.module_title === newMod.module_title);
      let modStatus = 'added';
      let originalIndex = -1;

      if (originalModIdx !== -1 && !usedModuleIndices.has(originalModIdx)) {
        modStatus = 'existing';
        originalIndex = originalModIdx;
        usedModuleIndices.add(originalModIdx);
      } else {
        // Renaming check
        const unmatchedIdx = modules.findIndex((_, idx) => !usedModuleIndices.has(idx));
        if (unmatchedIdx !== -1) {
          modStatus = 'renamed';
          originalIndex = unmatchedIdx;
          usedModuleIndices.add(unmatchedIdx);
        }
      }

      rows.push({
        type: 'module',
        title: newMod.module_title,
        moduleIndex: newModIdx,
        status: modStatus,
        originalTitle: modStatus === 'renamed' && originalIndex !== -1 ? modules[originalIndex].module_title : null,
      });

      (newMod.subtopics || []).forEach((sub) => {
        if (sub.type === 'existing') {
          const origMod = modules[sub.moduleIndex];
          const origSub = origMod?.subtopics?.[sub.subtopicIndex];
          const key = `${sub.moduleIndex}-${sub.subtopicIndex}`;
          usedSubtopicKeys.add(key);

          if (origSub) {
            const isMoved = sub.moduleIndex !== newModIdx;
            rows.push({
              type: 'subtopic',
              title: origSub.subtopic_title,
              subtopicType: origSub.subtopic_type || 'lesson',
              moduleIndex: newModIdx,
              status: isMoved ? 'moved' : 'existing',
              movedFrom: isMoved ? `Module ${sub.moduleIndex + 1}` : null,
            });
          }
        } else if (sub.type === 'new') {
          rows.push({
            type: 'subtopic',
            title: sub.subtopic_title,
            subtopicType: sub.subtopic_type || 'lesson',
            moduleIndex: newModIdx,
            status: 'added',
          });
        }
      });
    });

    // Detect all removed items
    const removedRows = [];
    modules.forEach((module, moduleIdx) => {
      (module.subtopics || []).forEach((sub, subIdx) => {
        const key = `${moduleIdx}-${subIdx}`;
        if (!usedSubtopicKeys.has(key)) {
          removedRows.push({
            type: 'subtopic',
            title: sub.subtopic_title,
            subtopicType: sub.subtopic_type || 'lesson',
            moduleIndex: moduleIdx,
            status: 'removed',
            moduleTitle: module.module_title,
          });
        }
      });
    });

    if (removedRows.length > 0) {
      rows.push({ type: 'removed_section_header', title: 'Removed Items' });
      rows.push(...removedRows);
    }

    return rows;
  }, [diff, modules]);

  return (
    <section id="study-plan-tuner" className="flex min-h-0 flex-col rounded-[2rem] border border-white/[0.06] bg-[#1b1b1b] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.28)]">
      <div className="mb-5 flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">AI tuner</p>
          <h2 className="mt-1 text-xl font-bold text-white">Tune syllabus</h2>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!diff ? (
          <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="rounded-[1.25rem] border border-white/[0.06] bg-black/35 p-1.5 transition focus-within:border-[#efff55]/30">
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
              className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#efff55] px-5 py-3 text-sm font-bold text-black hover:bg-[#efff55]/90 transition hover:shadow-[0_0_15px_rgba(239,255,85,0.15)] disabled:opacity-40 duration-300"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {loading ? 'Thinking' : 'Generate changes'}
              <CreditCost cost={creditCost} className="ml-1 text-black/50" />
            </button>
          </motion.div>
        ) : (
          <motion.div key="diff" className="flex min-h-0 flex-col" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="mb-3 rounded-[1.25rem] border border-white/[0.06] bg-white/[0.025] px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Summary</p>
              <p className="mt-1 text-sm font-semibold leading-6 text-zinc-300">{diff.summary}</p>
            </div>

            <div className="flex-1 min-h-0 space-y-1 overflow-y-auto pr-1 custom-scroll">
              {flatList.map((row, index) => {
                if (row.type === 'removed_section_header') {
                  return (
                    <div key={index} className="border-t border-white/[0.06] pt-4 pb-2 px-2 mt-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-red-400">
                        {row.title}
                      </p>
                    </div>
                  );
                }

                if (row.type === 'module') {
                  return (
                    <div key={index} className="px-2 pb-1 pt-3 flex flex-wrap items-center gap-2">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500">
                        Module {row.moduleIndex + 1}: {row.title}
                      </p>
                      {row.status === 'added' && (
                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wide text-emerald-300 border border-emerald-500/20">
                          New Module
                        </span>
                      )}
                      {row.status === 'renamed' && (
                        <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wide text-amber-300 border border-amber-500/20">
                          Renamed
                        </span>
                      )}
                    </div>
                  );
                }

                if (row.status === 'removed') {
                  return (
                    <div key={index} className="flex items-center justify-between gap-3 rounded-xl border border-red-300/20 bg-red-400/10 px-3 py-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <Trash2 className="h-3.5 w-3.5 shrink-0 text-red-300" />
                        <span className="text-sm font-semibold text-red-200 line-through truncate">{row.title}</span>
                      </div>
                      <span className="shrink-0 text-[9px] font-bold text-red-300/60 uppercase tracking-wider">
                        From: {row.moduleTitle || 'Syllabus'}
                      </span>
                    </div>
                  );
                }

                if (row.status === 'added') {
                  return (
                    <div key={index} className="flex items-center justify-between gap-3 rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-3 py-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <Plus className="h-3.5 w-3.5 shrink-0 text-emerald-200" />
                        <span className="text-sm font-semibold text-emerald-100 truncate">{row.title}</span>
                      </div>
                      <span className="shrink-0 rounded bg-emerald-500/20 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-emerald-300">
                        {row.subtopicType === 'mini-project' ? 'Project' : 'Lesson'}
                      </span>
                    </div>
                  );
                }

                if (row.status === 'moved') {
                  return (
                    <div key={index} className="flex items-center justify-between gap-3 rounded-xl border border-blue-400/20 bg-blue-400/10 px-3 py-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-blue-300" />
                        <span className="text-sm font-semibold text-blue-100 truncate">{row.title}</span>
                      </div>
                      <span className="shrink-0 text-[9px] font-bold text-blue-300/80 uppercase tracking-wider">
                        Moved from {row.movedFrom}
                      </span>
                    </div>
                  );
                }

                return (
                  <div key={index} className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.025] px-3 py-2.5">
                    <span className="text-sm font-semibold text-zinc-400 truncate">{row.title}</span>
                    <span className="shrink-0 text-[8px] font-semibold uppercase text-zinc-600 tracking-wider">
                      {row.subtopicType === 'mini-project' ? 'Project' : 'Lesson'}
                    </span>
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
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.05] text-sm font-semibold text-zinc-300 transition hover:bg-white/[0.09] disabled:opacity-40"
              >
                <XCircle className="h-4 w-4" />
                Reject
              </button>
              <button
                type="button"
                disabled={confirming}
                onClick={() => handleConfirm(true)}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white text-sm font-bold text-black transition hover:bg-zinc-200 disabled:opacity-40"
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
  const { usageData, fetchUsage } = useUsage();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [configDraft, setConfigDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showStudyControls, setShowStudyControls] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [toast, setToast] = useState(null); // { message, type }
  const [isTuning, setIsTuning] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const redirectToLibrary = useCallback((message) => {
    navigate('/dashboard/guided', {
      replace: true,
      state: { toast: { message } },
    });
  }, [navigate]);

  const fetchCourse = useCallback(async () => {
    if (!user?.id) {
      if (isLoaded && !isSignedIn) {
        redirectToLibrary('Please sign in to access guided study plans.');
      }
      setLoading(false);
      return;
    }
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
  }, [courseId, user?.id, isLoaded, isSignedIn, redirectToLibrary]);

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

  const handlePublish = async () => {
    if (!user?.id || !course?._id) return;
    setPublishing(true);
    setToast(null);
    try {
      const res = await fetch(`${API_BASE}/api/public-courses/publish/${course._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerkId: user.id,
          creatorName: user.fullName || user.username || user.primaryEmailAddress?.emailAddress || 'Creator',
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Could not publish this course.');
      setToast({
        type: 'success',
        message: data.alreadyPublished ? 'This course is already published.' : 'Course published to the public library.',
        href: `/courses/${data.course.slug}`,
      });
    } catch (error) {
      setToast({ type: 'error', message: error.message });
    } finally {
      setPublishing(false);
    }
  };

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
          <div className="order-1 rounded-[2.4rem] border border-white/[0.06] bg-[#1b1b1b] p-8 md:p-12">
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
                <div key={i} className="rounded-[2rem] border border-white/[0.06] bg-[#1b1b1b] p-6 space-y-3">
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
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className={`fixed left-1/2 top-6 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl border px-5 py-3 text-sm font-semibold backdrop-blur-md shadow-xl ${
              toast.type === 'success'
                ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200'
                : 'border-red-400/20 bg-red-500/10 text-red-200'
            }`}
          >
            <span>{toast.message}</span>
            {toast.href && <Link to={toast.href} className="rounded-full bg-white px-3 py-1 text-xs font-bold text-black">View</Link>}
          </motion.div>
        )}
      </AnimatePresence>
      <div className="mx-auto max-w-[104rem] flex flex-col gap-6">
        <div className="order-1">
          <CommandDeck
            course={course}
            currentRef={currentRef}
            currentModule={currentModule}
            currentSubtopic={currentSubtopic}
            pathStats={pathStats}
            onOpenSettings={() => setShowStudyControls((value) => !value)}
            onPublish={handlePublish}
            publishing={publishing}
            canPublish={pathStats.ready > 0}
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
                fetchUsage();
              }}
              onTuningStateChange={setIsTuning}
            />
            {!isTuning && <ModuleHealthPanel modules={course.modules || []} currentRef={currentRef} />}
          </aside>
        </div>
      </div>
    </DashboardShell>
  );
}
