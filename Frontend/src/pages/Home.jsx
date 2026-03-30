import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Hero from '../components/Hero';
import Features from '../components/Features';
import Pipeline from '../components/Pipeline';
import TutorAgent from '../components/TutorAgent';
import Impact from '../components/Impact';
import Pricing from '../components/Pricing';
import CTA from '../components/CTA';

export default function Home() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 300); // Slight delay ensures all components are rendered
      }
    }
  }, [location]);

  return (
    <>
      <Hero />
      <Features />
      <Pipeline />
      <TutorAgent />
      <Impact />
      <Pricing />
      <CTA />
    </>
  );
}
