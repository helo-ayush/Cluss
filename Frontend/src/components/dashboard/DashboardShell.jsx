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
    <div className="font-nunito min-h-screen overflow-x-clip bg-[#080808] text-white">







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
        <main className={`${disableDefaultPadding ? '' : 'px-4 pb-12 pt-[6.5rem] sm:px-6 lg:px-8'} ${contentClassName}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
