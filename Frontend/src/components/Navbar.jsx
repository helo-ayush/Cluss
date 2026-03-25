import { useTheme } from './ThemeProvider';
import { ShimmerButton } from './magicui/ShimmerButton';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex justify-between items-center px-8 py-3 w-[95%] max-w-6xl rounded-full backdrop-blur-2xl border shadow-2xl transition-colors duration-400" style={{ background: 'var(--theme-nav-bg)', borderColor: 'var(--theme-border)' }}>
      <Link to="/" className="text-2xl font-bold tracking-tighter font-headline italic transition-colors duration-400" style={{ color: 'var(--theme-text-heading)' }}>Focus Forge</Link>
      <div className="hidden md:flex gap-10 items-center">
        <a className="text-primary font-medium font-label tracking-wide text-xs uppercase hover:text-primary transition-all duration-300" href="#features">Features</a>
        <a className="font-medium font-label tracking-wide text-xs uppercase hover:text-primary transition-all duration-300" href="#pipeline" style={{ color: 'var(--theme-nav-link)' }}>Pipeline</a>
        <a className="font-medium font-label tracking-wide text-xs uppercase hover:text-primary transition-all duration-300" href="#impact" style={{ color: 'var(--theme-nav-link)' }}>Impact</a>
        <a className="font-medium font-label tracking-wide text-xs uppercase hover:text-primary transition-all duration-300" href="#team" style={{ color: 'var(--theme-nav-link)' }}>Team</a>
      </div>
      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="theme-toggle"
          aria-label="Toggle dark mode"
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <div className={`theme-toggle-knob ${isDark ? 'dark' : 'light'}`}>
            <span className="material-symbols-outlined" style={{ fontSize: '12px', color: 'var(--color-on-primary)' }}>
              {isDark ? 'dark_mode' : 'light_mode'}
            </span>
          </div>
        </button>
        
        <SignedOut>
          <SignInButton mode="modal">
            <div className="cursor-pointer">
              <ShimmerButton
                background={isDark ? "#22c55e" : "#16a34a"}
                shimmerColor="rgba(255,255,255,0.45)"
                borderRadius="9999px"
                className="font-label text-xs font-bold px-6 py-2 text-on-primary active:scale-95 flex items-center gap-2 group"
              >
                Sign In
                <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">login</span>
              </ShimmerButton>
            </div>
          </SignInButton>
        </SignedOut>

        <SignedIn>
          <UserButton afterSignOutUrl="/" />
          <Link to="/dashboard">
            <ShimmerButton
              background={isDark ? "#22c55e" : "#16a34a"}
              shimmerColor="rgba(255,255,255,0.45)"
              borderRadius="9999px"
              className="font-label text-xs font-bold px-4 py-2 text-on-primary active:scale-95 flex items-center gap-2 group ml-2"
            >
              Dashboard
              <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </ShimmerButton>
          </Link>
        </SignedIn>

      </div>
    </nav>
  );
}
