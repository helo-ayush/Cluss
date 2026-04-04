import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'motion/react';
import MarkdownRenderer from '../components/MarkdownRenderer';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// ─── Helpers ───
const formatDuration = (seconds) => {
  if (!seconds || seconds <= 0) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}:${String(s).padStart(2, '0')}`;
};
const formatDayDuration = (seconds) => {
  if (!seconds || seconds <= 0) return '0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

const DAY_COLORS = [
  { accent: '#818cf8', glow: 'rgba(129,140,248,0.15)' },
  { accent: '#6366f1', glow: 'rgba(99,102,241,0.15)' },
  { accent: '#a78bfa', glow: 'rgba(167,139,250,0.15)' },
  { accent: '#4f46e5', glow: 'rgba(79,70,229,0.15)' },
  { accent: '#34d399', glow: 'rgba(52,211,153,0.15)' },
  { accent: '#f472b6', glow: 'rgba(244,114,182,0.15)' },
];

// ─── Status Badge ───
function StatusBadge({ status }) {
  const config = {
    unprocessed: { label: 'Not Started', icon: 'schedule', color: 'var(--theme-text-faint)', bg: 'transparent', border: 'var(--theme-border)' },
    processing: { label: 'Processing...', icon: 'sync', color: '#818cf8', bg: 'rgba(129,140,248,0.08)', border: 'rgba(129,140,248,0.2)' },
    ready: { label: 'Complete', icon: 'check_circle', color: '#34d399', bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.2)' },
    failed: { label: 'Error', icon: 'error', color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)' },
  };
  const c = config[status] || config.unprocessed;
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-label text-[10px] font-bold uppercase tracking-wider"
      style={{ color: c.color, background: c.bg, border: `1px solid ${c.border}` }}>
      <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>{c.icon}</span>
      {c.label}
    </span>
  );
}

// ─── Video Row ───
function VideoRow({ video, index, isLocked, dayColor }) {
  return (
    <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.04, duration: 0.3 }}
      className="flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group"
      style={{ background: isLocked ? 'transparent' : 'rgba(255,255,255,0.02)', opacity: isLocked ? 0.4 : 1 }}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200"
        style={{ background: isLocked ? 'var(--theme-border)' : `${dayColor}12`, border: `1px solid ${isLocked ? 'var(--theme-border)' : dayColor + '25'}` }}>
        {isLocked ? (
          <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--theme-text-faint)' }}>lock</span>
        ) : (
          <span className="font-label text-[11px] font-bold" style={{ color: dayColor }}>{index + 1}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-body text-sm font-medium truncate" style={{ color: isLocked ? 'var(--theme-text-faint)' : 'var(--theme-text-heading)' }}>{video.title}</p>
        {video.channel && <p className="font-label text-[10px] mt-0.5 truncate" style={{ color: 'var(--theme-text-muted)' }}>{video.channel}</p>}
      </div>
      <span className="shrink-0 font-label text-[11px] font-bold px-2.5 py-1 rounded-lg"
        style={{ color: isLocked ? 'var(--theme-text-faint)' : dayColor, background: isLocked ? 'transparent' : `${dayColor}08` }}>
        {formatDuration(video.duration)}
      </span>
    </motion.div>
  );
}

// ─── Day Card ───
function DayCard({ day, index, isCurrent, isLocked, totalDays, onStartCheckpoint, courseId }) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(isCurrent);
  const palette = DAY_COLORS[index % DAY_COLORS.length];
  const dayStatus = day.status;
  const checkpointStatus = day.checkpoint?.status || 'locked';
  const nodeClass = dayStatus === 'ready' ? 'neon-node-completed' : isCurrent ? 'neon-node-active' : isLocked ? 'neon-node-locked' : '';

  return (
    <div className="relative">
      {index < totalDays - 1 && (
        <div className="flex justify-center w-full">
          <div className={`node-connector h-10 ${dayStatus === 'ready' ? 'node-connector-completed' : isCurrent ? 'node-connector-active' : 'node-connector-locked'}`} />
        </div>
      )}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08, duration: 0.5, ease: 'easeOut' }}>
        <div className={`neon-node ${nodeClass} rounded-2xl overflow-hidden transition-all duration-500 cursor-pointer`}
          onClick={() => !isLocked && setExpanded(!expanded)} style={{ opacity: isLocked ? 0.45 : 1 }}>
          <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(circle at 20% 20%, ${palette.glow}, transparent 70%)` }} />
          <div className="relative z-10 p-5 sm:p-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: isLocked ? 'var(--theme-border)' : `linear-gradient(135deg, ${palette.accent}25, ${palette.accent}10)`, border: `1.5px solid ${isLocked ? 'var(--theme-border)' : palette.accent + '40'}`, boxShadow: isCurrent ? `0 0 20px ${palette.accent}30` : 'none' }}>
                  <span className="font-headline text-lg font-black italic" style={{ color: isLocked ? 'var(--theme-text-faint)' : palette.accent }}>{day.dayNumber}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-headline text-base sm:text-lg font-bold" style={{ color: isLocked ? 'var(--theme-text-faint)' : 'var(--theme-text-heading)' }}>
                      Day {day.dayNumber}
                    </h3>
                    {day.isFiller && (
                      <span className="px-2 py-0.5 rounded-full font-label text-[8px] font-bold uppercase" style={{ background: 'rgba(168,85,247,0.1)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.2)' }}>
                        Filler · {day.fillerTopic}
                      </span>
                    )}
                  </div>
                  <p className="font-label text-[10px] sm:text-[11px] uppercase tracking-wider mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
                    {day.videos.length} video{day.videos.length !== 1 ? 's' : ''} • {formatDayDuration(day.totalDuration)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={dayStatus} />
                {!isLocked && (
                  <motion.span className="material-symbols-outlined" animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.3 }}
                    style={{ color: 'var(--theme-text-muted)', fontSize: '20px' }}>expand_more</motion.span>
                )}
              </div>
            </div>
          </div>
          <AnimatePresence>
            {expanded && !isLocked && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.35, ease: 'easeInOut' }} className="overflow-hidden">
                <div className="px-4 sm:px-5 pb-5 space-y-1">
                  <div className="h-px mb-3" style={{ background: 'linear-gradient(90deg, transparent, var(--theme-border-strong), transparent)' }} />

                  {/* Start Day Button */}
                  <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                    onClick={(e) => { e.stopPropagation(); navigate(`/playlist/${courseId}/day/${index}`); }}
                    className="w-full mb-4 py-3.5 rounded-xl font-label text-sm font-bold text-white flex items-center justify-center gap-2.5 transition-all hover:scale-[1.02] hover:-translate-y-0.5 cursor-pointer"
                    style={{ background: `linear-gradient(135deg, ${palette.accent}, ${palette.accent}dd)`, boxShadow: `0 4px 24px ${palette.accent}35` }}>
                    <span className="material-symbols-outlined text-lg">play_circle</span>
                    {dayStatus === 'ready' ? `Review Day ${day.dayNumber}` : `Start Day ${day.dayNumber}`}
                  </motion.button>

                  {day.videos.map((video, vIdx) => (
                    <VideoRow key={video.videoId || vIdx} video={video} index={vIdx} isLocked={false} dayColor={palette.accent} />
                  ))}

                  {/* Checkpoint CTA */}
                  {(isCurrent || checkpointStatus === 'available' || checkpointStatus === 'passed' || checkpointStatus === 'failed_all') && dayStatus !== 'ready' && (
                    <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                      onClick={(e) => { e.stopPropagation(); onStartCheckpoint && onStartCheckpoint(index); }}
                      className="w-full mt-4 py-3.5 rounded-xl font-label text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:scale-[1.02] hover:-translate-y-0.5"
                      style={{ background: `linear-gradient(135deg, ${palette.accent}, ${palette.accent}cc)`, boxShadow: `0 4px 20px ${palette.accent}40` }}>
                      <span className="material-symbols-outlined text-lg">quiz</span>
                      {checkpointStatus === 'passed' ? 'Review Checkpoint' : checkpointStatus === 'failed_all' ? 'Review (All attempts used)' : `Complete Day ${day.dayNumber}`}
                    </motion.button>
                  )}

                  {dayStatus === 'ready' && (
                    <div className="flex items-center gap-2 mt-3 px-4 py-2.5 rounded-xl" style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.15)' }}>
                      <span className="material-symbols-outlined" style={{ color: '#34d399', fontSize: '16px' }}>check_circle</span>
                      <span className="font-label text-xs font-bold" style={{ color: '#34d399' }}>Day completed — checkpoint passed!</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Progress Ring ───
function ProgressRing({ pct, size = 72, stroke = 5, color = '#6366f1' }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(99,102,241,0.1)" strokeWidth={stroke} />
      <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={circ} initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: offset }} transition={{ duration: 1.2, ease: 'easeOut' }} />
    </svg>
  );
}


