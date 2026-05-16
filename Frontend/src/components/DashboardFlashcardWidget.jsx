import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Brain, Check, RotateCcw, ArrowRight, ArrowLeft } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

function StackCard({ card, index, cardsLength, onSwipe }) {
  const isTop = index === 0;
  const isInitiallySolved = card.repetition > 0;
  const [isFlipped, setIsFlipped] = useState(isInitiallySolved);
  
  const x = useMotionValue(0);
  // Using a single transform: when x moves, the card rotates automatically.
  // x = -60 -> rotateZ = -6
  // x = 60 -> rotateZ = 6
  const rotateZ = useTransform(x, [-200, 200], [-20, 20]);
  
  // When swiping right, show a green tint overlay. Left = red tint.
  const overlayBackground = useTransform(
    x,
    [-200, 0, 200],
    ['rgba(239, 68, 68, 0.5)', 'rgba(0, 0, 0, 0)', 'rgba(16, 185, 129, 0.5)']
  );

  useEffect(() => {
    if (card.repetition > 0) setIsFlipped(true);
    // If it comes to top and wasn't solved, ensure it's not flipped
    if (isTop && card.repetition === 0) setIsFlipped(false);
  }, [isTop, card.repetition]);

  const handleDragEnd = (e, info) => {
    const threshold = 120;
    if (info.offset.x > threshold) {
      onSwipe(card._id, 5); // Easy (Right)
    } else if (info.offset.x < -threshold) {
      onSwipe(card._id, 1); // Hard (Left)
    }
  };

  // Determine fan-out positions for background cards
  const targetX = isTop ? 0 : index === 1 ? -50 : index === 2 ? 50 : 0;
  const targetY = isTop ? 0 : index === 1 ? 16 : index === 2 ? 32 : 0;

  return (
    <motion.div
      className="absolute origin-bottom"
      style={{
        zIndex: cardsLength - index,
        x,
        rotateZ,
      }}
      animate={{
        x: targetX,
        y: targetY,
        scale: 1 - index * 0.05,
        opacity: index >= 3 ? 0 : 1, // Show up to 3 cards
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      whileDrag={{ cursor: 'grabbing' }}
    >
      <motion.div
        className="relative h-[400px] w-[320px] cursor-pointer transition-shadow hover:shadow-[0_0_40px_rgba(79,70,229,0.15)] rounded-[2.5rem]"
        style={{ transformStyle: 'preserve-3d' }}
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.7, type: "spring", stiffness: 200, damping: 20 }}
        onClick={() => isTop && setIsFlipped(!isFlipped)}
      >
        {/* Swipe Overlays (Visible when dragging) */}
        <motion.div 
          className="pointer-events-none absolute inset-0 z-50 rounded-[2.5rem]"
          style={{ background: overlayBackground, opacity: isTop ? 1 : 0 }}
        />

        {/* Front Face */}
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center rounded-[2.5rem] border border-slate-200/80 bg-gradient-to-br from-white to-slate-50 p-8 text-center shadow-[0_20px_40px_rgba(15,23,42,0.08)]"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className="absolute top-6 rounded-full bg-slate-100 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 shadow-sm border border-black/5">
            Question
          </div>
          <h3 className="text-[1.4rem] font-semibold leading-snug text-slate-800">
            {card.front}
          </h3>
          <div className="absolute bottom-6 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-indigo-500/70">
            <RotateCcw className="h-3.5 w-3.5" /> Tap to reveal
          </div>
        </div>

        {/* Back Face */}
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center rounded-[2.5rem] border border-indigo-400 bg-gradient-to-b from-[#4338ca] to-[#312e81] p-8 text-center shadow-[0_20px_50px_rgba(67,56,202,0.3)]"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div className="absolute top-6 rounded-full bg-white/10 backdrop-blur-md px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-indigo-100 border border-white/20">
            Answer
          </div>
          <h3 className="text-[1.4rem] font-medium leading-snug text-white drop-shadow-md">
            {card.back}
          </h3>
          {isInitiallySolved ? (
             <div className="absolute bottom-6 flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-emerald-200 backdrop-blur-sm border border-emerald-500/30">
               <Check className="h-3 w-3" /> Reviewed
             </div>
          ) : (
            <div className="absolute bottom-6 w-full px-8 flex justify-between text-[11px] font-bold uppercase tracking-widest text-white/70">
               <span className="flex items-center gap-1.5 text-red-300 drop-shadow-sm"><ArrowLeft className="h-3.5 w-3.5"/> Hard</span>
               <span className="flex items-center gap-1.5 text-emerald-300 drop-shadow-sm">Easy <ArrowRight className="h-3.5 w-3.5"/></span>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function SkeletonCard() {
  return (
    <div className="absolute origin-bottom" style={{ zIndex: 10 }}>
      <div className="relative h-[400px] w-[320px] rounded-[2.5rem] border border-black/5 bg-white p-8 text-center shadow-[0_20px_40px_rgba(15,23,42,0.06)] flex flex-col justify-center items-center">
        <div className="absolute top-6 h-6 w-20 animate-pulse rounded-full bg-slate-100"></div>
        <div className="h-4 w-3/4 animate-pulse rounded-md bg-slate-200 mb-5"></div>
        <div className="h-4 w-1/2 animate-pulse rounded-md bg-slate-200"></div>
        <div className="absolute bottom-6 h-4 w-24 animate-pulse rounded-md bg-slate-100"></div>
      </div>
    </div>
  );
}

export default function DashboardFlashcardWidget() {
  const { getToken, userId } = useAuth();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) fetchDailyDeck();
  }, [userId]);

  const fetchDailyDeck = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/flashcards/daily/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setCards(data.cards);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (cardId, grade) => {
    // Cycle the card to the back of the deck and update its repetition
    setCards(prev => {
      const topCard = prev[0];
      const rest = prev.slice(1);
      return [...rest, { ...topCard, repetition: (topCard.repetition || 0) + 1 }];
    });

    try {
      const token = await getToken();
      await fetch(`${API_BASE}/api/flashcards/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ clerkId: userId, cardId, grade })
      });
    } catch (err) {
      console.error('Failed to submit review:', err);
    }
  };

  if (!loading && cards.length === 0) {
    return null;
  }

  return (
    <section className="course-surface rounded-[2.6rem] p-6 md:p-8 mb-10 overflow-hidden">
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.6rem] border border-black/5 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/20">
          <Brain className="h-6 w-6" />
        </div>
        <div>
          <p className="font-label text-[11px] font-bold uppercase tracking-[0.22em] text-indigo-600">Daily Habit</p>
          <h3 className="mt-1 text-2xl font-semibold text-slate-900">Review your Flashcards</h3>
        </div>
      </div>

      <div className="relative flex h-[480px] w-full items-center justify-center rounded-[2rem] bg-slate-50/50 outline outline-1 outline-black/5">
        {loading ? (
          <SkeletonCard />
        ) : (
          cards.map((card, index) => (
            <StackCard 
              key={card._id} 
              card={card} 
              index={index} 
              cardsLength={cards.length}
              onSwipe={handleSwipe}
            />
          ))
        )}
      </div>
    </section>
  );
}
