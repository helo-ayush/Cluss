import React, { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Layers, ChevronRight, Check } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

function FlashCard({ card, index, count, onSwipe }) {
  const isTop = index === 0;
  const [flipped, setFlipped] = useState(card.repetition > 0);
  const x = useMotionValue(0);
  const rotateZ = useTransform(x, [-200, 200], [-15, 15]);
  const overlayBackground = useTransform(x, [-200, 0, 200], ['rgba(239,255,85,0.22)', 'rgba(0,0,0,0)', 'rgba(52,211,153,0.22)']);

  useEffect(() => {
    setFlipped(card.repetition > 0);
  }, [card.repetition]);

  const handleDragEnd = (_, info) => {
    if (info.offset.x > 120) onSwipe(card._id, 5);
    if (info.offset.x < -120) onSwipe(card._id, 1);
  };

  return (
    <motion.div
      className="absolute origin-bottom"
      style={{ zIndex: count - index, x, rotateZ }}
      animate={{ x: isTop ? 0 : index === 1 ? -24 : 24, y: isTop ? 0 : index * 14, scale: 1 - index * 0.05, opacity: index > 2 ? 0 : 1 }}
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
    >
      <motion.div
        className="relative h-[20rem] w-[16.5rem] cursor-pointer rounded-[2rem]"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.55, type: 'spring', stiffness: 180, damping: 20 }}
        onClick={() => isTop && setFlipped((prev) => !prev)}
      >
        {/* Swiping indicator feedback overlay */}
        <motion.div className="pointer-events-none absolute inset-0 z-50 rounded-[2rem]" style={{ background: overlayBackground }} />

        {/* Card Face Front: Question (Dark Base) */}
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center rounded-[2rem] border border-white/[0.06] bg-[#222222] p-6 text-center shadow-[0_20px_50px_rgba(0,0,0,0.4)] hover:border-[#efff55]/30 transition-all duration-300" 
          style={{ backfaceVisibility: 'hidden' }}
        >
          <span className="absolute top-5 rounded-full bg-white/5 border border-white/[0.04] px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#efff55]/85">
            Active Deck · Question
          </span>
          <p className="text-base font-semibold leading-relaxed text-white pr-2 pl-2">
            {card.front}
          </p>
          <span className="absolute bottom-5 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.2em] text-[#efff55] drop-shadow-[0_0_8px_rgba(239,255,85,0.4)]">
            Tap to reveal <ChevronRight className="h-3 w-3 animate-pulse text-[#efff55]" />
          </span>
        </div>

        {/* Card Face Back: Answer (Lime Accent Highlight) */}
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center rounded-[2rem] border border-white/[0.06] bg-[#efff55] p-6 text-center text-black shadow-[0_20px_50px_rgba(239,255,85,0.16)]" 
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <span className="absolute top-5 rounded-full bg-black/10 px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.2em] text-black/60">
            Verify Answer
          </span>
          <p className="text-base font-black leading-relaxed text-black pr-2 pl-2">
            {card.back}
          </p>
          {card.repetition > 0 ? (
            <span className="absolute bottom-5 inline-flex items-center gap-1 rounded-full bg-black px-3.5 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#efff55]">
              <Check className="h-2.5 w-2.5 stroke-[3] text-[#efff55]" /> Reviewed
            </span>
          ) : (
            <div className="absolute bottom-5 flex w-full justify-between px-7 text-[10.5px] font-bold uppercase tracking-[0.16em] text-black/60">
              <span>← Swipe Left (Hard)</span>
              <span>Swipe Right (Easy) →</span>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function DashboardFlashcardsPanel() {
  const { getToken, userId } = useAuth();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const fetchDailyDeck = async () => {
      try {
        setLoading(true);
        const token = await getToken();
        const res = await fetch(`${API_BASE}/api/flashcards/daily/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) setCards(data.cards || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchDailyDeck();
  }, [getToken, userId]);

  const handleSwipe = async (cardId, grade) => {
    setCards((prev) => {
      const [top, ...rest] = prev;
      return top ? [...rest, { ...top, repetition: (top.repetition || 0) + 1 }] : prev;
    });
    try {
      const token = await getToken();
      await fetch(`${API_BASE}/api/flashcards/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ clerkId: userId, cardId, grade }),
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <motion.section 
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.15, duration: 0.45 }}
      whileHover={{ y: -2 }}
      className="h-[35rem] font-nunito antialiased text-white relative overflow-hidden flex flex-col rounded-[2rem] border border-white/[0.06] bg-[#1b1b1b] shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.7)] transition-all duration-300"
    >
      
      {/* Header Bar */}
      <div className="p-5 md:p-6 flex items-center justify-between border-b border-white/[0.04] relative z-10 shrink-0">
        <h2 className="text-sm font-bold text-white tracking-tight">Active Flashcards</h2>
      </div>
      
      {/* Cards deck area */}
      <div className="flex-1 flex flex-col justify-center p-6 md:p-8 relative z-10 min-h-0">
        <div className="relative flex h-full w-full items-center justify-center">
          {loading ? (
            <div className="h-[20rem] w-[16.5rem] animate-pulse rounded-[2rem] bg-white/[0.04] border border-white/[0.05]" />
          ) : cards.length > 0 ? (
            cards.map((card, index) => (
              <FlashCard key={card._id} card={card} index={index} count={cards.length} onSwipe={handleSwipe} />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center text-center max-w-xs py-8">
              <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10">
                <Layers className="h-6 w-6 text-zinc-400" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-2">No Cards Today!</h3>
              <p className="text-[11px] text-zinc-500 leading-relaxed pl-4 pr-4">
                You've cleared your deck or you don't have any active courses. Check back later!
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
}
