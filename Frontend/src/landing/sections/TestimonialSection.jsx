import React, { useRef, useState, useCallback, useEffect } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    text: "Cluss turned my chaotic web-dev watchlist into daily study blocks I could actually finish. The checkpoints forced me to stop pretending I'd understood everything.",
    name: 'Sean Bockhold',
    role: 'Computer Science Student, Georgia Tech',
    avatar: 'https://i.pravatar.cc/150?u=sean'
  },
  {
    id: 2,
    text: "The guided study plans feel way better than a blank chatbot. I open one lesson, study, answer, get feedback, and move on without losing context.",
    name: 'Dani Lledo',
    role: 'Self-taught Developer & UI/UX Expert',
    avatar: 'https://i.pravatar.cc/150?u=dani'
  },
  {
    id: 3,
    text: "As an educator, I like that Cluss makes students prove they learned something. The written prompts and coding checks are much more useful than passive summaries.",
    name: 'Nick Geeza',
    role: 'High School Mathematics Educator',
    avatar: 'https://i.pravatar.cc/150?u=nick'
  },
  {
    id: 4,
    text: "The free tier gives enough room to explore both guided and playlist study plans. The paid plans make sense once you want deeper control over the learning flow.",
    name: 'Sarah Miller',
    role: 'Lifelong Learner & Technical Writer',
    avatar: 'https://i.pravatar.cc/150?u=sarah'
  },
  {
    id: 5,
    text: "I used to drift through tutorials without finishing them. Now each day has a clearer target, and the app remembers what topic I was actually working on.",
    name: 'Alex Reed',
    role: 'Bootcamp Graduate & Software Engineer',
    avatar: 'https://i.pravatar.cc/150?u=alex'
  }
];

const CARD_WIDTH = 450;
const GAP = 32;
const STEP = CARD_WIDTH + GAP;

export default function TestimonialSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [maxIndex, setMaxIndex] = useState(0);
  const containerRef = useRef(null);
  const rawX = useMotionValue(0);
  const x = useSpring(rawX, { stiffness: 300, damping: 40 });

  useEffect(() => {
    const updateMax = () => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.offsetWidth;
      const totalWidth = testimonials.length * STEP - GAP;
      const maxScroll = totalWidth - containerWidth;
      setMaxIndex(Math.max(0, Math.ceil(maxScroll / STEP)));
    };

    updateMax();
    window.addEventListener('resize', updateMax);
    return () => window.removeEventListener('resize', updateMax);
  }, []);

  const goTo = useCallback((index) => {
    const clamped = Math.max(0, Math.min(index, maxIndex));
    setCurrentIndex(clamped);
    rawX.set(-clamped * STEP);
  }, [maxIndex, rawX]);

  const dragStartX = useRef(0);

  return (
    <section id="stories" className="relative overflow-hidden bg-[#1b1d25] py-24 text-white">
      {/* Ambient section glow */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[800px] rounded-full bg-indigo-500/[0.04] blur-[140px]" />
      </div>
      <div className="mx-auto max-w-7xl px-6 md:px-12">
        <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-3 text-sm font-medium text-zinc-400">
              <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
              What learners say
            </div>
            <h2 className="mt-4 max-w-3xl text-4xl font-medium tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400 md:text-6xl">
              Built for people who want to actually study, not just collect content.
            </h2>
          </div>
          <div className="flex gap-3">
            <button onClick={() => goTo(currentIndex - 1)} className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-zinc-900/40 text-zinc-300 transition-all duration-300 hover:border-white/30 hover:bg-white/10 hover:text-white">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <button onClick={() => goTo(currentIndex + 1)} className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-zinc-900/40 text-zinc-300 transition-all duration-300 hover:border-white/30 hover:bg-white/10 hover:text-white">
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div
          ref={containerRef}
          className="cursor-grab overflow-hidden active:cursor-grabbing"
          onMouseDown={(event) => { dragStartX.current = event.clientX; }}
          onMouseUp={(event) => {
            const diff = event.clientX - dragStartX.current;
            if (diff > 60) goTo(currentIndex - 1);
            if (diff < -60) goTo(currentIndex + 1);
          }}
        >
          <motion.div className="flex gap-8" style={{ x }}>
            {testimonials.map((item) => (
              <article key={item.id} className="w-[450px] shrink-0 rounded-[32px] border border-white/[0.08] bg-gradient-to-b from-[#272a33] to-[#1e2028] p-8 shadow-xl shadow-black/20 hover:border-white/15 hover:shadow-[0_20px_60px_rgba(99,102,241,0.08)] transition-all duration-500">
                <p className="text-[19px] leading-8 text-zinc-300">{item.text}</p>
                <div className="mt-10 flex items-center gap-4">
                  <img src={item.avatar} alt={item.name} className="h-14 w-14 rounded-full object-cover border border-white/10" />
                  <div>
                    <p className="font-semibold text-white">{item.name}</p>
                    <p className="text-sm text-zinc-500">{item.role}</p>
                  </div>
                </div>
              </article>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
