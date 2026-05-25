import React from 'react';
import { Link } from 'react-router-dom';
import { SignedIn, useUser } from '@clerk/clerk-react';
import { Menu, MessageCircle, Plus } from 'lucide-react';

export default function DashboardTopbar({ title, eyebrow, usageData, onMenuClick, sidebarCollapsed }) {
  const { user } = useUser();
  const initial = (user?.firstName || user?.fullName || user?.primaryEmailAddress?.emailAddress || 'L').charAt(0).toUpperCase();
  const displayName = user?.fullName || user?.username || 'Learner';

  return (
    <header
      className={`font-nunito pointer-events-none fixed right-0 top-0 z-40 px-3 py-2 transition-[left] duration-300 sm:px-5 lg:px-7 ${
        sidebarCollapsed ? 'lg:left-[5.5rem]' : 'lg:left-[15.5rem]'
      } left-0`}
    >
      <div className="pointer-events-auto flex min-h-[4.7rem] items-center justify-between gap-2 rounded-full border border-white/[0.08] bg-[#1b1b1b54] px-3 shadow-[0_18px_60px_rgba(0,0,0,0.38)] backdrop-blur-2xl sm:gap-4 sm:px-5">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
          <button
            type="button"
            onClick={onMenuClick}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[#1b1b1b] text-zinc-300 transition hover:bg-white hover:text-black lg:hidden"
            title="Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-medium tracking-[-0.06em] text-white sm:text-2xl md:text-3xl">
              {title}
            </h1>
          </div>
        </div>

        <div className="flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-3">
          <div className="flex h-14 items-center gap-1 rounded-full border border-white/10 bg-[#1b1b1b] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            <Link
              to="/create/guided"
              className="flex h-12 w-12 items-center justify-center rounded-full bg-[#efff55] text-black shadow-[0_0_22px_rgba(239,255,85,0.18)] transition hover:scale-105 max-[430px]:h-10 max-[430px]:w-10"
              title="Create"
            >
              <Plus className="h-6 w-6 max-[430px]:h-5 max-[430px]:w-5" />
            </Link>
            <Link
              to="/dashboard/chat"
              className="flex h-12 w-12 items-center justify-center rounded-full text-zinc-300 transition hover:bg-white hover:text-black max-[430px]:h-10 max-[430px]:w-10"
              title="AI Chat"
            >
              <MessageCircle className="h-5 w-5 max-[430px]:h-4 max-[430px]:w-4" />
            </Link>
          </div>
          <SignedIn>
            <Link
              to="/dashboard/profile"
              className="flex min-h-14 w-14 items-center justify-center gap-2 rounded-full border border-white/10 bg-[#1b1b1b] py-1 pl-1.5 pr-1.5 transition hover:border-white/20 hover:bg-[#222222] sm:w-[11.5rem] sm:justify-start sm:pl-4 md:w-[12.5rem]"
            >
              <div className="hidden min-w-0 flex-1 text-left sm:block">
                <p className="truncate text-sm font-medium leading-tight text-white" title={displayName}>{displayName}</p>
                <p className="mt-0.5 truncate text-[11px] font-semibold leading-tight text-zinc-500">
                  {usageData?.balance || 0} credits
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white/[0.06]">
                {user?.imageUrl ? (
                  <img src={user.imageUrl} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-sm font-black text-white">{initial}</span>
                )}
              </div>
            </Link>
          </SignedIn>
        </div>
      </div>
    </header>
  );
}
