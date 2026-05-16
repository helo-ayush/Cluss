import React, { useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowUp, ArrowRight, Instagram, Linkedin } from 'lucide-react';

const featuresLinks = [
  { label: 'Guided Study Plans', target: 'features' },
  { label: 'Playlist Study Plans', target: 'features' },
  { label: 'Study Chat', target: 'features' },
  { label: 'Inline Assessments', target: 'features' },
  { label: 'Study Summaries', target: 'features' },
  { label: 'Progress Tracking', target: 'features' },
  { label: 'Leaderboard', target: 'pricing' },
];

const learnLinks = [
  { label: 'K-12 Education', target: 'features' },
  { label: 'Higher Education', target: 'features' },
  { label: 'Coding Bootcamps', target: 'features' },
  { label: 'Language Learning', target: 'features' },
  { label: 'Test Prep', target: 'features' },
  { label: 'Self-taught Devs', target: 'about' },
  { label: 'Skill Building', target: 'about' },
];

const companyLinks = [
  { label: 'About', target: 'about' },
  { label: 'Pricing', target: 'pricing' },
  { label: 'Features', target: 'features' },
  { label: 'Contact', target: 'contact' },
];

const socialLinks = [
  { icon: <Instagram size={18} />, href: 'https://instagram.com' },
  { icon: <Linkedin size={18} />, href: 'https://linkedin.com' },
  { icon: <span className="text-sm font-bold">X</span>, href: 'https://x.com' },
];

export default function Footer() {
  const navigate = useNavigate();

  const scrollToTarget = useCallback((targetId) => {
    const element = document.getElementById(targetId);
    if (!element) return;

    if (window.__lenis) {
      window.__lenis.scrollTo(element);
    } else {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const handleNavigateOrScroll = useCallback((targetId) => {
    if (targetId === 'dashboard') {
      navigate('/dashboard');
      return;
    }

    scrollToTarget(targetId);
  }, [navigate, scrollToTarget]);

  return (
    <footer id="contact" className="w-full bg-[#e5e9eb] px-6 py-16 font-sans text-gray-900 md:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-20 grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <h4 className="mb-6 font-semibold">Company:</h4>
            <ul className="space-y-3">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <button
                    type="button"
                    onClick={() => handleNavigateOrScroll(link.target)}
                    className="block text-left text-[15px] transition-colors duration-200 hover:text-gray-500"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-6 font-semibold">Features:</h4>
            <ul className="space-y-3">
              {featuresLinks.map((link) => (
                <li key={link.label}>
                  <button
                    type="button"
                    onClick={() => handleNavigateOrScroll(link.target)}
                    className="block text-left text-[15px] transition-colors duration-200 hover:text-gray-500"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-6 font-semibold">Learning Paths:</h4>
            <ul className="space-y-3">
              {learnLinks.map((link) => (
                <li key={link.label}>
                  <button
                    type="button"
                    onClick={() => handleNavigateOrScroll(link.target)}
                    className="block text-left text-[15px] transition-colors duration-200 hover:text-gray-500"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col">
            <h4 className="mb-6 font-semibold">Stay in the loop</h4>
            <div className="group relative mb-8">
              <input
                type="email"
                placeholder="Your email here"
                className="w-full border-b border-gray-400 bg-transparent py-2 pr-10 text-[15px] focus:border-gray-900 focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => handleNavigateOrScroll('pricing')}
                className="absolute right-0 bottom-2 text-gray-500 transition-colors hover:text-gray-900"
              >
                <ArrowRight size={20} />
              </button>
            </div>
            <p className="mb-10 text-xs leading-relaxed text-gray-500">
              By signing up, you agree to our <Link to="/" className="underline">Privacy Policy</Link>. We respect your data. Unsubscribe anytime.
            </p>

            <h4 className="mb-6 font-semibold">Follow us on:</h4>
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.href}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 text-gray-700 transition-all duration-300 hover:border-white hover:bg-white"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="relative flex flex-col items-center justify-between gap-6 border-t border-gray-300 pt-8 md:flex-row">
          <div className="order-2 flex cursor-pointer items-center gap-2 md:order-1">
            <span className="text-2xl font-bold tracking-tighter text-[#666666]" style={{ fontFamily: 'Outfit, sans-serif' }}>
              cluss
            </span>
          </div>

          <div className="order-3 flex items-center gap-4 text-sm text-gray-500 md:order-2">
            <span>© 2026 Cluss. All rights reserved</span>
            <div className="mx-1 h-1 w-1 rounded-full bg-black" />
            <button type="button" onClick={() => handleNavigateOrScroll('home')} className="font-medium text-gray-900">
              Privacy Policy
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleNavigateOrScroll('home')}
            className="order-1 flex h-12 w-12 items-center justify-center rounded-full bg-black text-white transition-transform duration-300 hover:scale-110 md:absolute md:right-0 md:-top-6 md:order-3"
          >
            <ArrowUp size={24} />
          </button>
        </div>
      </div>
    </footer>
  );
}
