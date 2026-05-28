import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useClerk } from '@clerk/clerk-react';
import { motion } from 'motion/react';

function NavGlyph({ type, className = '' }) {
  const common = {
    className: `h-5 w-5 ${className}`,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };

  const paths = {
    home: (
      <>
        <rect x="4" y="5" width="16" height="14" rx="2.4" />
        <path d="M8 9h3.5M8 13h8" />
      </>
    ),
    guided: (
      <>
        <path d="M6.5 5.5h8.5a3 3 0 0 1 3 3v10H8.5a3 3 0 0 1-3-3v-10z" />
        <path d="M9 9h6M9 12h5M9 15h3" />
      </>
    ),
    playlist: (
      <>
        <rect x="4" y="6" width="16" height="12" rx="2.5" />
        <path d="m11 10 4 2-4 2v-4z" />
      </>
    ),
    courses: (
      <>
        <path d="M5 8.5 12 5l7 3.5-7 3.5-7-3.5z" />
        <path d="M7.5 10.5v4.25c1.5 1.4 3 2.05 4.5 2.05s3-.65 4.5-2.05V10.5" />
        <path d="M19 9v5" />
      </>
    ),
    saved: (
      <>
        <path d="M7 5.5h10v13l-5-3-5 3v-13z" />
        <path d="M10 9h4" />
      </>
    ),
    progress: (
      <>
        <path d="M5 18V9M12 18V5M19 18v-7" />
        <path d="M4 18h16" />
      </>
    ),
    chat: (
      <>
        <path d="M5 6.5h14v9.25H9l-4 3v-12.25z" />
        <path d="M8.5 10h7M8.5 13h4" />
      </>
    ),
    profile: (
      <>
        <circle cx="12" cy="8.5" r="3.25" />
        <path d="M5.5 19c1.15-3.05 3.3-4.6 6.5-4.6s5.35 1.55 6.5 4.6" />
      </>
    ),
    plus: (
      <>
        <path d="M12 5v14M5 12h14" />
      </>
    ),
    logout: (
      <>
        <path d="M10 6H6.5A1.5 1.5 0 0 0 5 7.5v9A1.5 1.5 0 0 0 6.5 18H10" />
        <path d="M14 8l4 4-4 4M18 12H9" />
      </>
    ),
  };

  return <svg {...common}>{paths[type] || paths.home}</svg>;
}

const navItems = [
  {
    label: 'Home',
    icon: 'home',
    to: '/dashboard',
    match: (path) => path === '/dashboard',
  },
  {
    label: 'Guided',
    icon: 'guided',
    to: '/dashboard/guided',
    match: (path) => path.startsWith('/dashboard/guided'),
    showPlus: true,
  },
  {
    label: 'Playlist',
    icon: 'playlist',
    to: '/dashboard/playlists',
    match: (path) => path.startsWith('/dashboard/playlists') || path.startsWith('/playlist'),
    showPlus: true,
  },
  {
    label: 'Courses',
    icon: 'courses',
    to: '/courses',
    match: (path) => path.startsWith('/courses') || path.startsWith('/creators'),
  },
  {
    label: 'Saved',
    icon: 'saved',
    to: '/dashboard/bookmarks',
    match: (path) => path === '/dashboard/bookmarks',
  },
  {
    label: 'Progress',
    icon: 'progress',
    to: '/dashboard/progress',
    match: (path) => path.startsWith('/dashboard/progress'),
  },
];

