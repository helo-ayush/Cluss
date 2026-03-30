import { useTheme } from './ThemeProvider';
import { ShimmerButton } from './magicui/ShimmerButton';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const isDashboard = location.pathname.startsWith('/dashboard');
  const isAppPage = location.pathname !== '/';

  const scrollToSection = (sectionId) => {
    if (location.pathname !== '/') {
      navigate('/');
      // Wait for navigation
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <nav
      className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 flex justify-between items-center px-4 md:px-8 py-3 rounded-full backdrop-blur-2xl border shadow-2xl transition-all duration-700 ease-in-out ${isAppPage ? 'w-[95%] sm:w-[85%] md:w-[65%] lg:w-[45%] xl:w-[38%]' : 'w-[95%] md:w-[90%]'}`}
      style={{
        background: 'var(--theme-nav-bg)',
        borderColor: 'var(--theme-border)',
        maxWidth: '1200px',
      }}
    >
      <Link to="/" className="text-xl md:text-2xl font-bold tracking-tighter font-headline transition-colors duration-400 shrink-0" style={{ color: 'var(--theme-text-heading)' }}>
        Focus<span style={{ color: 'var(--color-primary)' }}>Forge</span>
      </Link>
      
      <div 
        className={`hidden md:flex items-center overflow-hidden transition-all duration-500 ease-in-out ${!isAppPage ? 'opacity-100 max-w-[500px] gap-10' : 'opacity-0 max-w-0 gap-0'}`}
      >
        <button onClick={() => scrollToSection('features')} className="font-medium font-label tracking-wide text-xs uppercase transition-all duration-300 hover:text-indigo-400 whitespace-nowrap" style={{ color: 'var(--theme-nav-link)' }}>Features</button>
        <button onClick={() => scrollToSection('pipeline')} className="font-medium font-label tracking-wide text-xs uppercase transition-all duration-300 hover:text-indigo-400 whitespace-nowrap" style={{ color: 'var(--theme-nav-link)' }}>Pipeline</button>
        <button onClick={() => scrollToSection('impact')} className="font-medium font-label tracking-wide text-xs uppercase transition-all duration-300 hover:text-indigo-400 whitespace-nowrap" style={{ color: 'var(--theme-nav-link)' }}>Impact</button>
        <button onClick={() => scrollToSection('pricing')} className="font-medium font-label tracking-wide text-xs uppercase transition-all duration-300 hover:text-indigo-400 whitespace-nowrap" style={{ color: 'var(--theme-nav-link)' }}>Pricing</button>
      </div>
      
      <div className="flex items-center gap-4 shrink-0">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="theme-toggle"
          aria-label="Toggle dark mode"
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <div className={`theme-toggle-knob ${isDark ? 'dark' : 'light'}`}>
            <span className="material-symbols-outlined" style={{ fontSize: '12px', color: '#ffffff' }}>
              {isDark ? 'dark_mode' : 'light_mode'}
            </span>
          </div>
        </button>
        
        <SignedOut>
          <SignInButton mode="modal">
            <div className="cursor-pointer">
              <ShimmerButton
                background={isDark ? "#6366f1" : "#4f46e5"}
                shimmerColor="rgba(255,255,255,0.35)"
                borderRadius="9999px"
                className="font-label text-xs font-bold px-6 py-2 text-white active:scale-95 flex items-center gap-2 group"
              >
                Sign In
                <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">login</span>
              </ShimmerButton>
            </div>
          </SignInButton>
        </SignedOut>

        <SignedIn>
          <UserButton afterSignOutUrl="/" />
          <div 
            className={`overflow-hidden transition-all duration-500 ease-in-out ${!isDashboard ? 'opacity-100 max-w-[200px] ml-2' : 'opacity-0 max-w-0 ml-0'}`}
          >
            <Link to="/dashboard" className="block whitespace-nowrap">
              <ShimmerButton
                background={isDark ? "#6366f1" : "#4f46e5"}
                shimmerColor="rgba(255,255,255,0.35)"
                borderRadius="9999px"
                className="font-label text-xs font-bold px-4 py-2 text-white active:scale-95 flex items-center gap-2 group"
              >
                Dashboard
                <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </ShimmerButton>
            </Link>
          </div>
        </SignedIn>

      </div>
    </nav>
  );
}
