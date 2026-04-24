
import React, { useRef, useState, useEffect } from 'react'
import { motion, useMotionTemplate, useMotionValue, useSpring } from 'framer-motion'

export default function InteractiveGrid({ children }: { children: React.ReactNode }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth out the mouse movement for a fluid feel
  const springConfig = { damping: 25, stiffness: 700 };
  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <div 
      className="relative min-h-screen w-full bg-[#fdfdfd] group overflow-hidden selection:bg-black selection:text-white" 
      onMouseMove={handleMouseMove}
    >
        {/* 1. Static Faint Grid (Base Layer) */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

        {/* 2. The REVEAL Layer - Complex High-Tech Grid */}
        <motion.div
            className="pointer-events-none absolute inset-0 transition-opacity duration-500 opacity-0 group-hover:opacity-100"
            style={{
                maskImage: useMotionTemplate`radial-gradient(450px circle at ${springX}px ${springY}px, black, transparent)`,
                WebkitMaskImage: useMotionTemplate`radial-gradient(450px circle at ${springX}px ${springY}px, black, transparent)`,
            }}
        >
            {/* Darker Main Lines */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#dddddd_1px,transparent_1px),linear-gradient(to_bottom,#dddddd_1px,transparent_1px)] bg-[size:4rem_4rem]" />
            
            {/* Fine Sub-grid (Technical Detail) */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#eeeeee_1px,transparent_1px),linear-gradient(to_bottom,#eeeeee_1px,transparent_1px)] bg-[size:1rem_1rem]" />

            {/* Crosshairs at intersections */}
            <div className="absolute inset-0 opacity-50" style={{ 
                backgroundImage: `radial-gradient(circle at 1px 1px, black 1.5px, transparent 0)`,
                backgroundSize: '4rem 4rem' 
            }} />
        </motion.div>

        {/* 3. Mouse Follower Gradient Blob (Subtle Highlight) */}
        <motion.div
            className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-duration-300"
            style={{
                background: useMotionTemplate`radial-gradient(600px circle at ${springX}px ${springY}px, rgba(0,0,0,0.02), transparent 70%)`
            }}
        />

      {/* Content */}
      <div className="relative z-10 h-full pointer-events-none">
        <div className="pointer-events-auto min-h-screen">
            {children}
        </div>
      </div>
    </div>
  );
}
