import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import TopicNode from '../components/TopicNode';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export default function CourseMap() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourse();
  }, [courseId]);

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

  // Derive module status from subtopics
  const getModuleStatus = (module, moduleIndex) => {
    if (!module.subtopics || module.subtopics.length === 0) return 'locked';
    const allCompleted = module.subtopics.every(s => s.status === 'completed');
    const hasActive = module.subtopics.some(s => s.status === 'active');
    if (allCompleted) return 'completed';
    if (hasActive) return 'active';
    return 'locked';
  };

  // Connector status: completed → green, to-active → violet, else → locked
  const getConnectorStatus = (currentModuleStatus, nextModuleStatus) => {
    if (currentModuleStatus === 'completed' && nextModuleStatus === 'completed') return 'completed';
    if (currentModuleStatus === 'completed' && nextModuleStatus === 'active') return 'active';
    return 'locked';
  };

  if (loading) {
    return (
      <>
        <div className="fixed inset-0 z-0" style={{ background: 'var(--color-background)' }}></div>
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#8b5cf6', borderTopColor: 'transparent' }}></div>
            <p className="font-body text-sm" style={{ color: 'var(--theme-text-body)' }}>Loading course map...</p>
          </div>
        </div>
      </>
    );
  }

  if (!course) {
    return (
      <>
        <div className="fixed inset-0 z-0" style={{ background: 'var(--color-background)' }}></div>
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <p className="font-body text-lg" style={{ color: 'var(--theme-text-body)' }}>Course not found.</p>
        </div>
      </>
    );
  }

  const modules = course.modules || [];

  return (
    <>
      <div className="fixed inset-0 z-0 grid-bg" style={{ background: 'var(--color-background)' }}></div>

      {/* Ambient background orbs */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-600/10 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-violet-600/10 blur-[150px]"></div>
        <div className="absolute top-[40%] left-[60%] w-[40vw] h-[40vw] rounded-full bg-emerald-600/5 blur-[100px]"></div>
      </div>

      <main className="relative z-10 min-h-screen pt-28 pb-24 px-6 max-w-6xl mx-auto font-body">
        {/* Header */}
        <div className="mb-12 text-center animate-blur-text" style={{ animationDelay: '0.1s' }}>
          <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-xs font-label uppercase tracking-widest mb-6 hover:opacity-80 transition-opacity" style={{ color: 'var(--theme-text-muted)' }}>
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Dashboard
          </Link>
          <h1 className="font-headline text-4xl md:text-5xl lg:text-6xl font-bold italic forge-gradient-text leading-tight max-w-4xl mx-auto">
            {course.course_title}
          </h1>
          <p className="mt-4 text-sm font-label uppercase tracking-widest font-bold" style={{ color: 'var(--theme-text-muted)' }}>
            {modules.length} modules • {course.progress}% complete
          </p>
        </div>

        {/* Desktop Zig-Zag / Mobile Stack Timeline */}
        <div className="mt-16 relative animate-blur-text" style={{ animationDelay: '0.2s' }}>
          {/* Desktop Timeline Spine */}
          <div className="hidden md:block absolute top-0 bottom-0 left-[50%] -translate-x-[50%] w-1 rounded-full" style={{ background: 'var(--theme-border-strong)' }}></div>

          {modules.map((mod, i) => {
            const status = getModuleStatus(mod, i);
            const nextStatus = i < modules.length - 1 ? getModuleStatus(modules[i + 1], i + 1) : null;
            const connectorStatus = nextStatus ? getConnectorStatus(status, nextStatus) : null;
            const isLeft = i % 2 === 0;

            const orbColor = status === 'completed' ? '#22c55e' : status === 'active' ? '#8b5cf6' : 'var(--theme-border-strong)';

            return (
              <div key={mod._id || i} className="relative w-full mb-12 md:mb-20 last:mb-0 group">
                <div className={`flex flex-col md:flex-row items-center relative w-full ${isLeft ? 'md:justify-start' : 'md:justify-end'}`}>
                  
                  {/* Module Node Card */}
                  <div className={`w-full md:w-[calc(50%-3.5rem)] ${isLeft ? 'md:pr-2' : 'md:pl-2'} relative z-10`}>
                    <TopicNode
                      module={mod}
                      moduleIndex={i}
                      courseId={courseId}
                      status={status}
                      isLeft={isLeft}
                    />
                  </div>

                  {/* Desktop Connecting horizontal branch */}
                  <div className={`hidden md:block absolute top-[50%] -translate-y-[50%] h-[3px] rounded-full transition-colors duration-500 z-0`}
                       style={{
                         width: '3.5rem',
                         ...(isLeft 
                             ? { right: 'calc(50% - 1px)', background: `linear-gradient(90deg, transparent, ${orbColor}50)` }
                             : { left: 'calc(50% - 1px)', background: `linear-gradient(270deg, transparent, ${orbColor}50)` }
                         )
                       }}>
                  </div>

                  {/* Desktop Spine Orb */}
                  <div className="hidden md:flex absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-[4px] z-20 transition-all duration-300 group-hover:scale-[1.3]"
                       style={{ borderColor: 'var(--color-background)', background: orbColor, boxShadow: status !== 'locked' ? `0 0 16px ${orbColor}80` : 'none' }}>
                  </div>

                  {/* Mobile Vertical Connector (hidden on tablet+) */}
                  {i < modules.length - 1 && (
                    <div className="md:hidden flex justify-center w-full mt-6 mb-[-1rem]">
                      <div className={`node-connector h-12 node-connector-${connectorStatus}`}></div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Final Destination Div */}
          <div className="mt-20 relative flex justify-center w-full z-10 group">
             {/* Gradient connection tail from the spine */}
             <div className="hidden md:block absolute top-[-5rem] bottom-[50%] left-[50%] -translate-x-[50%] w-1 rounded-full bg-gradient-to-b from-[var(--theme-border-strong)] to-transparent" />
             <div className="md:hidden absolute top-[-3rem] bottom-[50%] left-[50%] -translate-x-[50%] w-[3px] rounded-full bg-gradient-to-b from-[var(--theme-border-strong)] to-transparent" />
             
             <div className="relative z-10 px-8 py-5 rounded-full flex items-center gap-5 cursor-default transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_16px_40px_rgba(99,102,241,0.2)]"
                  style={{ background: 'linear-gradient(145deg, rgba(30,41,59,0.7) 0%, rgba(15,23,42,0.9) 100%)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}>
                 <div className="w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-[0_0_30px_rgba(99,102,241,0.5)] group-hover:scale-110 transition-transform duration-500">
                    <span className="material-symbols-outlined text-3xl">sports_score</span>
                 </div>
                 <div>
                    <h3 className="font-headline text-xl italic font-black text-white drop-shadow-md tracking-wider">The Final Milestone</h3>
                    <p className="font-label text-[10px] md:text-xs text-indigo-200/60 tracking-widest uppercase mt-1 font-bold">Your journey to mastery awaits</p>
                 </div>
             </div>
          </div>
        </div>

        {/* Course complete badge */}
        {course.progress === 100 && (
          <div className="mt-20 text-center animate-blur-text" style={{ animationDelay: '0.4s' }}>
            <div className="inline-flex items-center gap-3 px-8 py-4 rounded-full" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', boxShadow: '0 0 40px rgba(34,197,94,0.2)' }}>
              <span className="material-symbols-outlined text-3xl" style={{ color: '#22c55e' }}>emoji_events</span>
              <span className="font-label text-base font-bold tracking-widest uppercase" style={{ color: '#22c55e' }}>Course Completed</span>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
