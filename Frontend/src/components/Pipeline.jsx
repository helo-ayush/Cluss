import { useEffect, useRef } from 'react';
import { BorderBeam } from './magicui/BorderBeam';
import { BlurFade } from './magicui/BlurFade';

export default function Pipeline() {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && window.Hls && window.Hls.isSupported()) {
      const Hls = window.Hls;
      const hls = new Hls();
      hls.loadSource('https://stream.mux.com/1CCfG6mPC7LbMOAs6iBOfPeNd3WaKlZuHuKHp00G62j8.m3u8');
      hls.attachMedia(videoRef.current);
    }
  }, []);

  return (
    <section id="pipeline" className="py-40 px-6">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-24 items-center">
        <div className="relative aspect-square rounded-2xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)]" style={{ borderColor: 'var(--theme-border-faint)', borderWidth: '1px' }}>
          <video 
            ref={videoRef}
            className="w-full h-full object-cover grayscale-[0.8] opacity-60" 
            loop 
            muted 
            playsInline
            autoPlay
          ></video>
          <div className="absolute inset-0 bg-gradient-to-tr from-background via-transparent to-primary/10"></div>
          <BorderBeam
            colorFrom="#22c55e"
            colorTo="#4ade80"
            duration={5}
            size={80}
            borderWidth={1.5}
          />
        </div>
        <div>
          <span className="font-label text-primary text-xs font-bold tracking-[0.3em] uppercase mb-6 block">The Agentic Pipeline</span>
          <BlurFade inView delay={0.1}>
            <h2 className="font-headline text-6xl md:text-7xl mb-8 leading-[0.95] italic transition-colors duration-400" style={{ color: 'var(--theme-text-heading)' }}>Intelligent Search &amp; Evaluation</h2>
          </BlurFade>
          <p className="text-xl leading-relaxed mb-12 font-body transition-colors duration-400" style={{ color: 'var(--theme-text-body)' }}>Focus Forge agents traverse millions of resources—documentation, research papers, and open-source repos—to identify the definitive path to mastery.</p>
          <ul className="space-y-8">
            <li className="flex items-center gap-6 group">
              <span className="w-8 h-8 rounded-full border border-primary/30 flex items-center justify-center text-primary group-hover:bg-primary/10 transition-colors">
                <span className="material-symbols-outlined text-lg">check</span>
              </span>
              <p className="font-medium text-lg transition-colors duration-400" style={{ color: 'var(--theme-text-heading)' }}>Auto-verification of source technical accuracy</p>
            </li>
            <li className="flex items-center gap-6 group">
              <span className="w-8 h-8 rounded-full border border-primary/30 flex items-center justify-center text-primary group-hover:bg-primary/10 transition-colors">
                <span className="material-symbols-outlined text-lg">timeline</span>
              </span>
              <p className="font-medium text-lg transition-colors duration-400" style={{ color: 'var(--theme-text-heading)' }}>Difficulty-adjusted modular sequencing</p>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
