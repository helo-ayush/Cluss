import React from 'react';
import { motion } from 'framer-motion';

export default function LoadingScreen({ message = "Loading..." }) {
  return (
    <div className="course-shell flex min-h-screen items-center justify-center px-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="course-surface relative flex flex-col items-center justify-center rounded-[2.5rem] px-10 py-12 text-center sm:px-16 sm:py-14 shadow-2xl shadow-[#4338ca]/5"
      >
        <div className="relative mb-8 flex h-24 w-24 items-center justify-center">
          {/* Outer glowing dash ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border-[3px] border-dashed border-[#818cf8]/40"
          />
          
          {/* Inner spinning gradient ring */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute inset-2 rounded-full border-[3.5px] border-transparent border-t-[#4338ca] border-l-[#4f46e5] opacity-90"
          />
          
          {/* Center glowing orb */}
          <motion.div
            animate={{ scale: [1, 1.25, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute h-10 w-10 rounded-full bg-gradient-to-tr from-[#4338ca] to-[#818cf8] blur-md"
          />
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute h-10 w-10 rounded-full bg-gradient-to-tr from-[#4338ca] to-[#818cf8] shadow-lg shadow-[#4338ca]/40"
          />
        </div>

        <h2 className="font-serif text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Cluss AI</h2>
        
        <motion.div 
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="mt-4 flex items-center gap-2"
        >
          <div className="h-1.5 w-1.5 rounded-full bg-[#4338ca]"></div>
          <p className="text-xs font-bold tracking-[0.2em] text-[#4338ca] uppercase">
            {message}
          </p>
          <div className="h-1.5 w-1.5 rounded-full bg-[#4338ca]"></div>
        </motion.div>
      </motion.div>
    </div>
  );
}
