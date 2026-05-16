import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, ArrowLeft, Brain, Check, X, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export default function FlashcardReview() {
  const { getToken, userId } = useAuth();
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (userId) {
      fetchDailyDeck();
    }
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
      } else {
        setError(data.error || 'Failed to fetch flashcards');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (grade) => {
    try {
      const currentCard = cards[currentIndex];
      const token = await getToken();
      
      // Optimistically move to next card
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(prev => prev + 1), 150);

      await fetch(`${API_BASE}/api/flashcards/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ clerkId: userId, cardId: currentCard._id, grade })
      });
    } catch (err) {
      console.error('Failed to submit review:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-50 text-slate-900">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mb-4" />
        <h2 className="text-xl font-bold">Generating Daily Review Deck...</h2>
        <p className="text-slate-500">This might take a few seconds.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500">
        <p>{error}</p>
        <Link to="/dashboard" className="text-indigo-600 underline">Go Back</Link>
      </div>
    );
  }

  if (currentIndex >= cards.length || cards.length === 0) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-50 p-6">
        <div className="rounded-3xl bg-white p-10 text-center shadow-xl shadow-slate-200/50">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
            <Check className="h-10 w-10 text-emerald-600" />
          </div>
          <h1 className="mb-2 text-3xl font-bold text-slate-900">All Done!</h1>
          <p className="mb-8 text-slate-500">You've finished your daily review. Great job building that learning habit.</p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700"
          >
            <ArrowLeft className="h-5 w-5" /> Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const currentCard = cards[currentIndex];

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="flex items-center justify-between border-b bg-white px-6 py-4 shadow-sm">
        <Link to="/dashboard" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition">
          <ArrowLeft className="h-5 w-5" /> Back
        </Link>
        <div className="flex items-center gap-2 font-medium text-slate-700">
          <Brain className="h-5 w-5 text-indigo-500" />
          Daily Review
        </div>
        <div className="text-sm font-medium text-slate-500">
          {currentIndex + 1} / {cards.length}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-2xl perspective-1000">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex + (isFlipped ? '-flipped' : '-front')}
              initial={{ rotateX: isFlipped ? -90 : 90, opacity: 0 }}
              animate={{ rotateX: 0, opacity: 1 }}
              exit={{ rotateX: isFlipped ? 90 : -90, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={`relative flex min-h-[400px] w-full flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-xl shadow-slate-200/50 ${
                isFlipped ? 'border-b-4 border-indigo-500' : ''
              }`}
            >
              <h2 className={`text-2xl sm:text-3xl font-medium leading-relaxed ${isFlipped ? 'text-slate-700' : 'text-slate-900'}`}>
                {isFlipped ? currentCard.back : currentCard.front}
              </h2>

              {!isFlipped && (
                <div className="absolute bottom-10 left-0 right-0 flex justify-center">
                  <button
                    onClick={() => setIsFlipped(true)}
                    className="flex items-center gap-2 rounded-full bg-slate-100 px-6 py-3 font-semibold text-slate-600 transition hover:bg-slate-200 hover:text-slate-900"
                  >
                    <RotateCcw className="h-5 w-5" /> Show Answer
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Action Buttons */}
          <div className={`mt-10 flex flex-wrap justify-center gap-4 transition-opacity duration-300 ${isFlipped ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <button
              onClick={() => handleReview(1)}
              className="flex min-w-[120px] flex-col items-center justify-center rounded-2xl bg-red-50 py-4 border border-red-200 text-red-700 hover:bg-red-100 transition active:scale-95"
            >
              <X className="mb-1 h-6 w-6" />
              <span className="font-bold">Hard</span>
              <span className="text-xs opacity-70">Review soon</span>
            </button>
            <button
              onClick={() => handleReview(3)}
              className="flex min-w-[120px] flex-col items-center justify-center rounded-2xl bg-amber-50 py-4 border border-amber-200 text-amber-700 hover:bg-amber-100 transition active:scale-95"
            >
              <Check className="mb-1 h-6 w-6" />
              <span className="font-bold">Good</span>
              <span className="text-xs opacity-70">Normal</span>
            </button>
            <button
              onClick={() => handleReview(5)}
              className="flex min-w-[120px] flex-col items-center justify-center rounded-2xl bg-emerald-50 py-4 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition active:scale-95"
            >
              <Check className="mb-1 h-6 w-6" />
              <span className="font-bold">Easy</span>
              <span className="text-xs opacity-70">Review later</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
