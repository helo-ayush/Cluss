import { useNavigate } from 'react-router-dom';
import { SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react';

export default function Hero() {
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const val = e.target.value;
    if (val.trim() || val.length > 0) {
      navigate(`/dashboard?q=${encodeURIComponent(val)}`);
    }
  };

  const handleForgeClick = () => {
    navigate('/dashboard');
  };

  return (
    <header className="relative h-screen w-full flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <video autoPlay className="opacity-40 grayscale-[0.5]" loop muted playsInline>
          <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260317_100335_dc625816-c3c1-4b00-b93e-4cb301cf5ea5.mp4" type="video/mp4"/>
        </video>
        <div className="absolute inset-0" style={{ background: 'var(--theme-overlay)' }}></div>
        <div className="absolute inset-0 bg-linear-to-t from-background via-background/40 to-transparent"></div>
      </div>
      <div className="relative z-10 max-w-5xl px-6 text-center mt-32 md:mt-40">
        <h1 
          className="font-serif text-5xl sm:text-7xl md:text-[10rem] tracking-[-0.04em] leading-[0.9] animate-blur-text italic transition-colors duration-400" 
          style={{ animationDelay: '0.1s', color: 'var(--theme-text-heading)' }}
        >
          Escape Tutorial Hell
        </h1>
        <p 
          className="mt-10 text-lg md:text-xl max-w-xl mx-auto font-body leading-relaxed opacity-0 animate-blur-text transition-colors duration-400" 
          style={{ animationDelay: '0.4s', color: 'var(--theme-text-body-strong)' }}
        >
          One prompt generates a structured learning path. Cut through the noise and get a distraction-free curriculum curated just for you.
        </p>
        <div 
          className="mt-10 sm:mt-14 max-w-2xl mx-auto liquid-glass p-2 rounded-3xl sm:rounded-full flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-0 opacity-0 animate-blur-text" 
          style={{ animationDelay: '0.7s' }}
        >
          <input 
            className="bg-transparent border-none focus:ring-0 w-full px-4 sm:px-8 py-3 sm:py-0 font-body text-base sm:text-lg outline-none transition-colors duration-400 text-center sm:text-left" 
            placeholder="What do you want to master today?" 
            type="text"
            onChange={handleInputChange}
            style={{ color: 'var(--theme-text-heading)', '--tw-placeholder-opacity': 1 }}
          />
          <SignedIn>
            <button onClick={handleForgeClick} className="w-full sm:w-auto forge-btn-primary text-on-primary px-10 py-4 rounded-full font-label text-sm font-black whitespace-nowrap active:scale-95">
              Forge Your Path
            </button>
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal" forceRedirectUrl="/dashboard">
              <button className="w-full sm:w-auto forge-btn-primary text-on-primary px-10 py-4 rounded-full font-label text-sm font-black whitespace-nowrap active:scale-95">
                Forge Your Path
              </button>
            </SignInButton>
          </SignedOut>
        </div>
      </div>
    </header>
  );
}
