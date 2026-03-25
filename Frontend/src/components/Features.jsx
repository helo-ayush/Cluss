import { useEffect, useRef } from 'react';
import { MagicCard } from './magicui/MagicCard';

export default function Features() {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && window.Hls && window.Hls.isSupported()) {
      const Hls = window.Hls;
      const hls = new Hls();
      hls.loadSource('https://stream.mux.com/Jwr2RhmsNrd6GEspBNgm02vJsRZAGlaoQIh4AucGdASw.m3u8');
      hls.attachMedia(videoRef.current);
    }
  }, []);

  const cards = [
    { icon: 'account_tree', title: 'Structured Curriculum', desc: 'Linear, logic-driven paths that build foundational strength before tackling complexity.' },
    { icon: 'target', title: 'Precision Learning', desc: 'Our agents filter the global noise to deliver only the highest-signal content for your goal.' },
    { icon: 'vital_signs', title: 'Hands-on Progress', desc: 'Integrated checkpoints and project prompts that ensure you move from watching to doing.' },
  ];

  return (
    <section id="features" className="relative py-40 px-6 overflow-hidden">
      <div className="absolute inset-0 -z-10 h-full w-full">
        <video 
          ref={videoRef}
          className="opacity-10 pointer-events-none" 
          loop 
          muted 
          playsInline
          autoPlay
        ></video>
        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background"></div>
      </div>
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8">
          {cards.map((card, i) => (
            <MagicCard
              key={i}
              className="liquid-glass rounded-2xl"
              gradientColor="rgba(34, 197, 94, 0.12)"
              gradientFrom="#22c55e"
              gradientTo="#052e16"
            >
              <div className="p-12 flex flex-col gap-8">
                <div className="w-14 h-14 glass-pill flex items-center justify-center rounded-xl bg-primary/10">
                  <span className="material-symbols-outlined text-primary text-3xl">{card.icon}</span>
                </div>
                <div>
                  <h3 className="font-headline text-4xl mb-4 italic transition-colors duration-400" style={{ color: 'var(--theme-text-heading)' }}>{card.title}</h3>
                  <p className="leading-relaxed font-body transition-colors duration-400" style={{ color: 'var(--theme-text-body)' }}>{card.desc}</p>
                </div>
              </div>
            </MagicCard>
          ))}
        </div>
      </div>
    </section>
  );
}
