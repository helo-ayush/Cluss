import React from 'react';
import Marquee from './Marquee';
import { motion, useScroll, useTransform } from 'motion/react';
import {
    FileText, Calendar, Brain, Search, Video, Users, Plus, Mic2, AudioLines
} from 'lucide-react';
import InteractiveBackground from './ui/InteractiveBackground';

const Img1 = '/ref/Img1.png';
const Img2 = '/ref/Img2.png';

const HeroSection = () => {
    const { scrollY } = useScroll();
    const width = useTransform(scrollY, [0, 200], ["100vw", "90vw"]);
    const height = useTransform(scrollY, [0, 200], ["100vh", "95vh"]);
    const borderRadius = useTransform(scrollY, [0, 200], ["0px", "48px"]);
    const marginTop = useTransform(scrollY, [0, 200], ["0px", "12px"]);

    return (
        <div id="home" className='flex items-center flex-col gap-20'>

            {/* ── HERO CARD (with InteractiveBackground particle overlay) ── */}
            <motion.div
                style={{ width, height, borderRadius, marginTop }}
                className='flex flex-col xl:justify-evenly justify-between items-center bg-white relative overflow-hidden'
            >
                <InteractiveBackground>
                    <div className='flex flex-col xl:justify-evenly justify-between items-center w-full h-full relative'>

                        <div className='w-full h-22 invisible lg:block'></div>

                        <div className='flex flex-col md:flex-row items-center justify-center gap-10 px-8 md:px-20 w-full flex-1 max-w-[2000px] mx-auto'>

                            {/* Left: Text Content */}
                            <div className='flex flex-col items-start mt-15 md:mt-0 gap-4 max-w-2xl z-10 md:pl-10'>
                                <div className='text-[40px] md:text-[70px] font-medium text-left leading-[1.1] text-gray-900'>
                                    Stop Searching.<br />Start Learning.
                                </div>
                                <div className='text-[18px] text-gray-600 text-left max-w-lg'>
                                    Cluss automatically generates high-quality, structured courses from YouTube using AI, complete with quizzes, summaries, and interactive RAG chat.
                                </div>
                                <div className='group relative cursor-pointer px-6 py-3 bg-[#e5e9eb] flex gap-2 rounded-full overflow-hidden mt-4'>
                                    <div className='absolute inset-0 bg-black translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-in-out'></div>
                                    <div className='relative z-10 flex gap-2 text-gray-900 group-hover:text-white transition-colors duration-500'>
                                        <div>Get Started Free</div>
                                        <div className='group-hover:-rotate-45 transition duration-500 text-xl'>🚀</div>
                                    </div>
                                </div>
                            </div>

                            {/* Right: 3D Feature Card */}
                            <div aria-hidden className="perspective-near hidden md:block min-w-75 md:min-w-125 scale-75 md:scale-95 py-12 md:translate-x-12">
                                <div className="rotate-x-12 bg-gray-50 rotate-y-2 rotate-z-10 relative flex h-64 -rotate-12 flex-col rounded-3xl border py-4 pl-4 transition-all duration-500">
                                    <div className="bg-white shadow-xl bottom-20 absolute left-4 min-w-60 rounded-2xl p-1 border border-gray-100">
                                        <div className="hover:bg-gray-50 flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors duration-200">
                                            <Calendar className="text-green-500 w-4 h-4" />
                                            <span className='text-gray-900'>AI Study Planner</span>
                                        </div>
                                        <span className="mx-3 my-0.5 block h-px bg-gray-100" />
                                        <div className="hover:bg-gray-50 flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors duration-200">
                                            <FileText className="text-blue-500 w-4 h-4" />
                                            <span className='text-gray-900'>YouTube Q&A Chat</span>
                                        </div>
                                        <div className="hover:bg-gray-50 flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors duration-200">
                                            <Search className="text-orange-500 w-4 h-4" />
                                            <span className='text-gray-900'>Deep Topic Search</span>
                                        </div>
                                        <div className="hover:bg-gray-50 flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors duration-200">
                                            <Video className="text-red-500 w-4 h-4" />
                                            <span className='text-gray-900'>Instant AI Notes</span>
                                        </div>
                                        <div className="hover:bg-gray-50 flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors duration-200">
                                            <Brain className="text-purple-500 w-4 h-4" />
                                            <span className='text-gray-900'>AI Quiz Generator</span>
                                        </div>
                                        <div className="hover:bg-gray-50 flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors duration-200">
                                            <Users className="text-yellow-500 w-4 h-4" />
                                            <span className='text-gray-900'>RAG Study Rooms</span>
                                        </div>
                                    </div>
                                    <div className="bg-white shadow-sm mt-auto flex h-fit w-[90%] justify-between gap-3 rounded-full p-2 border border-gray-100">
                                        <div className="flex items-center gap-2">
                                            <div className="bg-gray-100 flex w-9 h-9 items-center justify-center rounded-full hover:bg-gray-200 cursor-pointer transition-colors">
                                                <Plus className="w-4 h-4 text-gray-700" />
                                            </div>
                                            <div className="text-gray-500 text-sm font-medium">Learn Python from scratch...</div>
                                        </div>
                                        <div className="flex items-center gap-0.5">
                                            <div className="flex w-9 h-9 items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer transition-colors">
                                                <Mic2 className="w-4 h-4 text-gray-700" />
                                            </div>
                                            <div className="bg-black text-white flex w-9 h-9 items-center justify-center rounded-full hover:brightness-110 cursor-pointer transition-all">
                                                <AudioLines className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Scroll Indicator */}
                        <div className='w-11 h-11 rounded-full group flex items-center justify-center hover:bg-[#dedede] transition-all duration-300 cursor-pointer bg-black animate-float mb-6'>
                            <img
                                src='https://cdn.prod.website-files.com/673786754d248974527e65b5/673a2c5929486b4e031f7c94_dropdown-arrow.svg'
                                alt="Arrow"
                                width={10}
                                height={10}
                                className="rounded-full invert group-hover:invert-0 transition-all duration-300"
                            />
                        </div>

                        <div className='left-0 w-full'>
                            <Marquee />
                        </div>
                    </div>
                </InteractiveBackground>
            </motion.div>

            {/* ── WHO WE ARE (no particles) ── */}
            <div className='w-[90vw] rounded-4xl h-auto bg-white flex flex-col md:flex-row px-8 py-10 gap-8 relative overflow-hidden'>
                <div className='flex flex-col md:flex-row gap-8 w-full'>
                    {/* Left: Screenshot Card */}
                    <div className='w-full md:w-1/2 flex flex-col justify-start gap-3'>
                        <div className='flex items-center gap-5 font-medium text-xl'>
                            <div className='dot'></div>
                            <div className='text-gray-900'>What we do</div>
                        </div>
                        <div className='bg-[#eef3f4] rounded-3xl p-6 relative w-full max-w-105'>
                            <div className='rounded-2xl overflow-hidden relative'>
                                <div className='aspect-video w-full rounded-xl overflow-hidden bg-[#f3f6f7]'>
                                    <img src={Img1} alt="Cluss Dashboard" className="w-full h-full object-cover" />
                                </div>
                            </div>
                            <div className='mt-5 flex items-center justify-between'>
                                <div className='text-[18px] font-medium text-gray-900'>AI Course Generation</div>
                                <div className='text-2xl'>🎓</div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Copy */}
                    <div className='w-full md:w-1/2 flex flex-col justify-center'>
                        <h2 className='text-[40px] font-semibold tracking-tight mb-6 text-gray-900'>Turn Videos into Knowledge</h2>
                        <p className='text-[16px] text-gray-700 leading-relaxed max-w-170 mb-6'>
                            Cluss provides an integrated toolkit for learners. Instantly generate curated curriculums from YouTube, read AI-generated summaries, interact with your courses via RAG study chat, and reinforce your knowledge with AI quizzes — designed to save time and boost retention.
                        </p>
                        <div className='group relative cursor-pointer w-fit px-6 py-3 bg-[#e5e9eb] flex gap-2 rounded-full overflow-hidden'>
                            <div className='absolute inset-0 bg-black translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-in-out'></div>
                            <div className='relative z-10 flex gap-2 text-gray-900 group-hover:text-white transition-colors duration-500'>
                                <div>Explore Features</div>
                                <div className='group-hover:-rotate-45 transition duration-500 text-xl'>✨</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── SECTION HEADER BREAKER ── */}
            <div className='w-[90vw] flex flex-col md:flex-row rounded-4xl gap-2 justify-between items-start'>
                <div className='px-2 md:px-0 flex items-center gap-2'>
                    <div className='dot'></div>
                    <div className='text-sm md:text-xl font-medium text-gray-900'>Key Features</div>
                </div>
                <div className='px-2 md:px-0 text-xl md:text-2xl lg:text-3xl md:w-1/2 font-semibold text-gray-900'>
                    <div className='w-3/4'>
                        We create the path for learning — you just have to walk it.
                    </div>
                </div>
            </div>

            {/* ── FEATURE SHOWCASE (no particles) ── */}
            <div className='w-[90vw] rounded-4xl h-auto bg-white flex flex-col items-center relative overflow-hidden'>
                <div className='flex flex-col items-center w-full'>

                    {/* Feature 1: AI Course Builder */}
                    <div id='features' className='flex flex-col md:flex-row px-10 md:px-18 py-15 gap-8'>
                        <div className='w-full md:w-1/2 flex flex-col justify-between gap-4'>
                            <div className='flex flex-col gap-3'>
                                <div className='flex items-center gap-5 font-medium text-[18px]'>
                                    <div className='dot'></div>
                                    <div className='text-gray-700'>Curated AI Curriculum</div>
                                </div>
                                <h2 className='text-[35px] font-medium tracking-tight mb-6 underline text-gray-900'>AI Course Builder</h2>
                                <div className='text-[16px] text-gray-700 leading-relaxed max-w-170 mb-6'>
                                    <div className='w-3/4'>
                                        Stop wasting hours searching for tutorials. Enter any topic and our Gemini 3.1 AI will instantly construct a structured, multi-module syllabus using the best educational videos from YouTube.
                                    </div>
                                </div>
                            </div>
                            <div className='flex gap-2 flex-wrap'>
                                <div className='bg-[#fafafa] text-sm px-5 py-2 border border-[#d7d7d7] rounded-sm cursor-pointer hover:border-[#a4a4a4] transition-all duration-300 text-gray-800'>Gemini 3.1</div>
                                <div className='bg-[#fafafa] text-sm px-5 py-2 border border-[#d7d7d7] rounded-sm cursor-pointer hover:border-[#a4a4a4] transition-all duration-300 text-gray-800'>YouTube API</div>
                                <div className='bg-[#fafafa] text-sm px-5 py-2 border border-[#d7d7d7] rounded-sm cursor-pointer hover:border-[#a4a4a4] transition-all duration-300 text-gray-800'>Auto-structure</div>
                            </div>
                        </div>
                        <div className='w-full md:w-1/2 flex flex-col justify-start gap-3'>
                            <img src={Img1} alt='AI course building' className='w-full rounded-2xl' />
                        </div>
                    </div>

                    {/* Feature 2: RAG Study Chat */}
                    <div className='flex flex-col md:flex-row px-10 md:px-18 py-15 gap-8 border-t border-gray-100'>
                        <div className='w-full hidden md:flex md:w-1/2 flex-col justify-start gap-3'>
                            <img src={Img2} alt='AI assistant chat' className='w-full rounded-2xl' />
                        </div>
                        <div className='w-full px-5 md:w-1/2 flex flex-col justify-between gap-4'>
                            <div className='flex flex-col gap-3'>
                                <div className='flex items-center gap-5 font-medium text-[18px]'>
                                    <div className='dot'></div>
                                    <div className='text-gray-700'>Your personal tutor</div>
                                </div>
                                <h2 className='text-[35px] font-medium tracking-tight mb-6 underline text-gray-900'>RAG Study Chat</h2>
                                <div className='text-[16px] text-gray-700 leading-relaxed max-w-170 mb-6'>
                                    <div className='w-3/4'>
                                        Interact with your courses like never before. Ask questions, get deep answers from your video transcripts, generate PDF notes, and challenge yourself with AI-powered quizzes that adapt to your knowledge gaps.
                                    </div>
                                </div>
                            </div>
                            <div className='flex gap-2 flex-wrap'>
                                <div className='bg-[#fafafa] text-sm px-5 py-2 border border-[#d7d7d7] rounded-sm cursor-pointer hover:border-[#a4a4a4] transition-all duration-300 text-gray-800'>Q&A Chat</div>
                                <div className='bg-[#fafafa] text-sm px-5 py-2 border border-[#d7d7d7] rounded-sm cursor-pointer hover:border-[#a4a4a4] transition-all duration-300 text-gray-800'>AI Notes</div>
                                <div className='bg-[#fafafa] text-sm px-5 py-2 border border-[#d7d7d7] rounded-sm cursor-pointer hover:border-[#a4a4a4] transition-all duration-300 text-gray-800'>Quizzes</div>
                            </div>
                        </div>
                        <div className='md:hidden w-full flex flex-col justify-start gap-3'>
                            <img src={Img2} alt='AI assistant chat' className='w-full rounded-2xl' />
                        </div>
                    </div>

                    {/* Feature 3: Progress Tracking */}
                    <div className='flex flex-col md:flex-row px-10 md:px-18 py-15 gap-8 border-t border-gray-100'>
                        <div className='w-full md:w-1/2 flex flex-col justify-between gap-4'>
                            <div className='flex flex-col gap-3'>
                                <div className='flex items-center gap-5 font-medium text-[18px]'>
                                    <div className='dot'></div>
                                    <div className='text-gray-700'>Track your growth</div>
                                </div>
                                <h2 className='text-[35px] font-medium tracking-tight mb-6 underline text-gray-900'>Progress Tracking</h2>
                                <div className='text-[16px] text-gray-700 leading-relaxed max-w-170 mb-6'>
                                    <div className='w-3/4'>
                                        Consistency is the key to mastery. Track your learning streaks, unlock modules by passing quizzes, and monitor your course completion across all your AI-generated curriculums in a central dashboard.
                                    </div>
                                </div>
                            </div>
                            <div className='flex gap-2 flex-wrap'>
                                <div className='bg-[#fafafa] text-sm px-5 py-2 border border-[#d7d7d7] rounded-sm cursor-pointer hover:border-[#a4a4a4] transition-all duration-300 text-gray-800'>Streaks</div>
                                <div className='bg-[#fafafa] text-sm px-5 py-2 border border-[#d7d7d7] rounded-sm cursor-pointer hover:border-[#a4a4a4] transition-all duration-300 text-gray-800'>Unlock Gates</div>
                                <div className='bg-[#fafafa] text-sm px-5 py-2 border border-[#d7d7d7] rounded-sm cursor-pointer hover:border-[#a4a4a4] transition-all duration-300 text-gray-800'>Dashboard</div>
                            </div>
                        </div>
                        <div className='w-full md:w-1/2 flex flex-col justify-start gap-3'>
                            <img src={Img1} alt='Progress tracking' className='w-full rounded-2xl' />
                        </div>
                    </div>

                    {/* Bottom CTA */}
                    <div className='group relative cursor-pointer px-6 py-3 mb-15 bg-[#e5e9eb] flex gap-2 rounded-full overflow-hidden mt-4'>
                        <div className='absolute inset-0 bg-black translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-in-out'></div>
                        <div className='relative z-10 flex gap-2 text-gray-900 group-hover:text-white transition-colors duration-500'>
                            <div>Start Learning Today</div>
                            <div className='group-hover:-rotate-45 transition duration-500'>🚀</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HeroSection;