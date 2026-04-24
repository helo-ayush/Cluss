import React, { useState } from 'react';
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from 'motion/react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react';

const Navbar = () => {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;
  const courseMatch = pathname.match(/^\/course\/([^/]+)$/);
  const learnMatch = pathname.match(/^\/course\/([^/]+)\/learn\/\d+$/);
  const mobileMenuDelay = 320;

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    if (latest > previous && latest > 150) {
      setHidden(true);
      setMobileMenuOpen(false);
    } else {
      setHidden(false);
    }
  });

  const handleScroll = (e, id) => {
    e.preventDefault();
    const shouldDelayScroll = mobileMenuOpen;
    setMobileMenuOpen(false);
    if (pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const runScroll = () => {
          const el = document.getElementById(id);
          if (el) {
            if (window.__lenis) window.__lenis.scrollTo(el);
            else el.scrollIntoView({ behavior: 'smooth' });
          }
        };

        if (shouldDelayScroll) {
          setTimeout(runScroll, mobileMenuDelay);
        } else {
          runScroll();
        }
      }, 150);
    } else {
      const runScroll = () => {
        const el = document.getElementById(id);
        if (el) {
          if (window.__lenis) window.__lenis.scrollTo(el);
          else el.scrollIntoView({ behavior: 'smooth' });
        }
      };

      if (shouldDelayScroll) {
        setTimeout(runScroll, mobileMenuDelay);
      } else {
        runScroll();
      }
    }
  };

  const scrollToPageSection = (sectionId, offset = 132, settle = false) => {
    const element = document.getElementById(sectionId);
    if (!element) return;

    const runScroll = () => {
      const nextElement = document.getElementById(sectionId);
      if (!nextElement) return;
      const top = window.scrollY + nextElement.getBoundingClientRect().top - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    };

    runScroll();

    if (settle) {
      setTimeout(runScroll, 260);
    }
  };

  const handleContextAction = (e, action) => {
    e.preventDefault();
    const shouldDelayScroll = mobileMenuOpen;
    setMobileMenuOpen(false);

    if (action.type === 'scroll') {
      const runScroll = () => scrollToPageSection(action.target, action.offset, action.settle);
      if (shouldDelayScroll) {
        setTimeout(runScroll, mobileMenuDelay);
      } else {
        runScroll();
      }
      return;
    }

    if (action.type === 'navigate') {
      navigate(action.to);
    }
  };

  const contextualActions = courseMatch
    ? [
        { label: 'Progress', type: 'scroll', target: 'course-progress-overview', offset: 132 },
        { label: 'Topic', type: 'scroll', target: 'course-current-topic', offset: 132 },
      ]
    : learnMatch
    ? [
        { label: 'Course', type: 'navigate', to: `/course/${learnMatch[1]}` },
        { label: 'Lectures', type: 'scroll', target: 'learn-module-quiz', offset: 84, settle: true },
      ]
    : pathname === '/dashboard'
    ? [
        { label: 'Forge Path', type: 'navigate', to: '/dashboard?action=forge' },
        { label: 'Import Playlist', type: 'navigate', to: '/dashboard?action=import' },
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
      variants={{ visible: { y: 0 }, hidden: { y: "-100%" } }}
      animate={hidden ? "hidden" : "visible"}
      transition={{ duration: 0.55, ease: "easeInOut" }}
      style={{ position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 100 }}
      className='bg-white/40 backdrop-blur-2xl border-b border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-b-[32px]'
    >
      <div className='flex items-center justify-between p-4 text-black md:mx-10 lg:mx-15 mt-1'>
        {/* Brand */}
        <div className='flex gap-2 items-center cursor-pointer'>
          <Link
            className='text-2xl font-bold tracking-tighter text-gray-800'
            style={{ fontFamily: 'Outfit, sans-serif' }}
            to='/'
          >
            cluss
          </Link>
        </div>

        {/* Desktop Links */}
        <motion.div className='hidden gap-8 lg:gap-13 md:flex items-center'>
          <motion.div className='relative cursor-pointer transition duration-300 group'>
            <Link
              to="/"
              onClick={(e) => { if (pathname === '/') handleScroll(e, "home"); }}
              className="text-gray-900 font-medium after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-px after:bg-gray-300 after:scale-x-0 after:origin-right hover:after:scale-x-100 hover:after:origin-left after:transition-transform after:duration-300"
            >
              Home
            </Link>
          </motion.div>

          <AnimatePresence mode="popLayout">
            {contextualActions.length > 0 && (
              <motion.div
                key={`nav-links-${pathname}`}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
                className="flex gap-8 lg:gap-13 items-center"
              >
                {contextualActions.map((action) =>
                  action.type === 'landing' ? (
                    <a
                      key={action.label}
                      href={`#${action.target}`}
                      onClick={(e) => handleScroll(e, action.target)}
                      className='group cursor-pointer flex items-center gap-1.5 hover:text-gray-400 transition duration-300 font-medium text-gray-900'
                    >
                      {action.label}
                    </a>
                  ) : action.type === 'navigate' ? (
                    <Link
                      key={action.label}
                      to={action.to}
                      className='group cursor-pointer flex items-center gap-1.5 hover:text-gray-400 transition duration-300 font-medium text-gray-900'
                    >
                      {action.label}
                    </Link>
                  ) : (
                    <button
                      key={action.label}
                      type="button"
                      onClick={(e) => handleContextAction(e, action)}
                      className='group flex cursor-pointer items-center gap-1.5 bg-transparent hover:text-gray-400 transition duration-300 font-medium text-gray-900'
                    >
                      {action.label}
                    </button>
                  )
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Mobile: Auth + Hamburger */}
        <div className='flex md:hidden items-center gap-3'>
          <SignedOut>
            <SignInButton mode="modal">
              <button className='px-4 py-2 bg-[#e5e9eb] hover:bg-black hover:text-white transition-colors duration-300 rounded-full font-medium text-sm'>
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <div className="flex items-center gap-3">
              <Link to="/dashboard" className='px-4 py-2 bg-[#e5e9eb] hover:bg-black hover:text-white transition-colors duration-300 rounded-full font-medium text-sm'>
                Dashboard
              </Link>
              <UserButton afterSignOutUrl="/" />
            </div>
          </SignedIn>

          {/* Ham button — only on small screens */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className='hover:bg-[#e5e9eb] rounded-full cursor-pointer transition duration-300 p-1 flex items-center justify-center'
            aria-label="Toggle menu"
          >
            <img
              src="https://cdn.prod.website-files.com/673786754d248974527e65b5/673a401dc37634f53f2462ea_Button%20menu.svg"
              alt="Menu"
              className="w-8 h-8 rounded-full"
            />
          </button>
        </div>

        {/* Desktop Auth */}
        <div className='hidden md:flex items-center gap-4'>
          <SignedOut>
            <SignInButton mode="modal">
              <div className='group relative cursor-pointer px-5 py-2.5 bg-[#e5e9eb] flex gap-2 rounded-full overflow-hidden'>
                <div className='absolute inset-0 bg-black translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-in-out'></div>
                <div className='relative z-10 flex gap-2 group-hover:text-white transition-colors duration-500 font-medium'>
                  <div>Sign In</div>
                  <div className='group-hover:translate-x-1 transition duration-500'>→</div>
                </div>
              </div>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Link to="/dashboard">
              <div className='group relative cursor-pointer px-5 py-2.5 bg-[#e5e9eb] flex gap-2 rounded-full overflow-hidden'>
                <div className='absolute inset-0 bg-black translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-in-out'></div>
                <div className='relative z-10 flex gap-2 group-hover:text-white transition-colors duration-500 font-medium'>
                  <div>Dashboard</div>
                  <div className='group-hover:translate-x-1 transition duration-500'>→</div>
                </div>
              </div>
            </Link>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden overflow-hidden bg-white/95 backdrop-blur-xl border-t border-gray-100"
          >
            <div className="flex flex-col px-6 py-4 gap-4 font-medium">
              <Link to="/" onClick={() => setMobileMenuOpen(false)} className="py-2 border-b border-gray-100">Home</Link>
              {contextualActions.map((action, index) =>
                action.type === 'landing' ? (
                  <a
                    key={action.label}
                    href={`#${action.target}`}
                    onClick={(e) => handleScroll(e, action.target)}
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
                    onClick={(e) => handleContextAction(e, action)}
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
};

export default Navbar;
