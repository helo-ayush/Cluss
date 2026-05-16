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
        className="relative flex flex-col items-center justify-between overflow-hidden bg-white xl:justify-evenly"
      >
        <InteractiveBackground>
          <div className="relative flex h-full w-full flex-col items-center justify-between xl:justify-evenly">
            <div className="invisible h-22 w-full lg:block" />

            <div className="mx-auto flex max-w-[2000px] flex-1 flex-col items-center justify-center gap-10 px-8 md:flex-row md:px-20">
              <div className="z-10 mt-15 flex max-w-2xl flex-col items-start gap-4 md:mt-0 md:pl-10">
                <div className="text-left text-[40px] leading-[1.1] font-medium text-gray-900 md:text-[70px]">
                  Stop Searching.
                  <br />
                  Start Learning.
                </div>
                <div className="max-w-lg text-left text-[18px] text-gray-600">
                  Cluss turns topics and YouTube playlists into guided study plans with checkpoints, notes, and focused AI support.
                </div>
                <button
                  type="button"
                  onClick={handlePrimaryCta}
                  className="group relative mt-4 flex cursor-pointer gap-2 overflow-hidden rounded-full bg-[#e5e9eb] px-6 py-3"
                >
                  <div className="absolute inset-0 translate-y-full bg-black transition-transform duration-500 ease-in-out group-hover:translate-y-0" />
                  <div className="relative z-10 flex gap-2 text-gray-900 transition-colors duration-500 group-hover:text-white">
                    <div>Get Started Free</div>
                    <div className="text-xl transition duration-500 group-hover:-rotate-45">🚀</div>
                  </div>
                </button>
              </div>

              <div aria-hidden className="perspective-near hidden min-w-75 scale-75 py-12 md:block md:min-w-125 md:translate-x-12 md:scale-95">
                <div className="rotate-x-12 rotate-y-2 rotate-z-10 relative flex h-64 -rotate-12 flex-col rounded-3xl border bg-gray-50 py-4 pl-4 transition-all duration-500">
                  <div className="absolute bottom-20 left-4 min-w-60 rounded-2xl border border-gray-100 bg-white p-1 shadow-xl">
                    <div className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors duration-200 hover:bg-gray-50">
                      <Calendar className="h-4 w-4 text-green-500" />
                      <span className="text-gray-900">AI Study Planner</span>
                    </div>
                    <span className="mx-3 my-0.5 block h-px bg-gray-100" />
                    <div className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors duration-200 hover:bg-gray-50">
                      <FileText className="h-4 w-4 text-blue-500" />
                      <span className="text-gray-900">YouTube Q&amp;A Chat</span>
                    </div>
                    <div className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors duration-200 hover:bg-gray-50">
                      <Search className="h-4 w-4 text-orange-500" />
                      <span className="text-gray-900">Deep Topic Search</span>
                    </div>
                    <div className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors duration-200 hover:bg-gray-50">
                      <Video className="h-4 w-4 text-red-500" />
                      <span className="text-gray-900">Instant AI Notes</span>
                    </div>
                    <div className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors duration-200 hover:bg-gray-50">
                      <Brain className="h-4 w-4 text-purple-500" />
                      <span className="text-gray-900">AI Quiz Generator</span>
                    </div>
                    <div className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors duration-200 hover:bg-gray-50">
                      <Users className="h-4 w-4 text-yellow-500" />
                      <span className="text-gray-900">RAG Study Rooms</span>
                    </div>
                  </div>
                  <div className="mt-auto flex h-fit w-[90%] justify-between gap-3 rounded-full border border-gray-100 bg-white p-2 shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200">
                        <Plus className="h-4 w-4 text-gray-700" />
                      </div>
                      <div className="text-sm font-medium text-gray-500">Learn Python from scratch...</div>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-gray-100">
                        <Mic2 className="h-4 w-4 text-gray-700" />
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-white transition-all hover:brightness-110">
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
              className="group mb-6 flex h-11 w-11 animate-float items-center justify-center rounded-full bg-black transition-all duration-300 hover:bg-[#dedede]"
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

      <div className="relative flex h-auto w-[90vw] flex-col gap-8 overflow-hidden rounded-4xl bg-white px-8 py-10 md:flex-row">
        <div className="flex w-full flex-col gap-8 md:flex-row">
          <div className="flex w-full flex-col justify-start gap-3 md:w-1/2">
            <div className="flex items-center gap-5 text-xl font-medium">
              <div className="dot" />
              <div className="text-gray-900">What we do</div>
            </div>
            <div className="relative w-full max-w-105 rounded-3xl bg-[#eef3f4] p-6">
              <div className="relative overflow-hidden rounded-2xl">
                <div className="aspect-video w-full overflow-hidden rounded-xl bg-[#f3f6f7]">
                  <img src="/ref/Video.gif" alt="Cluss Dashboard Video" className="h-full w-full object-cover" />
                </div>
              </div>
              <div className="mt-5 flex items-center justify-between">
                <div className="text-[18px] font-medium text-gray-900">Guided Study Planning</div>
                <div className="text-2xl">🎓</div>
              </div>
            </div>
          </div>

          <div className="flex w-full flex-col justify-center md:w-1/2">
            <h2 className="mb-6 text-[40px] font-semibold tracking-tight text-gray-900">Turn Videos into Knowledge</h2>
            <p className="mb-6 max-w-170 text-[16px] leading-relaxed text-gray-700">
              Cluss provides an integrated toolkit for learners. Build guided study plans from a topic, import playlists into day-by-day learning blocks, chat inside the lesson context, and reinforce everything with AI checkpoints designed to save time and boost retention.
            </p>
            <button
              type="button"
              onClick={() => scrollToTarget('features')}
              className="group relative flex w-fit cursor-pointer gap-2 overflow-hidden rounded-full bg-[#e5e9eb] px-6 py-3"
            >
              <div className="absolute inset-0 translate-y-full bg-black transition-transform duration-500 ease-in-out group-hover:translate-y-0" />
              <div className="relative z-10 flex gap-2 text-gray-900 transition-colors duration-500 group-hover:text-white">
                <div>Explore Features</div>
                <div className="text-xl transition duration-500 group-hover:-rotate-45">✨</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      <div className="flex w-[90vw] flex-col items-start justify-between gap-2 rounded-4xl md:flex-row">
        <div className="flex items-center gap-2 px-2 md:px-0">
          <div className="dot" />
          <div className="text-sm font-medium text-gray-900 md:text-xl">Key Features</div>
        </div>
        <div className="px-2 text-xl font-semibold text-gray-900 md:w-1/2 md:px-0 md:text-2xl lg:text-3xl">
          <div className="w-3/4">
            We create the path for learning and you just have to walk it.
          </div>
        </div>
      </div>

      <div className="relative flex h-auto w-[90vw] flex-col items-center overflow-hidden rounded-4xl bg-white">
        <div className="flex w-full flex-col items-center">
          <div id="features" className="flex flex-col gap-8 px-10 py-15 md:flex-row md:px-18">
            <div className="flex w-full flex-col justify-between gap-4 md:w-1/2">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-5 text-[18px] font-medium">
                  <div className="dot" />
                  <div className="text-gray-700">Guided Study Flow</div>
                </div>
                <h2 className="mb-6 text-[35px] font-medium tracking-tight text-gray-900 underline">Guided Study Plans</h2>
                <div className="mb-6 max-w-170 text-[16px] leading-relaxed text-gray-700">
                  <div className="w-3/4">
                    Stop studying from a blank page. Enter any topic and Cluss will shape it into a structured, multi-module path with teachable steps, inline questions, and milestone checkpoints.
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="cursor-pointer rounded-sm border border-[#d7d7d7] bg-[#fafafa] px-5 py-2 text-sm text-gray-800 transition-all duration-300 hover:border-[#a4a4a4]">Gemini 3.1</div>
                <div className="cursor-pointer rounded-sm border border-[#d7d7d7] bg-[#fafafa] px-5 py-2 text-sm text-gray-800 transition-all duration-300 hover:border-[#a4a4a4]">YouTube API</div>
                <div className="cursor-pointer rounded-sm border border-[#d7d7d7] bg-[#fafafa] px-5 py-2 text-sm text-gray-800 transition-all duration-300 hover:border-[#a4a4a4]">Auto-structure</div>
              </div>
            </div>
            <div className="flex w-full flex-col justify-start gap-3 md:w-1/2">
              <img src={Img1} alt="AI course building" className="w-full rounded-2xl" />
            </div>
          </div>

          <div className="flex flex-col gap-8 border-t border-gray-100 px-10 py-15 md:flex-row md:px-18">
            <div className="hidden w-full flex-col justify-start gap-3 md:flex md:w-1/2">
              <img src={Img2} alt="AI assistant chat" className="w-full rounded-2xl" />
            </div>
            <div className="flex w-full flex-col justify-between gap-4 px-5 md:w-1/2">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-5 text-[18px] font-medium">
                  <div className="dot" />
                  <div className="text-gray-700">Your personal tutor</div>
                </div>
                <h2 className="mb-6 text-[35px] font-medium tracking-tight text-gray-900 underline">RAG Study Chat</h2>
                <div className="mb-6 max-w-170 text-[16px] leading-relaxed text-gray-700">
                  <div className="w-3/4">
                    Interact with your lessons like never before. Ask questions, get grounded answers from the current subtopic or playlist day, generate study notes, and challenge yourself with AI-powered checks that adapt to your knowledge gaps.
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="cursor-pointer rounded-sm border border-[#d7d7d7] bg-[#fafafa] px-5 py-2 text-sm text-gray-800 transition-all duration-300 hover:border-[#a4a4a4]">Q&amp;A Chat</div>
                <div className="cursor-pointer rounded-sm border border-[#d7d7d7] bg-[#fafafa] px-5 py-2 text-sm text-gray-800 transition-all duration-300 hover:border-[#a4a4a4]">AI Notes</div>
                <div className="cursor-pointer rounded-sm border border-[#d7d7d7] bg-[#fafafa] px-5 py-2 text-sm text-gray-800 transition-all duration-300 hover:border-[#a4a4a4]">Quizzes</div>
              </div>
            </div>
            <div className="flex w-full flex-col justify-start gap-3 md:hidden">
              <img src={Img2} alt="AI assistant chat" className="w-full rounded-2xl" />
            </div>
          </div>

          <div className="flex flex-col gap-8 border-t border-gray-100 px-10 py-15 md:flex-row md:px-18">
            <div className="flex w-full flex-col justify-between gap-4 md:w-1/2">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-5 text-[18px] font-medium">
                  <div className="dot" />
                  <div className="text-gray-700">Track your growth</div>
                </div>
                <h2 className="mb-6 text-[35px] font-medium tracking-tight text-gray-900 underline">Progress Tracking</h2>
                <div className="mb-6 max-w-170 text-[16px] leading-relaxed text-gray-700">
                  <div className="w-3/4">
                    Consistency is the key to mastery. Track your learning streaks, unlock lessons by passing checkpoints, and monitor your study-plan completion across guided and playlist learning in one dashboard.
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="cursor-pointer rounded-sm border border-[#d7d7d7] bg-[#fafafa] px-5 py-2 text-sm text-gray-800 transition-all duration-300 hover:border-[#a4a4a4]">Streaks</div>
                <div className="cursor-pointer rounded-sm border border-[#d7d7d7] bg-[#fafafa] px-5 py-2 text-sm text-gray-800 transition-all duration-300 hover:border-[#a4a4a4]">Unlock Gates</div>
                <div className="cursor-pointer rounded-sm border border-[#d7d7d7] bg-[#fafafa] px-5 py-2 text-sm text-gray-800 transition-all duration-300 hover:border-[#a4a4a4]">Dashboard</div>
              </div>
            </div>
            <div className="flex w-full flex-col justify-start gap-3 md:w-1/2">
              <img src={Img1} alt="Progress tracking" className="w-full rounded-2xl" />
            </div>
          </div>

          <button
            type="button"
            onClick={handlePrimaryCta}
            className="group relative mt-4 mb-15 flex cursor-pointer gap-2 overflow-hidden rounded-full bg-[#e5e9eb] px-6 py-3"
          >
            <div className="absolute inset-0 translate-y-full bg-black transition-transform duration-500 ease-in-out group-hover:translate-y-0" />
            <div className="relative z-10 flex gap-2 text-gray-900 transition-colors duration-500 group-hover:text-white">
              <div>Start Learning Today</div>
              <div className="transition duration-500 group-hover:-rotate-45">🚀</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
