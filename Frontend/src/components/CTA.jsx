import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react';
import Footer from './Footer';
import { ShimmerButton } from './magicui/ShimmerButton';
import { useTheme } from './ThemeProvider';

export default function CTA() {
  const videoRef = useRef(null);
  const { isDark } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    if (videoRef.current && window.Hls && window.Hls.isSupported()) {
      const Hls = window.Hls;
      const hls = new Hls();
      hls.loadSource('https://stream.mux.com/tLkHO1qZoaaQOUeVWo8hEBeGQfySP02EPS02BmnNFyXys.m3u8');
      hls.attachMedia(videoRef.current);
    }
  }, []);

  const handleImpactClick = () => {
    const element = document.getElementById('impact');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <section className="relative py-48 px-6">
        <div className="absolute inset-0 -z-20 h-full w-full">
          <video 
            ref={videoRef}
            className="opacity-20 grayscale" 
            loop 
            muted 
            playsInline
            autoPlay
          ></video>
          <div className="absolute inset-0 bg-linear-to-t from-background via-transparent to-background"></div>
        </div>
        <div className="max-w-5xl mx-auto liquid-glass p-10 sm:p-20 md:p-32 rounded-4xl sm:rounded-[3rem] text-center relative z-10" style={{ borderColor: 'var(--theme-border-strong)' }}>
          <h2 className="font-headline text-5xl sm:text-6xl md:text-8xl mb-6 sm:mb-10 leading-[0.95] italic transition-colors duration-400" style={{ color: 'var(--theme-text-heading)' }}>Ready to escape tutorial hell?</h2>
          <p className="text-lg sm:text-xl mb-10 sm:mb-16 max-w-xl mx-auto font-body transition-colors duration-400" style={{ color: 'var(--theme-text-body)' }}>Join thousands of crafters forging their professional paths through focused, agent-assisted learning.</p>
          <div className="flex flex-col md:flex-row gap-6 justify-center">
            <SignedIn>
              <div onClick={() => navigate('/dashboard')} className="cursor-pointer">
                <ShimmerButton
                  background={isDark ? "#6366f1" : "#4f46e5"}
                  shimmerColor="rgba(255,255,255,0.45)"
                  borderRadius="9999px"
                  className="font-label text-sm font-black px-12 py-5 text-on-primary active:scale-95"
                >
                  Start Your First Forge
                </ShimmerButton>
              </div>
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal" forceRedirectUrl="/dashboard">
                <div className="cursor-pointer">
                  <ShimmerButton
                    background={isDark ? "#6366f1" : "#4f46e5"}
                    shimmerColor="rgba(255,255,255,0.45)"
                    borderRadius="9999px"
                    className="font-label text-sm font-black px-12 py-5 text-on-primary active:scale-95"
                  >
                    Start Your First Forge
                  </ShimmerButton>
                </div>
              </SignInButton>
            </SignedOut>
            <button onClick={handleImpactClick} className="glass-pill px-12 py-5 rounded-full font-label text-sm font-bold transition-all hover:bg-white/5" style={{ color: 'var(--theme-text-heading)', borderColor: 'var(--theme-border)' }}>
              View Enterprise Impact
            </button>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
