import { useEffect, useRef } from 'react';
import { NumberTicker } from './magicui/NumberTicker';

export default function Impact() {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && window.Hls && window.Hls.isSupported()) {
      const Hls = window.Hls;
      const hls = new Hls();
      hls.loadSource('https://stream.mux.com/Kec29dVyJgiPdtWaQtPuEiiGHkJIYQAVUJcNiIHUYeo.m3u8');
      hls.attachMedia(videoRef.current);
    }
  }, []);

  return (
    <section id="impact" className="relative py-48 px-6 overflow-hidden bg-background">
      <div className="absolute inset-0 -z-10">
        <video 
          ref={videoRef}
          className="opacity-20 mix-blend-screen" 
          loop 
          muted 
          playsInline
          autoPlay
        ></video>
      </div>
      <div className="max-w-6xl mx-auto text-center">
        <span className="font-label text-primary text-xs font-bold tracking-[0.3em] uppercase">Global Reach</span>
        <div className="mt-8 font-headline text-[10rem] md:text-[14rem] leading-none forge-gradient-text font-black tracking-tighter italic">
          <NumberTicker value={130} className="forge-gradient-text" />M+
        </div>
        <p className="text-2xl font-light -mt-4 transition-colors duration-400" style={{ color: 'var(--theme-text-muted)' }}>Requests processed via Forge Pipeline</p>
        <div className="grid md:grid-cols-2 gap-12 mt-32">
          <div className="liquid-glass py-16 px-10 rounded-2xl" style={{ borderColor: 'var(--theme-border-faint)' }}>
            <h4 className="font-headline text-6xl mb-4 italic transition-colors duration-400" style={{ color: 'var(--theme-text-heading)' }}>
              <NumberTicker value={47} className="" style={{ color: 'var(--theme-text-heading)' }} />M+
            </h4>
            <p className="font-label uppercase tracking-[0.2em] text-xs font-bold transition-colors duration-400" style={{ color: 'var(--theme-text-muted)' }}>Developers Accelerated</p>
          </div>
          <div className="liquid-glass py-16 px-10 rounded-2xl" style={{ borderColor: 'var(--theme-border-faint)' }}>
            <h4 className="font-headline text-6xl mb-4 italic transition-colors duration-400" style={{ color: 'var(--theme-text-heading)' }}>
              <NumberTicker value={10} className="" style={{ color: 'var(--theme-text-heading)' }} />M+
            </h4>
            <p className="font-label uppercase tracking-[0.2em] text-xs font-bold transition-colors duration-400" style={{ color: 'var(--theme-text-muted)' }}>STEM Researchers</p>
          </div>
        </div>
      </div>
    </section>
  );
}
