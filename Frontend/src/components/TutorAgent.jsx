import { useEffect, useRef } from 'react';
import { BorderBeam } from './magicui/BorderBeam';
import { BlurFade } from './magicui/BlurFade';

export default function TutorAgent() {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && window.Hls && window.Hls.isSupported()) {
      const Hls = window.Hls;
      const hls = new Hls();
      hls.loadSource('https://stream.mux.com/f0001qPDy00mvqP023lqK3lWx31uHvxirFCHK1yNLczzqxY.m3u8');
      hls.attachMedia(videoRef.current);
    }
  }, []);

  return (
    <section className="py-40 px-6 bg-surface-container-low">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-24 items-center">
        <div className="order-2 md:order-1">
          <span className="font-label text-xs font-bold tracking-[0.3em] uppercase mb-6 block" style={{ color: 'var(--color-primary)' }}>Synthesis Phase</span>
          <BlurFade inView delay={0.1}>
            <h2 className="font-headline text-6xl md:text-7xl mb-8 leading-[0.95] italic transition-colors duration-400" style={{ color: 'var(--theme-text-heading)' }}>The Tutor Agent</h2>
          </BlurFade>
          <p className="text-xl leading-relaxed mb-12 font-body transition-colors duration-400" style={{ color: 'var(--theme-text-body)' }}>Your personal agent doesn't just find links; it compiles refined data into a structured day-by-day markdown curriculum.</p>
          <div className="liquid-glass p-8 rounded-xl border-l-4" style={{ borderColor: 'var(--color-primary)' }}>
            <code className="font-mono text-sm block leading-loose" style={{ color: 'var(--color-primary)' }}>
              <span style={{ color: 'var(--theme-text-body)' }}># Day 04:</span> Advanced Concurrency<br/>
              <span style={{ color: 'var(--theme-text-body)' }}>-</span> Review: Shared States<br/>
              <span style={{ color: 'var(--theme-text-body)' }}>-</span> Task: Build a Thread-safe Queue<br/>
              <span style={{ color: 'var(--theme-text-body)' }}>-</span> Resource: Forge Lab v.09
            </code>
          </div>
        </div>
        <div className="relative aspect-video rounded-2xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] order-1 md:order-2" style={{ borderColor: 'var(--theme-border-faint)', borderWidth: '1px' }}>
          <video 
            ref={videoRef}
            className="w-full h-full object-cover grayscale-[0.5] opacity-60" 
            loop 
            muted 
            playsInline
            autoPlay
          ></video>
          <BorderBeam
            colorFrom="#6366f1"
            colorTo="#818cf8"
            duration={5}
            size={80}
            borderWidth={1.5}
            reverse
          />
        </div>
      </div>
    </section>
  );
}