// ═══════════════════════════════════════════════
//  CHECKPOINT MODAL
// ═══════════════════════════════════════════════
function CheckpointModal({ checkpoint, courseId, dayIndex, clerkId, onClose, onSubmitted }) {
  const [activeTab, setActiveTab] = useState('theory');
  const [theoryAnswers, setTheoryAnswers] = useState(Array(checkpoint?.theoryQuestions?.length || 0).fill(''));
  const [codeFiles, setCodeFiles] = useState([{ fileName: 'filename', content: '' }]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const gutterRefs = useRef([]);
  const lastSub = checkpoint?.submissions?.length > 0 ? checkpoint.submissions[checkpoint.submissions.length - 1] : null;

  const syncScroll = (e, idx) => {
    if (gutterRefs.current[idx]) {
      gutterRefs.current[idx].scrollTop = e.target.scrollTop;
    }
  };

  useEffect(() => {
    if (lastSub && (checkpoint?.status === 'passed' || checkpoint?.status === 'failed_all')) {
      setResult(lastSub.feedback);
      setTheoryAnswers(lastSub.theoryAnswers || []);
      if (lastSub.codeFiles?.length > 0) setCodeFiles(lastSub.codeFiles);
    }
  }, []);

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/course/${courseId}/day/${dayIndex}/checkpoint/submit`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clerkId, theoryAnswers, codeFiles: checkpoint.questionType === 'mixed' ? codeFiles : [] })
      });
      const data = await res.json();
      if (data.feedback) setResult(data.feedback);
      onSubmitted(data);
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  };

  const addFile = () => setCodeFiles([...codeFiles, { fileName: 'filename', content: '' }]);
  const removeFile = (i) => setCodeFiles(codeFiles.filter((_, idx) => idx !== i));
  const updateFile = (i, key, val) => { const f = [...codeFiles]; f[i] = { ...f[i], [key]: val }; setCodeFiles(f); };
  const updateAnswer = (i, val) => { const a = [...theoryAnswers]; a[i] = val; setTheoryAnswers(a); };

  const isReview = checkpoint?.status === 'passed' || checkpoint?.status === 'failed_all';
  const attemptsUsed = checkpoint?.attemptsUsed || 0;
  const maxAttempts = checkpoint?.maxAttempts || 3;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-6"
      style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="relative w-full h-full md:h-auto md:max-h-[90vh] max-w-4xl md:rounded-2xl flex flex-col overflow-hidden"
        style={{ background: 'var(--color-background)', border: '1px solid var(--theme-border-strong)' }}>

        {/* Header */}
        <div className="shrink-0 p-5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--theme-border)' }}>
          <div>
            <h2 className="font-headline text-lg font-bold" style={{ color: 'var(--theme-text-heading)' }}>
              {isReview ? '📊 Checkpoint Review' : `🧠 Day ${dayIndex + 1} Checkpoint`}
            </h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="font-label text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                {attemptsUsed}/{maxAttempts} attempts used
              </span>
              {result && (
                <span className={`font-label text-xs font-bold ${result.passed ? 'text-emerald-400' : 'text-red-400'}`}>
                  Score: {result.overallScore}%
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10"
            style={{ border: '1px solid var(--theme-border)' }}>
            <span className="material-symbols-outlined text-sm" style={{ color: 'var(--theme-text-muted)' }}>close</span>
          </button>
        </div>

        {/* Tabs */}
        {checkpoint?.questionType === 'mixed' && (
          <div className="shrink-0 flex gap-2 px-5 pt-4">
            {[{ key: 'theory', label: '📝 Theory', icon: 'edit_note' }, { key: 'coding', label: '💻 Coding', icon: 'code' }].map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className="px-4 py-2 rounded-lg font-label text-xs font-bold transition-all"
                style={{ background: activeTab === t.key ? 'rgba(99,102,241,0.1)' : 'transparent', color: activeTab === t.key ? '#818cf8' : 'var(--theme-text-muted)', border: `1px solid ${activeTab === t.key ? 'rgba(99,102,241,0.3)' : 'var(--theme-border)'}` }}>
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 custom-scroll">
          {activeTab === 'theory' && (
            <div className="space-y-6 max-w-3xl mx-auto">
              {(checkpoint?.theoryQuestions || []).map((q, i) => {
                const fb = result?.theoryScores?.find(s => s.questionIndex === i);
                return (
                  <div key={i} className="rounded-xl p-5" style={{ background: 'var(--color-surface-container)', border: '1px solid var(--theme-border-strong)' }}>
                    <div className="flex items-start gap-3 mb-3">
                      <span className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center font-label text-xs font-bold"
                        style={{ background: fb ? (fb.score >= 60 ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)') : 'rgba(99,102,241,0.1)', color: fb ? (fb.score >= 60 ? '#22c55e' : '#ef4444') : '#818cf8', border: `1px solid ${fb ? (fb.score >= 60 ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)') : 'rgba(99,102,241,0.2)'}` }}>
                        {fb ? `${fb.score}` : i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <MarkdownRenderer content={q.question} className="font-body text-sm font-semibold" />
                      </div>
                    </div>
                      <textarea value={theoryAnswers[i] || ''} onChange={e => updateAnswer(i, e.target.value)} disabled={isReview}
                      rows={5} placeholder="Write your detailed answer here..."
                      className="w-full bg-transparent rounded-lg p-3 font-body text-sm resize-y outline-none disabled:opacity-60 transition-all focus:border-indigo-500/50"
                      style={{ border: '1px solid var(--theme-border-strong)', color: 'var(--theme-text-heading)' }} />
                    {fb && fb.feedback && (
                      <div className="mt-3 p-4 rounded-lg" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)' }}>
                        <p className="font-label text-[10px] uppercase font-bold mb-1" style={{ color: '#a78bfa' }}>Feedback</p>
                        <MarkdownRenderer content={fb.feedback} className="font-body text-xs" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'coding' && checkpoint?.questionType === 'mixed' && (
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Prompt */}
              <div className="rounded-xl p-5" style={{ background: 'var(--color-surface-container)', border: '1px solid var(--theme-border-strong)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-base" style={{ color: '#818cf8' }}>terminal</span>
                  <p className="font-label text-xs uppercase font-bold tracking-wider" style={{ color: '#818cf8' }}>Coding Challenge</p>
                </div>
                <MarkdownRenderer content={checkpoint.codingQuestion?.prompt} className="font-body text-sm mb-3" />
                {checkpoint.codingQuestion?.expectedBehavior && (
                  <div className="p-3 rounded-lg" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)' }}>
                    <p className="font-label text-[10px] uppercase font-bold mb-1" style={{ color: '#34d399' }}>Expected Behavior</p>
                    <MarkdownRenderer content={checkpoint.codingQuestion.expectedBehavior} className="font-body text-xs" />
                  </div>
                )}
              </div>
              {/* Code Files */}
              {codeFiles.map((f, i) => (
                <div key={i} className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--theme-border-strong)' }}>
                  <div className="flex items-center gap-2 px-4 py-2" style={{ background: 'var(--color-surface-container-high)', borderBottom: '1px solid var(--theme-border-strong)' }}>
                    <span className="material-symbols-outlined text-sm" style={{ color: 'var(--theme-text-faint)' }}>description</span>
                    <input value={f.fileName} onChange={e => updateFile(i, 'fileName', e.target.value)} disabled={isReview}
                      className="flex-1 bg-transparent border-none outline-none font-label text-[10px] uppercase font-bold"
                      style={{ color: 'var(--theme-text-heading)' }} placeholder="filename" />
                    {codeFiles.length > 1 && !isReview && (
                      <button onClick={() => removeFile(i)} className="w-6 h-6 rounded flex items-center justify-center hover:bg-red-500/20">
                        <span className="material-symbols-outlined text-sm text-red-400">close</span>
                      </button>
                    )}
                  </div>
                  <div className="relative flex font-mono text-[13px] overflow-hidden rounded-b-xl"
                    style={{ 
                      background: '#1e1e1e',
                      borderTop: 'none',
                      minHeight: '200px'
                    }}>
                    {/* Line Numbers Gutter */}
                    <div ref={el => gutterRefs.current[i] = el}
                      className="shrink-0 w-10 py-5 bg-[#1e1e1e] text-[#858585] text-[11px] text-right pr-3 select-none border-r border-[#333333] overflow-hidden leading-relaxed">
                      {(f.content.split('\n').map((_, idx) => (
                        <div key={idx} className="h-[21px]">{idx + 1}</div>
                      )))}
                      {/* Add extra empty line for breathing room */}
                      <div className="h-[20px]"></div>
                    </div>
                    {/* Textarea */}
                    <textarea value={f.content} 
                      onChange={e => updateFile(i, 'content', e.target.value)} 
                      onScroll={e => syncScroll(e, i)}
                      disabled={isReview}
                      rows={10} placeholder="Paste your code here..."
                      className="flex-1 p-5 bg-transparent outline-none disabled:opacity-60 leading-relaxed custom-scroll whitespace-pre overflow-auto"
                      style={{ 
                        color: '#d4d4d4',
                        caretColor: '#ffffff',
                        resize: 'none',
                        lineHeight: '21px'
                      }} />
                  </div>
                </div>
              ))}
              {!isReview && (
                <button onClick={addFile} className="w-full py-3 rounded-xl font-label text-xs font-bold flex items-center justify-center gap-2 transition-all hover:bg-white/5 active:scale-95"
                  style={{ border: '1px dashed var(--theme-border-strong)', color: 'var(--theme-text-muted)' }}>
                  <span className="material-symbols-outlined text-sm">add</span> Add File
                </button>
              )}
              {result?.codingScore && (
                <div className="p-4 rounded-xl" style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.15)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-label text-xs uppercase font-bold" style={{ color: '#a78bfa' }}>Coding Score</p>
                    <span className={`font-headline text-lg font-bold ${result.codingScore.score >= 60 ? 'text-emerald-400' : 'text-red-400'}`}>{result.codingScore.score}/100</span>
                  </div>
                  <p className="font-body text-xs" style={{ color: 'var(--theme-text-body)' }}>{result.codingScore.feedback}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 p-5 flex items-center justify-between" style={{ borderTop: '1px solid var(--theme-border)' }}>
          {result && (
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${result.passed ? 'bg-emerald-400' : 'bg-red-400'}`} />
              <span className="font-label text-xs font-bold" style={{ color: result.passed ? '#34d399' : '#ef4444' }}>
                {result.passed ? 'Passed!' : 'Not passed yet'}
              </span>
            </div>
          )}
          {!result && <div />}
          {!isReview && attemptsUsed < maxAttempts ? (
            <button onClick={handleSubmit} disabled={submitting}
              className="px-8 py-3 rounded-xl font-label text-sm font-bold text-white disabled:opacity-50 flex items-center gap-2 transition-all hover:scale-[1.02]"
              style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', boxShadow: '0 0 20px rgba(99,102,241,0.3)' }}>
              {submitting ? (
                <><div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> Grading...</>
              ) : (
                <><span className="material-symbols-outlined text-base">send</span> Submit ({maxAttempts - attemptsUsed} left)</>
              )}
            </button>
          ) : (
            <button onClick={onClose} className="px-6 py-3 rounded-xl font-label text-sm font-bold transition-all hover:bg-white/5"
              style={{ border: '1px solid var(--theme-border)', color: 'var(--theme-text-body)' }}>Close</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════
//  MAIN PAGE
// ══════════════════════════════════════════════════
export default function PlaylistCourseMap() {
  const { courseId } = useParams();
  const { user, isLoaded } = useUser();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  // Checkpoint state
  const [checkpointDay, setCheckpointDay] = useState(null);
  const [checkpointData, setCheckpointData] = useState(null);
  const [loadingCheckpoint, setLoadingCheckpoint] = useState(false);

  const fetchCourse = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/course/${courseId}`);
      const data = await res.json();
      if (data.success) setCourse(data.course);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [courseId]);

  useEffect(() => { fetchCourse(); }, [fetchCourse]);

  const handleStartCheckpoint = async (dayIdx) => {
    setLoadingCheckpoint(true);
    setCheckpointDay(dayIdx);
    try {
      const res = await fetch(`${API_BASE}/api/course/${courseId}/day/${dayIdx}/checkpoint`);
      const data = await res.json();
      if (data.success) setCheckpointData(data.checkpoint);
    } catch (e) { console.error(e); }
    finally { setLoadingCheckpoint(false); }
  };

  if (loading) {
    return (
      <><div className="fixed inset-0 z-0" style={{ background: 'var(--color-background)' }} />
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#8b5cf6', borderTopColor: 'transparent' }} />
            <p className="font-body text-sm" style={{ color: 'var(--theme-text-body)' }}>Loading study plan...</p>
          </div>
        </div></>
    );
  }

  if (!course || !course.days) {
    return (
      <><div className="fixed inset-0 z-0" style={{ background: 'var(--color-background)' }} />
        <div className="relative z-10 min-h-screen flex items-center justify-center flex-col gap-4">
          <span className="material-symbols-outlined text-5xl" style={{ color: 'var(--theme-text-faint)' }}>error_outline</span>
          <p className="font-body text-lg" style={{ color: 'var(--theme-text-body)' }}>Course not found.</p>
          <Link to="/dashboard" className="font-label text-sm font-bold underline" style={{ color: 'var(--color-primary)' }}>← Back to Dashboard</Link>
        </div></>
    );
  }

  const days = course.days || [];
  const totalVideos = days.reduce((sum, d) => sum + d.videos.length, 0);
  const totalDuration = days.reduce((sum, d) => sum + d.totalDuration, 0);
  const completedDays = days.filter(d => d.status === 'ready').length;
  const progressPct = days.length > 0 ? Math.round((completedDays / days.length) * 100) : 0;
  const currentDayIndex = course.currentDayIndex || 0;

  return (
    <>
      <div className="fixed inset-0 z-0 grid-bg" style={{ background: 'var(--color-background)' }} />
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-600/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-violet-600/10 blur-[150px]" />
      </div>

      {/* Modals */}
      {checkpointData && checkpointDay !== null && (
        <CheckpointModal checkpoint={checkpointData} courseId={courseId} dayIndex={checkpointDay} clerkId={user?.id}
          onClose={() => { setCheckpointData(null); setCheckpointDay(null); }}
          onSubmitted={() => fetchCourse()} />
      )}

      <main className="relative z-10 min-h-screen pt-28 pb-24 px-6 max-w-3xl mx-auto font-body">

        {/* Header */}
        <div className="mb-10 text-center animate-blur-text" style={{ animationDelay: '0.1s' }}>
          <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-xs font-label uppercase tracking-widest mb-6 hover:opacity-80 transition-opacity" style={{ color: 'var(--theme-text-muted)' }}>
            <span className="material-symbols-outlined text-sm">arrow_back</span> Dashboard
          </Link>
          <div className="flex justify-center mb-4">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full font-label text-[10px] font-bold uppercase tracking-widest"
              style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>smart_display</span> YouTube Playlist
            </span>
          </div>
          <h1 className="font-headline text-3xl sm:text-4xl md:text-5xl font-bold italic forge-gradient-text leading-tight max-w-3xl mx-auto">{course.course_title}</h1>
          <div className="flex items-center justify-center gap-6 mt-6 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lg" style={{ color: '#818cf8' }}>video_library</span>
              <span className="font-label text-xs font-bold" style={{ color: 'var(--theme-text-heading)' }}>{totalVideos} videos</span>
            </div>
            <div className="w-px h-4" style={{ background: 'var(--theme-border-strong)' }} />
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lg" style={{ color: '#a78bfa' }}>calendar_today</span>
              <span className="font-label text-xs font-bold" style={{ color: 'var(--theme-text-heading)' }}>{days.length} days</span>
            </div>
            <div className="w-px h-4" style={{ background: 'var(--theme-border-strong)' }} />
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lg" style={{ color: '#34d399' }}>timer</span>
              <span className="font-label text-xs font-bold" style={{ color: 'var(--theme-text-heading)' }}>{formatDayDuration(totalDuration)} total</span>
            </div>
          </div>
        </div>


        {/* Progress Card */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.5 }}
          className="rounded-2xl p-6 mb-10" style={{ background: 'var(--dash-card-bg)', border: '1px solid var(--dash-card-border)', backdropFilter: 'blur(24px)' }}>
          <div className="flex items-center justify-between flex-wrap gap-6">
            <div className="flex items-center gap-5">
              <div className="relative shrink-0">
                <ProgressRing pct={progressPct} size={72} stroke={5} color="#6366f1" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-headline text-lg font-black" style={{ color: 'var(--color-primary)' }}>{progressPct}%</span>
                </div>
              </div>
              <div>
                <p className="font-headline text-xl font-bold" style={{ color: 'var(--theme-text-heading)' }}>Study Plan Progress</p>
                <p className="font-body text-sm mt-1" style={{ color: 'var(--theme-text-muted)' }}>{completedDays} of {days.length} days completed • ~{course.hoursPerDay}h/day</p>
              </div>
            </div>
            {currentDayIndex < days.length && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'rgba(129,140,248,0.06)', border: '1px solid rgba(129,140,248,0.15)' }}>
                <span className="material-symbols-outlined" style={{ color: '#818cf8', fontSize: '18px' }}>play_circle</span>
                <span className="font-label text-xs font-bold" style={{ color: '#818cf8' }}>Currently on Day {currentDayIndex + 1}</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Day Timeline */}
        <div className="space-y-0 animate-blur-text" style={{ animationDelay: '0.25s' }}>
          {days.map((day, i) => (
            <DayCard key={day._id || i} day={day} index={i}
              isCurrent={i === currentDayIndex}
              isLocked={i > currentDayIndex && day.status !== 'ready'}
              totalDays={days.length}
              courseId={courseId}
              onStartCheckpoint={handleStartCheckpoint} />
          ))}
        </div>

        {/* Loading checkpoint overlay */}
        {loadingCheckpoint && (
          <div className="fixed inset-0 z-40 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
              <p className="font-body text-sm text-white">Generating checkpoint questions...</p>
            </div>
          </div>
        )}

        {/* Finish Badge */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5 }} className="mt-16 flex justify-center">
          <div className="relative z-10 px-8 py-5 rounded-full flex items-center gap-5 cursor-default transition-all duration-500 hover:-translate-y-2"
            style={{ background: 'linear-gradient(145deg, rgba(30,41,59,0.7) 0%, rgba(15,23,42,0.9) 100%)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', boxShadow: progressPct === 100 ? '0 0 40px rgba(52,211,153,0.3)' : '0 4px 20px rgba(0,0,0,0.3)' }}>
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-[0_0_30px_rgba(99,102,241,0.5)] ${progressPct === 100 ? 'bg-linear-to-br from-emerald-500 to-green-600' : 'bg-linear-to-br from-indigo-500 to-violet-600'}`}>
              <span className="material-symbols-outlined text-3xl">{progressPct === 100 ? 'emoji_events' : 'sports_score'}</span>
            </div>
            <div>
              <h3 className="font-headline text-xl italic font-black text-white drop-shadow-md tracking-wider">
                {progressPct === 100 ? 'Playlist Complete!' : 'The Final Milestone'}
              </h3>
              <p className="font-label text-[10px] md:text-xs text-indigo-200/60 tracking-widest uppercase mt-1 font-bold">
                {progressPct === 100 ? 'You conquered every single day' : 'Your journey to mastery awaits'}
              </p>
            </div>
          </div>
        </motion.div>
      </main>
    </>
  );
}
