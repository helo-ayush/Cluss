import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BarChart3, BookOpen, Home, Plus, User, Youtube } from 'lucide-react';
import CreatePanel from './CreatePanel';

const navItems = [
  { label: 'Home', icon: Home, to: '/dashboard', match: (path) => path === '/dashboard' },
  { label: 'Guided', icon: BookOpen, to: '/dashboard/guided', match: (path) => path.startsWith('/dashboard/guided') },
  { label: 'Playlist', icon: Youtube, to: '/dashboard/playlists', match: (path) => path.startsWith('/dashboard/playlists') },
  { label: 'Progress', icon: BarChart3, to: '/dashboard/progress', match: (path) => path.startsWith('/dashboard/progress') },
  { label: 'Profile', icon: User, to: '/dashboard/profile', match: (path) => path === '/dashboard/profile' },
];

export default function DashboardSidebar({ mobileMenuOpen, setMobileMenuOpen }) {
  const { pathname } = useLocation();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden" 
          onClick={() => setMobileMenuOpen?.(false)} 
        />
      )}

      {/* Sidebar (Desktop & Mobile Drawer) */}
      <aside 
        className={`fixed left-0 top-0 z-50 flex h-dvh w-[5.25rem] flex-col items-center bg-[#0a0a0a] border-r border-white/5 px-3 py-5 transition-transform duration-300 lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Link 
          to="/" 
          onClick={() => setMobileMenuOpen?.(false)}
          className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/[0.06] bg-[#000000] hover:border-white/20 transition duration-300"
        >
          <img src="/Logo.png" alt="Cluss Logo" className="h-7 w-7 object-contain" />
        </Link>

        <nav className="mt-12 flex flex-1 flex-col items-center gap-4 overflow-y-auto w-full no-scrollbar">
          {navItems.map((item) => {
            const active = item.match(pathname);
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                to={item.to}
                title={item.label}
                onClick={() => setMobileMenuOpen?.(false)}
                className={`group flex h-12 w-12 shrink-0 items-center justify-center rounded-full border text-sm font-black transition ${
                  active
                    ? 'border-white bg-white text-black'
                    : 'border-white/[0.06] bg-[#171717] text-zinc-400 hover:border-white/20 hover:bg-[#202020] hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={() => {
            setCreateOpen(true);
            setMobileMenuOpen?.(false);
          }}
          className="mt-4 mb-2 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[#171717] text-zinc-300 transition hover:rotate-90 hover:bg-white hover:text-black"
        >
          <Plus className="h-6 w-6" />
        </button>
      </aside>

      <CreatePanel open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  );
}
