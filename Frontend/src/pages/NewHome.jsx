import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Lenis from 'lenis';

import Navbar from '../components/Navbar';
import HeroSection from '../landing/sections/HeroSection';
import ServicesSection from '../landing/sections/ServiceSection';
import TestimonialSection from '../landing/sections/TestimonialSection';
import Pricing from '../landing/sections/Pricing';
import Footer from '../landing/sections/Footer';

export default function NewHome() {
  const location = useLocation();

  // Lenis smooth scroll setup
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Store on window so Navbar can access
    window.__lenis = lenis;

    return () => {
      lenis.destroy();
      delete window.__lenis;
    };
  }, []);

  // Hash-based scroll on navigate
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          if (window.__lenis) {
            window.__lenis.scrollTo(element);
          } else {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }
      }, 300);
    }
  }, [location]);

  return (
    <div className='bg-[#1b1d25] min-h-screen text-white relative'>
      {/* Ambient gradient orbs for atmospheric depth */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-[300px] -right-[200px] h-[700px] w-[700px] rounded-full bg-indigo-500/[0.07] blur-[150px]" />
        <div className="absolute top-[55%] -left-[250px] h-[600px] w-[600px] rounded-full bg-purple-600/[0.05] blur-[140px]" />
        <div className="absolute top-[25%] right-[5%] h-[400px] w-[400px] rounded-full bg-blue-500/[0.04] blur-[120px]" />
        <div className="absolute bottom-[10%] left-[30%] h-[500px] w-[500px] rounded-full bg-indigo-400/[0.03] blur-[130px]" />
      </div>
      <div className="relative z-10">
        <Navbar />
        <HeroSection />
        <ServicesSection />
        <TestimonialSection />
        <Pricing />
        <Footer />
      </div>
    </div>
  );
}
