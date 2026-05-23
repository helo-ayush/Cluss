import React, { useEffect, useState } from 'react';
import DashboardSidebar from './DashboardSidebar';
import DashboardTopbar from './DashboardTopbar';
import { useUsage } from '../../contexts/UsageContext';

export default function DashboardShell({ title, eyebrow, showCreate = true, contentClassName = '', disableDefaultPadding = false, children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('cluss_sidebar_collapsed') === 'true';
  });
  const { usageData } = useUsage();

  useEffect(() => {
    window.localStorage.setItem('cluss_sidebar_collapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  return (
    <div className="min-h-screen overflow-x-clip bg-[#050505] text-white">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -left-32 top-10 h-96 w-96 rounded-full bg-white/[0.055] blur-[120px]" />
        <div className="absolute right-0 top-24 h-[30rem] w-[30rem] rounded-full bg-zinc-500/[0.08] blur-[150px]" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-white/[0.035] blur-[130px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0,rgba(0,0,0,0.34)_70%)]" />
      </div>

      <DashboardSidebar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      <div className={`relative z-10 min-h-screen transition-[padding-left] duration-300 ${sidebarCollapsed ? 'lg:pl-[5.5rem]' : 'lg:pl-[15.5rem]'}`}>
        <DashboardTopbar
          title={title}
          eyebrow={eyebrow}
          usageData={usageData}
          showCreate={showCreate}
          sidebarCollapsed={sidebarCollapsed}
          onMenuClick={() => setMobileMenuOpen(true)}
        />
        <main className={`${disableDefaultPadding ? '' : 'px-4 pb-12 pt-20 sm:px-6 lg:px-8'} ${contentClassName}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
