import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import TopicNode from '../components/TopicNode';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

function getModuleStatus(module) {
  if (!module.subtopics || module.subtopics.length === 0) return 'locked';
  const allCompleted = module.subtopics.every((subtopic) => subtopic.status === 'completed');
  const hasActive = module.subtopics.some((subtopic) => subtopic.status === 'active');
  if (allCompleted) return 'completed';
  if (hasActive) return 'active';
  return 'locked';
}

function LoadingState({ message }) {
  return (
    <div className="course-shell flex min-h-screen items-center justify-center px-6">
      <div className="course-surface flex flex-col items-center gap-4 rounded-[2rem] px-8 py-10 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#111827] border-t-transparent" />
        <p className="font-body text-sm" style={{ color: 'var(--theme-text-body)' }}>
          {message}
        </p>
      </div>
    </div>
  );
}

export default function CourseMap() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/course/${courseId}`);
        const data = await res.json();
        if (data.success) setCourse(data.course);
      } catch (err) {
        console.error('Failed to fetch course:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId]);

  const modules = course?.modules || [];

  const derived = useMemo(() => {
    const statuses = modules.map((module) => getModuleStatus(module));
    const completedModules = statuses.filter((status) => status === 'completed').length;
    const activeModuleIndex = statuses.findIndex((status) => status === 'active');
    const nextModuleIndex = activeModuleIndex >= 0 ? activeModuleIndex : completedModules;
    return {
      statuses,
      completedModules,
      activeModuleIndex,
      nextModuleIndex: nextModuleIndex < modules.length ? nextModuleIndex : -1,
    };
  }, [modules]);

  if (loading) {
    return <LoadingState message="Building your course studio..." />;
  }

  if (!course) {
    return (
      <div className="course-shell flex min-h-screen items-center justify-center px-6">
        <div className="course-surface max-w-lg rounded-[2rem] px-8 py-10 text-center">
          <h1 className="font-serif text-4xl font-semibold" style={{ color: 'var(--theme-text-heading)' }}>
            Course not found
          </h1>
          <p className="mt-3 font-body text-sm leading-7" style={{ color: 'var(--theme-text-body)' }}>
            We could not load this course map. Head back to your dashboard and open it again.
          </p>
          <Link to="/dashboard" className="course-primary-button mt-6">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const nextModule =
    derived.nextModuleIndex >= 0 ? modules[derived.nextModuleIndex] : null;
  const focusModuleIndex =
    derived.activeModuleIndex >= 0
      ? derived.activeModuleIndex
      : derived.nextModuleIndex >= 0
      ? derived.nextModuleIndex
      : modules.length > 0
      ? modules.length - 1
      : -1;

  return (
    <div className="course-shell">
      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-4 pb-20 pt-28 md:px-6 lg:px-8">
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          id="course-progress-overview"
          className="course-hero-card scroll-mt-32 overflow-hidden rounded-[2.5rem] px-6 py-8 md:px-10 md:py-10"
        >
          <div className="flex flex-col gap-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <Link to="/dashboard" className="course-outline-button">
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                  Dashboard
                </Link>
                <span className="course-kicker">
                  <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                  AI Forged Course
                </span>
              </div>
              <div className="course-stat-chip">
                <span className="material-symbols-outlined text-[18px]" style={{ color: '#4338ca' }}>
                  timeline
                </span>
                {course.progress}% complete
              </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-[1.5fr_0.9fr]">
              <div>
                <p
                  className="font-label text-[11px] font-bold uppercase tracking-[0.28em]"
                  style={{ color: 'rgba(15, 23, 42, 0.48)' }}
                >
                  Curriculum Studio
                </p>
                <h1
                  className="mt-4 max-w-4xl font-serif text-4xl font-semibold leading-tight md:text-6xl"
                  style={{ color: 'var(--theme-text-heading)' }}
                >
                  {course.course_title}
                </h1>
                <p
                  className="mt-4 max-w-3xl font-body text-sm leading-7 md:text-[15px]"
                  style={{ color: 'var(--theme-text-body)' }}
                >
                  Move through the modules in sequence. Each one opens into a focused lesson
                  room with curated videos, progress tracking, and the quiz gate that unlocks
                  the next step.
                </p>
              </div>

              <div className="course-surface-soft rounded-[2rem] p-6">
                <p
                  className="font-label text-[10px] font-bold uppercase tracking-[0.24em]"
                  style={{ color: 'rgba(15, 23, 42, 0.46)' }}
                >
                  Next Up
                </p>
                <h2
                  className="mt-3 font-serif text-2xl font-semibold leading-tight"
                  style={{ color: 'var(--theme-text-heading)' }}
                >
                  {nextModule ? nextModule.module_title : 'Everything is complete'}
                </h2>
                <p className="mt-3 font-body text-sm leading-7" style={{ color: 'var(--theme-text-body)' }}>
                  {nextModule
                    ? 'Open this module to continue the path from theory into guided practice.'
                    : 'You have already completed every module in this course. Review anything anytime.'}
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="course-surface-soft rounded-[1.6rem] px-5 py-5">
                <p className="font-label text-[10px] font-bold uppercase tracking-[0.24em]" style={{ color: 'rgba(15, 23, 42, 0.46)' }}>
                  Modules
                </p>
                <p className="mt-2 font-headline text-4xl font-bold" style={{ color: 'var(--theme-text-heading)' }}>
                  {modules.length}
                </p>
              </div>
              <div className="course-surface-soft rounded-[1.6rem] px-5 py-5">
                <p className="font-label text-[10px] font-bold uppercase tracking-[0.24em]" style={{ color: 'rgba(15, 23, 42, 0.46)' }}>
                  Completed
                </p>
                <p className="mt-2 font-headline text-4xl font-bold" style={{ color: 'var(--theme-text-heading)' }}>
                  {derived.completedModules}
                </p>
              </div>
              <div className="course-surface-soft rounded-[1.6rem] px-5 py-5">
                <p className="font-label text-[10px] font-bold uppercase tracking-[0.24em]" style={{ color: 'rgba(15, 23, 42, 0.46)' }}>
                  Course Progress
                </p>
                <div className="mt-3">
                  <div className="course-progress-track">
                    <div className="course-progress-fill" style={{ width: `${course.progress || 0}%` }} />
                  </div>
                  <p className="mt-3 font-label text-xs font-bold" style={{ color: '#4338ca' }}>
                    {course.progress || 0}% mastered
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        <section className="relative">
          <div
            className="absolute left-[1.4rem] top-4 hidden h-[calc(100%-2rem)] w-px md:block"
            style={{ background: 'linear-gradient(180deg, rgba(17, 24, 39, 0.08), rgba(99, 102, 241, 0.16), rgba(249, 115, 22, 0.08))' }}
          />
          <div className="space-y-6 md:space-y-8">
            {modules.map((module, index) => {
              const status = derived.statuses[index];
              const markerColor =
                status === 'completed'
                  ? '#15803d'
                  : status === 'active'
                  ? '#4338ca'
                  : 'rgba(15, 23, 42, 0.18)';

              return (
                <div
                  key={module._id || index}
                  id={index === focusModuleIndex ? 'course-current-topic' : undefined}
                  className="relative flex scroll-mt-32 gap-4 md:gap-6"
                >
                  <div className="hidden pt-8 md:block">
                    <span
                      className="block h-5 w-5 rounded-full border-[5px]"
                      style={{
                        background: '#ffffff',
                        borderColor: markerColor,
                        boxShadow:
                          status === 'locked' ? 'none' : `0 0 0 8px ${markerColor}18`,
                      }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <TopicNode
                      module={module}
                      moduleIndex={index}
                      courseId={courseId}
                      status={status}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {course.progress === 100 && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.45 }}
            className="course-surface mx-auto max-w-3xl rounded-[2rem] px-6 py-8 text-center"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#ecfdf5] text-[#15803d]">
              <span className="material-symbols-outlined text-[30px]">emoji_events</span>
            </div>
            <h2 className="mt-4 font-serif text-3xl font-semibold" style={{ color: 'var(--theme-text-heading)' }}>
              Course Completed
            </h2>
            <p className="mt-3 font-body text-sm leading-7" style={{ color: 'var(--theme-text-body)' }}>
              Every module is unlocked, watched, and passed. You can revisit any lesson or quiz
              whenever you want.
            </p>
          </motion.section>
        )}
      </main>
    </div>
  );
}