export default function DashboardSidebar({ collapsed, setCollapsed, mobileMenuOpen, setMobileMenuOpen }) {
  const { pathname } = useLocation();
  const { signOut } = useClerk();
  const expanded = mobileMenuOpen || !collapsed;
  const sidebarRadius = expanded ? '18px' : '34px';

  return (
    <>
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen?.(false)}
        />
      )}

      <aside
        className={`font-nunito fixed left-0 top-0 z-50 h-dvh w-[15.5rem] p-2.5 transition-transform duration-300 ease-out will-change-transform lg:translate-x-0 lg:transition-[width,transform] ${
          collapsed ? 'lg:w-[5.5rem]' : 'lg:w-[15.5rem]'
        } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex h-full flex-col gap-3">
          <div className="relative shrink-0">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen?.(false)}
              className={`flex h-[4.35rem] w-full items-center border border-white/[0.07] bg-[#1b1b1b] shadow-[0_20px_70px_rgba(0,0,0,0.32),inset_0_1px_0_rgba(255,255,255,0.05)] transition-[border-radius,background-color,padding] duration-300 ease-out hover:bg-[#222222] ${
                expanded ? 'justify-start' : 'justify-center'
              } ${expanded ? 'px-4' : 'px-0'}`}
              style={{ borderRadius: sidebarRadius }}
            >
              {expanded ? (
                <span className="text-xl font-black uppercase tracking-[-0.08em] text-white">
                  CLUSS
                </span>
              ) : (
                <img src="/Logo.png" alt="Cluss" className="h-8 w-8 object-contain" />
              )}
             
            </Link>
            <button
              type="button"
              onClick={() => {
                setCollapsed?.((value) => !value);
                setMobileMenuOpen?.(false);
              }}
              className="absolute -right-5 top-1/2 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-[#202020] text-zinc-400 shadow-[0_12px_30px_rgba(0,0,0,0.4)] transition hover:bg-white hover:text-black lg:flex"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <svg viewBox="0 0 16 16" className={`h-4 w-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 4 6 8l4 4" />
              </svg>
            </button>
          </div>

          <nav
            className={`flex min-h-0 flex-1 flex-col overflow-hidden border border-white/[0.07] bg-[#1b1b1b] shadow-[0_20px_70px_rgba(0,0,0,0.35)] transition-[border-radius,padding] duration-300 ease-out ${
              expanded ? 'p-3' : 'px-2 py-3'
            }`}
            style={{ borderRadius: sidebarRadius }}
          >
            <div className={`min-h-0 flex-1 overflow-y-auto custom-scroll ${expanded ? 'space-y-2 pr-0.5' : 'space-y-3'}`}>
              {navItems.map((item) => {
                const active = item.match(pathname);
                return (
                  <Link
                    key={item.label}
                    to={item.to}
                    onClick={() => setMobileMenuOpen?.(false)}
                    className={`group flex items-center gap-3 text-sm font-semibold transition ${
                      expanded
                        ? `min-h-12 rounded-[0.9rem] px-3 ${active ? 'bg-white text-black shadow-[0_12px_28px_rgba(0,0,0,0.18)]' : 'text-zinc-400 hover:bg-white/[0.06] hover:text-white'}`
                        : `mx-auto h-11 w-11 justify-center rounded-[1rem] px-0 ${active ? 'bg-white text-black shadow-none' : 'text-zinc-400 hover:bg-white/[0.06] hover:text-white'}`
                    } ${expanded ? 'justify-start' : 'justify-center'}`}
                    title={item.label}
                  >
                    <motion.span
                      key={`${pathname}-${item.label}-${active ? 'active' : 'idle'}`}
                      initial={active ? { scale: 0.72, rotate: -8, opacity: 0.55 } : false}
                      animate={active ? { scale: 1, rotate: 0, opacity: 1 } : { scale: 1, rotate: 0, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 420, damping: 19 }}
                      className="shrink-0"
                    >
                      <NavGlyph type={item.icon} />
                    </motion.span>
                    {expanded && <span className="min-w-0 flex-1 truncate">{item.label}</span>}
                    {expanded && item.showPlus && <span className="text-xl font-bold leading-none text-zinc-500">+</span>}
                  </Link>
                );
              })}
            </div>

            <div className={`mt-4 shrink-0 overflow-hidden border border-white/[0.08] bg-[#1d1d1d] shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] ${
              expanded ? 'mx-1 flex gap-1.5 rounded-full p-1.5' : 'mx-auto flex w-12 flex-col items-center gap-1.5 rounded-full p-1.5'
            }`}>
              <Link
                to="/dashboard/profile"
                onClick={() => setMobileMenuOpen?.(false)}
                className={`flex items-center justify-center gap-1.5 rounded-full bg-white text-[11px] font-black text-black transition hover:bg-zinc-200 ${
                  expanded ? 'min-h-9 flex-1 px-3' : 'h-9 w-9 px-0'
                }`}
                title="Profile"
              >
                <NavGlyph type="profile" className="h-3.5 w-3.5" />
                {expanded && <span>Profile</span>}
              </Link>
              <button
                type="button"
                onClick={() => signOut(() => { window.location.href = '/'; })}
                className={`flex items-center justify-center gap-1.5 rounded-full bg-[#151515] text-[11px] font-black text-zinc-400 transition hover:bg-[#262626] hover:text-white ${
                  expanded ? 'min-h-9 flex-1 px-3' : 'h-9 w-9 px-0'
                }`}
                title="Logout"
              >
                <NavGlyph type="logout" className="h-3.5 w-3.5" />
                {expanded && <span>Logout</span>}
              </button>
            </div>
          </nav>
        </div>
      </aside>
    </>
  );
}
