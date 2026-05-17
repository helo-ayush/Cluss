import React, { useEffect, useState, useMemo } from 'react';
import { AnimatePresence, motion, useAnimation, useMotionValueEvent, useScroll } from 'motion/react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { SignedIn, SignedOut, SignInButton, useUser } from '@clerk/clerk-react';
import { ArrowLeft } from 'lucide-react';
import { getAvatarIcon } from '../utils/avatars';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// ── Circular Credit Ring ──
function CreditRing({ percentage, children }) {
  const radius = 22;
  const stroke = 3;
  const normalizedRadius = radius - stroke;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(percentage, 100) / 100) * circumference;

  const color = percentage > 50 ? '#22c55e' : percentage > 20 ? '#eab308' : '#ef4444';

  return (
    <div className="relative flex items-center justify-center" style={{ width: radius * 2, height: radius * 2 }}>
      <svg width={radius * 2} height={radius * 2} className="absolute -rotate-90">
        <circle
          stroke="#e5e7eb"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke={color}
          fill="transparent"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.4s ease' }}
        />
      </svg>
      <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gray-50">
        {children}
      </div>
    </div>
  );
}

export default function Navbar() {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useUser();
  const [avatarId, setAvatarId] = useState('none');
  const [creditData, setCreditData] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;

  const wiggleControls = useAnimation();

  const handleDashboardClick = async (e) => {
    if (pathname === '/dashboard') {
      e.preventDefault();
      await wiggleControls.start({
        x: [0, -6, 6, -6, 6, 0],
        rotate: [0, -2, 2, -2, 2, 0],
        transition: { duration: 0.4, ease: "easeInOut" }
      });
    }
  };

  useMotionValueEvent(scrollY, 'change', (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    if (latest > previous && latest > 140) {
      setHidden(true);
      setMobileMenuOpen(false);
    } else {
      setHidden(false);
    }
  });

  useEffect(() => {
    if (!user) return;

    const cacheKey = `cluss_avatar_${user.id}`;
    const cachedAvatar = localStorage.getItem(cacheKey);
    if (cachedAvatar) setAvatarId(cachedAvatar);

    const fetchAvatar = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/user/${user.id}/avatar?t=${Date.now()}`);
        const data = await res.json();
        if (data.success && data.avatar) {
          setAvatarId(data.avatar);
          localStorage.setItem(cacheKey, data.avatar);
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchAvatar();
    const handleAvatarChanged = () => {
      const latest = localStorage.getItem(cacheKey);
      if (latest) setAvatarId(latest);
    };
    window.addEventListener('avatarChanged', handleAvatarChanged);
    return () => window.removeEventListener('avatarChanged', handleAvatarChanged);
  }, [user]);

  // ── Credit fetch ──
  useEffect(() => {
    if (!user) return;
    const fetchCredits = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/user/${user.id}/usage?name=${encodeURIComponent(user.fullName || '')}`);
        const data = await res.json();
        if (data.success) setCreditData(data);
      } catch (err) { /* silent */ }
    };
    fetchCredits();
    // Re-fetch every 30s and on navigation
    const interval = setInterval(fetchCredits, 30000);
    window.addEventListener('creditsChanged', fetchCredits);
    return () => {
      clearInterval(interval);
      window.removeEventListener('creditsChanged', fetchCredits);
    };
  }, [user, pathname]);

  const creditPercentage = useMemo(() => {
    if (!creditData) return 100;
    // Free: percentage of fixed allowance. Paid: use max(balance, allowance) as denominator since credits accumulate.
    const max = creditData.plan === 'free'
      ? creditData.allowance
      : Math.max(creditData.balance, creditData.allowance, 1);
    return Math.min(100, Math.round((creditData.balance / max) * 100));
  }, [creditData]);

  const AvatarIcon = getAvatarIcon(avatarId);
  const mobileMenuDelay = 320;

  const scrollToSection = (sectionId, offset = 132) => {
    const el = document.getElementById(sectionId);
    if (!el) return;
    const top = window.scrollY + el.getBoundingClientRect().top - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  const handleLandingScroll = (event, id) => {
    event.preventDefault();
    const shouldDelay = mobileMenuOpen;
    setMobileMenuOpen(false);
    const run = () => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    };

    if (pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        if (shouldDelay) setTimeout(run, mobileMenuDelay);
        else run();
      }, 150);
    } else if (shouldDelay) {
      setTimeout(run, mobileMenuDelay);
    } else {
      run();
    }
  };

  const handleContextAction = (event, action) => {
    event.preventDefault();
    const shouldDelay = mobileMenuOpen;
    setMobileMenuOpen(false);

    const run = () => {
      if (action.type === 'navigate') {
        navigate(action.to);
      } else {
        scrollToSection(action.target, action.offset);
      }
    };

    if (shouldDelay) setTimeout(run, mobileMenuDelay);
    else run();
  };

  const handleBack = () => {
    // 1. If in Learn mode (Guided), go to Study Plan Map
    const learnMatch = pathname.match(/^\/dashboard\/guided\/study-plan\/([^/]+)\/learn/);
    if (learnMatch) return navigate(`/dashboard/guided/study-plan/${learnMatch[1]}`);

    // 2. If in Learn mode (Playlist), go to Playlist Overview
    const playlistLearnMatch = pathname.match(/^\/playlist\/([^/]+)\/day/);
    if (playlistLearnMatch) return navigate(`/playlist/${playlistLearnMatch[1]}`);

    // 3. If in Study Plan Map or Playlist Overview or Profile, go to Dashboard
    if (pathname.startsWith('/dashboard/guided/study-plan/') || pathname.startsWith('/playlist/') || pathname === '/profile') {
      return navigate('/dashboard');
    }

    // 4. If in Dashboard, go to Home
    if (pathname === '/dashboard') {
      return navigate('/');
    }

    // Default browser back for everything else
    navigate(-1);
  };

  const studyPlanMatch = pathname.match(/^\/dashboard\/guided\/study-plan\/([^/]+)$/);
  const studyPlanLearnMatch = pathname.match(/^\/dashboard\/guided\/study-plan\/([^/]+)\/learn\/\d+\/\d+$/);
  const playlistCourseMatch = pathname.match(/^\/playlist\/([^/]+)$/);
  const playlistLearnMatch = pathname.match(/^\/playlist\/([^/]+)\/day\/\d+$/);

  const contextualActions = studyPlanMatch
    ? [
        { label: 'Progress', type: 'scroll', target: 'study-plan-progress-overview', offset: 132 },
        { label: 'Topic', type: 'scroll', target: 'study-plan-current-topic', offset: 132 },
      ]
    : studyPlanLearnMatch
    ? [
        { label: 'Plan', type: 'navigate', to: `/dashboard/guided/study-plan/${studyPlanLearnMatch[1]}` },
        { label: 'Lesson', type: 'scroll', target: 'study-plan-lesson', offset: 132 },
      ]
    : playlistCourseMatch
    ? [
        { label: 'Progress', type: 'scroll', target: 'playlist-progress-overview', offset: 132 },
        { label: 'Current Day', type: 'scroll', target: 'playlist-current-day', offset: 132 },
      ]
    : playlistLearnMatch
    ? [
        { label: 'Queue', type: 'scroll', target: 'playlist-day-queue', offset: 132 },
        { label: 'Checkpoint', type: 'scroll', target: 'playlist-day-checkpoint', offset: 132 },
      ]
    : pathname === '/dashboard'
    ? [
        { label: 'Progress', type: 'scroll', target: 'dashboard-progress', offset: 132 },
        { label: 'Collection', type: 'scroll', target: 'dashboard-collection', offset: 132 },
      ]
    : pathname === '/profile'
    ? [
        { label: 'Avatars', type: 'scroll', target: 'profile-avatars', offset: 132 },
        { label: 'Badges', type: 'scroll', target: 'profile-badges', offset: 132 },
        { label: 'Stats', type: 'scroll', target: 'profile-stats', offset: 132 },
      ]
    : pathname === '/'
    ? [
        { label: 'Features', type: 'landing', target: 'about' },
        { label: 'Overview', type: 'landing', target: 'features' },
        { label: 'Pricing', type: 'landing', target: 'pricing' },
      ]
    : [];

  return (
    <motion.div
      variants={{ visible: { y: 0 }, hidden: { y: '-100%' } }}
      animate={hidden ? 'hidden' : 'visible'}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
      style={{ position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 100 }}
      className="main-navbar rounded-b-[32px] border-b border-white/40 bg-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.04)] backdrop-blur-2xl"
    >
      <div className="mt-1 flex items-center justify-between p-4 text-black md:mx-10 lg:mx-15">
        <div className="flex items-center -ml-3 sm:-ml-4">
          <div className="flex h-10 w-11 items-center justify-start">
            <AnimatePresence mode="wait">
              {pathname !== '/' && (
                <motion.button
                  key="back-btn"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  whileTap={{ x: -5 }}
                  type="button"
                  onClick={handleBack}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200/50 text-slate-600 transition-colors hover:bg-slate-200"
                  title="Go back"
                >
                  <ArrowLeft className="h-4 w-4" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
          <Link className="text-3xl font-bold tracking-tighter text-gray-800" style={{ fontFamily: 'Outfit, sans-serif' }} to="/">
            cluss
          </Link>
        </div>

        <motion.div className="hidden items-center gap-8 md:flex lg:gap-13">
          <Link to="/" onClick={(event) => pathname === '/' && handleLandingScroll(event, 'home')}
            className="relative font-medium text-gray-900 after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:origin-right after:scale-x-0 after:bg-gray-300 after:transition-transform after:duration-300 hover:after:origin-left hover:after:scale-x-100">
            Home
          </Link>

          <AnimatePresence mode="popLayout">
            {contextualActions.length > 0 && (
              <motion.div
                key={`context-${pathname}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
                className="flex items-center gap-8 lg:gap-13"
              >
                {contextualActions.map((action) => (
                  action.type === 'landing' ? (
                    <a
                      key={action.label}
                      href={`#${action.target}`}
                      onClick={(event) => handleLandingScroll(event, action.target)}
                      className="relative font-medium text-gray-900 after:absolute after:-bottom-1 after:left-0 after:h-px after:w-full after:origin-right after:scale-x-0 after:bg-gray-300 after:transition-transform after:duration-300 hover:after:origin-left hover:after:scale-x-100"
                    >
                      {action.label}
                    </a>
                  ) : action.type === 'navigate' ? (
                    <Link
                      key={action.label}
                      to={action.to}
                      className="relative font-medium text-gray-900 after:absolute after:-bottom-1 after:left-0 after:h-px after:w-full after:origin-right after:scale-x-0 after:bg-gray-300 after:transition-transform after:duration-300 hover:after:origin-left hover:after:scale-x-100"
                    >
                      {action.label}
                    </Link>
                  ) : (
                    <button
                      key={action.label}
                      type="button"
                      onClick={(event) => handleContextAction(event, action)}
                      className="relative font-medium text-gray-900 after:absolute after:-bottom-1 after:left-0 after:h-px after:w-full after:origin-right after:scale-x-0 after:bg-gray-300 after:transition-transform after:duration-300 hover:after:origin-left hover:after:scale-x-100"
                    >
                      {action.label}
                    </button>
                  )
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <div className="flex items-center gap-3 md:hidden">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="rounded-full bg-[#e5e9eb] px-4 py-2 text-sm font-medium transition-colors duration-300 hover:bg-black hover:text-white">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Link to="/dashboard" onClick={handleDashboardClick}>
              <motion.div
                animate={wiggleControls}
                className="rounded-full bg-[#e5e9eb] px-4 py-2 text-sm font-medium transition-colors duration-300 hover:bg-black hover:text-white"
              >
                Dashboard
              </motion.div>
            </Link>
          </SignedIn>
          <button onClick={() => setMobileMenuOpen((prev) => !prev)} className="flex items-center justify-center rounded-full p-1 transition hover:bg-[#e5e9eb]" aria-label="Toggle menu">
            <img
              src="https://cdn.prod.website-files.com/673786754d248974527e65b5/673a401dc37634f53f2462ea_Button%20menu.svg"
              alt="Menu"
              className="h-8 w-8 rounded-full"
            />
          </button>
        </div>

        <div className="hidden items-center gap-4 md:flex">
          <SignedOut>
            <SignInButton mode="modal">
              <div className="group relative cursor-pointer overflow-hidden rounded-full bg-[#e5e9eb] px-5 py-2.5">
                <div className="absolute inset-0 translate-y-full bg-black transition-transform duration-500 ease-in-out group-hover:translate-y-0" />
                <div className="relative z-10 flex gap-2 font-medium transition-colors duration-500 group-hover:text-white">
                  <div>Sign In</div>
                  <div className="transition duration-500 group-hover:translate-x-1">→</div>
                </div>
              </div>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Link to="/dashboard" onClick={handleDashboardClick}>
              <motion.div
                animate={wiggleControls}
                className="group relative cursor-pointer overflow-hidden rounded-full bg-[#e5e9eb] px-5 py-2.5"
              >
                <div className="absolute inset-0 translate-y-full bg-black transition-transform duration-500 ease-in-out group-hover:translate-y-0" />
                <div className="relative z-10 flex gap-2 font-medium transition-colors duration-500 group-hover:text-white">
                  <div>Dashboard</div>
                  <div className="transition duration-500 group-hover:translate-x-1">→</div>
                </div>
              </motion.div>
            </Link>
            <Link to="/dashboard/profile" className="relative" title={creditData ? `${creditData.balance} Credits · +${creditData.allowance}/${creditData.refillInterval === 'weekly' ? 'week' : 'day'}` : 'Profile'}>
              <CreditRing percentage={creditPercentage}>
                {avatarId === 'none' ? (
                  <img
                    src={user?.imageUrl || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <AvatarIcon className="h-5 w-5 text-gray-600" />
                )}
              </CreditRing>
            </Link>
          </SignedIn>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28 }}
            className="overflow-hidden border-t border-gray-100 bg-white/95 backdrop-blur-xl md:hidden"
          >
            <div className="flex flex-col gap-4 px-6 py-4 font-medium">
              <Link to="/" onClick={() => setMobileMenuOpen(false)} className="border-b border-gray-100 py-2">Home</Link>
              {contextualActions.map((action, index) =>
                action.type === 'landing' ? (
                  <a
                    key={action.label}
                    href={`#${action.target}`}
                    onClick={(event) => handleLandingScroll(event, action.target)}
                    className={`py-2 ${index !== contextualActions.length - 1 ? 'border-b border-gray-100' : ''}`}
                  >
                    {action.label}
                  </a>
                ) : action.type === 'navigate' ? (
                  <Link
                    key={action.label}
                    to={action.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`py-2 ${index !== contextualActions.length - 1 ? 'border-b border-gray-100' : ''}`}
                  >
                    {action.label}
                  </Link>
                ) : (
                  <button
                    key={action.label}
                    type="button"
                    onClick={(event) => handleContextAction(event, action)}
                    className={`bg-transparent py-2 text-left ${index !== contextualActions.length - 1 ? 'border-b border-gray-100' : ''}`}
                  >
                    {action.label}
                  </button>
                )
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
