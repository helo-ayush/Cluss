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
    setMobileMenuOpen(false);
    if (pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) {
          if (window.__lenis) window.__lenis.scrollTo(el);
          else el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 150);
    } else {
      const el = document.getElementById(id);
      if (el) {
        if (window.__lenis) window.__lenis.scrollTo(el);
        else el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

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
            {pathname === '/' && (
              <motion.div
                key="nav-links"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
                className="flex gap-8 lg:gap-13 items-center"
              >
                <a href="#about" onClick={(e) => handleScroll(e, "about")} className='group cursor-pointer flex items-center gap-1.5 hover:text-gray-400 transition duration-300 font-medium text-gray-900'>
                  Features
                </a>
                <a href="#features" onClick={(e) => handleScroll(e, "features")} className='group cursor-pointer flex items-center gap-1.5 hover:text-gray-400 transition duration-300 font-medium text-gray-900'>
                  Overview
                </a>
                <a href="#pricing" onClick={(e) => handleScroll(e, "pricing")} className='group cursor-pointer flex items-center gap-1.5 hover:text-gray-400 transition duration-300 font-medium text-gray-900'>
                  Pricing
                </a>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="popLayout">
            {pathname === '/dashboard' && (
              <motion.div
                key="dash-links"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
                className="flex gap-8 lg:gap-13 items-center"
              >
                <Link to="/dashboard?action=forge" className='group cursor-pointer flex items-center gap-1.5 hover:text-gray-400 transition duration-300 font-medium text-gray-900'>
                  Forge Path
                </Link>
                <Link to="/dashboard?action=import" className='group cursor-pointer flex items-center gap-1.5 hover:text-gray-400 transition duration-300 font-medium text-gray-900'>
                  Import Playlist
                </Link>
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
              {pathname === '/' && (
                <>
                  <a href="#about" onClick={(e) => handleScroll(e, "about")} className="py-2 border-b border-gray-100">Features</a>
                  <a href="#features" onClick={(e) => handleScroll(e, "features")} className="py-2 border-b border-gray-100">Overview</a>
                  <a href="#pricing" onClick={(e) => handleScroll(e, "pricing")} className="py-2">Pricing</a>
                </>
              )}
              {pathname === '/dashboard' && (
                <>
                  <Link to="/dashboard?action=forge" onClick={() => setMobileMenuOpen(false)} className="py-2 border-b border-gray-100">Forge Path</Link>
                  <Link to="/dashboard?action=import" onClick={() => setMobileMenuOpen(false)} className="py-2">Import Playlist</Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Navbar;
