import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { motion, useScroll, useTransform } from 'motion/react';
import {
  FileText,
  Calendar,
  Brain,
  Search,
  Video,
  Users,
  Plus,
  Mic2,
  AudioLines,
} from 'lucide-react';
import Marquee from './Marquee';
import InteractiveBackground from '../ui/InteractiveBackground';

const Img1 = '/ref/Img1.png';
const Img2 = '/ref/Img2.png';

export default function HeroSection() {
  const { scrollY } = useScroll();
  const navigate = useNavigate();
  const { user } = useUser();

  const width = useTransform(scrollY, [0, 200], ['100vw', '90vw']);
  const height = useTransform(scrollY, [0, 200], ['100vh', '95vh']);
  const borderRadius = useTransform(scrollY, [0, 200], ['0px', '48px']);
  const marginTop = useTransform(scrollY, [0, 200], ['0px', '12px']);

  const scrollToTarget = useCallback((targetId) => {
    const element = document.getElementById(targetId);
    if (!element) return;

    if (window.__lenis) {
      window.__lenis.scrollTo(element);
    } else {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const handlePrimaryCta = useCallback(() => {
    if (user) {
      navigate('/dashboard');
      return;
    }

    scrollToTarget('pricing');
  }, [navigate, scrollToTarget, user]);

  return (
    <div id="home" className="flex flex-col items-center gap-20">
      <motion.div
        style={{ width, height, borderRadius, marginTop }}
        className="relative flex flex-col items-center justify-between overflow-hidden bg-[#1b1d25] border border-white/10 xl:justify-evenly"
      >
        <InteractiveBackground>
          <div className="relative flex h-full w-full flex-col items-center justify-between xl:justify-evenly">
            <div className="invisible h-22 w-full lg:block" />

            <div className="mx-auto flex max-w-[2000px] flex-1 flex-col items-center justify-center gap-10 px-8 md:flex-row md:px-20">
              <div className="z-10 mt-15 flex max-w-2xl flex-col items-start gap-4 md:mt-0 md:pl-10">
                <div className="text-left text-[40px] leading-[1.1] font-bold text-transparent bg-clip-text bg-gradient-to-br from-white to-zinc-400 md:text-[70px]">
                  Stop Searching.
                  <br />
                  Start Learning.
                </div>
                <div className="max-w-lg text-left text-[18px] text-zinc-400">
                  Cluss turns topics and YouTube playlists into guided study plans with checkpoints, notes, and focused AI support.
                </div>
                <button
                  type="button"
                  onClick={handlePrimaryCta}
                  className="group relative mt-4 flex cursor-pointer gap-2 overflow-hidden rounded-full bg-white/10 border border-white/10 px-6 py-3"
                >
                  <div className="absolute inset-0 translate-y-full bg-white transition-transform duration-500 ease-in-out group-hover:translate-y-0" />
                  <div className="relative z-10 flex gap-2 text-white transition-colors duration-500 group-hover:text-black">
                    <div>Get Started Free</div>
                    <div className="text-xl transition duration-500 group-hover:-rotate-45">🚀</div>
                  </div>
                </button>
              </div>

              <div aria-hidden className="perspective-near hidden min-w-75 scale-75 py-12 md:block md:min-w-125 md:translate-x-12 md:scale-95">
                <div className="rotate-x-12 rotate-y-2 rotate-z-10 relative flex h-64 -rotate-12 flex-col rounded-3xl border border-white/10 bg-zinc-900/60 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-md py-4 pl-4 transition-all duration-500">
                  <div className="absolute bottom-20 left-4 min-w-60 rounded-2xl border border-white/10 bg-[#1b1d25]/90 p-1.5 shadow-2xl backdrop-blur-md">
                    <div className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors duration-200 hover:bg-white/10">
                      <Calendar className="h-4 w-4 text-green-400" />
                      <span className="text-zinc-200">AI Study Planner</span>
                    </div>
                    <span className="mx-3 my-0.5 block h-px bg-white/10" />
                    <div className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors duration-200 hover:bg-white/10">
                      <FileText className="h-4 w-4 text-blue-400" />
                      <span className="text-zinc-200">YouTube Q&amp;A Chat</span>
                    </div>
                    <div className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors duration-200 hover:bg-white/10">
                      <Search className="h-4 w-4 text-orange-400" />
                      <span className="text-zinc-200">Deep Topic Search</span>
                    </div>
                    <div className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors duration-200 hover:bg-white/10">
                      <Video className="h-4 w-4 text-red-400" />
                      <span className="text-zinc-200">Instant AI Notes</span>
                    </div>
                    <div className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors duration-200 hover:bg-white/10">
                      <Brain className="h-4 w-4 text-purple-400" />
                      <span className="text-zinc-200">AI Quiz Generator</span>
                    </div>
                    <div className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors duration-200 hover:bg-white/10">
                      <Users className="h-4 w-4 text-yellow-400" />
                      <span className="text-zinc-200">RAG Study Rooms</span>
                    </div>
                  </div>
                  <div className="mt-auto flex h-fit w-[90%] justify-between gap-3 rounded-full border border-white/10 bg-[#1b1d25]/80 p-2 shadow-inner backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 transition-colors hover:bg-zinc-700">
                        <Plus className="h-4 w-4 text-zinc-300" />
                      </div>
                      <div className="text-sm font-medium text-zinc-400">Learn Python from scratch...</div>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-white/10">
                        <Mic2 className="h-4 w-4 text-zinc-300" />
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black transition-all hover:bg-zinc-200">
                        <AudioLines className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => scrollToTarget('about')}
              className="group mb-6 flex h-11 w-11 animate-float items-center justify-center rounded-full bg-white/10 border border-white/10 transition-all duration-300 hover:bg-white text-white hover:text-black"
            >
              <img
                src="https://cdn.prod.website-files.com/673786754d248974527e65b5/673a2c5929486b4e031f7c94_dropdown-arrow.svg"
                alt="Arrow"
                width={10}
                height={10}
                className="rounded-full invert transition-all duration-300 group-hover:invert-0"
              />
            </button>

            <div className="left-0 w-full">
              <Marquee />
            </div>
          </div>
        </InteractiveBackground>
      </motion.div>

      <div className="relative flex h-auto w-[90vw] flex-col gap-8 overflow-hidden rounded-4xl border border-white/[0.08] bg-gradient-to-b from-[#252830] to-[#1e2028] px-8 py-10 md:flex-row shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
        <div className="flex w-full flex-col gap-8 md:flex-row">
          <div className="flex w-full flex-col justify-start gap-3 md:w-1/2">
            <div className="flex items-center gap-5 text-xl font-medium">
              <div className="dot bg-indigo-500" />
              <div className="text-zinc-300">What we do</div>
            </div>
            <div className="relative w-full max-w-105 rounded-3xl bg-[#1b1d25]/80 border border-white/10 p-6 shadow-inner backdrop-blur-sm">
              <div className="relative overflow-hidden rounded-2xl">
                <div className="aspect-video w-full overflow-hidden rounded-xl bg-zinc-900">
                  <img src="/ref/Video.gif" alt="Cluss Dashboard Video" className="h-full w-full object-cover" />
                </div>
              </div>
              <div className="mt-5 flex items-center justify-between">
                <div className="text-[18px] font-medium text-white">Guided Study Planning</div>
                <div className="text-2xl">🎓</div>
              </div>
            </div>
          </div>

          <div className="flex w-full flex-col justify-center md:w-1/2">
            <h2 className="mb-6 text-[40px] font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400">Turn Videos into Knowledge</h2>
            <p className="mb-6 max-w-170 text-[16px] leading-relaxed text-zinc-400">
              Cluss provides an integrated toolkit for learners. Build guided study plans from a topic, import playlists into day-by-day learning blocks, chat inside the lesson context, and reinforce everything with AI checkpoints designed to save time and boost retention.
            </p>
            <button
              type="button"
              onClick={() => scrollToTarget('features')}
              className="group relative flex w-fit cursor-pointer gap-2 overflow-hidden rounded-full bg-white/10 border border-white/10 px-6 py-3"
            >
              <div className="absolute inset-0 translate-y-full bg-white transition-transform duration-500 ease-in-out group-hover:translate-y-0" />
              <div className="relative z-10 flex gap-2 text-white transition-colors duration-500 group-hover:text-black">
                <div>Explore Features</div>
                <div className="text-xl transition duration-500 group-hover:-rotate-45">✨</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      <div className="flex w-[90vw] flex-col items-start justify-between gap-2 rounded-4xl md:flex-row">
        <div className="flex items-center gap-2 px-2 md:px-0">
          <div className="dot bg-indigo-500" />
          <div className="text-sm font-medium text-zinc-400 md:text-xl">Key Features</div>
        </div>
        <div className="px-2 text-xl font-semibold text-white md:w-1/2 md:px-0 md:text-2xl lg:text-3xl">
          <div className="w-3/4 text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400">
            We create the path for learning and you just have to walk it.
          </div>
        </div>
      </div>

      <div className="relative flex h-auto w-[90vw] flex-col items-center overflow-hidden rounded-4xl border border-white/[0.08] bg-gradient-to-b from-[#252830] to-[#1e2028] shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
        <div className="flex w-full flex-col items-center">
          <div id="features" className="flex flex-col gap-8 px-10 py-15 md:flex-row md:px-18">
            <div className="flex w-full flex-col justify-between gap-4 md:w-1/2">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-5 text-[18px] font-medium">
                  <div className="dot bg-indigo-500" />
                  <div className="text-zinc-400">Guided Study Flow</div>
                </div>
                <h2 className="mb-6 text-[35px] font-medium tracking-tight text-white underline decoration-indigo-500/50">Guided Study Plans</h2>
                <div className="mb-6 max-w-170 text-[16px] leading-relaxed text-zinc-400">
                  <div className="w-3/4">
                    Stop studying from a blank page. Enter any topic and Cluss will shape it into a structured, multi-module path with teachable steps, inline questions, and milestone checkpoints.
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="cursor-pointer rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm text-zinc-300 transition-all duration-300 hover:border-white/30 hover:bg-white/10 hover:text-white">Gemini 3.1</div>
                <div className="cursor-pointer rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm text-zinc-300 transition-all duration-300 hover:border-white/30 hover:bg-white/10 hover:text-white">YouTube API</div>
                <div className="cursor-pointer rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm text-zinc-300 transition-all duration-300 hover:border-white/30 hover:bg-white/10 hover:text-white">Auto-structure</div>
              </div>
            </div>
            <div className="flex w-full flex-col justify-start gap-3 md:w-1/2">
              <img src={Img1} alt="AI course building" className="w-full rounded-2xl border border-white/10 shadow-2xl" />
            </div>
          </div>

          <div className="flex flex-col gap-8 border-t border-white/10 px-10 py-15 md:flex-row md:px-18">
            <div className="hidden w-full flex-col justify-start gap-3 md:flex md:w-1/2">
              <img src={Img2} alt="AI assistant chat" className="w-full rounded-2xl border border-white/10 shadow-2xl" />
            </div>
            <div className="flex w-full flex-col justify-between gap-4 px-5 md:w-1/2">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-5 text-[18px] font-medium">
                  <div className="dot bg-indigo-500" />
                  <div className="text-zinc-400">Your personal tutor</div>
                </div>
                <h2 className="mb-6 text-[35px] font-medium tracking-tight text-white underline decoration-indigo-500/50">RAG Study Chat</h2>
                <div className="mb-6 max-w-170 text-[16px] leading-relaxed text-zinc-400">
                  <div className="w-3/4">
                    Interact with your lessons like never before. Ask questions, get grounded answers from the current subtopic or playlist day, generate study notes, and challenge yourself with AI-powered checks that adapt to your knowledge gaps.
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="cursor-pointer rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm text-zinc-300 transition-all duration-300 hover:border-white/30 hover:bg-white/10 hover:text-white">Q&amp;A Chat</div>
                <div className="cursor-pointer rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm text-zinc-300 transition-all duration-300 hover:border-white/30 hover:bg-white/10 hover:text-white">AI Notes</div>
                <div className="cursor-pointer rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm text-zinc-300 transition-all duration-300 hover:border-white/30 hover:bg-white/10 hover:text-white">Quizzes</div>
              </div>
            </div>
            <div className="flex w-full flex-col justify-start gap-3 md:hidden">
              <img src={Img2} alt="AI assistant chat" className="w-full rounded-2xl border border-white/10 shadow-2xl" />
            </div>
          </div>

          <div className="flex flex-col gap-8 border-t border-white/10 px-10 py-15 md:flex-row md:px-18">
            <div className="flex w-full flex-col justify-between gap-4 md:w-1/2">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-5 text-[18px] font-medium">
                  <div className="dot bg-indigo-500" />
                  <div className="text-zinc-400">Track your growth</div>
                </div>
                <h2 className="mb-6 text-[35px] font-medium tracking-tight text-white underline decoration-indigo-500/50">Progress Tracking</h2>
                <div className="mb-6 max-w-170 text-[16px] leading-relaxed text-zinc-400">
                  <div className="w-3/4">
                    Consistency is the key to mastery. Track your learning streaks, unlock lessons by passing checkpoints, and monitor your study-plan completion across guided and playlist learning in one dashboard.
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="cursor-pointer rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm text-zinc-300 transition-all duration-300 hover:border-white/30 hover:bg-white/10 hover:text-white">Streaks</div>
                <div className="cursor-pointer rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm text-zinc-300 transition-all duration-300 hover:border-white/30 hover:bg-white/10 hover:text-white">Unlock Gates</div>
                <div className="cursor-pointer rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm text-zinc-300 transition-all duration-300 hover:border-white/30 hover:bg-white/10 hover:text-white">Dashboard</div>
              </div>
            </div>
            <div className="flex w-full flex-col justify-start gap-3 md:w-1/2">
              <img src={Img1} alt="Progress tracking" className="w-full rounded-2xl border border-white/10 shadow-2xl" />
            </div>
          </div>

          <button
            type="button"
            onClick={handlePrimaryCta}
            className="group relative mt-4 mb-15 flex cursor-pointer gap-2 overflow-hidden rounded-full bg-white/10 border border-white/10 px-6 py-3"
          >
            <div className="absolute inset-0 translate-y-full bg-white transition-transform duration-500 ease-in-out group-hover:translate-y-0" />
            <div className="relative z-10 flex gap-2 text-white transition-colors duration-500 group-hover:text-black">
              <div>Start Learning Today</div>
              <div className="transition duration-500 group-hover:-rotate-45">🚀</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
