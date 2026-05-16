import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight, BookOpen, ChevronRight, Crown, Layers3,
  Lock, Settings2, Sparkles, WandSparkles, Plus, Trash2,
  CheckCircle, XCircle, Loader2, Navigation, MapPin,
} from 'lucide-react';
import StudyConfigPanel from '../components/StudyConfigPanel';
import { normalizeStudyConfig } from '../utils/studyConfig';
import CreditCost from '../components/CreditCost';
import { getCostForAction } from '../config/creditCosts';
import { SignInButton } from '@clerk/clerk-react';
import LoadingScreen from '../components/LoadingScreen';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

function QuickJumpNavigator({ modules, currentRef }) {
  const scrollToModule = (mi) => {
    const el = document.getElementById(`module-section-${mi}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const scrollToCurrent = () => {
    const el = document.getElementById('study-plan-current-topic');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const activeIdx = currentRef?.moduleIndex ?? 0;
  const total = (modules || []).length;
  let start = Math.max(0, activeIdx - 1);
  let end = Math.min(total, start + 4);
  if (end - start < 4) start = Math.max(0, end - 4);
  const visible = (modules || []).slice(start, end);

  return (
    <div className="course-surface rounded-[2rem] px-5 py-5">
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Quick Jump</p>
        <button
          type="button"
          onClick={scrollToCurrent}
          className="group flex items-center gap-1.5 text-[11px] font-bold text-[#4338ca] transition hover:text-[#312e81]"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#4338ca] opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#4338ca]" />
          </span>
          Go to current
        </button>
      </div>

      {/* Timeline */}
      <div className="relative pl-4">
        {/* Vertical line */}
        <div className="absolute left-[7px] top-1 bottom-1 w-[2px] rounded-full bg-gradient-to-b from-slate-200 via-[#4338ca]/20 to-slate-200" />

        <div className="space-y-0.5">
          {visible.map((mod, i) => {
            const mi = start + i;
            const subtopics = mod.subtopics || [];
            const done = subtopics.filter(s => s.status === 'completed').length;
            const isActive = currentRef?.moduleIndex === mi;
            const isComplete = done === subtopics.length && subtopics.length > 0;
            const pct = subtopics.length ? Math.round((done / subtopics.length) * 100) : 0;

            return (
              <button
                key={mi}
                type="button"
                onClick={() => scrollToModule(mi)}
                className={`group relative w-full rounded-xl py-2.5 pr-3 pl-5 text-left transition hover:-translate-y-0.5 ${
                  isActive ? 'bg-[#eef2ff]/80' : 'hover:bg-slate-50/60'
                }`}
              >
                {/* Dot */}
                <div className="absolute left-[-11px] top-1/2 -translate-y-1/2">
                  {isActive ? (
                    <span className="relative flex h-4 w-4">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#4338ca] opacity-30" />
                      <span className="relative flex h-4 w-4 items-center justify-center rounded-full bg-[#4338ca] shadow-[0_0_8px_rgba(67,56,202,0.4)]">
                        <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      </span>
                    </span>
                  ) : isComplete ? (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 shadow-sm">
                      <CheckCircle className="h-2.5 w-2.5 text-white" />
                    </span>
                  ) : (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full border-2 border-slate-300 bg-white transition group-hover:border-[#4338ca]/40" />
                  )}
                </div>

                {/* Content */}
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className={`text-[13px] font-semibold truncate leading-tight ${
                      isActive ? 'text-[#4338ca]' : isComplete ? 'text-emerald-700' : 'text-slate-600 group-hover:text-slate-800'
                    }`}>
                      {mod.module_title}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="h-[3px] flex-1 max-w-[100px] rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            background: isComplete ? '#059669' : isActive ? '#4338ca' : '#cbd5e1'
                          }}
                        />
                      </div>
                      <span className={`text-[10px] font-bold ${isComplete ? 'text-emerald-500' : isActive ? 'text-[#4338ca]' : 'text-slate-400'}`}>
                        {done}/{subtopics.length}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className={`h-3.5 w-3.5 shrink-0 transition ${isActive ? 'text-[#4338ca]' : 'text-slate-300 group-hover:text-slate-500'}`} />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, detail, accent = '#4338ca' }) {
  return (
    <div className="rounded-[1.7rem] border border-black/5 bg-white/80 p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-black text-slate-900">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{detail}</p>
      <div className="mt-4 h-1.5 w-14 rounded-full" style={{ background: `${accent}33` }} />
    </div>
  );
}

function SubtopicRow({ courseId, moduleIndex, subtopicIndex, subtopic, isCurrent }) {
  const navigate = useNavigate();
  const completed = subtopic.status === 'completed';
  const locked = subtopic.status === 'locked';
  const miniProject = subtopic.subtopic_type === 'mini-project';
  const accent = locked ? '#94a3b8' : miniProject ? '#8b6f1b' : completed ? '#059669' : '#4338ca';

  return (
    <button
      type="button"
      id={isCurrent ? 'study-plan-current-topic' : undefined}
      onClick={() => !locked && navigate(`/study-plan/${courseId}/learn/${moduleIndex}/${subtopicIndex}`)}
      disabled={locked}
      className={`group w-full rounded-[1.5rem] border px-4 py-4 text-left transition ${
        locked
          ? 'cursor-not-allowed border-black/5 bg-slate-50/50 opacity-60 grayscale-[0.5]'
          : 'border-black/5 bg-white/90 hover:-translate-y-0.5 hover:shadow-[0_18px_30px_rgba(15,23,42,0.05)]'
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-black"
          style={{
            background: miniProject ? 'rgba(253,245,216,0.92)' : completed ? 'rgba(209,250,229,0.92)' : 'rgba(238,242,255,0.95)',
            color: accent,
          }}
        >
          {locked ? <Lock className="h-4 w-4" /> : miniProject ? <Crown className="h-4 w-4" /> : String(subtopicIndex + 1).padStart(2, '0')}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {miniProject && (
              <span className="rounded-full bg-[#fdf5d8] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#8b6f1b]">
                Golden checkpoint
              </span>
            )}
            <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${
              locked ? 'bg-slate-100 text-slate-500' : completed ? 'bg-emerald-50 text-emerald-700' : 'bg-[#eef2ff] text-[#4338ca]'
            }`}>
              {locked ? 'Locked' : completed ? 'Completed' : 'Active'}
            </span>
          </div>
          <h4 className="mt-3 text-lg font-semibold leading-snug text-slate-900">{subtopic.subtopic_title}</h4>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {miniProject
              ? 'A larger milestone that checks whether the previous ideas actually stuck.'
              : subtopic.generationStatus === 'ready'
              ? 'Lesson generated and ready to continue from.'
              : 'Open this step to generate the lesson, questions, and feedback flow.'}
          </p>
        </div>
        <ChevronRight className="mt-2 h-5 w-5 shrink-0 text-slate-300 transition group-hover:text-slate-500" />
      </div>
    </button>
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

  // Build a flat list of all modules/subtopics for diff display
  const flatList = useMemo(() => {
    if (!diff || !modules) return [];
    const removedKeys = new Set(
      (diff.removes || []).map(r => `${r.moduleIndex}-${r.subtopicIndex}`)
    );
    const rows = [];
    modules.forEach((mod, mi) => {
      rows.push({ type: 'module', title: mod.module_title, moduleIndex: mi });
      (mod.subtopics || []).forEach((sub, si) => {
        const key = `${mi}-${si}`;
        rows.push({
          type: 'subtopic',
          title: sub.subtopic_title,
          moduleIndex: mi,
          subtopicIndex: si,
          status: removedKeys.has(key) ? 'removed' : 'existing',
        });
      });
      // Insert adds for this module
      (diff.adds || []).filter(a => a.moduleIndex === mi).forEach(add => {
        rows.push({
          type: 'subtopic',
          title: add.subtopic_title,
          moduleIndex: mi,
          status: 'added',
        });
      });
    });
    return rows;
  }, [diff, modules]);

  return (
    <div className="course-surface rounded-[2.6rem] p-6 md:p-7">
      <div className="flex items-start gap-4 mb-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-[1.6rem] border border-black/5 bg-white/80 text-[#4338ca]">
          <WandSparkles className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">AI Tuner</p>
          <h2 className="mt-1 font-serif text-[1.8rem] font-semibold text-slate-900">Tune Syllabus</h2>
          <p className="mt-1 text-sm text-slate-500">Add or remove topics using plain language.</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!diff ? (
          <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="rounded-[1.6rem] border border-black/10 bg-white p-1.5 focus-within:border-slate-300 focus-within:ring-4 focus-within:ring-slate-100 transition-all">
              <textarea
                value={instruction}
                onChange={e => setInstruction(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleTune(); } }}
                placeholder={`e.g. "Add Indexing after Module 2" or "Remove the NULL Values topic"`}
                className="w-full resize-none bg-transparent px-4 py-3 text-sm outline-none text-slate-800 placeholder:text-slate-400 min-h-[80px]"
              />
            </div>
            {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
            <button
              type="button"
              disabled={loading || !instruction.trim()}
              onClick={handleTune}
              className="mt-3 w-full flex items-center justify-center gap-2 rounded-2xl bg-[#111827] py-3 px-5 text-sm font-bold text-white transition hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {loading ? 'Thinking...' : 'Generate Changes'}
              <CreditCost cost={creditCost} className="text-white/70 ml-1" />
            </button>
            <p className="mt-2 text-center text-[11px] text-slate-400">Credits charged on generation regardless of confirm/reject.</p>
          </motion.div>
        ) : (
          <motion.div key="diff" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="mb-3 rounded-2xl border border-black/5 bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">AI Summary</p>
              <p className="text-sm text-slate-700">{diff.summary}</p>
            </div>

            <div className="max-h-[340px] overflow-y-auto space-y-1 pr-1 custom-scroll">
              {flatList.map((row, i) => {
                if (row.type === 'module') {
                  return (
                    <div key={i} className="pt-3 pb-1 px-2">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                        Module {row.moduleIndex + 1} · {row.title}
                      </p>
                    </div>
                  );
                }
                if (row.status === 'removed') {
                  return (
                    <div key={i} className="flex items-center gap-3 rounded-xl bg-red-50 border border-red-200 px-3 py-2.5">
                      <Trash2 className="h-3.5 w-3.5 shrink-0 text-red-500" />
                      <span className="text-sm font-medium text-red-700 line-through">{row.title}</span>
                      <span className="ml-auto text-[10px] font-bold text-red-500 uppercase">Remove</span>
                    </div>
                  );
                }
                if (row.status === 'added') {
                  return (
                    <div key={i} className="flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2.5">
                      <Plus className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      <span className="text-sm font-medium text-emerald-700">{row.title}</span>
                      <span className="ml-auto text-[10px] font-bold text-emerald-600 uppercase">Add</span>
                    </div>
                  );
                }
                return (
                  <div key={i} className="flex items-center gap-3 rounded-xl border border-black/5 bg-white/70 px-3 py-2.5">
                    <span className="text-sm text-slate-600">{row.title}</span>
                  </div>
                );
              })}
            </div>

            {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={confirming}
                onClick={() => handleConfirm(false)}
                className="flex items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
              >
                <XCircle className="h-4 w-4" /> Reject
              </button>
              <button
                type="button"
                disabled={confirming}
                onClick={() => handleConfirm(true)}
                className="flex items-center justify-center gap-2 rounded-2xl bg-[#111827] py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 disabled:opacity-40"
              >
                {confirming ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                Apply
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function GuidedStudyPlanMap() {
  const { courseId } = useParams();
  const { user, isLoaded, isSignedIn } = useUser();
  const [course, setCourse] = useState(null);
  const [usageData, setUsageData] = useState(null);
  const [configDraft, setConfigDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showStudyControls, setShowStudyControls] = useState(false);

  const fetchCourse = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${API_BASE}/api/study-plans/${courseId}?clerkId=${user.id}`);
      const data = await res.json();
      if (data.success) {
        setCourse(data.course);
        setConfigDraft(data.course.studyConfig);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [courseId, user?.id]);

  const fetchUsage = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${API_BASE}/api/user/${user.id}/usage`);
      const data = await res.json();
      if (data.success) setUsageData(data);
    } catch (error) {
      console.error(error);
    }
  }, [user?.id]);

  useEffect(() => { fetchCourse(); }, [fetchCourse]);
  useEffect(() => { if (user?.id) fetchUsage(); }, [fetchUsage, user?.id]);

  const currentRef = useMemo(() => {
    if (!course?.modules) return null;
    for (let m = 0; m < course.modules.length; m++) {
      for (let s = 0; s < (course.modules[m].subtopics || []).length; s++) {
        if (course.modules[m].subtopics[s].status === 'active') return { moduleIndex: m, subtopicIndex: s };
      }
    }
    return { moduleIndex: course.current_module_index || 0, subtopicIndex: course.current_subtopic_index || 0 };
  }, [course]);

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
      if (data.success) { setCourse(data.course); setConfigDraft(data.course.studyConfig); setShowStudyControls(false); }
    } catch (error) { console.error(error); }
    finally { setSaving(false); }
  };

  if (!isLoaded) {
    return <LoadingScreen message="Checking your credentials..." />;
  }

  if (!isSignedIn) {
    return (
      <div className="course-shell flex min-h-screen items-center justify-center px-6">
        <div className="course-surface max-w-xl rounded-[2.4rem] px-8 py-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-slate-100 text-slate-500">
            <Lock className="h-7 w-7" />
          </div>
          <h1 className="mt-6 font-serif text-4xl font-semibold text-slate-900">Sign in to continue</h1>
          <p className="mt-4 text-sm leading-7 text-slate-500">You must be logged in to view this study plan. If you are the creator, please sign in.</p>
          <div className="mt-6">
            <SignInButton mode="modal">
              <button type="button" className="course-primary-button justify-center w-full">Sign In</button>
            </SignInButton>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingScreen message="Opening your guided plan..." />;
  }

  if (!course || course.sourceType !== 'guided-topic') {
    return (
      <div className="course-shell flex min-h-screen items-center justify-center px-6">
        <div className="course-surface max-w-xl rounded-[2.4rem] px-8 py-10 text-center">
          <h1 className="font-serif text-4xl font-semibold text-slate-900">Access Denied</h1>
          <p className="mt-4 text-sm leading-7 text-slate-500">This study plan either does not exist, or you don't have permission to view it.</p>
          <Link to="/dashboard" className="course-primary-button mt-6 justify-center">Back to dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="course-shell min-h-screen px-4 pb-20 pt-28 md:px-10 lg:px-14">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* ── Header ── */}
        <section id="study-plan-progress-overview" className="course-surface overflow-hidden rounded-[2.8rem] p-6 md:p-8 lg:p-10">
          <div className="grid gap-8 xl:grid-cols-[1.03fr_0.97fr]">
            <div className="rounded-[2.2rem] bg-[radial-gradient(circle_at_top_left,rgba(79,70,229,0.16),transparent_42%),linear-gradient(135deg,#f8fafc,white)] p-6 md:p-7">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-[#eef2ff] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#4338ca]">
                  Guided Study Plan
                </span>
                {course.studyConfig?.miniProjectsEnabled && (
                  <span className="rounded-full bg-[#fdf5d8] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#8b6f1b]">
                    Golden checkpoints enabled
                  </span>
                )}
              </div>
              <h1 className="mt-6 max-w-3xl break-words font-serif text-[2.5rem] font-semibold leading-[0.96] text-slate-900 md:text-[4.2rem]">
                {course.course_title}
              </h1>
              {course.learningGoal && course.learningGoal !== course.course_query && (
                <p className="mt-5 max-w-3xl text-[15px] leading-8 text-slate-500 line-clamp-2" title={course.learningGoal}>
                  {course.learningGoal}
                </p>
              )}
              <div className="mt-7 flex flex-wrap gap-3">
                {currentRef && (
                  <Link to={`/study-plan/${course._id}/learn/${currentRef.moduleIndex}/${currentRef.subtopicIndex}`} className="course-primary-button w-full justify-center sm:w-auto">
                    Continue learning <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => setShowStudyControls(v => !v)}
                  className="course-outline-button w-full justify-center sm:w-auto"
                >
                  {showStudyControls ? 'Hide defaults' : 'Tune defaults'} <Settings2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <SummaryCard label="Progress" value={`${course.progress || 0}%`} detail="Overall completion across lessons and mini-project gates." />
              <SummaryCard label="Modules" value={course.totalModules || 0} detail="Major sections in your custom guided map." accent="#111827" />
              <SummaryCard label="Lessons" value={course.totalSubtopics || 0} detail="Total units across explanations and milestone work." accent="#ea580c" />
              <SummaryCard label="Done" value={course.completedSubtopics || 0} detail="Units already completed." accent="#059669" />
            </div>
          </div>
        </section>

        {/* ── Study Controls — expandable full-width panel ── */}
        <AnimatePresence>
          {showStudyControls && (
            <motion.section
              key="study-controls"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div id="study-plan-settings" className="course-surface rounded-[2.6rem] p-6 md:p-8">
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-[1.6rem] border border-black/5 bg-white/80 text-[#4338ca]">
                    <Settings2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">Defaults</p>
                    <h2 className="mt-1 font-serif text-[2rem] font-semibold text-slate-900">Study controls</h2>
                    <p className="mt-1 text-sm text-slate-500">Update defaults for any lesson that has not been generated yet.</p>
                  </div>
                </div>
                <StudyConfigPanel value={configDraft} onChange={setConfigDraft} plan={usageData?.plan || 'free'} />
                <div className="mt-6 flex flex-wrap gap-3">
                  <button type="button" onClick={handleSaveConfig} disabled={saving} className="course-primary-button">
                    {saving ? 'Saving...' : 'Save defaults'}
                  </button>
                  <button type="button" onClick={() => setShowStudyControls(false)} className="course-outline-button">
                    Cancel
                  </button>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* ── Main two-column layout ── */}
        <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr] xl:items-start">

          {/* Left: scrollable learning path */}
          <section className="course-surface rounded-[2.6rem] p-6 md:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-[1.6rem] border border-black/5 bg-white/80 text-[#4338ca]">
                <Layers3 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">Map</p>
                <h2 className="mt-1 font-serif text-[2.2rem] font-semibold text-slate-900">The learning path</h2>
                <p className="mt-2 text-sm leading-7 text-slate-500">Open active steps to generate the lesson workspace.</p>
              </div>
            </div>

            <div className="mt-8 space-y-6">
              {(course.modules || []).map((module, moduleIndex) => (
                <div key={module.module_id || moduleIndex} id={`module-section-${moduleIndex}`} className="rounded-[2rem] border border-black/5 bg-white/75 p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Module {moduleIndex + 1}</p>
                      <h3 className="mt-2 text-2xl font-semibold leading-tight text-slate-900">{module.module_title}</h3>
                    </div>
                  </div>
                  <div className="mt-5 space-y-3">
                    {(module.subtopics || []).map((subtopic, subtopicIndex) => (
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
          </section>

          {/* Right: sticky panels */}
          <aside className="xl:sticky xl:top-6 space-y-6">
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
            <QuickJumpNavigator
              modules={course.modules || []}
              currentRef={currentRef}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}
