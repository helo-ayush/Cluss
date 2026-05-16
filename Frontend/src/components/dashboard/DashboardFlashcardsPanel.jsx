import React, { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Layers } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

function FlashCard({ card, index, count, onSwipe }) {
  const isTop = index === 0;
  const [flipped, setFlipped] = useState(card.repetition > 0);
  const x = useMotionValue(0);
  const rotateZ = useTransform(x, [-200, 200], [-18, 18]);
  const overlayBackground = useTransform(x, [-200, 0, 200], ['rgba(255,159,28,0.32)', 'rgba(0,0,0,0)', 'rgba(255,255,255,0.28)']);

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
      animate={{ x: isTop ? 0 : index === 1 ? -30 : 30, y: isTop ? 0 : index * 18, scale: 1 - index * 0.055, opacity: index > 2 ? 0 : 1 }}
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
    >
      <motion.div
        className="relative h-[21rem] w-[17rem] cursor-pointer rounded-[2rem]"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.55, type: 'spring', stiffness: 180, damping: 20 }}
        onClick={() => isTop && setFlipped((prev) => !prev)}
      >
        <motion.div className="pointer-events-none absolute inset-0 z-50 rounded-[2rem]" style={{ background: overlayBackground }} />
        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-[2rem] border border-white/10 bg-[#202020] p-6 text-center shadow-[0_24px_60px_rgba(0,0,0,0.35)]" style={{ backfaceVisibility: 'hidden' }}>
          <span className="absolute top-5 rounded-full bg-white/[0.08] px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Question</span>
          <p className="text-lg font-black leading-snug text-white">{card.front}</p>
          <span className="absolute bottom-5 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
            Tap to reveal
          </span>
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-[2rem] border border-white/20 bg-white p-6 text-center text-black shadow-[0_24px_70px_rgba(255,255,255,0.12)]" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
          <span className="absolute top-5 rounded-full bg-black/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em]">Answer</span>
          <p className="text-lg font-black leading-snug">{card.back}</p>
          {card.repetition > 0 ? (
            <span className="absolute bottom-5 inline-flex items-center gap-2 rounded-full bg-black px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white">
              Reviewed
            </span>
          ) : (
            <div className="absolute bottom-5 flex w-full justify-between px-7 text-[10px] font-black uppercase tracking-[0.16em]">
              <span>Hard</span>
              <span>Easy</span>
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
    <section className="relative overflow-hidden flex flex-col rounded-[2.4rem] border border-white/10 bg-[#0a0a0a] shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
      {/* Background aesthetics */}
      <div className="absolute -left-32 top-10 h-96 w-96 rounded-full bg-emerald-500/[0.04] blur-[120px] pointer-events-none" />
      <div className="absolute -right-20 bottom-10 h-72 w-72 rounded-full bg-teal-500/[0.04] blur-[100px] pointer-events-none" />

      <div className="p-6 md:p-8 flex items-center justify-between border-b border-white/5 relative z-10">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">
            <Layers className="h-3 w-3" />
            <span>Daily Habit</span>
          </div>
          <h2 className="mt-2 text-2xl font-black text-white">Flashcards</h2>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col justify-center p-6 md:p-8 relative z-10 min-h-[32rem]">
        <div className="relative flex h-full w-full items-center justify-center">
          {loading ? (
            <div className="h-[21rem] w-[17rem] animate-pulse rounded-[2rem] bg-white/[0.08]" />
          ) : cards.length > 0 ? (
            cards.map((card, index) => (
              <FlashCard key={card._id} card={card} index={index} count={cards.length} onSwipe={handleSwipe} />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center text-center max-w-xs">
              <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4 border border-emerald-500/20">
                <Layers className="h-8 w-8 text-emerald-400 opacity-80" />
              </div>
              <h3 className="text-lg font-black text-white mb-2">No Cards Today!</h3>
              <p className="text-sm text-zinc-400">You've cleared your deck or you don't have any active courses. Check back later!</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
