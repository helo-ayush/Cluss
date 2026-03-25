import React from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Features from '../components/Features';
import Pipeline from '../components/Pipeline';
import TutorAgent from '../components/TutorAgent';
import Impact from '../components/Impact';
import Team from '../components/Team';
import CTA from '../components/CTA';

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <Features />
      <Pipeline />
      <TutorAgent />
      <Impact />
      <Team />
      <CTA />
    </>
  );
}
