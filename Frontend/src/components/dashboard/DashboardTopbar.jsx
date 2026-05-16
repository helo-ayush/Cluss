import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SignedIn, useUser } from '@clerk/clerk-react';
import { Menu, PanelsTopLeft, MessageCircle, Sparkles } from 'lucide-react';

const topLinks = [
  { label: 'Home', to: '/dashboard', icon: PanelsTopLeft, match: (path) => path === '/dashboard' },
  { label: 'AI Chat', to: '/dashboard/chat', icon: MessageCircle, match: (path) => path.startsWith('/dashboard/chat') },
  { label: 'Progress', to: '/dashboard/progress', icon: Sparkles, match: (path) => path.startsWith('/dashboard/progress') },
];

export default function DashboardTopbar({ title, usageData, onMenuClick }) {
  const { user } = useUser();
  const { pathname } = useLocation();
  const plan = usageData?.plan || 'free';
  const initial = (user?.firstName || user?.fullName || user?.primaryEmailAddress?.emailAddress || 'L').charAt(0).toUpperCase();

  return (
    <header className="fixed left-0 right-0 top-0 z-40 bg-black/25 px-4 py-3 md:py-4 backdrop-blur-3xl border-b border-white/10 sm:px-6 lg:left-[5.25rem] lg:px-8 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile Ham / Desktop Nav */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-zinc-300 transition hover:bg-white hover:text-black md:hidden backdrop-blur-md"
            title="Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          
          {/* Mobile AI Chat Button */}
          {(() => {
            const chatActive = pathname.startsWith('/dashboard/chat');
            return (
              <Link 
                to="/dashboard/chat" 
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition md:hidden backdrop-blur-md ${
                  chatActive 
                    ? 'border-white/20 bg-white text-black' 
                    : 'border-white/10 bg-white/[0.03] text-zinc-300 hover:bg-white hover:text-black'
                }`}
                title="AI Chat"
              >
                <MessageCircle className="h-5 w-5" />
              </Link>
            );
          })()}
          
          <nav className="hidden items-center gap-3 md:flex">
            {topLinks.map((item) => {
              const active = item.match(pathname);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-black transition backdrop-blur-md ${
                    active ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.15)]' : 'bg-white/[0.04] border border-white/5 text-zinc-300 hover:-translate-y-0.5 hover:bg-white/[0.08] hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Center: Mobile Title */}
        <div className="min-w-0 md:hidden flex-1 text-center">
          <h1 className="truncate text-lg font-black text-white">{title}</h1>
        </div>

        {/* Right: Profile & Actions */}
        <div className="flex min-w-0 items-center gap-3 md:gap-4">
          
          {/* Universal Credits Capsule */}
          <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-white/[0.04] border border-white/10 px-3 py-1.5 backdrop-blur-md">
            <Sparkles className="h-3 w-3 text-[#A3FF4F]" />
            <span className="text-[11px] font-black text-white">{usageData?.balance || 0} left</span>
          </div>

          <SignedIn>
            <Link to="/dashboard/profile" className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/[0.05] ring-1 ring-white/10 transition hover:ring-white/20 backdrop-blur-md">
              {user?.imageUrl ? (
                <img src={user?.imageUrl} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <span className="text-sm font-black text-white">{initial}</span>
              )}
            </Link>
          </SignedIn>
        </div>
      </div>
    </header>
  );
}
