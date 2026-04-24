import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Lenis from 'lenis';

import Navbar from '../components/Navbar';
import HeroSection from '../components/new-landing/HeroSection';
import ServicesSection from '../components/new-landing/ServiceSection';
import FallingBoxes from '../components/new-landing/FallingBoxes';
import TestimonialSection from '../components/new-landing/TestimonialSection';
import Pricing from '../components/new-landing/Pricing';
import Footer from '../components/new-landing/Footer';

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
    <div className='bg-[#e5e9eb]'>
      <Navbar />
      <HeroSection />
      <ServicesSection />
      <FallingBoxes />
      <TestimonialSection />
      <Pricing />
      <Footer />
    </div>
  );
}
